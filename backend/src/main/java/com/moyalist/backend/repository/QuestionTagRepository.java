package com.moyalist.backend.repository;

import com.moyalist.backend.entity.QuestionTag;
import com.moyalist.backend.entity.QuestionTagId;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface QuestionTagRepository extends JpaRepository<QuestionTag, QuestionTagId> {
    List<QuestionTag> findByQuestionId(Long questionId);
    List<QuestionTag> findByTagId(Long tagId);
}