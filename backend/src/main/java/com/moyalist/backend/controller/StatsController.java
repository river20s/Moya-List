package com.moyalist.backend.controller;

import com.moyalist.backend.dto.DailyActivityResponse;
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

    // 특정 날짜의 활동: 생성된 질문 / 해결된 질문 분리 반환
    @GetMapping("/daily")
    public ResponseEntity<DailyActivityResponse> getDailyActivity(
            @AuthenticationPrincipal Long userId,
            @RequestParam String date) {
        return ResponseEntity.ok(statsService.getDailyActivity(userId, LocalDate.parse(date)));
    }
}
