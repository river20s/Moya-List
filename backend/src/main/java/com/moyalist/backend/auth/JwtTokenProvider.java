package com.moyalist.backend.auth;

import io.jsonwebtoken.*;
import io.jsonwebtoken.security.Keys;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import javax.crypto.SecretKey;
import java.util.Date;

/**
 * JWT 토큰 생성 및 검증을 담당하는 유틸리티 클래스.
 *
 * JWT(JSON Web Token) 구조: header.payload.signature
 * - header:    알고리즘 정보 (HS256)
 * - payload:   데이터 (userId, 만료시간 등)
 * - signature: 위변조 방지 서명
 */
@Component
public class JwtTokenProvider {

    private final SecretKey secretKey;
    private final long expiration;

    public JwtTokenProvider(
            @Value("${jwt.secret}") String secret,
            @Value("${jwt.expiration}") long expiration
    ) {
        // 문자열 시크릿을 HMAC-SHA 키로 변환
        this.secretKey = Keys.hmacShaKeyFor(secret.getBytes());
        this.expiration = expiration;
    }

    /** 사용자 ID를 담은 JWT 토큰 생성 */
    public String generateToken(Long userId) {
        Date now = new Date();
        Date expiryDate = new Date(now.getTime() + expiration);

        return Jwts.builder()
                .subject(String.valueOf(userId))   // payload에 userId 저장
                .issuedAt(now)                      // 발급 시간
                .expiration(expiryDate)             // 만료 시간
                .signWith(secretKey)                // 서명
                .compact();
    }

    /** 토큰에서 userId 추출 */
    public Long getUserId(String token) {
        String subject = Jwts.parser()
                .verifyWith(secretKey)
                .build()
                .parseSignedClaims(token)
                .getPayload()
                .getSubject();
        return Long.parseLong(subject);
    }

    /** 토큰 유효성 검증 */
    public boolean validate(String token) {
        try {
            Jwts.parser()
                    .verifyWith(secretKey)
                    .build()
                    .parseSignedClaims(token);
            return true;
        } catch (JwtException | IllegalArgumentException e) {
            return false;
        }
    }
}
