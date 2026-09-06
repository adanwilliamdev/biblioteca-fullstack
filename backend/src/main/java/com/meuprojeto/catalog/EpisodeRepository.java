package com.meuprojeto.catalog;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface EpisodeRepository extends JpaRepository<Episode, Long> {
    List<Episode> findByTemporadaIdOrderByNumeroAsc(Long temporadaId);
    long countByTemporadaId(Long temporadaId);
    long countByTemporada_Conteudo_Id(Long conteudoId);

    @Query("SELECT COALESCE(SUM(e.duracaoMinutos), 0) FROM Episode e, UserProgress p " +
           "WHERE p.episodio = e AND p.usuario.id = :userId AND p.status = com.meuprojeto.progress.ProgressStatus.ASSISTIDO")
    Long somarMinutosAssistidosPorUsuario(@Param("userId") Long userId);

    /**
     * Retorna, para cada id de conteudo da lista, o total de episodios cadastrados.
     * Usado para calcular o progresso de varios itens em uma unica query (evita N+1).
     * Cada linha do resultado eh [conteudoId (Long), totalEpisodios (Long)].
     */
    @Query("SELECT e.temporada.conteudo.id, COUNT(e) FROM Episode e " +
           "WHERE e.temporada.conteudo.id IN :conteudoIds GROUP BY e.temporada.conteudo.id")
    List<Object[]> contarEpisodiosPorConteudoIds(@Param("conteudoIds") List<Long> conteudoIds);
}
