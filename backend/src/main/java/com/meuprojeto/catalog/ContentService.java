package com.seuprojeto.catalog;

import com.seuprojeto.catalog.dto.*;
import com.seuprojeto.progress.ProgressStatus;
import com.seuprojeto.progress.UserProgress;
import com.seuprojeto.progress.UserProgressRepository;
import com.seuprojeto.user.User;
import com.seuprojeto.user.UserService;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Comparator;
import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ContentService {

    private final ContentRepository contentRepository;
    private final SeasonRepository seasonRepository;
    private final EpisodeRepository episodeRepository;
    private final UserProgressRepository progressRepository;
    private final UserService userService;

    @Transactional(readOnly = true)
    public Page<ContentSummaryResponse> listar(String titulo, String genero, Integer ano, ContentType tipo,
                                                Pageable pageable, String userEmail) {
        User user = userService.findByEmail(userEmail);

        Specification<Content> spec = Specification.where(null);
        if (titulo != null && !titulo.isBlank()) {
            spec = spec.and(ContentSpecifications.comTitulo(titulo));
        }
        if (genero != null && !genero.isBlank()) {
            spec = spec.and(ContentSpecifications.comGenero(genero));
        }
        if (ano != null) {
            spec = spec.and(ContentSpecifications.comAno(ano));
        }
        if (tipo != null) {
            spec = spec.and(ContentSpecifications.comTipo(tipo));
        }

        Page<Content> page = contentRepository.findAll(spec, pageable);
        return page.map(content -> toSummary(content, user.getId()));
    }

    private ContentSummaryResponse toSummary(Content content, Long userId) {
        return ContentSummaryResponse.builder()
                .id(content.getId())
                .titulo(content.getTitulo())
                .genero(content.getGenero())
                .ano(content.getAno())
                .imagemUrl(content.getImagemUrl())
                .tipo(content.getTipo())
                .progresso(calcularProgressoSerie(content.getId(), userId))
                .build();
    }

    @Transactional(readOnly = true)
    public ContentDetailResponse buscarDetalhes(Long id, String userEmail) {
        User user = userService.findByEmail(userEmail);
        Content content = contentRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Conteúdo não encontrado"));

        ContentDetailResponse.ContentDetailResponseBuilder builder = ContentDetailResponse.builder()
                .id(content.getId())
                .titulo(content.getTitulo())
                .sinopse(content.getSinopse())
                .genero(content.getGenero())
                .ano(content.getAno())
                .imagemUrl(content.getImagemUrl())
                .tipo(content.getTipo());

        if (content.getTipo() == ContentType.FILME) {
            boolean assistido = progressRepository.findByUsuarioIdAndConteudoId(user.getId(), content.getId())
                    .map(p -> p.getStatus() == ProgressStatus.ASSISTIDO)
                    .orElse(false);
            builder.assistido(assistido);
            builder.progresso(assistido ? 100.0 : 0.0);
        } else {
            List<Season> temporadas = seasonRepository.findByConteudoIdOrderByNumeroAsc(content.getId());
            List<SeasonResponse> seasonResponses = temporadas.stream()
                    .map(season -> toSeasonResponse(season, user.getId()))
                    .collect(Collectors.toList());
            builder.temporadas(seasonResponses);
            builder.progresso(calcularProgressoSerie(content.getId(), user.getId()));
        }

        return builder.build();
    }

    private SeasonResponse toSeasonResponse(Season season, Long userId) {
        List<Episode> episodios = episodeRepository.findByTemporadaIdOrderByNumeroAsc(season.getId());
        Set<Long> assistidos = progressRepository
                .findByUsuarioIdAndEpisodio_Temporada_Id(userId, season.getId()).stream()
                .filter(p -> p.getStatus() == ProgressStatus.ASSISTIDO)
                .map(p -> p.getEpisodio().getId())
                .collect(Collectors.toSet());

        List<EpisodeResponse> episodeResponses = episodios.stream()
                .map(ep -> EpisodeResponse.builder()
                        .id(ep.getId())
                        .numero(ep.getNumero())
                        .titulo(ep.getTitulo())
                        .duracaoMinutos(ep.getDuracaoMinutos())
                        .assistido(assistidos.contains(ep.getId()))
                        .build())
                .sorted(Comparator.comparing(EpisodeResponse::getNumero))
                .collect(Collectors.toList());

        double progresso = episodios.isEmpty() ? 0.0 : (100.0 * assistidos.size() / episodios.size());

        return SeasonResponse.builder()
                .id(season.getId())
                .numero(season.getNumero())
                .titulo(season.getTitulo())
                .progresso(progresso)
                .episodios(episodeResponses)
                .build();
    }

    public double calcularProgressoSerie(Long conteudoId, Long userId) {
        long totalEpisodios = episodeRepository.countByTemporada_Conteudo_Id(conteudoId);
        if (totalEpisodios == 0) {
            // pode ser filme
            return progressRepository.findByUsuarioIdAndConteudoId(userId, conteudoId)
                    .map(p -> p.getStatus() == ProgressStatus.ASSISTIDO ? 100.0 : 0.0)
                    .orElse(0.0);
        }
        long assistidos = progressRepository.countByUsuarioIdAndStatusAndEpisodio_Temporada_Conteudo_Id(
                userId, ProgressStatus.ASSISTIDO, conteudoId);
        return 100.0 * assistidos / totalEpisodios;
    }

    // ---------- CRUD (Admin) ----------

    @Transactional
    public Content criar(ContentRequest request) {
        Content content = Content.builder()
                .titulo(request.getTitulo())
                .sinopse(request.getSinopse())
                .genero(request.getGenero())
                .ano(request.getAno())
                .imagemUrl(request.getImagemUrl())
                .tipo(request.getTipo())
                .assistido(false)
                .build();
        return contentRepository.save(content);
    }

    @Transactional
    public Content atualizar(Long id, ContentRequest request) {
        Content content = contentRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Conteúdo não encontrado"));
        content.setTitulo(request.getTitulo());
        content.setSinopse(request.getSinopse());
        content.setGenero(request.getGenero());
        content.setAno(request.getAno());
        content.setImagemUrl(request.getImagemUrl());
        content.setTipo(request.getTipo());
        return contentRepository.save(content);
    }

    @Transactional
    public void remover(Long id) {
        if (!contentRepository.existsById(id)) {
            throw new EntityNotFoundException("Conteúdo não encontrado");
        }
        // Remove registros de progresso vinculados antes de excluir o conteúdo,
        // para não violar a restrição de chave estrangeira em progresso_usuario.
        progressRepository.deleteByConteudoId(id);
        progressRepository.deleteByEpisodio_Temporada_Conteudo_Id(id);
        contentRepository.deleteById(id);
    }

    @Transactional
    public Season adicionarTemporada(Long conteudoId, SeasonRequest request) {
        Content content = contentRepository.findById(conteudoId)
                .orElseThrow(() -> new EntityNotFoundException("Conteúdo não encontrado"));
        Season season = Season.builder()
                .numero(request.getNumero())
                .titulo(request.getTitulo())
                .conteudo(content)
                .build();
        return seasonRepository.save(season);
    }

    @Transactional
    public void removerTemporada(Long temporadaId) {
        if (!seasonRepository.existsById(temporadaId)) {
            throw new EntityNotFoundException("Temporada não encontrada");
        }
        progressRepository.deleteByEpisodio_Temporada_Id(temporadaId);
        seasonRepository.deleteById(temporadaId);
    }

    @Transactional
    public Episode adicionarEpisodio(Long temporadaId, EpisodeRequest request) {
        Season season = seasonRepository.findById(temporadaId)
                .orElseThrow(() -> new EntityNotFoundException("Temporada não encontrada"));
        Episode episode = Episode.builder()
                .numero(request.getNumero())
                .titulo(request.getTitulo())
                .duracaoMinutos(request.getDuracaoMinutos())
                .temporada(season)
                .build();
        return episodeRepository.save(episode);
    }

    @Transactional
    public void removerEpisodio(Long episodioId) {
        if (!episodeRepository.existsById(episodioId)) {
            throw new EntityNotFoundException("Episódio não encontrado");
        }
        progressRepository.deleteByEpisodioId(episodioId);
        episodeRepository.deleteById(episodioId);
    }
}
