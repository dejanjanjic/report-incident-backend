package eu.reportincident.api_gateway.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.config.annotation.web.reactive.EnableWebFluxSecurity;
import org.springframework.security.config.web.server.ServerHttpSecurity;
import org.springframework.security.web.server.SecurityWebFilterChain;

@Configuration
@EnableWebFluxSecurity
public class SecurityConfig {

    @Bean
    public SecurityWebFilterChain springSecurityFilterChain(ServerHttpSecurity http) {
        //TODO: Popraviti koje putanje smiju a koje ne
        http
                .csrf(ServerHttpSecurity.CsrfSpec::disable)
                .authorizeExchange(exchange -> exchange
                        .pathMatchers("/api/v1/auth/**").permitAll()
                        .pathMatchers("/login/**").permitAll()
                        .pathMatchers("/oauth2/**").permitAll()
                        .pathMatchers(HttpMethod.GET, "/api/v1/incidents/**").permitAll()
                        .pathMatchers(HttpMethod.POST, "/api/v1/incidents/filter/**").permitAll()
                        .pathMatchers(HttpMethod.GET, "/api/v1/moderation/**").permitAll()
                        .anyExchange().authenticated()
                );

        return http.build();
    }
}