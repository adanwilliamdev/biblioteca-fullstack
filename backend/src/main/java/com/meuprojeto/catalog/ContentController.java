package com.seuprojeto.catalog;

import com.seuprojeto.catalog.dto.*;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/catalog")
@RequiredArgsConstructor
public class ContentController {

    private final ContentService contentService;

    @GetMapping
    public Page<ContentSummaryResponse> listar(
            @RequestParam(required = false) String titulo,
            @RequestParam(required = false) String genero,
            @RequestParam(required = false) Integer ano,
            @RequestParam(required = false) ContentType tipo,
            @PageableDefault(size = 15) Pageable pageable,
            Authentication authentication) {
        return contentService.listar(titulo, genero, ano, tipo, pageable, authentication.getName());
    }

    @GetMapping("/{id}")
    public ContentDetailResponse detalhes(@PathVariable Long id, Authentication authentication) {
        return contentService.buscarDetalhes(id, authentication.getName());
    }

    @PostMapping
    public ResponseEntity<Content> criar(@Valid @RequestBody ContentRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(contentService.criar(request));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public Content atualizar(@PathVariable Long id, @Valid @RequestBody ContentRequest request) {
        return contentService.atualizar(id, request);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> remover(@PathVariable Long id) {
        contentService.remover(id);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/{id}/temporadas")
    public ResponseEntity<Season> adicionarTemporada(@PathVariable Long id, @Valid @RequestBody SeasonRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(contentService.adicionarTemporada(id, request));
    }

    @DeleteMapping("/temporadas/{temporadaId}")
    public ResponseEntity<Void> removerTemporada(@PathVariable Long temporadaId) {
        contentService.removerTemporada(temporadaId);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/temporadas/{temporadaId}/episodios")
    public ResponseEntity<Episode> adicionarEpisodio(@PathVariable Long temporadaId, @Valid @RequestBody EpisodeRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(contentService.adicionarEpisodio(temporadaId, request));
    }

    @DeleteMapping("/episodios/{episodioId}")
    public ResponseEntity<Void> removerEpisodio(@PathVariable Long episodioId) {
        contentService.removerEpisodio(episodioId);
        return ResponseEntity.noContent().build();
    }
}
