package com.seuprojeto.dashboard;

import com.seuprojeto.catalog.Content;
import com.seuprojeto.catalog.ContentRepository;
import com.seuprojeto.catalog.ContentService;
import com.seuprojeto.catalog.ContentType;
import com.seuprojeto.dashboard.dto.ContinuarAssistindoItem;
import com.seuprojeto.dashboard.dto.DashboardResponse;
import com.seuprojeto.dashboard.dto.GeneroStat;
import com.seuprojeto.progress.ProgressStatus;
import com.seuprojeto.progress.UserProgress;
import com.seuprojeto.progress.UserProgressRepository;
import com.seuprojeto.user.User;
import com.seuprojeto.user.UserService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class DashboardService {

    private final ContentRepository contentRepository;
    private final com.seuprojeto.catalog.EpisodeRepository episodeRepository;
    private final UserProgressRepository progressRepository;
    private final UserService userService;
    private final ContentService contentService;

    @Transactional(readOnly = true)
    public DashboardResponse gerar(String userEmail) {
        User user = userService.findByEmail(userEmail);
        Long userId = user.getId();

        long totalFilmes = contentRepository.countByTipo(ContentType.FILME);
        long totalSeries = contentRepository.countByTipo(ContentType.SERIE);

        long episodiosAssistidos = progressRepository.countByUsuarioIdAndStatusAndEpisodioIsNotNull(
                userId, ProgressStatus.ASSISTIDO);
        long filmesAssistidos = progressRepository.countByUsuarioIdAndStatusAndConteudoIsNotNull(
                userId, ProgressStatus.ASSISTIDO);

        Long minutosAssistidos = episodeRepository.somarMinutosAssistidosPorUsuario(userId);
        double horasAssistidas = (minutosAssistidos == null ? 0 : minutosAssistidos) / 60.0;

        List<Content> series = contentRepository.findByTipo(ContentType.SERIE);
        long concluidas = 0, emProgresso = 0, naoIniciadas = 0;
        for (Content serie : series) {
            double progresso = contentService.calcularProgressoSerie(serie.getId(), userId);
            if (progresso >= 100.0) concluidas++;
            else if (progresso > 0.0) emProgresso++;
            else naoIniciadas++;
        }

        double progressoGeral;
        long totalItens = totalFilmes + totalSeries;
        if (totalItens == 0) {
            progressoGeral = 0.0;
        } else {
            double somaProgresso = filmesAssistidos; // cada filme assistido conta 100%, aqui somamos %/100 depois
            double acumulador = 0.0;
            List<Content> filmes = contentRepository.findByTipo(ContentType.FILME);
            for (Content filme : filmes) {
                acumulador += contentService.calcularProgressoSerie(filme.getId(), userId);
            }
            for (Content serie : series) {
                acumulador += contentService.calcularProgressoSerie(serie.getId(), userId);
            }
            progressoGeral = acumulador / totalItens;
        }

        List<GeneroStat> distribuicao = contentRepository.countAgrupadoPorGenero().stream()
                .map(row -> GeneroStat.builder()
                        .genero((String) row[0])
                        .quantidade((Long) row[1])
                        .build())
                .collect(Collectors.toList());

        List<UserProgress> ultimosAssistidos = progressRepository
                .findTop10ByUsuarioIdAndStatusOrderByAtualizadoEmDesc(userId, ProgressStatus.ASSISTIDO);

        List<ContinuarAssistindoItem> continuarAssistindo = ultimosAssistidos.stream()
                .filter(p -> p.getEpisodio() != null)
                .map(p -> {
                    Long conteudoId = p.getEpisodio().getTemporada().getConteudo().getId();
                    return ContinuarAssistindoItem.builder()
                            .conteudoId(conteudoId)
                            .tituloConteudo(p.getEpisodio().getTemporada().getConteudo().getTitulo())
                            .imagemUrl(p.getEpisodio().getTemporada().getConteudo().getImagemUrl())
                            .episodioId(p.getEpisodio().getId())
                            .numeroEpisodio(p.getEpisodio().getNumero())
                            .numeroTemporada(p.getEpisodio().getTemporada().getNumero())
                            .progressoSerie(contentService.calcularProgressoSerie(conteudoId, userId))
                            .build();
                })
                .limit(5)
                .collect(Collectors.toList());

        return DashboardResponse.builder()
                .totalFilmes(totalFilmes)
                .totalSeries(totalSeries)
                .episodiosAssistidos(episodiosAssistidos)
                .filmesAssistidos(filmesAssistidos)
                .progressoGeral(progressoGeral)
                .totalHorasAssistidas(horasAssistidas)
                .seriesConcluidas(concluidas)
                .seriesEmProgresso(emProgresso)
                .seriesNaoIniciadas(naoIniciadas)
                .distribuicaoPorGenero(distribuicao)
                .continuarAssistindo(continuarAssistindo)
                .build();
    }
}
