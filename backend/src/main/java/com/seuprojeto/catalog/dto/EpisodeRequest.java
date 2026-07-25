package com.seuprojeto.catalog.dto;

import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class EpisodeRequest {

    @NotNull(message = "Número do episódio é obrigatório")
    private Integer numero;

    private String titulo;

    private Integer duracaoMinutos;
}
