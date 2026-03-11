package com.moyalist.backend.controller;

import com.moyalist.backend.dto.QuestionRequestDto;
import com.moyalist.backend.dto.QuestionResponseDto;
import com.moyalist.backend.service.QuestionService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;

@RestController
@RequestMapping("/api/questions")
@RequiredArgsConstructor
public class QuestionController {

    private final QuestionService questionService;

    @PostMapping
    public ResponseEntity<QuestionResponseDto> createQuestion(
            @AuthenticationPrincipal Long userId,
            @Valid @RequestBody QuestionRequestDto request) {
        QuestionResponseDto response = questionService.createQuestion(userId, request);
        return ResponseEntity.ok(response);
    }

    /**
     * 질문 목록 조회 및 검색 API
     *
     * @param keyword 검색 키워드 (선택, 제목과 설명에서 검색)
     * @param tagId 태그 ID (선택, 특정 태그로 필터링)
     * @param isResolved 해결 여부 (선택, true/false로 필터링)
     * @param page 페이지 번호 (기본값: 0)
     * @param size 페이지 크기 (기본값: 10)
     * @param sort 정렬 기준 (기본값: createdAt,desc - 최신순)
     * @return Page<QuestionResponseDto> 페이징된 질문 목록
     *
     * 사용 예시:
     * - 전체 조회: GET /api/questions
     * - 키워드 검색: GET /api/questions?keyword=spring
     * - 태그 필터: GET /api/questions?tagId=1
     * - 미해결만: GET /api/questions?isResolved=false
     * - 복합 조건: GET /api/questions?keyword=spring&tagId=1&isResolved=false&page=0&size=10
     */
    @GetMapping
    public ResponseEntity<Page<QuestionResponseDto>> getAllQuestions(
            @AuthenticationPrincipal Long userId,
            @RequestParam(required = false) String keyword,
            @RequestParam(required = false) Long tagId,
            @RequestParam(required = false) Boolean isResolved,
            @RequestParam(required = false) LocalDate startDate,
            @RequestParam(required = false) LocalDate endDate,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(defaultValue = "createdAt,desc") String sort) {

        String[] sortParams = sort.split(",");
        Sort.Direction direction = sortParams.length > 1 && sortParams[1].equalsIgnoreCase("asc")
                ? Sort.Direction.ASC
                : Sort.Direction.DESC;
        Sort sortBy = Sort.by(direction, sortParams[0]);

        Pageable pageable = PageRequest.of(page, size, sortBy);

        Page<QuestionResponseDto> result = questionService.searchQuestions(
                userId, keyword, tagId, isResolved, startDate, endDate, pageable
        );

        return ResponseEntity.ok(result);
    }

    @GetMapping("/{id}")
    public ResponseEntity<QuestionResponseDto> getQuestion(@PathVariable Long id) {
        return ResponseEntity.ok(questionService.getQuestion(id));
    }

    @PatchMapping("/{id}/resolve")
    public ResponseEntity<QuestionResponseDto> toggleResolveStatus(
            @AuthenticationPrincipal Long userId,
            @PathVariable Long id) {
        return ResponseEntity.ok(questionService.toggleResolve(userId, id));
    }

    @PutMapping("/{id}")
    public ResponseEntity<QuestionResponseDto> updateQuestion(
            @AuthenticationPrincipal Long userId,
            @PathVariable Long id,
            @Valid @RequestBody QuestionRequestDto request) {
        return ResponseEntity.ok(questionService.updateQuestion(userId, id, request));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteQuestion(
            @AuthenticationPrincipal Long userId,
            @PathVariable Long id) {
        questionService.deleteQuestion(userId, id);
        return ResponseEntity.noContent().build();
    }
}