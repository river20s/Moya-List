package com.moyalist.backend.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.util.List;

@Getter
@NoArgsConstructor
public class QuestionRequestDto {

    @NotNull(message = "사용자 Id는 필수입니다")
    private Long userId;

    @NotBlank(message = "제목은 필수입니다")
    private String title;

    private String sourceUrl;

    private String description;

    private List<Long> tagIds;
}