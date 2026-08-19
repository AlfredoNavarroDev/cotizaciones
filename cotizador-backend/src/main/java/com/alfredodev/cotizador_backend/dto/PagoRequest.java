package com.alfredodev.cotizador_backend.dto;

import com.alfredodev.cotizador_backend.entity.MetodoPago;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;

import java.math.BigDecimal;
import java.time.LocalDate;

public record PagoRequest(
        @NotNull @Positive BigDecimal monto,
        @NotNull LocalDate fecha,
        @NotNull MetodoPago metodo,
        String nota
) {
}
