package com.moyalist.backend.specification;

import com.moyalist.backend.entity.Question;
import com.moyalist.backend.entity.QuestionTag;
import com.moyalist.backend.entity.Tag;
import jakarta.persistence.criteria.Join;
import jakarta.persistence.criteria.Predicate;
import org.springframework.data.jpa.domain.Specification;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;
import java.util.Locale;

/**
 * Question 엔티티에 대한 검색 조건을 정의하는 Specification 클래스
 *
 * Specification은 JPA Criteria API를 사용하여 동적 쿼리를 생성합니다.
 * 각 static 메서드는 하나의 검색 조건을 Specification 객체로 반환합니다.
 */
public class
QuestionSpecification {

    /**
     * 키워드로 제목 또는 설명을 검색하는 조건
     *
     * @param keyword 검색할 키워드
     * @return Specification<Question>
     *
     * SQL 예시:
     * WHERE (title LIKE '%keyword%' OR description LIKE '%keyword%')
     */
    public static Specification<Question> hasKeyword(String keyword) {
        return (root, query, cb) -> {
            if (keyword == null || keyword.trim().isEmpty()) {
                return null; // 조건이 없으면 null 반환 (조건 무시)
            }

            String pattern = "%" + keyword + "%";

            // root.get("title"): Question 엔티티의 title 필드
            // cb.like(): SQL의 LIKE 연산자
            // cb.or(): 두 조건을 OR로 연결
            return cb.or(
                cb.like(root.get("title"), pattern),
                cb.like(root.get("description"), pattern)
            );
        };
    }

    /**
     * 특정 태그를 가진 질문을 검색하는 조건
     *
     * @param tagId 검색할 태그 ID
     * @return Specification<Question>
     *
     * SQL 예시:
     * SELECT q.* FROM questions q
     * JOIN question_tags qt ON q.id = qt.question_id
     * JOIN tags t ON qt.tag_id = t.id
     * WHERE t.id = tagId
     */
    public static Specification<Question> hasTag(Long tagId) {
        return (root, query, cb) -> {
            if (tagId == null) {
                return null;
            }

            // Question -> QuestionTag 조인
            // root.join("questionTags"): Question 엔티티의 questionTags 컬렉션과 조인
            Join<Question, QuestionTag> questionTagJoin = root.join("questionTags");

            // QuestionTag -> Tag 조인
            Join<QuestionTag, Tag> tagJoin = questionTagJoin.join("tag");

            // Tag의 id가 tagId와 같은 조건
            return cb.equal(tagJoin.get("id"), tagId);
        };
    }

    /**
     * 해결 여부로 필터링하는 조건
     *
     * @param isResolved 해결 여부 (true: 해결됨, false: 미해결, null: 전체)
     * @return Specification<Question>
     *
     * SQL 예시:
     * WHERE is_resolved = isResolved
     */
    public static Specification<Question> isResolved(Boolean isResolved) {
        return (root, query, cb) -> {
            if (isResolved == null) {
                return null;
            }

            // root.get("isResolved"): Question 엔티티의 isResolved 필드
            // cb.equal(): SQL의 = 연산자
            return cb.equal(root.get("isResolved"), isResolved);
        };
    }

    /**
     * 여러 조건을 조합하여 최종 Specification을 생성
     *
     * @param keyword 검색 키워드 (선택)
     * @param tagId 태그 ID (선택)
     * @param isResolved 해결 여부 (선택)
     * @return 조합된 Specification
     *
     * 이 메서드는 주어진 파라미터들을 AND 조건으로 조합합니다.
     * null인 파라미터는 무시됩니다 (동적 쿼리).
     */
    public static Specification<Question> searchWith(
            Long userId,
            String keyword,
            Long tagId,
            Boolean isResolved,
            LocalDate startDate,
            LocalDate endDate
    ) {
        return (root, query, cb) -> {
            List<Predicate> predicates = new ArrayList<>();

            // 사용자 조건 추가 (본인 질문만 조회)
            predicates.add(cb.equal(root.get("user").get("id"), userId));

            // 키워드 조건 추가
            if (keyword != null && !keyword.trim().isEmpty()) {
                String pattern = "%" + keyword + "%";
                predicates.add(
                    cb.or(
                        cb.like(root.get("title"), pattern),
                        cb.like(root.get("description"), pattern)
                    )
                );
            }

            // 태그 조건 추가
            if (tagId != null) {
                Join<Question, QuestionTag> questionTagJoin = root.join("questionTags");
                Join<QuestionTag, Tag> tagJoin = questionTagJoin.join("tag");
                predicates.add(cb.equal(tagJoin.get("id"), tagId));
            }

            // 해결 여부 조건 추가
            if (isResolved != null) {
                predicates.add(cb.equal(root.get("isResolved"), isResolved));
            }

            // 시작일 조건 추가
            // createdAt >= startDate 00:00:00
            if (startDate != null) {
                predicates.add(cb.greaterThanOrEqualTo(
                        root.get("createdAt"),
                        startDate.atStartOfDay()
                ));
            }

            // 종료일 조건 추가
            // createdAt < endDate+1 00:00:00
            // 종료일 포함
            if (endDate != null) {
                predicates.add(cb.lessThan(
                        root.get("createdAt"),
                        endDate.plusDays(1).atStartOfDay()
                ));
            }

            // 모든 조건을 AND로 연결
            // predicates가 비어있으면 null 반환 (조건 없음 = 전체 조회)
            return predicates.isEmpty() ? null : cb.and(predicates.toArray(new Predicate[0]));
        };
    }
}
