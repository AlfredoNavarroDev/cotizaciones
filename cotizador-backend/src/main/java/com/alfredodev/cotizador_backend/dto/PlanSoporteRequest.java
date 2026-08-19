package com.alfredodev.cotizador_backend.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;

import java.math.BigDecimal;

public record PlanSoporteRequest(
        @NotBlank String nombre,
        String descripcion,
        @NotNull @Positive BigDecimal precioMensual,
        Boolean activo
) {
}
