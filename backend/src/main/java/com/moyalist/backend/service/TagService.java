package com.moyalist.backend.service;

import com.moyalist.backend.dto.QuestionResponseDto;
import com.moyalist.backend.dto.TagRequestDto;
import com.moyalist.backend.dto.TagResponseDto;
import com.moyalist.backend.entity.QuestionTag;
import com.moyalist.backend.entity.Tag;
import com.moyalist.backend.entity.User;
import com.moyalist.backend.repository.QuestionTagRepository;
import com.moyalist.backend.repository.TagRepository;
import com.moyalist.backend.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class TagService {

    private final TagRepository tagRepository;
    private final UserRepository userRepository;
    private final QuestionTagRepository questionTagRepository;

    public List<TagResponseDto> getAllTags(Long userId) {
        List<Tag> tags = tagRepository.findByUserId(userId);

        List<Object[]> countResults = tagRepository.countQuestionsByTagAndUserId(userId);
        Map<Long, Long> countMap = countResults.stream()
                .collect(Collectors.toMap(
                        row -> (Long) row[0],
                        row -> (Long) row[1]
                ));

        return tags.stream()
                .map(tag -> TagResponseDto.from(tag, countMap.getOrDefault(tag.getId(), 0L)))
                .collect(Collectors.toList());
    }

    public TagResponseDto getTag(Long id) {
        Tag tag = tagRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("태그를 찾을 수 없습니다: " + id));
        return TagResponseDto.from(tag);
    }

    @Transactional
    public TagResponseDto createTag(Long userId, String name) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("사용자를 찾을 수 없습니다: " + userId));

        Tag tag = Tag.builder()
                .user(user)
                .name(name)
                .build();
        return TagResponseDto.from(tagRepository.save(tag));
    }

    @Transactional
    public TagResponseDto updateTag(Long userId, Long id, TagRequestDto request) {
        Tag tag = tagRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("태그를 찾을 수 없습니다: " + id));

        if (!tag.getUser().getId().equals(userId)) {
            throw new AccessDeniedException("해당 태그를 수정할 권한이 없습니다.");
        }

        tag.update(request.getName(), request.getColor());
        return TagResponseDto.from(tag);
    }

    @Transactional
    public void deleteTag(Long userId, Long id) {
        Tag tag = tagRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("태그를 찾을 수 없습니다: " + id));

        if (!tag.getUser().getId().equals(userId)) {
            throw new AccessDeniedException("해당 태그를 삭제할 권한이 없습니다.");
        }

        List<QuestionTag> questionTags = questionTagRepository.findByTagId(id);
        questionTagRepository.deleteAll(questionTags);
        tagRepository.delete(tag);
    }

    public List<QuestionResponseDto> getQuestionsByTagId(Long tagId) {
        // 태그 존재 확인 (없으면 예외)
        tagRepository.findById(tagId)
                .orElseThrow(() -> new IllegalArgumentException("태그를 찾을 수 없습니다: " + tagId));
        // 해당 태그와 연결된 QuestionTag 목록 조회
        List<QuestionTag> questionTags = questionTagRepository.findByTagId(tagId);
        return questionTags.stream()
                .map(qt -> QuestionResponseDto.from(qt.getQuestion()))
                .collect(Collectors.toList());
    }
}