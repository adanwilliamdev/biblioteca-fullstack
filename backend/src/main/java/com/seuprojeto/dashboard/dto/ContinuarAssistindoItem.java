package com.seuprojeto.dashboard.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ContinuarAssistindoItem {
    private Long conteudoId;
    private String tituloConteudo;
    private String imagemUrl;
    private Long episodioId;
    private Integer numeroEpisodio;
    private Integer numeroTemporada;
    private double progressoSerie;
}
