package com.seuprojeto.catalog;

import org.springframework.data.jpa.domain.Specification;

public final class ContentSpecifications {

    private ContentSpecifications() {
    }

    public static Specification<Content> comTitulo(String titulo) {
        return (root, query, cb) ->
                cb.like(cb.lower(root.get("titulo")), "%" + titulo.toLowerCase() + "%");
    }

    public static Specification<Content> comGenero(String genero) {
        return (root, query, cb) ->
                cb.equal(cb.lower(root.get("genero")), genero.toLowerCase());
    }

    public static Specification<Content> comAno(Integer ano) {
        return (root, query, cb) -> cb.equal(root.get("ano"), ano);
    }

    public static Specification<Content> comTipo(ContentType tipo) {
        return (root, query, cb) -> cb.equal(root.get("tipo"), tipo);
    }
}
