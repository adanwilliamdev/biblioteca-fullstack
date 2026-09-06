package com.meuprojeto.catalog.dto;

import com.meuprojeto.catalog.ContentType;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ContentDetailResponse {
    private Long id;
    private String titulo;
    private String sinopse;
    private String genero;
    private Integer ano;
    private String imagemUrl;
    private ContentType tipo;
    private double progresso;
    private Boolean assistido; // para filmes
    private List<SeasonResponse> temporadas; // para series
}
