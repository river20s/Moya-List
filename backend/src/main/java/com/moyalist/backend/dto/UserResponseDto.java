package com.moyalist.backend.dto;

import com.moyalist.backend.entity.User;
import lombok.Builder;
import lombok.Getter;

import java.time.LocalDateTime;

@Getter
@Builder
public class UserResponseDto {

    private Long id;
    private String name;
    private String email;
    private String profileUrl;
    private String provider;
    private LocalDateTime createdAt;

    public static UserResponseDto from(User user) {
        return UserResponseDto.builder()
                .id(user.getId())
                .name(user.getName())
                .email(user.getEmail())
                .profileUrl(user.getProfileUrl())
                .provider(user.getProvider())
                .createdAt(user.getCreatedAt())
                .build();
    }
}