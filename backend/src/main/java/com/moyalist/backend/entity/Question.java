package com.moyalist.backend.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "questions")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@AllArgsConstructor
@Builder
public class Question {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Column(length = 500, nullable = false)
    private String title;

    @Column(columnDefinition = "TEXT")
    private String description;

    @Column(name = "source_url", length = 1000)
    private String sourceUrl;

    @Builder.Default
    @Column(name = "is_resolved", nullable = false)
    private Boolean isResolved = false;

    @Column(name = "resolved_at")
    private LocalDateTime resolvedAt;

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @Builder.Default
    @OneToMany(mappedBy = "question", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<QuestionTag> questionTags = new ArrayList<>();

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
    }

    // update 메서드
    public void update(String title, String sourceUrl, String description) {
        this.title = title;
        this.sourceUrl = sourceUrl;
        this.description = description;
    }

    // isResolved 값을 반전시키는 메서드
    public void toggleResolved() {
        this.isResolved = !this.isResolved;
        this.resolvedAt = this.isResolved ? LocalDateTime.now() : null;
    }

    //태그 추가 메서드
    public void addTag(Tag tag) {
        QuestionTag questionTag = new QuestionTag(this, tag);
        this.questionTags.add(questionTag);
    }
}