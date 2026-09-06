# Usando imagens do Docker Hub que são mais confiáveis
FROM maven:3.9-amazoncorretto-17 AS build
WORKDIR /app

# Copiar pom.xml e baixar dependências
COPY pom.xml .
RUN mvn -B dependency:go-offline -DskipTests

# Copiar código e buildar
COPY src ./src
RUN mvn -B clean package -DskipTests

# Estágio final - usando Amazon Corretto (mais confiável)
FROM amazoncorretto:17-alpine
WORKDIR /app

# Executa como usuário não-root por segurança (evita rodar o processo como root
# dentro do container caso a imagem seja comprometida).
RUN addgroup -S spring && adduser -S spring -G spring
USER spring:spring

# Copiar o JAR
COPY --from=build --chown=spring:spring /app/target/*.jar app.jar

EXPOSE 8080
ENTRYPOINT ["java", "-jar", "app.jar"]