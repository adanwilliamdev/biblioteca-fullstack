package com.meuprojeto.catalog.dto;

import com.meuprojeto.catalog.ContentType;
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
