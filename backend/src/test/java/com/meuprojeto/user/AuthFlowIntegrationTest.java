package com.meuprojeto.user;

import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.servlet.http.Cookie;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * Cobre o fluxo completo de autenticação baseado em cookies httpOnly:
 * registro/login emitem cookies, rotas protegidas exigem o cookie de acesso,
 * o refresh token é rotacionado a cada uso e o logout revoga a sessão.
 */
@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
class AuthFlowIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Test
    void registraLogaEAcessaRotaProtegidaComCookie() throws Exception {
        String email = "joana." + System.nanoTime() + "@teste.com";

        MvcResult registroResult = mockMvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(new Credenciais("Joana Teste", email, "senha123"))))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.email").value(email))
                .andReturn();

        Cookie accessCookie = registroResult.getResponse().getCookie("access_token");
        Cookie refreshCookie = registroResult.getResponse().getCookie("refresh_token");
        assertThat(accessCookie).as("cookie access_token deve ser emitido no registro").isNotNull();
        assertThat(accessCookie.isHttpOnly()).isTrue();
        assertThat(refreshCookie).as("cookie refresh_token deve ser emitido no registro").isNotNull();
        assertThat(refreshCookie.isHttpOnly()).isTrue();

        // O access token do cookie deve autenticar normalmente numa rota protegida.
        mockMvc.perform(get("/api/users/me").cookie(accessCookie))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.email").value(email));
    }

    @Test
    void acessarRotaProtegidaSemCookieRetorna401() throws Exception {
        mockMvc.perform(get("/api/users/me"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void loginComSenhaErradaRetorna401() throws Exception {
        String email = "carlos." + System.nanoTime() + "@teste.com";
        mockMvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(new Credenciais("Carlos Teste", email, "senhaCerta1"))))
                .andExpect(status().isCreated());

        mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(new Login(email, "senhaErrada"))))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void refreshRotacionaTokenELogoutRevogaSessao() throws Exception {
        String email = "maria." + System.nanoTime() + "@teste.com";
        MvcResult registroResult = mockMvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(new Credenciais("Maria Teste", email, "senha123"))))
                .andExpect(status().isCreated())
                .andReturn();

        Cookie refreshCookie = registroResult.getResponse().getCookie("refresh_token");
        assertThat(refreshCookie).isNotNull();

        // Renova a sessão com o refresh token válido.
        MvcResult refreshResult = mockMvc.perform(post("/api/auth/refresh").cookie(refreshCookie))
                .andExpect(status().isOk())
                .andReturn();

        Cookie novoAccessCookie = refreshResult.getResponse().getCookie("access_token");
        Cookie novoRefreshCookie = refreshResult.getResponse().getCookie("refresh_token");
        assertThat(novoAccessCookie).isNotNull();
        assertThat(novoRefreshCookie).isNotNull();
        assertThat(novoRefreshCookie.getValue()).isNotEqualTo(refreshCookie.getValue());

        // Rotação: o refresh token antigo já foi consumido e não pode ser reutilizado.
        mockMvc.perform(post("/api/auth/refresh").cookie(refreshCookie))
                .andExpect(status().isUnauthorized());

        // Logout revoga o refresh token vigente.
        mockMvc.perform(post("/api/auth/logout").cookie(novoRefreshCookie))
                .andExpect(status().isNoContent());

        mockMvc.perform(post("/api/auth/refresh").cookie(novoRefreshCookie))
                .andExpect(status().isUnauthorized());
    }

    private record Credenciais(String nome, String email, String senha) {}

    private record Login(String email, String senha) {}
}
