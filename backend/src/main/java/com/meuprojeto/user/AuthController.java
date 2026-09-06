package com.meuprojeto.user;

import com.meuprojeto.config.JwtUtil;
import com.meuprojeto.user.dto.*;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseCookie;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.web.bind.annotation.*;

/**
 * Autenticação baseada em cookies httpOnly:
 *  - access_token: JWT de vida curta, enviado em toda requisição autenticada.
 *  - refresh_token: token opaco de vida longa, usado só em /api/auth/refresh
 *    para obter um novo access_token sem exigir novo login. É rotacionado
 *    (revogado e substituído) a cada uso.
 *
 * Nenhum dos dois tokens é devolvido no corpo JSON, apenas via Set-Cookie —
 * isso limita o impacto de um eventual XSS no frontend, já que JS não
 * consegue ler cookies httpOnly.
 */
@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {

    private static final String ACCESS_COOKIE = "access_token";
    private static final String REFRESH_COOKIE = "refresh_token";

    private final AuthenticationManager authenticationManager;
    private final UserService userService;
    private final JwtUtil jwtUtil;
    private final RefreshTokenService refreshTokenService;

    // Em produção, configure APP_COOKIE_SECURE=true (exige HTTPS) via variável de ambiente.
    @Value("${app.cookie-secure:false}")
    private boolean cookieSecure;

    @PostMapping("/register")
    public ResponseEntity<?> register(@Valid @RequestBody RegisterRequest request, HttpServletResponse response) {
        try {
            User user = userService.register(request);
            emitirCookies(user, response);
            return ResponseEntity.status(HttpStatus.CREATED).body(toAuthResponse(user));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(HttpStatus.CONFLICT).body(new ErrorResponse(e.getMessage()));
        }
    }

    @PostMapping("/login")
    public ResponseEntity<?> login(@Valid @RequestBody LoginRequest request, HttpServletResponse response) {
        try {
            authenticationManager.authenticate(
                    new UsernamePasswordAuthenticationToken(request.getEmail(), request.getSenha())
            );
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(new ErrorResponse("E-mail ou senha inválidos"));
        }

        User user = userService.findByEmail(request.getEmail());
        emitirCookies(user, response);
        return ResponseEntity.ok(toAuthResponse(user));
    }

    @PostMapping("/refresh")
    public ResponseEntity<?> refresh(@CookieValue(value = REFRESH_COOKIE, required = false) String refreshTokenValue,
                                      HttpServletResponse response) {
        if (refreshTokenValue == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(new ErrorResponse("Sessão expirada, faça login novamente"));
        }
        try {
            RefreshToken refreshToken = refreshTokenService.validar(refreshTokenValue);
            // Rotação: o refresh token usado é revogado e um novo par é emitido.
            refreshTokenService.revogar(refreshTokenValue);
            User user = refreshToken.getUsuario();
            emitirCookies(user, response);
            return ResponseEntity.ok(toAuthResponse(user));
        } catch (BadCredentialsException e) {
            limparCookies(response);
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(new ErrorResponse("Sessão expirada, faça login novamente"));
        }
    }

    @PostMapping("/logout")
    public ResponseEntity<Void> logout(@CookieValue(value = REFRESH_COOKIE, required = false) String refreshTokenValue,
                                        HttpServletResponse response) {
        if (refreshTokenValue != null) {
            refreshTokenService.revogar(refreshTokenValue);
        }
        limparCookies(response);
        return ResponseEntity.noContent().build();
    }

    private void emitirCookies(User user, HttpServletResponse response) {
        String accessToken = jwtUtil.generateToken(user);
        RefreshToken refreshToken = refreshTokenService.criar(user);

        ResponseCookie accessCookie = ResponseCookie.from(ACCESS_COOKIE, accessToken)
                .httpOnly(true)
                .secure(cookieSecure)
                .sameSite("Lax")
                .path("/")
                .maxAge(jwtUtil.getExpirationSeconds())
                .build();

        ResponseCookie refreshCookie = ResponseCookie.from(REFRESH_COOKIE, refreshToken.getToken())
                .httpOnly(true)
                .secure(cookieSecure)
                .sameSite("Lax")
                .path("/")
                .maxAge(refreshTokenService.getExpirationSeconds())
                .build();

        response.addHeader(HttpHeaders.SET_COOKIE, accessCookie.toString());
        response.addHeader(HttpHeaders.SET_COOKIE, refreshCookie.toString());
    }

    private void limparCookies(HttpServletResponse response) {
        ResponseCookie accessCookie = ResponseCookie.from(ACCESS_COOKIE, "")
                .httpOnly(true).secure(cookieSecure).sameSite("Lax").path("/").maxAge(0).build();
        ResponseCookie refreshCookie = ResponseCookie.from(REFRESH_COOKIE, "")
                .httpOnly(true).secure(cookieSecure).sameSite("Lax").path("/").maxAge(0).build();
        response.addHeader(HttpHeaders.SET_COOKIE, accessCookie.toString());
        response.addHeader(HttpHeaders.SET_COOKIE, refreshCookie.toString());
    }

    private AuthResponse toAuthResponse(User user) {
        return AuthResponse.builder()
                .id(user.getId())
                .nome(user.getNome())
                .email(user.getEmail())
                .role(user.getRole().name())
                .build();
    }

    record ErrorResponse(String message) {}
}
