package com.moyalist.backend.auth;

import com.moyalist.backend.entity.User;
import com.moyalist.backend.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.oauth2.client.oidc.userinfo.OidcUserRequest;
import org.springframework.security.oauth2.client.oidc.userinfo.OidcUserService;
import org.springframework.security.oauth2.core.oidc.user.OidcUser;
import org.springframework.stereotype.Service;

/**
 * Google은 OAuth2가 아닌 OIDC(OpenID Connect) 프로토콜을 사용한다.
 * OIDC 요청은 OidcUserService가 처리하므로 별도로 구현이 필요하다.
 *
 * CustomOAuth2UserService와 역할은 동일:
 * 구글에서 받은 사용자 정보로 DB에서 유저를 찾거나 신규 생성한다.
 */
@Service
@RequiredArgsConstructor
public class CustomOidcUserService extends OidcUserService {

    private final UserRepository userRepository;

    @Override
    public OidcUser loadUser(OidcUserRequest userRequest) {
        // 부모 클래스가 구글 OIDC 엔드포인트에서 사용자 정보를 가져옴
        OidcUser oidcUser = super.loadUser(userRequest);

        String provider = userRequest.getClientRegistration().getRegistrationId(); // "google"
        String providerId = oidcUser.getAttribute("sub");
        String email = oidcUser.getAttribute("email");
        String name = oidcUser.getAttribute("name");
        String picture = oidcUser.getAttribute("picture");

        userRepository.findByProviderAndProviderId(provider, providerId)
                .map(existingUser -> {
                    existingUser.update(name, email, picture);
                    return userRepository.save(existingUser);
                })
                .orElseGet(() -> userRepository.save(
                        User.builder()
                                .email(email).name(name).profileUrl(picture)
                                .provider(provider).providerId(providerId)
                                .build()
                ));

        return oidcUser;
    }
}
