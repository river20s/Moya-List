package com.moyalist.backend.repository;

import com.moyalist.backend.entity.Question;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface QuestionRepository extends JpaRepository<Question, Long> {
    List<Question> findByUserIdOrderByCreatedAtDesc(Long userId);
}