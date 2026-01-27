package com.moyalist.backend.service;

import com.moyalist.backend.dto.TagStatsResponse;
import com.moyalist.backend.repository.QuestionTagRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class StatsService {

    private final QuestionTagRepository questionTagRepository;

    public List<TagStatsResponse> getTopTags(String period) {
        LocalDateTime startDate = calculateStartDate(period);
        return questionTagRepository.findTopTagsSince(startDate);
    }

    private LocalDateTime calculateStartDate(String period) {
        LocalDateTime now = LocalDateTime.now();

        return switch (period) {
            case "weekly" -> now.minusDays(7);
            case "monthly" -> now.minusDays(30);
            case "yearly" -> now.minusDays(365);
            default -> now.minusDays(7); // 기본값: weekly
        };
    }
}
