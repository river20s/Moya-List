package com.moyalist.backend.controller;

import com.moyalist.backend.dto.UserResponseDto;
import com.moyalist.backend.entity.User;
import com.moyalist.backend.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * 인증 관련 API.
 *
 * GET /api/auth/me
 *   - JwtAuthenticationFilter가 토큰을 검증하고 SecurityContext에 userId를 저장
 *   - @AuthenticationPrincipal로 해당 userId를 꺼내 사용자 정보 반환
 */
@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {

    private final UserRepository userRepository;

    @GetMapping("/me")
    public ResponseEntity<UserResponseDto> me(@AuthenticationPrincipal Long userId) {
        if (userId == null) {
            return ResponseEntity.status(401).build();
        }

        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));

        return ResponseEntity.ok(UserResponseDto.from(user));
    }
}
