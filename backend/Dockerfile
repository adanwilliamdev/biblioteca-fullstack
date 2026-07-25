# Estágio 1: Build
FROM maven:3.9-eclipse-temurin-17 AS build
WORKDIR /app

# Copiar apenas o pom.xml primeiro para cache
COPY pom.xml .
RUN mvn -B dependency:go-offline -DskipTests

# Copiar o código fonte
COPY src ./src
RUN mvn -B clean package -DskipTests

# Estágio 2: Runtime
FROM eclipse-temurin:17-jre-alpine
WORKDIR /app

# Copiar o JAR do estágio de build
COPY --from=build /app/target/*.jar app.jar

# Criar usuário não-root para segurança
RUN addgroup -S spring && adduser -S spring -G spring
USER spring:spring

# Porta da aplicação
EXPOSE 8080

# Healthcheck para o Railway
HEALTHCHECK --interval=30s --timeout=3s --start-period=60s --retries=3 \
  CMD wget --quiet --tries=1 --spider http://localhost:8080/actuator/health || exit 1

# Comando para iniciar a aplicação
ENTRYPOINT ["java", "-jar", "app.jar"]