package com.moyalist.backend.auth;

import com.moyalist.backend.entity.User;
import com.moyalist.backend.repository.UserRepository;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.core.Authentication;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.security.web.authentication.SimpleUrlAuthenticationSuccessHandler;
import org.springframework.stereotype.Component;

import java.io.IOException;

/**
 * OAuth2 로그인 성공 시 동작하는 핸들러.
 *
 * 1. CustomOAuth2User에서 userId를 꺼냄
 * 2. JwtTokenProvider로 JWT 토큰 생성
 * 3. 프론트엔드로 리다이렉트 (토큰을 쿼리 파라미터로 전달)
 *
 * 프론트엔드는 URL에서 토큰을 꺼내 localStorage에 저장한 뒤,
 * 이후 모든 API 요청의 Authorization 헤더에 붙인다.
 */
@Component
@RequiredArgsConstructor
public class OAuth2SuccessHandler extends SimpleUrlAuthenticationSuccessHandler {

    private final JwtTokenProvider jwtTokenProvider;
    private final UserRepository userRepository;

    @Value("${app.frontend-url}")
    private String frontendUrl;

    @Override
    public void onAuthenticationSuccess(
            HttpServletRequest request,
            HttpServletResponse response,
            Authentication authentication
    ) throws IOException {
        // Google은 OIDC를 사용하므로 DefaultOidcUser가 반환됨 → OAuth2User로만 참조
        OAuth2User oAuth2User = (OAuth2User) authentication.getPrincipal();
        String email = oAuth2User.getAttribute("email");

        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new IllegalStateException("로그인 후 유저를 찾을 수 없음: " + email));

        String token = jwtTokenProvider.generateToken(user.getId());

        // 프론트엔드의 /auth/callback 페이지로 토큰을 전달
        String redirectUrl = frontendUrl + "/auth/callback?token=" + token;
        getRedirectStrategy().sendRedirect(request, response, redirectUrl);
    }
}
