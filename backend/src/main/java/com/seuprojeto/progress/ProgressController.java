package com.seuprojeto.progress;

import com.seuprojeto.progress.dto.ProgressResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/progresso")
@RequiredArgsConstructor
public class ProgressController {

    private final ProgressService progressService;

    @PutMapping("/episodios/{episodioId}")
    public ProgressResponse marcarEpisodio(@PathVariable Long episodioId,
                                            @RequestParam ProgressStatus status,
                                            Authentication authentication) {
        return progressService.marcarEpisodio(episodioId, status, authentication.getName());
    }

    @PutMapping("/conteudos/{conteudoId}")
    public ProgressResponse marcarFilme(@PathVariable Long conteudoId,
                                         @RequestParam ProgressStatus status,
                                         Authentication authentication) {
        return progressService.marcarFilme(conteudoId, status, authentication.getName());
    }
}
