package com.moyalist.backend.repository;

import com.moyalist.backend.dto.TagStatsResponse;
import com.moyalist.backend.entity.QuestionTag;
import com.moyalist.backend.entity.QuestionTagId;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDateTime;
import java.util.List;

public interface QuestionTagRepository extends JpaRepository<QuestionTag, QuestionTagId> {
    List<QuestionTag> findByQuestionId(Long questionId);
    List<QuestionTag> findByTagId(Long tagId);

    @Query("SELECT new com.moyalist.backend.dto.TagStatsResponse(t.id, t.name, COUNT(t)) " +
           "FROM QuestionTag qt " +
           "JOIN qt.tag t " +
           "JOIN qt.question q " +
           "WHERE q.createdAt >= :startDate " +
           "GROUP BY t.id, t.name " +
           "ORDER BY COUNT(t) DESC " +
           "LIMIT 5")
    List<TagStatsResponse> findTopTagsSince(@Param("startDate") LocalDateTime startDate);
}
