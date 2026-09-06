package com.meuprojeto.user;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

/**
 * Refresh token opaco (string aleatória), persistido no banco para permitir
 * revogação e rotação. Diferente do access token (JWT autocontido e de vida curta),
 * este token só serve para obter um novo access token através de /api/auth/refresh.
 */
@Entity
@Table(name = "refresh_tokens")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class RefreshToken {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true, length = 100)
    private String token;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "usuario_id", nullable = false)
    private User usuario;

    @Column(nullable = false)
    private LocalDateTime expiraEm;

    @Builder.Default
    @Column(nullable = false)
    private boolean revogado = false;

    @Builder.Default
    private LocalDateTime criadoEm = LocalDateTime.now();
}
