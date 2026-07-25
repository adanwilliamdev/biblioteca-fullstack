package com.seuprojeto.catalog;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "episodios")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Episode {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private Integer numero;

    private String titulo;

    private Integer duracaoMinutos;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "temporada_id", nullable = false)
    @JsonIgnore
    private Season temporada;
}
