package com.seuprojeto.catalog;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "conteudos")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Content {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String titulo;

    @Column(length = 2000)
    private String sinopse;

    private String genero;

    private Integer ano;

    private String imagemUrl;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private ContentType tipo;

    // Usado apenas quando tipo = FILME
    private Boolean assistido;

    @Builder.Default
    private LocalDateTime criadoEm = LocalDateTime.now();

    @JsonIgnore
    @OneToMany(mappedBy = "conteudo", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.LAZY)
    @Builder.Default
    private List<Season> temporadas = new ArrayList<>();
}
