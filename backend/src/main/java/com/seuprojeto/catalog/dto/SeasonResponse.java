package com.seuprojeto.catalog.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SeasonResponse {
    private Long id;
    private Integer numero;
    private String titulo;
    private double progresso; // percentual 0-100
    private List<EpisodeResponse> episodios;
}
