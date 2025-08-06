FROM alpine/java:21-jre
RUN apk update && apk add --no-cache curl
WORKDIR /app
COPY target/*.jar app.jar
ARG DEFAULT_PORT=8888
ENV PORT=$DEFAULT_PORT
EXPOSE $PORT
ENTRYPOINT ["java", "-jar", "app.jar"]