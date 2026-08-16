# Build stage
FROM maven:3.9.6-eclipse-temurin-17 AS build
WORKDIR /app
# 1. Copy pom.xml and pre-fetch dependencies (Cached Docker Layer)
COPY pom.xml .
RUN mvn dependency:go-offline -B

# 2. Copy source code and package application (Fast Build)
COPY src ./src
RUN mvn package -DskipTests -B

# Run stage
FROM eclipse-temurin:17-jre-alpine
WORKDIR /app
COPY --from=build /app/target/*.jar app.jar
EXPOSE 8080
ENTRYPOINT ["java", "-jar", "app.jar"]
