package com.moyalist.backend.service;

import com.moyalist.backend.entity.Question;
import com.moyalist.backend.repository.QuestionRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class QuestionService {

    private final QuestionRepository questionRepository;

    public List<Question> getQuestionsByUser(Long userId) {
        return questionRepository.findByUserIdOrderByCreatedAtDesc(userId);
    }

    public Question getQuestion(Long id) {
        return questionRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("질문을 찾을 수 없습니다: " + id));
    }
}