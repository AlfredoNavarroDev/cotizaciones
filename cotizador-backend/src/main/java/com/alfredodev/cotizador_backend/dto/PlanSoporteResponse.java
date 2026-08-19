package com.alfredodev.cotizador_backend.dto;

import java.math.BigDecimal;

public record PlanSoporteResponse(
        Long id,
        String nombre,
        String descripcion,
        BigDecimal precioMensual,
        Boolean activo
) {
}
