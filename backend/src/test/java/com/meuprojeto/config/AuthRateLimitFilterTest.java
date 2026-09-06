package com.meuprojeto.config;

import jakarta.servlet.FilterChain;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.junit.jupiter.api.Test;
import org.springframework.test.util.ReflectionTestUtils;

import java.io.PrintWriter;
import java.io.StringWriter;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

/**
 * Testa o filtro de rate limiting isoladamente (sem subir o contexto Spring),
 * simulando requisições repetidas de um mesmo IP para /api/auth/login.
 */
class AuthRateLimitFilterTest {

    @Test
    void bloqueiaAposExcederLimiteDeTentativasNaMesmaJanela() throws Exception {
        AuthRateLimitFilter filter = new AuthRateLimitFilter();
        ReflectionTestUtils.setField(filter, "janelaMs", 60_000L);
        ReflectionTestUtils.setField(filter, "maxTentativas", 3);

        FilterChain chain = mock(FilterChain.class);

        for (int i = 0; i < 3; i++) {
            HttpServletResponse response = responseMock();
            filter.doFilter(requisicaoDeLogin(), response, chain);
            verify(response, never()).setStatus(429);
        }

        // 4ª tentativa, mesmo IP e mesma janela: deve ser bloqueada com 429.
        StringWriter corpoResposta = new StringWriter();
        HttpServletResponse response = responseMock(corpoResposta);
        filter.doFilter(requisicaoDeLogin(), response, chain);

        verify(response).setStatus(429);
        assertThat(corpoResposta.toString()).contains("Muitas tentativas");
        verify(chain, times(3)).doFilter(any(), any());
    }

    @Test
    void naoLimitaRotasQueNaoSaoDeAutenticacao() throws Exception {
        AuthRateLimitFilter filter = new AuthRateLimitFilter();
        ReflectionTestUtils.setField(filter, "janelaMs", 60_000L);
        ReflectionTestUtils.setField(filter, "maxTentativas", 1);

        FilterChain chain = mock(FilterChain.class);
        HttpServletRequest request = mock(HttpServletRequest.class);
        when(request.getRequestURI()).thenReturn("/api/catalog");
        when(request.getMethod()).thenReturn("GET");
        when(request.getRemoteAddr()).thenReturn("10.0.0.1");

        HttpServletResponse response = responseMock();

        for (int i = 0; i < 5; i++) {
            filter.doFilter(request, response, chain);
        }

        verify(response, never()).setStatus(429);
        verify(chain, times(5)).doFilter(any(), any());
    }

    private HttpServletRequest requisicaoDeLogin() {
        HttpServletRequest request = mock(HttpServletRequest.class);
        when(request.getRequestURI()).thenReturn("/api/auth/login");
        when(request.getMethod()).thenReturn("POST");
        when(request.getRemoteAddr()).thenReturn("192.168.0.42");
        return request;
    }

    private HttpServletResponse responseMock() throws Exception {
        return responseMock(new StringWriter());
    }

    private HttpServletResponse responseMock(StringWriter writer) throws Exception {
        HttpServletResponse response = mock(HttpServletResponse.class);
        when(response.getWriter()).thenReturn(new PrintWriter(writer));
        return response;
    }
}
