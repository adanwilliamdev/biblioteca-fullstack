package com.meuprojeto.config;

import org.springframework.cache.CacheManager;
import org.springframework.cache.annotation.EnableCaching;
import org.springframework.cache.concurrent.ConcurrentMapCacheManager;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

/**
 * Cache simples em memória (sem dependências extras) para reduzir chamadas
 * repetidas à API externa do TMDB em buscas populares.
 *
 * Observação: como é um cache local por instância, ele não é compartilhado entre
 * múltiplas réplicas da aplicação. Para esse cenário, trocar por um CacheManager
 * baseado em Redis seria o próximo passo natural.
 */
@Configuration
@EnableCaching
public class CacheConfig {

    @Bean
    public CacheManager cacheManager() {
        return new ConcurrentMapCacheManager("tmdbBusca");
    }
}
