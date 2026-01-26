package com.moyalist.backend.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "tags")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class Tag {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Column(length = 50, nullable = false)
    private String name;

    @Column(length = 20, nullable = false)
    private String color;

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        if (color == null) {
            color = "#6B7280";
        }
    }

    @Builder
    public Tag(User user, String name, String color) {
        this.user = user;
        this.name = name;
        this.color = color != null ? color : "#6B7280";
    }

    public void update(String name, String color) {
        // null이면 기존 값 유지
        if (name != null) {
            this.name = name;
        }
        if (color != null) {
            this.color = color;
        }
    }
}