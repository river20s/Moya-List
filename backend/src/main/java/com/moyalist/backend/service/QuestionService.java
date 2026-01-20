package com.moyalist.backend.service;

import com.moyalist.backend.dto.QuestionRequestDto;
import com.moyalist.backend.dto.QuestionResponseDto;
import com.moyalist.backend.entity.Question;
import com.moyalist.backend.entity.User;
import com.moyalist.backend.repository.QuestionRepository;
import com.moyalist.backend.repository.TagRepository;
import com.moyalist.backend.repository.UserRepository;
import com.moyalist.backend.entity.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

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
    public QuestionResponseDto createQuestion(QuestionRequestDto request) {
        User user = userRepository.findById(request.getUserId())
                .orElseThrow(() -> new IllegalArgumentException("사용자를 찾을 수 없습니다: " + request.getUserId()));

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
    public QuestionResponseDto updateQuestion(Long id, QuestionRequestDto request) {
        Question question = questionRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("질문을 찾을 수 없습니다: " + id));

        question.update(request.getTitle(), request.getSourceUrl(), request.getDescription());
        return QuestionResponseDto.from(question);
    }

    @Transactional
    public void deleteQuestion(Long id) {
        Question question = questionRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("질문을 찾을 수 없습니다: " + id));
        questionRepository.delete(question);
    }
}