package com.seuprojeto.catalog.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class EpisodeResponse {
    private Long id;
    private Integer numero;
    private String titulo;
    private Integer duracaoMinutos;
    private boolean assistido;
}
