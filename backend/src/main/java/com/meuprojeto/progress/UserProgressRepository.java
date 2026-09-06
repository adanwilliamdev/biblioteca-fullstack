package com.meuprojeto.progress;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface UserProgressRepository extends JpaRepository<UserProgress, Long> {

    Optional<UserProgress> findByUsuarioIdAndEpisodioId(Long usuarioId, Long episodioId);

    Optional<UserProgress> findByUsuarioIdAndConteudoId(Long usuarioId, Long conteudoId);

    List<UserProgress> findByUsuarioIdAndEpisodio_Temporada_Conteudo_Id(Long usuarioId, Long conteudoId);

    List<UserProgress> findByUsuarioIdAndEpisodio_Temporada_Id(Long usuarioId, Long temporadaId);

    long countByUsuarioIdAndStatusAndEpisodio_Temporada_Conteudo_Id(Long usuarioId, ProgressStatus status, Long conteudoId);

    long countByUsuarioIdAndStatusAndEpisodio_Temporada_Id(Long usuarioId, ProgressStatus status, Long temporadaId);

    long countByUsuarioIdAndStatus(Long usuarioId, ProgressStatus status);

    List<UserProgress> findTop10ByUsuarioIdAndStatusOrderByAtualizadoEmDesc(Long usuarioId, ProgressStatus status);

    long countByUsuarioIdAndStatusAndEpisodioIsNotNull(Long usuarioId, ProgressStatus status);

    long countByUsuarioIdAndStatusAndConteudoIsNotNull(Long usuarioId, ProgressStatus status);

    void deleteByConteudoId(Long conteudoId);

    void deleteByEpisodio_Temporada_Conteudo_Id(Long conteudoId);

    void deleteByEpisodio_Temporada_Id(Long temporadaId);

    void deleteByEpisodioId(Long episodioId);

    /**
     * Para cada conteudo (serie) da lista, retorna quantos episodios o usuario ja assistiu.
     * Cada linha do resultado eh [conteudoId (Long), totalAssistidos (Long)].
     */
    @Query("SELECT p.episodio.temporada.conteudo.id, COUNT(p) FROM UserProgress p " +
           "WHERE p.usuario.id = :usuarioId AND p.status = com.meuprojeto.progress.ProgressStatus.ASSISTIDO " +
           "AND p.episodio.temporada.conteudo.id IN :conteudoIds " +
           "GROUP BY p.episodio.temporada.conteudo.id")
    List<Object[]> contarEpisodiosAssistidosPorConteudoIds(@Param("usuarioId") Long usuarioId,
                                                            @Param("conteudoIds") List<Long> conteudoIds);

    /**
     * Para conteudos do tipo filme, retorna o status de progresso direto (sem episodio).
     * Cada linha do resultado eh [conteudoId (Long), status (ProgressStatus)].
     */
    @Query("SELECT p.conteudo.id, p.status FROM UserProgress p " +
           "WHERE p.usuario.id = :usuarioId AND p.conteudo.id IN :conteudoIds")
    List<Object[]> buscarStatusFilmesPorConteudoIds(@Param("usuarioId") Long usuarioId,
                                                      @Param("conteudoIds") List<Long> conteudoIds);

}
