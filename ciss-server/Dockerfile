# Build stage
FROM gradle:7.6-jdk17 AS build
WORKDIR /app
COPY . .
RUN gradle build --no-daemon

# Runtime stage
FROM eclipse-temurin:17-jre
WORKDIR /app
COPY --from=build /app/build/libs/*.jar app.jar

# Runtime configuration
ENV REDIS_HOST=redis \
    REDIS_PORT=6379 \
    MONGO_URI=mongodb://mongo:27017

EXPOSE 8080

ENTRYPOINT ["java", "-jar", "app.jar"]