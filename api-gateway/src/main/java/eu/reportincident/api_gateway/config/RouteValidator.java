package eu.reportincident.api_gateway.config;

import org.springframework.http.server.reactive.ServerHttpRequest;
import org.springframework.stereotype.Component;

import java.util.List;
import java.util.function.Predicate;

//curl -f http://localhost:8080/actuator/health || exit 1
//curl -f http://localhost:8080/incident-service/actuator/health || exit 1
//curl -f http://localhost:8080/moderation-service/actuator/health || exit 1
//curl -f http://localhost:8080/auth-service/actuator/health || exit 1
@Component
public class RouteValidator {

    public static final List<String> openApiEndpoints = List.of(
            "/login/oauth2/code/google",
            "/api/v1/incidents/filter",
            "/oauth2/authorization/google",
            "/actuator/health",
            "/incident-service/actuator/health",
            "/moderation-service/actuator/health",
            "/auth-service/actuator/health"
    );

    public Predicate<ServerHttpRequest> isSecured =
            request -> openApiEndpoints
                    .stream()
                    .noneMatch(uri -> request.getURI().getPath().contains(uri));
}

