package com.moyalist.backend.auth;

import com.moyalist.backend.entity.User;
import com.moyalist.backend.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.oauth2.client.userinfo.DefaultOAuth2UserService;
import org.springframework.security.oauth2.client.userinfo.OAuth2UserRequest;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.stereotype.Service;

/**
 * OAuth2 로그인 성공 후 호출되는 서비스.
 *
 * Spring Security가 Google에서 사용자 정보를 받아온 뒤,
 * 이 서비스를 통해 우리 DB의 User와 연결한다.
 *
 * 흐름:
 * 1. Google → 사용자 정보(email, name, picture) 반환
 * 2. loadUser() 호출 → DB에 없으면 신규 가입, 있으면 정보 업데이트
 * 3. OAuth2User 반환 → 이후 OAuth2SuccessHandler에서 JWT 발급
 */
@Service
@RequiredArgsConstructor
public class CustomOAuth2UserService extends DefaultOAuth2UserService {

    private final UserRepository userRepository;

    @Override
    public OAuth2User loadUser(OAuth2UserRequest userRequest) {
        // 부모 클래스가 Google API를 호출해서 사용자 정보를 가져옴
        OAuth2User oAuth2User = super.loadUser(userRequest);

        String provider = userRequest.getClientRegistration().getRegistrationId(); // "google"
        String providerId = oAuth2User.getAttribute("sub");   // Google 고유 ID
        String email = oAuth2User.getAttribute("email");
        String name = oAuth2User.getAttribute("name");
        String picture = oAuth2User.getAttribute("picture");

        // DB에서 기존 사용자 조회
        User user = userRepository.findByProviderAndProviderId(provider, providerId)
                .map(existingUser -> {
                    // 기존 사용자면 최신 정보로 업데이트 (이름, 프로필 사진)
                    existingUser.update(name, email, picture);
                    return userRepository.save(existingUser);
                })
                .orElseGet(() -> userRepository.save(
                        // 신규 사용자면 DB에 저장
                        User.builder()
                                .email(email)
                                .name(name)
                                .profileUrl(picture)
                                .provider(provider)
                                .providerId(providerId)
                                .build()
                ));

        // userId를 attributes에 추가해서 SuccessHandler에서 꺼낼 수 있게 함
        return new CustomOAuth2User(oAuth2User, user.getId());
    }
}
