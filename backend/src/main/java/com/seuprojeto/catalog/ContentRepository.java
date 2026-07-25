package com.seuprojeto.catalog;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;

import java.util.List;

public interface ContentRepository extends JpaRepository<Content, Long>, JpaSpecificationExecutor<Content> {

    long countByTipo(ContentType tipo);

    @Query("SELECT c.genero, COUNT(c) FROM Content c WHERE c.genero IS NOT NULL GROUP BY c.genero")
    List<Object[]> countAgrupadoPorGenero();

    List<Content> findByTipo(ContentType tipo);
}
