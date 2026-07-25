package com.seuprojeto.catalog;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface EpisodeRepository extends JpaRepository<Episode, Long> {
    List<Episode> findByTemporadaIdOrderByNumeroAsc(Long temporadaId);
    long countByTemporadaId(Long temporadaId);
    long countByTemporada_Conteudo_Id(Long conteudoId);

    @Query("SELECT COALESCE(SUM(e.duracaoMinutos), 0) FROM Episode e, UserProgress p " +
           "WHERE p.episodio = e AND p.usuario.id = :userId AND p.status = com.seuprojeto.progress.ProgressStatus.ASSISTIDO")
    Long somarMinutosAssistidosPorUsuario(@Param("userId") Long userId);
}
