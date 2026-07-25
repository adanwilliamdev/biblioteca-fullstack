package com.seuprojeto.catalog.dto;

import com.seuprojeto.catalog.ContentType;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ContentSummaryResponse {
    private Long id;
    private String titulo;
    private String genero;
    private Integer ano;
    private String imagemUrl;
    private ContentType tipo;
    private double progresso;
}
