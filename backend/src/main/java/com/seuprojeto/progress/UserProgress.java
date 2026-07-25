package com.seuprojeto.progress;

import com.seuprojeto.catalog.Content;
import com.seuprojeto.catalog.Episode;
import com.seuprojeto.user.User;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Entity
@Table(name = "progresso_usuario", uniqueConstraints = {
        @UniqueConstraint(columnNames = {"usuario_id", "episodio_id"})
})
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UserProgress {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "usuario_id", nullable = false)
    private User usuario;

    // Para filmes (progresso simples, sem episodio)
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "conteudo_id")
    private Content conteudo;

    // Para series, vinculado a um episodio especifico
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "episodio_id")
    private Episode episodio;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private ProgressStatus status;

    private LocalDateTime atualizadoEm;
}
