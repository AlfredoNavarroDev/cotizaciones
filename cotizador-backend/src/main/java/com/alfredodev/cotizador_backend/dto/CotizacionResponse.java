package com.alfredodev.cotizador_backend.dto;

import com.alfredodev.cotizador_backend.entity.EstadoCotizacion;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

public record CotizacionResponse(
        Long id,
        String numero,
        LocalDate fecha,
        ClienteResponse cliente,
        Integer validezDias,
        String moneda,
        Boolean incluyeIGV,
        EstadoCotizacion estado,
        PlanSoporteResponse planSoporte,
        BigDecimal tarifaSoporteFueraGarantia,
        String notasCostosNoIncluidos,
        List<ItemCotizacionResponse> items,
        List<PagoResponse> pagos,
        BigDecimal subtotal,
        BigDecimal igv,
        BigDecimal total,
        BigDecimal montoPagado,
        BigDecimal saldoPendiente
) {
}
