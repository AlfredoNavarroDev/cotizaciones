package com.alfredodev.cotizador_backend.dto;

import java.math.BigDecimal;

public record RolTarifaResponse(
        Long id,
        String nombre,
        BigDecimal tarifaMinima,
        BigDecimal tarifaMaxima,
        Boolean activo
) {
}
