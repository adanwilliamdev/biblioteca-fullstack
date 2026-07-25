package com.seuprojeto.tmdb;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.web.client.RestTemplateBuilder;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestTemplate;

import java.time.Duration;

@Configuration
public class TmdbConfig {

    @Bean
    public RestTemplate tmdbRestTemplate(RestTemplateBuilder builder) {
        return builder
                .setConnectTimeout(Duration.ofSeconds(5))
                .setReadTimeout(Duration.ofSeconds(8))
                .build();
    }

    @Component
    public static class TmdbProperties {

        @Value("${tmdb.api-key}")
        private String apiKey;

        @Value("${tmdb.base-url}")
        private String baseUrl;

        @Value("${tmdb.image-base-url}")
        private String imageBaseUrl;

        public String getApiKey() {
            return apiKey;
        }

        public String getBaseUrl() {
            return baseUrl;
        }

        public String getImageBaseUrl() {
            return imageBaseUrl;
        }

        public boolean isConfigured() {
            return apiKey != null && !apiKey.isBlank();
        }
    }
}
