# Build the batch module jar
FROM gradle:7.4.2-jdk17 AS build
WORKDIR /workspace
COPY . /workspace
RUN gradle :ciss-batch:bootJar --no-daemon

# Runtime image
FROM eclipse-temurin:17-jre
WORKDIR /app
COPY --from=build /workspace/ciss-batch/build/libs/*.jar /app/ciss-batch.jar
# Default command runs the batch jar. Use an external scheduler (e.g., cron) to trigger as needed.
CMD ["java", "-jar", "/app/ciss-batch.jar"]