# Etapa 1: compilar el proyecto con Maven
FROM maven:3.9-eclipse-temurin-17 AS build
WORKDIR /app
COPY pom.xml .
COPY src ./src
RUN mvn -q -DskipTests clean package

# Etapa 2: ejecutar el .jar
FROM eclipse-temurin:17-jre
WORKDIR /app
COPY --from=build /app/target/erp-topconsult-1.0.0.jar app.jar
ENV HEADLESS=true
EXPOSE 8080
ENTRYPOINT ["java","-jar","app.jar"]
