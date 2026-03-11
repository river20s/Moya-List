package com.moyalist.backend.service;

import com.moyalist.backend.dto.QuestionResponseDto;
import com.moyalist.backend.dto.TagStatsResponse;
import com.moyalist.backend.repository.QuestionRepository;
import com.moyalist.backend.repository.QuestionTagRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.Year;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class StatsService {

    private final QuestionTagRepository questionTagRepository;
    private final QuestionRepository questionRepository;

    public List<TagStatsResponse> getTopTags(String period) {
        LocalDateTime startDate = calculateStartDate(period);
        return questionTagRepository.findTopTagsSince(startDate);
    }

    // 연도별 날짜별 활동 수 (생성 + 해결)
    public Map<String, Long> getHeatmap(Long userId, int year) {
        Map<String, Long> result = new HashMap<>();

        for (Object[] row : questionRepository.countCreatedByDay(userId, year)) {
            String date = row[0].toString();
            Long count = ((Number) row[1]).longValue();
            result.merge(date, count, Long::sum);
        }

        for (Object[] row : questionRepository.countResolvedByDay(userId, year)) {
            String date = row[0].toString();
            Long count = ((Number) row[1]).longValue();
            result.merge(date, count, Long::sum);
        }

        return result;
    }

    // 특정 날짜에 활동(생성 또는 해결)한 질문 목록
    public List<QuestionResponseDto> getDailyQuestions(Long userId, LocalDate date) {
        LocalDateTime start = date.atStartOfDay();
        LocalDateTime end = start.plusDays(1);
        return questionRepository.findByActivityDate(userId, start, end)
                .stream()
                .map(QuestionResponseDto::from)
                .collect(Collectors.toList());
    }

    private LocalDateTime calculateStartDate(String period) {
        LocalDateTime now = LocalDateTime.now();

        return switch (period) {
            case "weekly" -> now.minusDays(7);
            case "monthly" -> now.minusDays(30);
            case "yearly" -> now.minusDays(365);
            default -> now.minusDays(7);
        };
    }
}
