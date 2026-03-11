package com.moyalist.backend.service;

import com.moyalist.backend.dto.GuestQuestionDto;
import com.moyalist.backend.dto.QuestionRequestDto;
import com.moyalist.backend.dto.QuestionResponseDto;
import com.moyalist.backend.entity.Question;
import com.moyalist.backend.entity.User;
import com.moyalist.backend.repository.QuestionRepository;
import com.moyalist.backend.repository.TagRepository;
import com.moyalist.backend.repository.UserRepository;
import com.moyalist.backend.entity.Tag;
import com.moyalist.backend.specification.QuestionSpecification;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class QuestionService {

    private final QuestionRepository questionRepository;
    private final UserRepository userRepository;
    private final TagRepository tagRepository;

    @Transactional
    public QuestionResponseDto createQuestion(Long userId, QuestionRequestDto request) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("사용자를 찾을 수 없습니다: " + userId));

        Question question = Question.builder()
                .user(user)
                .title(request.getTitle())
                .sourceUrl(request.getSourceUrl())
                .description(request.getDescription())
                .isResolved(false)
                .build();

        if (request.getTagIds() != null && !request.getTagIds().isEmpty()) {
            for (Long tagId : request.getTagIds()) {
                Tag tag = tagRepository.findById(tagId)
                        .orElseThrow(() -> new IllegalArgumentException("태그를 찾을 수 없습니다: " + tagId));
                question.addTag(tag);
            }
        }

        Question saved = questionRepository.save(question);
        return QuestionResponseDto.from(saved);
    }

    public List<QuestionResponseDto> getAllQuestions() {
        return questionRepository.findAll().stream()
                .map(QuestionResponseDto::from)
                .collect(Collectors.toList());
    }

    public QuestionResponseDto getQuestion(Long id) {
        Question question = questionRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("질문을 찾을 수 없습니다: " + id));
        return QuestionResponseDto.from(question);
    }
    @Transactional
    public QuestionResponseDto updateQuestion(Long userId, Long id, QuestionRequestDto request) {
        Question question = questionRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("질문을 찾을 수 없습니다: " + id));

        if (!question.getUser().getId().equals(userId)) {
            throw new AccessDeniedException("해당 질문을 수정할 권한이 없습니다.");
        }

        question.update(request.getTitle(), request.getSourceUrl(), request.getDescription());
        return QuestionResponseDto.from(question);
    }

    @Transactional
    public QuestionResponseDto toggleResolve(Long userId, Long id) {
        Question question = questionRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("질문을 찾을 수 없습니다: " + id));

        if (!question.getUser().getId().equals(userId)) {
            throw new AccessDeniedException("해당 질문을 수정할 권한이 없습니다.");
        }

        question.toggleResolved();
        return QuestionResponseDto.from(question);
    }

    @Transactional
    public void deleteQuestion(Long userId, Long id) {
        Question question = questionRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("질문을 찾을 수 없습니다: " + id));

        if (!question.getUser().getId().equals(userId)) {
            throw new AccessDeniedException("해당 질문을 삭제할 권한이 없습니다.");
        }

        questionRepository.delete(question);
    }

    /**
     * 검색 조건과 페이지네이션을 적용하여 질문 목록을 조회합니다.
     *
     * @param keyword 검색 키워드 (제목 또는 설명에서 검색, 선택 사항)
     * @param tagId 필터링할 태그 ID (선택 사항)
     * @param isResolved 해결 여부 필터 (선택 사항)
     * @param pageable 페이지 정보 (페이지 번호, 크기, 정렬)
     * @return Page<QuestionResponseDto> 페이징된 질문 목록
     *
     * 동작 방식:
     * 1. QuestionSpecification.searchWith()로 동적 검색 조건 생성
     * 2. questionRepository.findAll(spec, pageable)로 조건에 맞는 데이터 조회
     * 3. Page.map()으로 Question -> QuestionResponseDto 변환
     */
    @Transactional
    public List<QuestionResponseDto> migrateGuestQuestions(Long userId, List<GuestQuestionDto> guestQuestions) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("사용자를 찾을 수 없습니다: " + userId));

        return guestQuestions.stream()
                .map(dto -> {
                    Question q = Question.builder()
                            .user(user)
                            .title(dto.getTitle())
                            .description(dto.getDescription())
                            .sourceUrl(dto.getSourceUrl())
                            .isResolved(false)
                            .build();
                    return QuestionResponseDto.from(questionRepository.save(q));
                })
                .collect(Collectors.toList());
    }

    public Page<QuestionResponseDto> searchQuestions(
            Long userId,
            String keyword,
            Long tagId,
            Boolean isResolved,
            LocalDate startDate,
            LocalDate endDate,
            Pageable pageable) {

        Specification<Question> spec = QuestionSpecification.searchWith(
                userId, keyword, tagId, isResolved, startDate, endDate);

        // Repository에서 Specification과 Pageable을 사용하여 검색
        // Page 객체는 데이터뿐만 아니라 총 개수, 페이지 정보도 포함
        Page<Question> questionPage = questionRepository.findAll(spec, pageable);

        // Page<Question>을 Page<QuestionResponseDto>로 변환
        // map() 메서드는 각 Question을 QuestionResponseDto로 변환
        return questionPage.map(QuestionResponseDto::from);
    }
}