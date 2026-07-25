package com.seuprojeto.progress.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ProgressResponse {
    private Long episodioId;
    private Long conteudoId;
    private String status;
    private double progressoTemporada;
    private double progressoSerie;
}
