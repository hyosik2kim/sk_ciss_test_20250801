# syntax=docker/dockerfile:1

# Build stage
FROM gradle:7.4-jdk11 AS build
WORKDIR /home/gradle/project

# Copy Gradle wrapper and settings
COPY gradle gradle
COPY gradlew settings.gradle build.gradle ./

# Copy module sources
COPY ciss-fescaro-solution ciss-fescaro-solution

# Build the Spring Boot jar
RUN ./gradlew :ciss-fescaro-solution:bootJar --no-daemon

# Runtime stage
FROM eclipse-temurin:11-jre-jammy
WORKDIR /app

# Copy the built jar
COPY --from=build /home/gradle/project/ciss-fescaro-solution/build/libs/*.jar app.jar

# Expose service port
EXPOSE 8082

# Environment variables for secrets (set these at runtime)
ENV REDIS_HOST="" \
    REDIS_PORT="" \
    MONGODB_URI=""

# Run the application
ENTRYPOINT ["java","-jar","app.jar"]