package com.moyalist.backend.auth;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.List;

/**
 * 모든 요청에서 JWT 토큰을 검증하는 필터.
 *
 * 요청 헤더: Authorization: Bearer {token}
 *
 * 흐름:
 * 1. 헤더에서 "Bearer " 이후의 토큰 문자열 추출
 * 2. JwtTokenProvider로 유효성 검증
 * 3. 유효하면 SecurityContext에 인증 정보 저장
 *    → 이후 컨트롤러에서 @AuthenticationPrincipal로 꺼낼 수 있음
 */
@Component
@RequiredArgsConstructor
public class JwtAuthenticationFilter extends OncePerRequestFilter {

    private final JwtTokenProvider jwtTokenProvider;

    @Override
    protected void doFilterInternal(
            HttpServletRequest request,
            HttpServletResponse response,
            FilterChain filterChain
    ) throws ServletException, IOException {

        String token = extractToken(request);

        if (token != null && jwtTokenProvider.validate(token)) {
            Long userId = jwtTokenProvider.getUserId(token);

            // SecurityContext에 인증 정보 등록 (권한은 빈 리스트로 설정)
            UsernamePasswordAuthenticationToken authentication =
                    new UsernamePasswordAuthenticationToken(userId, null, List.of());
            SecurityContextHolder.getContext().setAuthentication(authentication);
        }

        filterChain.doFilter(request, response);
    }

    /** Authorization 헤더에서 Bearer 토큰 추출 */
    private String extractToken(HttpServletRequest request) {
        String header = request.getHeader("Authorization");
        if (StringUtils.hasText(header) && header.startsWith("Bearer ")) {
            return header.substring(7);
        }
        return null;
    }
}
