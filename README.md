"# sk_ciss_das_test_20250801" 
# CISS DAS Test Skeleton

This repository provides a minimal Spring Boot multi-module project that mimics the architecture of the CISS backend. Each module runs on Java 11 with Spring Boot 2.6.3 and exposes a simple health endpoint.

## Modules
- **ciss-api** (8081): accepts messages and enqueues them into Redis (`/enqueue`).
- **ciss-server** (8085): dequeues messages from Redis (`/dequeue`).
- **ciss-daemon-server** (8087)
- **ciss-batch** (8083)
- **ciss-fescaro-solution** (8082)
- **ciss-front-end** (3000)

All services share Redis settings via `application.yml` and include a `/health` endpoint.

## Running tests
```
./gradlew test
```