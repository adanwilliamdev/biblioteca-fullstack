package com.meuprojeto.catalog;

import com.meuprojeto.catalog.dto.*;
import com.meuprojeto.progress.ProgressStatus;
import com.meuprojeto.progress.UserProgress;
import com.meuprojeto.progress.UserProgressRepository;
import com.meuprojeto.user.User;
import com.meuprojeto.user.UserService;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Comparator;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
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

        // Calcula o progresso de todos os itens da pagina em lote (2 queries no total),
        // em vez de uma query por item (evita N+1).
        List<Long> idsDaPagina = page.getContent().stream().map(Content::getId).toList();
        Map<Long, Double> progressoPorConteudo = calcularProgressoEmLote(idsDaPagina, user.getId());

        return page.map(content -> toSummary(content, progressoPorConteudo.getOrDefault(content.getId(), 0.0)));
    }

    private ContentSummaryResponse toSummary(Content content, double progresso) {
        return ContentSummaryResponse.builder()
                .id(content.getId())
                .titulo(content.getTitulo())
                .genero(content.getGenero())
                .ano(content.getAno())
                .imagemUrl(content.getImagemUrl())
                .tipo(content.getTipo())
                .progresso(progresso)
                .build();
    }

    /**
     * Calcula o progresso (0-100) de uma lista de conteudos para um usuario usando
     * apenas duas queries agregadas, independentemente do tamanho da lista.
     */
    private Map<Long, Double> calcularProgressoEmLote(List<Long> conteudoIds, Long userId) {
        if (conteudoIds.isEmpty()) {
            return Map.of();
        }

        Map<Long, Long> totalEpisodiosPorConteudo = episodeRepository.contarEpisodiosPorConteudoIds(conteudoIds).stream()
                .collect(Collectors.toMap(row -> (Long) row[0], row -> (Long) row[1]));

        Map<Long, Long> assistidosPorConteudo = progressRepository.contarEpisodiosAssistidosPorConteudoIds(userId, conteudoIds).stream()
                .collect(Collectors.toMap(row -> (Long) row[0], row -> (Long) row[1]));

        Map<Long, ProgressStatus> statusFilmesPorConteudo = progressRepository.buscarStatusFilmesPorConteudoIds(userId, conteudoIds).stream()
                .collect(Collectors.toMap(row -> (Long) row[0], row -> (ProgressStatus) row[1], (a, b) -> a));

        Map<Long, Double> resultado = new HashMap<>();
        for (Long conteudoId : conteudoIds) {
            Long totalEpisodios = totalEpisodiosPorConteudo.get(conteudoId);
            if (totalEpisodios != null && totalEpisodios > 0) {
                long assistidos = assistidosPorConteudo.getOrDefault(conteudoId, 0L);
                resultado.put(conteudoId, 100.0 * assistidos / totalEpisodios);
            } else {
                ProgressStatus status = statusFilmesPorConteudo.get(conteudoId);
                resultado.put(conteudoId, status == ProgressStatus.ASSISTIDO ? 100.0 : 0.0);
            }
        }
        return resultado;
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
