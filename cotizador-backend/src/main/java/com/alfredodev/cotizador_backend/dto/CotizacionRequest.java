package com.alfredodev.cotizador_backend.dto;

import com.alfredodev.cotizador_backend.entity.EstadoCotizacion;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;

import java.math.BigDecimal;
import java.util.List;

public record CotizacionRequest(
        @NotNull Long clienteId,
        @NotNull @Positive Integer validezDias,
        // Sin default silencioso: cambia el cálculo de igv/total, debe venir explícito (CLAUDE.md).
        @NotNull Boolean incluyeIGV,
        // Null en creación => BORRADOR; null en edición => conserva el estado actual (mismo patrón
        // que RolTarifaRequest.activo).
        EstadoCotizacion estado,
        Long planSoporteId,
        @Positive BigDecimal tarifaSoporteFueraGarantia,
        String notasCostosNoIncluidos,
        @NotNull @Valid List<ItemCotizacionRequest> items
) {
}
