package com.seuprojeto.dashboard.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class DashboardResponse {
    private long totalFilmes;
    private long totalSeries;
    private long episodiosAssistidos;
    private long filmesAssistidos;
    private double progressoGeral;
    private double totalHorasAssistidas;
    private long seriesConcluidas;
    private long seriesEmProgresso;
    private long seriesNaoIniciadas;
    private List<GeneroStat> distribuicaoPorGenero;
    private List<ContinuarAssistindoItem> continuarAssistindo;
}
