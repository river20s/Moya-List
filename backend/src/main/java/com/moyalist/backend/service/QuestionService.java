package com.moyalist.backend.service;

import com.moyalist.backend.entity.Question;
import com.moyalist.backend.entity.User;
import com.moyalist.backend.repository.QuestionRepository;
import com.moyalist.backend.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class QuestionService {

    private final QuestionRepository questionRepository;
    private final UserRepository userRepository;

    public List<Question> getQuestionsByUser(Long userId) {
        return questionRepository.findByUserIdOrderByCreatedAtDesc(userId);
    }

    public Question getQuestion(Long id) {
        return questionRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("질문을 찾을 수 없습니다: " + id));
    }

    @Transactional
    public Question createQuestion(Long userId, String title, String sourceUrl, String description) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("사용자를 찾을 수 없습니다: " + userId));

        Question question = Question.builder()
                .user(user)
                .title(title)
                .sourceUrl(sourceUrl)
                .description(description)
                .isResolved(false)
                .build();

        return questionRepository.save(question);
    }

    @Transactional
    public void deleteQuestion(Long id) {
        questionRepository.deleteById(id);
    }
}