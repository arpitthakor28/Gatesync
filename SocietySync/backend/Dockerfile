# Build stage
FROM maven:3.9.6-eclipse-temurin-21 AS build
WORKDIR /app
# Copy pom.xml (supports root context and subfolder context)
COPY SocietySync/backend/pom.xml* pom.xml* ./
RUN if [ -f "SocietySync/backend/pom.xml" ]; then mv SocietySync/backend/pom.xml ./pom.xml; fi
RUN mvn dependency:go-offline -B || true

# Copy java sources (supports root context and subfolder context)
COPY SocietySync/backend/src* ./b_src/
COPY src* ./l_src/
RUN if [ -d "b_src/src" ]; then cp -r b_src/src ./src; \
    elif [ -d "b_src" ] && [ "$(ls -A b_src 2>/dev/null)" ]; then cp -r b_src ./src; \
    elif [ -d "l_src" ]; then cp -r l_src ./src; fi && \
    rm -rf b_src l_src
RUN mvn clean package -DskipTests -B

# Run stage
FROM eclipse-temurin:21-jre-alpine
WORKDIR /app
COPY --from=build /app/target/*.jar app.jar
EXPOSE 8080
ENV JAVA_OPTS="-XX:+UseContainerSupport -Xmx384m -Djava.security.egd=file:/dev/./urandom"
ENTRYPOINT ["sh", "-c", "java $JAVA_OPTS -jar app.jar"]
