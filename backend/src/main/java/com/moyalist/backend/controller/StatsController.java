package com.moyalist.backend.controller;

import com.moyalist.backend.dto.TagStatsResponse;
import com.moyalist.backend.service.StatsService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

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
}
