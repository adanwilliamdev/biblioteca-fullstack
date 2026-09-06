package com.meuprojeto.config;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.lang.NonNull;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.Deque;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.ConcurrentLinkedDeque;

/**
 * Rate limiting simples, em memória, para os endpoints de autenticação
 * (login e registro), para dificultar ataques de força bruta / enumeração de e-mails.
 *
 * Implementação por IP com janela deslizante. É uma proteção de baixo custo para uma
 * aplicação single-instance; não substitui uma solução distribuída (ex: Redis) caso a
 * aplicação venha a rodar em múltiplas instâncias atrás de um load balancer.
 */
@Component
public class AuthRateLimitFilter extends OncePerRequestFilter {

    // Limite defensivo de memória: numa aplicação pequena, isso nunca deveria ser
    // atingido organicamente; serve só para não deixar o mapa crescer sem controle
    // em caso de um ataque distribuído (muitos IPs diferentes).
    private static final int MAX_IPS_RASTREADOS = 10_000;

    @Value("${app.rate-limit.janela-ms:60000}")
    private long janelaMs;

    @Value("${app.rate-limit.max-tentativas:10}")
    private int maxTentativas;

    private final ConcurrentHashMap<String, Deque<Long>> tentativasPorIp = new ConcurrentHashMap<>();

    @Override
    protected void doFilterInternal(@NonNull HttpServletRequest request,
                                     @NonNull HttpServletResponse response,
                                     @NonNull FilterChain filterChain) throws ServletException, IOException {

        if (!isEndpointSensivel(request)) {
            filterChain.doFilter(request, response);
            return;
        }

        String ip = extrairIp(request);
        long agora = System.currentTimeMillis();

        if (tentativasPorIp.size() > MAX_IPS_RASTREADOS) {
            tentativasPorIp.clear();
        }

        Deque<Long> tentativas = tentativasPorIp.computeIfAbsent(ip, k -> new ConcurrentLinkedDeque<>());

        synchronized (tentativas) {
            while (!tentativas.isEmpty() && agora - tentativas.peekFirst() > janelaMs) {
                tentativas.pollFirst();
            }
            if (tentativas.size() >= maxTentativas) {
                response.setStatus(HttpStatus.TOO_MANY_REQUESTS.value());
                response.setContentType("application/json");
                response.getWriter().write("{\"message\":\"Muitas tentativas. Aguarde um instante e tente novamente.\"}");
                return;
            }
            tentativas.addLast(agora);
        }

        filterChain.doFilter(request, response);
    }

    private boolean isEndpointSensivel(HttpServletRequest request) {
        String path = request.getRequestURI();
        return "POST".equalsIgnoreCase(request.getMethod())
                && (path.endsWith("/api/auth/login") || path.endsWith("/api/auth/register"));
    }

    private String extrairIp(HttpServletRequest request) {
        String forwarded = request.getHeader("X-Forwarded-For");
        if (forwarded != null && !forwarded.isBlank()) {
            return forwarded.split(",")[0].trim();
        }
        return request.getRemoteAddr();
    }
}
