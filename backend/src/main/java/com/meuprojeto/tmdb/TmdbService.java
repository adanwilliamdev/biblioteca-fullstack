package com.seuprojeto.tmdb;

import com.fasterxml.jackson.databind.JsonNode;
import com.seuprojeto.catalog.*;
import com.seuprojeto.tmdb.dto.TmdbImportResult;
import com.seuprojeto.tmdb.dto.TmdbSearchResult;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.util.UriComponentsBuilder;

import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;
import java.util.stream.StreamSupport;

@Service
@RequiredArgsConstructor
public class TmdbService {

    private final RestTemplate tmdbRestTemplate;
    private final TmdbConfig.TmdbProperties tmdbProperties;
    private final ContentRepository contentRepository;
    private final SeasonRepository seasonRepository;
    private final EpisodeRepository episodeRepository;

    public boolean isConfigured() {
        return tmdbProperties.isConfigured();
    }

    public List<TmdbSearchResult> buscar(String query, ContentType tipo) {
        if (!isConfigured()) {
            throw new IllegalStateException(
                    "Integração com o TMDB não configurada. Defina a variável de ambiente TMDB_API_KEY.");
        }

        String path = tipo == ContentType.FILME ? "/search/movie" : "/search/tv";
        String url = UriComponentsBuilder.fromHttpUrl(tmdbProperties.getBaseUrl() + path)
                .queryParam("api_key", tmdbProperties.getApiKey())
                .queryParam("language", "pt-BR")
                .queryParam("query", query)
                .queryParam("include_adult", false)
                .build()
                .toUriString();

        JsonNode response = tmdbRestTemplate.getForObject(url, JsonNode.class);
        if (response == null || !response.has("results")) {
            return List.of();
        }

        return StreamSupport.stream(response.get("results").spliterator(), false)
                .limit(20)
                .map(node -> toSearchResult(node, tipo))
                .collect(Collectors.toList());
    }

    private TmdbSearchResult toSearchResult(JsonNode node, ContentType tipo) {
        String titulo = tipo == ContentType.FILME
                ? textOrNull(node, "title")
                : textOrNull(node, "name");

        String dataLancamento = tipo == ContentType.FILME
                ? textOrNull(node, "release_date")
                : textOrNull(node, "first_air_date");

        Integer ano = null;
        if (dataLancamento != null && dataLancamento.length() >= 4) {
            try {
                ano = Integer.parseInt(dataLancamento.substring(0, 4));
            } catch (NumberFormatException ignored) {
                // mantém ano nulo se a data vier em formato inesperado
            }
        }

        String posterPath = textOrNull(node, "poster_path");
        String imagemUrl = posterPath != null ? tmdbProperties.getImageBaseUrl() + posterPath : null;

        return TmdbSearchResult.builder()
                .tmdbId(node.get("id").asLong())
                .titulo(titulo != null ? titulo : "Sem título")
                .ano(ano)
                .imagemUrl(imagemUrl)
                .sinopse(textOrNull(node, "overview"))
                .tipo(tipo)
                .avaliacao(node.has("vote_average") ? node.get("vote_average").asDouble() : null)
                .build();
    }

    @Transactional
    public TmdbImportResult importar(Long tmdbId, ContentType tipo) {
        if (!isConfigured()) {
            throw new IllegalStateException(
                    "Integração com o TMDB não configurada. Defina a variável de ambiente TMDB_API_KEY.");
        }

        String path = tipo == ContentType.FILME ? "/movie/" + tmdbId : "/tv/" + tmdbId;
        String detailsUrl = UriComponentsBuilder.fromHttpUrl(tmdbProperties.getBaseUrl() + path)
                .queryParam("api_key", tmdbProperties.getApiKey())
                .queryParam("language", "pt-BR")
                .build()
                .toUriString();

        JsonNode details = tmdbRestTemplate.getForObject(detailsUrl, JsonNode.class);
        if (details == null) {
            throw new IllegalArgumentException("Não foi possível encontrar este título no TMDB");
        }

        String titulo = tipo == ContentType.FILME ? textOrNull(details, "title") : textOrNull(details, "name");
        String dataLancamento = tipo == ContentType.FILME
                ? textOrNull(details, "release_date")
                : textOrNull(details, "first_air_date");
        Integer ano = null;
        if (dataLancamento != null && dataLancamento.length() >= 4) {
            try {
                ano = Integer.parseInt(dataLancamento.substring(0, 4));
            } catch (NumberFormatException ignored) {
            }
        }

        String genero = null;
        if (details.has("genres") && details.get("genres").isArray()) {
            List<String> generos = new ArrayList<>();
            details.get("genres").forEach(g -> generos.add(g.get("name").asText()));
            genero = String.join(", ", generos);
        }

        String posterPath = textOrNull(details, "poster_path");
        String imagemUrl = posterPath != null ? tmdbProperties.getImageBaseUrl() + posterPath : null;

        Content content = Content.builder()
                .titulo(titulo != null ? titulo : "Sem título")
                .sinopse(textOrNull(details, "overview"))
                .genero(genero)
                .ano(ano)
                .imagemUrl(imagemUrl)
                .tipo(tipo)
                .assistido(false)
                .build();
        content = contentRepository.save(content);

        int temporadasImportadas = 0;
        int episodiosImportados = 0;

        if (tipo == ContentType.SERIE && details.has("seasons")) {
            for (JsonNode seasonNode : details.get("seasons")) {
                int seasonNumber = seasonNode.get("season_number").asInt();

                Season season = Season.builder()
                        .numero(seasonNumber)
                        .titulo(textOrNull(seasonNode, "name"))
                        .conteudo(content)
                        .build();
                season = seasonRepository.save(season);
                temporadasImportadas++;

                episodiosImportados += importarEpisodios(tmdbId, seasonNumber, season);
            }
        }

        return TmdbImportResult.builder()
                .conteudoId(content.getId())
                .titulo(content.getTitulo())
                .temporadasImportadas(temporadasImportadas)
                .episodiosImportados(episodiosImportados)
                .build();
    }

    private int importarEpisodios(Long tmdbId, int seasonNumber, Season season) {
        String episodesUrl = UriComponentsBuilder
                .fromHttpUrl(tmdbProperties.getBaseUrl() + "/tv/" + tmdbId + "/season/" + seasonNumber)
                .queryParam("api_key", tmdbProperties.getApiKey())
                .queryParam("language", "pt-BR")
                .build()
                .toUriString();

        JsonNode seasonDetails;
        try {
            seasonDetails = tmdbRestTemplate.getForObject(episodesUrl, JsonNode.class);
        } catch (Exception e) {
            return 0;
        }

        if (seasonDetails == null || !seasonDetails.has("episodes")) {
            return 0;
        }

        int count = 0;
        for (JsonNode episodeNode : seasonDetails.get("episodes")) {
            Episode episode = Episode.builder()
                    .numero(episodeNode.get("episode_number").asInt())
                    .titulo(textOrNull(episodeNode, "name"))
                    .duracaoMinutos(episodeNode.has("runtime") && !episodeNode.get("runtime").isNull()
                            ? episodeNode.get("runtime").asInt()
                            : null)
                    .temporada(season)
                    .build();
            episodeRepository.save(episode);
            count++;
        }
        return count;
    }

    private String textOrNull(JsonNode node, String field) {
        if (!node.has(field) || node.get(field).isNull()) return null;
        String value = node.get(field).asText();
        return value.isBlank() ? null : value;
    }
}
