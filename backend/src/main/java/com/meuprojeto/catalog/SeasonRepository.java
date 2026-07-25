package com.seuprojeto.catalog;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface SeasonRepository extends JpaRepository<Season, Long> {
    List<Season> findByConteudoIdOrderByNumeroAsc(Long conteudoId);
}
