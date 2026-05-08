# ── Stage 1: Build ────────────────────────────────────────────────────────────
FROM maven:3.9.6-eclipse-temurin-17 AS builder

WORKDIR /app

# Copy pom first – lets Docker cache the dependency layer
COPY pom.xml .
RUN mvn dependency:go-offline -q

# Copy source and build (skip tests – tests run in CI before this)
COPY src ./src
RUN mvn package -DskipTests -q

# ── Stage 2: Run ──────────────────────────────────────────────────────────────
FROM eclipse-temurin:17-jre-alpine

WORKDIR /app

# Non-root user for security
RUN addgroup -S aegis && adduser -S aegis -G aegis
USER aegis

COPY --from=builder /app/target/aegis-server-*.jar app.jar

EXPOSE 8081

ENTRYPOINT ["java", \
  "-Duser.timezone=Asia/Kolkata", \
  "-jar", "app.jar"]
