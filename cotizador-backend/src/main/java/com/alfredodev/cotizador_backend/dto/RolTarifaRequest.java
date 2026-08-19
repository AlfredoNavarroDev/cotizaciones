package com.alfredodev.cotizador_backend.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;

import java.math.BigDecimal;

public record RolTarifaRequest(
        @NotBlank String nombre,
        @NotNull @Positive BigDecimal tarifaMinima,
        @NotNull @Positive BigDecimal tarifaMaxima,
        Boolean activo
) {
}
