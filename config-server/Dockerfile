# 1. faza - Build aplikacije
FROM maven:3.9.3-eclipse-temurin-17 as builder
RUN apt-get update && apt-get install -y curl && apt-get clean
WORKDIR /app
COPY . .
RUN mvn clean package -DskipTests

# 2. faza - Pokretanje aplikacije
FROM eclipse-temurin:17-jdk-alpine
WORKDIR /app

# Port kao argument (opcionalno)
ARG DEFAULT_PORT=8888
ENV PORT=$DEFAULT_PORT

# Izloženi port (nije obavezan ali je dobra praksa)
EXPOSE $PORT

# Kopiranje JAR-a iz builder stage-a
COPY --from=builder /app/target/config-server-*.jar app.jar

ENTRYPOINT ["java", "-jar", "app.jar"]