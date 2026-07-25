package com.seuprojeto.progress;

import org.springframework.data.jpa.repository.JpaRepository;

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

}
