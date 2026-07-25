package com.seuprojeto.catalog.dto;

import com.seuprojeto.catalog.ContentType;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class ContentRequest {

    @NotBlank(message = "Título é obrigatório")
    private String titulo;

    private String sinopse;

    private String genero;

    private Integer ano;

    private String imagemUrl;

    @NotNull(message = "Tipo é obrigatório (FILME ou SERIE)")
    private ContentType tipo;
}
