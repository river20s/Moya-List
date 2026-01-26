package com.moyalist.backend.controller;

import com.moyalist.backend.dto.QuestionResponseDto;
import com.moyalist.backend.dto.TagRequestDto;
import com.moyalist.backend.dto.TagResponseDto;
import com.moyalist.backend.service.TagService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/tags")
@RequiredArgsConstructor
public class TagController {

    private final TagService tagService;

    @GetMapping
    public ResponseEntity<List<TagResponseDto>> getAllTags() {
        // 모든 태그 반환
        return ResponseEntity.ok(tagService.getAllTags());
    }

    @GetMapping("/{id}")
    public ResponseEntity<TagResponseDto> getTag(@PathVariable Long id) {
        // 특정 태그 반환
        return ResponseEntity.ok(tagService.getTag(id));
    }

    @PostMapping
    public ResponseEntity<TagResponseDto> createTag(@RequestBody Map<String, String> request) {
        Long userId = Long.parseLong(request.get("userId"));
        String name = request.get("name");
        return ResponseEntity.ok(tagService.createTag(userId, name));
    }

    @PutMapping("/{id}")
    public  ResponseEntity<TagResponseDto> updateTag(@RequestBody TagRequestDto request, @PathVariable Long id) {
        return ResponseEntity.ok(tagService.updateTag(id, request));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteTag(@PathVariable Long id) {
        tagService.deleteTag(id);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/{id}/questions")
    public ResponseEntity<List<QuestionResponseDto>>
    getQuestionByTagId(@PathVariable Long id) {
        return ResponseEntity.ok(tagService.getQuestionsByTagId(id));
    }
}