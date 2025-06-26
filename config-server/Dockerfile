FROM openjdk:17-jdk-slim
RUN apt-get update && apt-get install -y curl && apt-get clean
WORKDIR /app
COPY target/config-server-*.jar app.jar
EXPOSE 8888
ENTRYPOINT ["java", "-jar", "app.jar"]