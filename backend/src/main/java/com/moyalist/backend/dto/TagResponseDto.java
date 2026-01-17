package com.moyalist.backend.dto;

import com.moyalist.backend.entity.Tag;
import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
public class TagResponseDto {

    // Tag 엔티티를 API 응답용으로 변환
    // DB (tags 테이블)
    //      ↓
    // Tag 엔티티 (Java 객체)
    //      ↓
    // TagResponseDTO (API 응답용)
    //      ↓
    // JSON 응답: {"id": 1, "name": "ubukki"}

    private Long id;
    private String name;
    private String color;

    public static TagResponseDto from(Tag tag) {
        return TagResponseDto.builder()
                .id(tag.getId())
                .name(tag.getName())
                .color(tag.getColor())
                .build();
    }
}