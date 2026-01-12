package com.moyalist.backend.controller;

import com.moyalist.backend.entity.Question;
import com.moyalist.backend.service.QuestionService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/questions")
@RequiredArgsConstructor
public class QuestionController {

    private final QuestionService questionService;

    @GetMapping("/user/{userId}")
    public List<Question> getQuestionsByUser(@PathVariable Long userId) {
        return questionService.getQuestionsByUser(userId);
    }

    @GetMapping("/{id}")
    public Question getQuestion(@PathVariable Long id) {
        return questionService.getQuestion(id);
    }

    @PostMapping
    public Question createQuestion(@RequestBody Map<String, String> request) {
        Long userId = Long.parseLong(request.get("userId"));
        String title = request.get("title");
        String sourceUrl = request.get("sourceUrl");
        String description = request.get("description");

        return questionService.createQuestion(userId, title, sourceUrl, description);
    }

    @DeleteMapping("/{id}")
    public void deleteQuestion(@PathVariable Long id) {
        questionService.deleteQuestion(id);
    }
}