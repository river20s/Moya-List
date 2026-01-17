package com.moyalist.backend.dto;

import com.moyalist.backend.entity.Question;
import lombok.Builder;
import lombok.Getter;

import java.time.LocalDateTime;

@Getter
@Builder
public class QuestionResponseDto {

    private Long id;
    private Long userId;
    private String userName;
    private String title;
    private String sourceUrl;
    private String description;
    private Boolean isResolved;
    private LocalDateTime createdAt;

    public static QuestionResponseDto from(Question question) {
        return QuestionResponseDto.builder()
                .id(question.getId())
                .userId(question.getUser().getId())
                .userName(question.getUser().getName())
                .title(question.getTitle())
                .sourceUrl(question.getSourceUrl())
                .description(question.getDescription())
                .isResolved(question.getIsResolved())
                .createdAt(question.getCreatedAt())
                .build();
    }
}