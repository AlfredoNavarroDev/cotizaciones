package com.alfredodev.cotizador_backend.dto;

import java.math.BigDecimal;
import java.util.List;

public record ItemCotizacionResponse(
        Long id,
        String nombreFase,
        List<String> descripcionTecnica,
        Integer plazoSemanas,
        Long rolTarifaId,
        BigDecimal precioFinal
) {
}
