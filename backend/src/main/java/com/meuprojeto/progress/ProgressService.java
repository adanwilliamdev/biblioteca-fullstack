package com.seuprojeto.progress;

import com.seuprojeto.catalog.Content;
import com.seuprojeto.catalog.ContentRepository;
import com.seuprojeto.catalog.ContentService;
import com.seuprojeto.catalog.Episode;
import com.seuprojeto.catalog.EpisodeRepository;
import com.seuprojeto.progress.dto.ProgressResponse;
import com.seuprojeto.user.User;
import com.seuprojeto.user.UserService;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;

@Service
@RequiredArgsConstructor
public class ProgressService {

    private final UserProgressRepository progressRepository;
    private final EpisodeRepository episodeRepository;
    private final ContentRepository contentRepository;
    private final UserService userService;
    private final ContentService contentService;

    @Transactional
    public ProgressResponse marcarEpisodio(Long episodioId, ProgressStatus status, String userEmail) {
        User user = userService.findByEmail(userEmail);
        Episode episode = episodeRepository.findById(episodioId)
                .orElseThrow(() -> new EntityNotFoundException("Episódio não encontrado"));

        UserProgress progress = progressRepository
                .findByUsuarioIdAndEpisodioId(user.getId(), episodioId)
                .orElse(UserProgress.builder()
                        .usuario(user)
                        .episodio(episode)
                        .build());

        progress.setStatus(status);
        progress.setAtualizadoEm(LocalDateTime.now());
        progressRepository.save(progress);

        Long conteudoId = episode.getTemporada().getConteudo().getId();
        Long temporadaId = episode.getTemporada().getId();

        long totalTemporada = episodeRepository.countByTemporadaId(temporadaId);
        long assistidosTemporada = progressRepository.countByUsuarioIdAndStatusAndEpisodio_Temporada_Id(
                user.getId(), ProgressStatus.ASSISTIDO, temporadaId);
        double progressoTemporada = totalTemporada == 0 ? 0.0 : (100.0 * assistidosTemporada / totalTemporada);

        double progressoSerie = contentService.calcularProgressoSerie(conteudoId, user.getId());

        return ProgressResponse.builder()
                .episodioId(episodioId)
                .conteudoId(conteudoId)
                .status(status.name())
                .progressoTemporada(progressoTemporada)
                .progressoSerie(progressoSerie)
                .build();
    }

    @Transactional
    public ProgressResponse marcarFilme(Long conteudoId, ProgressStatus status, String userEmail) {
        User user = userService.findByEmail(userEmail);
        Content content = contentRepository.findById(conteudoId)
                .orElseThrow(() -> new EntityNotFoundException("Conteúdo não encontrado"));

        UserProgress progress = progressRepository
                .findByUsuarioIdAndConteudoId(user.getId(), conteudoId)
                .orElse(UserProgress.builder()
                        .usuario(user)
                        .conteudo(content)
                        .build());

        progress.setStatus(status);
        progress.setAtualizadoEm(LocalDateTime.now());
        progressRepository.save(progress);

        return ProgressResponse.builder()
                .conteudoId(conteudoId)
                .status(status.name())
                .progressoTemporada(status == ProgressStatus.ASSISTIDO ? 100.0 : 0.0)
                .progressoSerie(status == ProgressStatus.ASSISTIDO ? 100.0 : 0.0)
                .build();
    }
}
