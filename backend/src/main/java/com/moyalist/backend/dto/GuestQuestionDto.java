package com.moyalist.backend.dto;

import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@NoArgsConstructor
public class GuestQuestionDto {
    private String title;
    private String description;
    private String sourceUrl;
}
