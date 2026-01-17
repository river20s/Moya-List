package com.moyalist.backend.service;

import com.moyalist.backend.dto.TagResponseDto;
import com.moyalist.backend.entity.Tag;
import com.moyalist.backend.entity.User;
import com.moyalist.backend.repository.TagRepository;
import com.moyalist.backend.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class TagService {

    private final TagRepository tagRepository;
    private final UserRepository userRepository;

    public List<TagResponseDto> getAllTags() {
        return tagRepository.findAll().stream()
                .map(TagResponseDto::from)
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
}