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
    public User processOAuth2User(OAuth2User oauth2User) {
        String email = oauth2User.getAttribute("email");
        String name = oauth2User.getAttribute("name");

        Optional<User> userOptional = userRepository.findByUsername(email);

        User user;
        if (userOptional.isPresent()) {
            // Korisnik već postoji, ažuriraj ime ako je potrebno
            user = userOptional.get();
            user.setFullName(name);
        } else {
            // Kreiraj novog korisnika
            user = User.builder()
                    .username(email)
                    .fullName(name)
                    .role(Role.ROLE_MODERATOR) // Svi sa ETF domenom su moderatori
                    .build();
        }
        return userRepository.save(user);
    }
}
