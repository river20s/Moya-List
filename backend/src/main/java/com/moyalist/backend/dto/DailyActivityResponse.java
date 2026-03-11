package com.moyalist.backend.dto;

import java.util.List;

public record DailyActivityResponse(
        List<QuestionResponseDto> created,
        List<QuestionResponseDto> resolved
) {}
