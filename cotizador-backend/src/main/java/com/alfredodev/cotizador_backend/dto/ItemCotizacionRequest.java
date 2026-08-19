package com.alfredodev.cotizador_backend.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;

import java.math.BigDecimal;
import java.util.List;

public record ItemCotizacionRequest(
        @NotBlank String nombreFase,
        List<String> descripcionTecnica,
        @NotNull @Positive Integer plazoSemanas,
        Long rolTarifaId,
        @NotNull @Positive BigDecimal precioFinal
) {
}
