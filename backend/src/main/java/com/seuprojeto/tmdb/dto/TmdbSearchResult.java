package com.seuprojeto.tmdb.dto;

import com.seuprojeto.catalog.ContentType;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class TmdbSearchResult {
    private Long tmdbId;
    private String titulo;
    private Integer ano;
    private String imagemUrl;
    private String sinopse;
    private ContentType tipo;
    private Double avaliacao; // nota media do TMDB (0-10), so para exibicao
}
