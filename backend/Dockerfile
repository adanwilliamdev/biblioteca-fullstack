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

# Copiar o JAR
COPY --from=build /app/target/*.jar app.jar

EXPOSE 8080
ENTRYPOINT ["java", "-jar", "app.jar"]