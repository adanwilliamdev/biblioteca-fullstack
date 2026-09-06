package com.meuprojeto.tmdb;

import com.meuprojeto.catalog.ContentType;
import com.meuprojeto.tmdb.dto.TmdbImportResult;
import com.meuprojeto.tmdb.dto.TmdbSearchResult;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/tmdb")
@RequiredArgsConstructor
public class TmdbController {

    private final TmdbService tmdbService;

    @GetMapping("/status")
    public Map<String, Boolean> status() {
        return Map.of("configurado", tmdbService.isConfigured());
    }

    @GetMapping("/search")
    public List<TmdbSearchResult> buscar(@RequestParam String query, @RequestParam ContentType tipo) {
        return tmdbService.buscar(query, tipo);
    }

    @PostMapping("/import")
    @PreAuthorize("hasRole('ADMIN')")
    public TmdbImportResult importar(@RequestParam Long tmdbId, @RequestParam ContentType tipo) {
        return tmdbService.importar(tmdbId, tipo);
    }
}
