FROM alpine/java:21-jre
WORKDIR /app
COPY target/*.jar app.jar
ARG DEFAULT_PORT=8083
ENV PORT=$DEFAULT_PORT
EXPOSE $PORT
ENTRYPOINT ["java", "-jar", "app.jar"]
