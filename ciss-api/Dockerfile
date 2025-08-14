# Build stage: compile the application using Gradle
FROM eclipse-temurin:17-jdk AS builder

WORKDIR /workspace

# Copy source code and Gradle wrapper
COPY . ./

# Build the ciss-api module and create the Boot JAR
RUN ./gradlew :ciss-api:bootJar --no-daemon

# Runtime stage: run the application
FROM eclipse-temurin:17-jre

WORKDIR /app

# Environment variables can be overridden at runtime or via --env-file
ENV JAVA_OPTS="" \
    SPRING_PROFILES_ACTIVE="default"

# Copy the built JAR from the builder stage
COPY --from=builder /workspace/ciss-api/build/libs/*.jar app.jar

EXPOSE 8081

ENTRYPOINT ["sh", "-c", "java $JAVA_OPTS -jar app.jar"]