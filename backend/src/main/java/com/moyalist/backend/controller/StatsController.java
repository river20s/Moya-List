package com.moyalist.backend.controller;

import com.moyalist.backend.dto.QuestionResponseDto;
import com.moyalist.backend.dto.TagStatsResponse;
import com.moyalist.backend.service.StatsService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.time.Year;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/stats")
@RequiredArgsConstructor
public class StatsController {

    private final StatsService statsService;

    @GetMapping("/tags/top")
    public ResponseEntity<List<TagStatsResponse>> getTopTags(
            @RequestParam(defaultValue = "weekly") String period) {
        return ResponseEntity.ok(statsService.getTopTags(period));
    }

    // 연도별 히트맵 데이터: { "2026-03-11": 3, ... }
    @GetMapping("/heatmap")
    public ResponseEntity<Map<String, Long>> getHeatmap(
            @AuthenticationPrincipal Long userId,
            @RequestParam(required = false) Integer year) {
        int targetYear = (year != null) ? year : Year.now().getValue();
        return ResponseEntity.ok(statsService.getHeatmap(userId, targetYear));
    }

    // 특정 날짜에 활동(생성/해결)한 질문 목록
    @GetMapping("/daily")
    public ResponseEntity<List<QuestionResponseDto>> getDailyQuestions(
            @AuthenticationPrincipal Long userId,
            @RequestParam String date) {
        return ResponseEntity.ok(statsService.getDailyQuestions(userId, LocalDate.parse(date)));
    }
}
