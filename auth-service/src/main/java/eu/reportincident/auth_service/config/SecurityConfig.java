package eu.reportincident.auth_service.config;

import eu.reportincident.auth_service.model.User;
import eu.reportincident.auth_service.service.UserService;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.security.web.SecurityFilterChain;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;

@Configuration
@EnableWebSecurity
@RequiredArgsConstructor
public class SecurityConfig {

    private final JwtService jwtService;
    private final UserService userService;

    @Value("${frontend.url}")
    private String frontendUrl;

    @Value("${allowed.domain}")
    private String requiredDomain;

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        http
                .sessionManagement(session -> session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
                .csrf(AbstractHttpConfigurer::disable)
                .authorizeHttpRequests(authorize -> authorize
                        .requestMatchers("/api/v1/auth/**", "/login/**", "/oauth2/**", "/error").permitAll()
                        .anyRequest().authenticated()
                )
                .oauth2Login(oauth2 -> oauth2
                        .successHandler((request, response, authentication) -> {
                            OAuth2User oauthUser = (OAuth2User) authentication.getPrincipal();
                            String email = oauthUser.getAttribute("email");

                            if (email == null) {
                                redirectToFrontendWithError(response, "Email not provided by identity provider.");
                                return;
                            }

                            String domain = email.substring(email.indexOf('@') + 1);

                            if (domain.equalsIgnoreCase(requiredDomain) || domain.toLowerCase().endsWith("." + requiredDomain)) {
                                User user = userService.processOAuth2User(oauthUser);
                                String jwt = jwtService.generateToken(user);
                                response.sendRedirect(frontendUrl + "/login-success?token=" + jwt);
                            } else {
                                String message = "Access denied. Only users with a '" + requiredDomain + "' domain are allowed.";
                                redirectToFrontendWithError(response, message);
                            }
                        })
                        .failureHandler((request, response, exception) -> {
                            String message = "Login failed. Please try again. Error: " + exception.getMessage();
                            redirectToFrontendWithError(response, message);
                        })
                );

        return http.build();
    }

    private void redirectToFrontendWithError(jakarta.servlet.http.HttpServletResponse response, String message) throws java.io.IOException {
        String encodedMessage = URLEncoder.encode(message, StandardCharsets.UTF_8.toString());
        response.sendRedirect(frontendUrl + "/login?error=" + encodedMessage);
    }
}
