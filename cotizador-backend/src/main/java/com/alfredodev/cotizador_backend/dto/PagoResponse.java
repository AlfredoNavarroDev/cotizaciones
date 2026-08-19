package com.alfredodev.cotizador_backend.dto;

import com.alfredodev.cotizador_backend.entity.MetodoPago;

import java.math.BigDecimal;
import java.time.LocalDate;

public record PagoResponse(
        Long id,
        BigDecimal monto,
        LocalDate fecha,
        MetodoPago metodo,
        String nota
) {
}
