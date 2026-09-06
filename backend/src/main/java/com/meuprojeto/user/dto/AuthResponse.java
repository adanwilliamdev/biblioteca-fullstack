package com.meuprojeto.user.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AuthResponse {
    // O token de acesso NÃO é mais devolvido no corpo da resposta: ele é enviado
    // apenas via cookie httpOnly (ver AuthController), para reduzir a superfície de
    // exposição a ataques de XSS. O corpo traz só os dados de perfil do usuário.
    private Long id;
    private String nome;
    private String email;
    private String role;
}
