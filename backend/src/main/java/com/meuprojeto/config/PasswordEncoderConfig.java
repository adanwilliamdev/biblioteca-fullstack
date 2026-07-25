package com.seuprojeto.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;

/**
 * Mantido em uma classe separada, sem nenhuma outra dependência, para evitar
 * o ciclo SecurityConfig -> JwtAuthFilter -> UserService -> SecurityConfig
 * (UserService precisa de PasswordEncoder, que antes era exposto pelo próprio SecurityConfig).
 */
@Configuration
public class PasswordEncoderConfig {

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }
}
