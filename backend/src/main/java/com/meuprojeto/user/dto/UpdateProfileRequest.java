package com.seuprojeto.user.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class UpdateProfileRequest {
    @NotBlank(message = "Nome é obrigatório")
    private String nome;
}
