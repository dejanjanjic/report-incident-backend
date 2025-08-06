package eu.reportincident.auth_service.service;

import eu.reportincident.auth_service.enums.Role;
import eu.reportincident.auth_service.model.User;
import eu.reportincident.auth_service.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Optional;

@Service
@RequiredArgsConstructor
public class UserService {

    private final UserRepository userRepository;

    @Transactional
    public User saveUser(OAuth2User oauth2User) {
        String email = oauth2User.getAttribute("email");
        String name = oauth2User.getAttribute("name");

        User user = User.builder()
                    .username(email)
                    .fullName(name)
                    .role(Role.ROLE_USER)
                    .build();

        return userRepository.save(user);
    }

    public User findUser(OAuth2User oauthUser) {
        String email = oauthUser.getAttribute("email");

        if (userRepository.findByUsername(email).isPresent()) {
            return userRepository.findByUsername(email).get();
        }

        return null;
    }
}
