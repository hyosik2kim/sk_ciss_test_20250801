# Build stage: compile the application using Gradle
FROM gradle:8.7-jdk17 AS build
WORKDIR /home/gradle/project

# Copy Gradle wrapper and project files
COPY gradle gradle
COPY build.gradle settings.gradle gradlew gradlew.bat wrapper.gradle ./
COPY ciss-daemon-server ./ciss-daemon-server

# Build the application
RUN gradle :ciss-daemon-server:bootJar --no-daemon

# Runtime stage: run the built application with a smaller JRE image
FROM eclipse-temurin:17-jre-alpine
WORKDIR /app

# Copy the built jar from the build stage
COPY --from=build /home/gradle/project/ciss-daemon-server/build/libs/*-SNAPSHOT.jar app.jar

# Configure exposed port and external dependency
EXPOSE 8087
ENV SPRING_REDIS_HOST=redis

# Run the application
ENTRYPOINT ["java","-jar","app.jar"]