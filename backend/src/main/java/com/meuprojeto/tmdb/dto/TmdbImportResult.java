package com.seuprojeto.tmdb.dto;

import com.seuprojeto.catalog.dto.ContentDetailResponse;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class TmdbImportResult {
    private Long conteudoId;
    private String titulo;
    private int temporadasImportadas;
    private int episodiosImportados;
}
