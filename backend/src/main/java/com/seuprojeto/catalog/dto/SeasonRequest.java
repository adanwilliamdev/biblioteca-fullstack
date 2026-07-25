package com.seuprojeto.catalog.dto;

import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class SeasonRequest {

    @NotNull(message = "Número da temporada é obrigatório")
    private Integer numero;

    private String titulo;
}
