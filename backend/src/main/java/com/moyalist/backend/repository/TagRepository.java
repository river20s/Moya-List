package com.moyalist.backend.repository;

import com.moyalist.backend.entity.Tag;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.util.List;
import java.util.Optional;

public interface TagRepository extends JpaRepository<Tag, Long> {
    Optional<Tag> findByName(String name);

    @Query("SELECT qt.tag.id, COUNT(qt) FROM QuestionTag qt GROUP BY qt.tag.id")
    List<Object[]> countQuestionsByTag();
}