package com.meuprojeto.catalog;

import com.meuprojeto.catalog.dto.ContentRequest;
import com.meuprojeto.catalog.dto.ContentSummaryResponse;
import com.meuprojeto.catalog.dto.EpisodeRequest;
import com.meuprojeto.catalog.dto.SeasonRequest;
import com.meuprojeto.progress.ProgressStatus;
import com.meuprojeto.progress.UserProgress;
import com.meuprojeto.progress.UserProgressRepository;
import com.meuprojeto.user.Role;
import com.meuprojeto.user.User;
import com.meuprojeto.user.UserRepository;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.transaction.annotation.Transactional;

import java.util.Map;
import java.util.stream.Collectors;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.within;

/**
 * Cobre o cálculo de progresso de filmes/séries, tanto no detalhe de um único
 * item (calcularProgressoSerie) quanto na listagem em lote usada por listar()
 * — a query em lote (ver ContentService.calcularProgressoEmLote) precisa
 * devolver exatamente o mesmo resultado que o cálculo individual.
 */
@SpringBootTest
@ActiveProfiles("test")
@Transactional
class ContentProgressTest {

    @Autowired
    private ContentService contentService;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private UserProgressRepository progressRepository;

    @Test
    void progressoDeSerieConsideraEpisodiosAssistidos() {
        User user = criarUsuario("progresso." + System.nanoTime() + "@teste.com");

        Content serie = criarSerie("Série de Teste");
        Season temporada = contentService.adicionarTemporada(serie.getId(), seasonRequest(1, "Temporada 1"));
        Episode ep1 = contentService.adicionarEpisodio(temporada.getId(), episodeRequest(1, "Ep 1"));
        Episode ep2 = contentService.adicionarEpisodio(temporada.getId(), episodeRequest(2, "Ep 2"));
        contentService.adicionarEpisodio(temporada.getId(), episodeRequest(3, "Ep 3"));
        contentService.adicionarEpisodio(temporada.getId(), episodeRequest(4, "Ep 4"));

        marcarEpisodioAssistido(user, ep1);
        marcarEpisodioAssistido(user, ep2);
        // ep3 e ep4 continuam não assistidos -> 2 de 4 = 50%

        double progresso = contentService.calcularProgressoSerie(serie.getId(), user.getId());
        assertThat(progresso).isCloseTo(50.0, within(0.001));
    }

    @Test
    void progressoDeFilmeEhBinario() {
        User user = criarUsuario("filme." + System.nanoTime() + "@teste.com");
        Content filme = criarFilme("Filme de Teste");

        assertThat(contentService.calcularProgressoSerie(filme.getId(), user.getId())).isZero();

        marcarFilmeAssistido(user, filme);

        assertThat(contentService.calcularProgressoSerie(filme.getId(), user.getId()))
                .isCloseTo(100.0, within(0.001));
    }

    @Test
    void listarCalculaProgressoDeVariosItensDeUmaSoVez() {
        User user = criarUsuario("lote." + System.nanoTime() + "@teste.com");

        // Série com progresso parcial: 1 de 2 episódios assistidos = 50%
        Content serie = criarSerie("Série em Lote");
        Season temporada = contentService.adicionarTemporada(serie.getId(), seasonRequest(1, "T1"));
        Episode epA = contentService.adicionarEpisodio(temporada.getId(), episodeRequest(1, "A"));
        contentService.adicionarEpisodio(temporada.getId(), episodeRequest(2, "B"));
        marcarEpisodioAssistido(user, epA);

        // Filme assistido = 100%
        Content filmeAssistido = criarFilme("Filme Visto");
        marcarFilmeAssistido(user, filmeAssistido);

        // Filme não assistido = 0%
        Content filmeNaoAssistido = criarFilme("Filme Não Visto");

        Page<ContentSummaryResponse> pagina = contentService.listar(
                null, null, null, null, PageRequest.of(0, 20), user.getEmail());

        Map<Long, Double> progressoPorId = pagina.getContent().stream()
                .collect(Collectors.toMap(ContentSummaryResponse::getId, ContentSummaryResponse::getProgresso));

        assertThat(progressoPorId.get(serie.getId())).isCloseTo(50.0, within(0.001));
        assertThat(progressoPorId.get(filmeAssistido.getId())).isCloseTo(100.0, within(0.001));
        assertThat(progressoPorId.get(filmeNaoAssistido.getId())).isCloseTo(0.0, within(0.001));
    }

    private User criarUsuario(String email) {
        return userRepository.save(User.builder()
                .nome("Usuário Teste")
                .email(email)
                .senha("hash-fake-para-teste")
                .role(Role.USER)
                .build());
    }

    private Content criarSerie(String titulo) {
        ContentRequest request = new ContentRequest();
        request.setTitulo(titulo);
        request.setTipo(ContentType.SERIE);
        return contentService.criar(request);
    }

    private Content criarFilme(String titulo) {
        ContentRequest request = new ContentRequest();
        request.setTitulo(titulo);
        request.setTipo(ContentType.FILME);
        return contentService.criar(request);
    }

    private SeasonRequest seasonRequest(int numero, String titulo) {
        SeasonRequest request = new SeasonRequest();
        request.setNumero(numero);
        request.setTitulo(titulo);
        return request;
    }

    private EpisodeRequest episodeRequest(int numero, String titulo) {
        EpisodeRequest request = new EpisodeRequest();
        request.setNumero(numero);
        request.setTitulo(titulo);
        request.setDuracaoMinutos(40);
        return request;
    }

    private void marcarEpisodioAssistido(User user, Episode episodio) {
        progressRepository.save(UserProgress.builder()
                .usuario(user)
                .episodio(episodio)
                .status(ProgressStatus.ASSISTIDO)
                .build());
    }

    private void marcarFilmeAssistido(User user, Content filme) {
        progressRepository.save(UserProgress.builder()
                .usuario(user)
                .conteudo(filme)
                .status(ProgressStatus.ASSISTIDO)
                .build());
    }
}
