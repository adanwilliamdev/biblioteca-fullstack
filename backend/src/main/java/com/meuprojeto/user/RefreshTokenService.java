package com.meuprojeto.user;

import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class RefreshTokenService {

    private final RefreshTokenRepository refreshTokenRepository;

    @Value("${jwt.refresh-expiration-ms}")
    private long refreshExpirationMs;

    @Transactional
    public RefreshToken criar(User usuario) {
        RefreshToken refreshToken = RefreshToken.builder()
                .token(gerarTokenAleatorio())
                .usuario(usuario)
                .expiraEm(LocalDateTime.now().plus(refreshExpirationMs, ChronoUnit.MILLIS))
                .revogado(false)
                .build();
        return refreshTokenRepository.save(refreshToken);
    }

    /**
     * Valida um refresh token (existe, não foi revogado e não expirou).
     * Lança BadCredentialsException caso contrário — o chamador deve tratar isso
     * como "sessão expirada, faça login novamente".
     */
    @Transactional(readOnly = true)
    public RefreshToken validar(String token) {
        RefreshToken refreshToken = refreshTokenRepository.findByToken(token)
                .orElseThrow(() -> new BadCredentialsException("Refresh token inválido"));
        if (refreshToken.isRevogado() || refreshToken.getExpiraEm().isBefore(LocalDateTime.now())) {
            throw new BadCredentialsException("Refresh token expirado ou revogado");
        }
        return refreshToken;
    }

    @Transactional
    public void revogar(String token) {
        refreshTokenRepository.findByToken(token).ifPresent(refreshToken -> {
            refreshToken.setRevogado(true);
            refreshTokenRepository.save(refreshToken);
        });
    }

    /**
     * Revoga todos os refresh tokens de um usuário (ex: ao trocar a senha, ou
     * "sair de todos os dispositivos").
     */
    @Transactional
    public void revogarTodosDoUsuario(Long usuarioId) {
        refreshTokenRepository.deleteByUsuarioId(usuarioId);
    }

    public long getExpirationSeconds() {
        return refreshExpirationMs / 1000;
    }

    private String gerarTokenAleatorio() {
        return UUID.randomUUID().toString() + UUID.randomUUID();
    }
}
