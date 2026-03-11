package com.moyalist.backend.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.util.List;

@Getter
@NoArgsConstructor
public class QuestionRequestDto {

    @NotBlank(message = "제목은 필수입니다")
    private String title;

    private String sourceUrl;

    private String description;

    private List<Long> tagIds;
}