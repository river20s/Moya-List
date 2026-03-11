package com.moyalist.backend.repository;

import com.moyalist.backend.entity.Question;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDateTime;
import java.util.List;

public interface QuestionRepository extends JpaRepository<Question, Long>,
                                            JpaSpecificationExecutor<Question> {

    List<Question> findByUserIdOrderByCreatedAtDesc(Long userId);

    // 연도별 날짜별 생성 수 (히트맵용)
    @Query(value = "SELECT DATE(created_at) as date, COUNT(*) as cnt " +
                   "FROM questions WHERE user_id = :userId AND YEAR(created_at) = :year " +
                   "GROUP BY DATE(created_at)", nativeQuery = true)
    List<Object[]> countCreatedByDay(@Param("userId") Long userId, @Param("year") int year);

    // 연도별 날짜별 해결 수 (히트맵용)
    @Query(value = "SELECT DATE(resolved_at) as date, COUNT(*) as cnt " +
                   "FROM questions WHERE user_id = :userId AND resolved_at IS NOT NULL AND YEAR(resolved_at) = :year " +
                   "GROUP BY DATE(resolved_at)", nativeQuery = true)
    List<Object[]> countResolvedByDay(@Param("userId") Long userId, @Param("year") int year);

    // 특정 날짜에 생성되거나 해결된 질문 목록
    @Query("SELECT q FROM Question q WHERE q.user.id = :userId " +
           "AND (q.createdAt >= :start AND q.createdAt < :end " +
           "     OR (q.resolvedAt IS NOT NULL AND q.resolvedAt >= :start AND q.resolvedAt < :end)) " +
           "ORDER BY q.createdAt DESC")
    List<Question> findByActivityDate(@Param("userId") Long userId,
                                      @Param("start") LocalDateTime start,
                                      @Param("end") LocalDateTime end);
}