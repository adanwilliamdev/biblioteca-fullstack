package com.seuprojeto.user;

import com.seuprojeto.config.JwtUtil;
import com.seuprojeto.user.dto.*;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthenticationManager authenticationManager;
    private final UserService userService;
    private final JwtUtil jwtUtil;

    @PostMapping("/register")
    public ResponseEntity<?> register(@Valid @RequestBody RegisterRequest request) {
        try {
            User user = userService.register(request);
            String token = jwtUtil.generateToken(user);
            AuthResponse response = AuthResponse.builder()
                    .token(token)
                    .id(user.getId())
                    .nome(user.getNome())
                    .email(user.getEmail())
                    .role(user.getRole().name())
                    .build();
            return ResponseEntity.status(HttpStatus.CREATED).body(response);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(HttpStatus.CONFLICT).body(new ErrorResponse(e.getMessage()));
        }
    }

    @PostMapping("/login")
    public ResponseEntity<?> login(@Valid @RequestBody LoginRequest request) {
        try {
            authenticationManager.authenticate(
                    new UsernamePasswordAuthenticationToken(request.getEmail(), request.getSenha())
            );
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(new ErrorResponse("E-mail ou senha inválidos"));
        }

        UserDetails userDetails = userService.loadUserByUsername(request.getEmail());
        User user = userService.findByEmail(request.getEmail());
        String token = jwtUtil.generateToken(userDetails);

        AuthResponse response = AuthResponse.builder()
                .token(token)
                .id(user.getId())
                .nome(user.getNome())
                .email(user.getEmail())
                .role(user.getRole().name())
                .build();
        return ResponseEntity.ok(response);
    }

    record ErrorResponse(String message) {}
}
