# Builder: compila el jar con Maven. Cache de dependencias separado del código para que
# `docker compose build` no vuelva a bajar todo Maven Central en cada cambio de fuente.
FROM maven:3.9-eclipse-temurin-21 AS builder
WORKDIR /build

COPY pom.xml .
RUN mvn -B dependency:go-offline

COPY src ./src
RUN mvn -B package -DskipTests

# Runtime: solo el JRE y el jar, sin Maven ni fuentes.
FROM eclipse-temurin:21-jre-alpine AS runtime
WORKDIR /app

RUN addgroup -S cotizador && adduser -S cotizador -G cotizador
COPY --from=builder /build/target/*.jar app.jar
USER cotizador

EXPOSE 8080
ENTRYPOINT ["java", "-jar", "app.jar"]
