package com.alfredodev.cotizador_backend.mapper;

import com.alfredodev.cotizador_backend.dto.CotizacionRequest;
import com.alfredodev.cotizador_backend.dto.CotizacionResponse;
import com.alfredodev.cotizador_backend.entity.Cliente;
import com.alfredodev.cotizador_backend.entity.Cotizacion;
import com.alfredodev.cotizador_backend.entity.EstadoCotizacion;
import com.alfredodev.cotizador_backend.entity.PlanSoporte;

import java.math.BigDecimal;
import java.time.LocalDate;

public class CotizacionMapper {

    private CotizacionMapper() {
    }

    // cliente/planSoporte ya vienen resueltos por el service; items se agregan aparte porque cada
    // uno necesita resolver su propio rolTarifa opcional (CotizacionService.crear).
    public static Cotizacion toEntity(CotizacionRequest request, String numero, Cliente cliente, PlanSoporte planSoporte) {
        return Cotizacion.builder()
                .numero(numero)
                .fecha(LocalDate.now())
                .cliente(cliente)
                .validezDias(request.validezDias())
                .incluyeIGV(request.incluyeIGV())
                .estado(request.estado() == null ? EstadoCotizacion.BORRADOR : request.estado())
                .planSoporte(planSoporte)
                .tarifaSoporteFueraGarantia(request.tarifaSoporteFueraGarantia())
                .notasCostosNoIncluidos(request.notasCostosNoIncluidos())
                .build();
    }

    // Estado null en el request => conserva el estado actual (no fuerza BORRADOR en una edición).
    public static void actualizarEntity(Cotizacion entity, CotizacionRequest request, Cliente cliente, PlanSoporte planSoporte) {
        entity.setCliente(cliente);
        entity.setValidezDias(request.validezDias());
        entity.setIncluyeIGV(request.incluyeIGV());
        if (request.estado() != null) {
            entity.setEstado(request.estado());
        }
        entity.setPlanSoporte(planSoporte);
        entity.setTarifaSoporteFueraGarantia(request.tarifaSoporteFueraGarantia());
        entity.setNotasCostosNoIncluidos(request.notasCostosNoIncluidos());
    }

    public static CotizacionResponse toResponse(
            Cotizacion entity,
            BigDecimal subtotal,
            BigDecimal igv,
            BigDecimal total,
            BigDecimal montoPagado,
            BigDecimal saldoPendiente
    ) {
        return new CotizacionResponse(
                entity.getId(),
                entity.getNumero(),
                entity.getFecha(),
                ClienteMapper.toResponse(entity.getCliente()),
                entity.getValidezDias(),
                entity.getMoneda(),
                entity.getIncluyeIGV(),
                entity.getEstado(),
                entity.getPlanSoporte() == null ? null : PlanSoporteMapper.toResponse(entity.getPlanSoporte()),
                entity.getTarifaSoporteFueraGarantia(),
                entity.getNotasCostosNoIncluidos(),
                entity.getItems().stream().map(ItemCotizacionMapper::toResponse).toList(),
                entity.getPagos().stream().map(PagoMapper::toResponse).toList(),
                subtotal,
                igv,
                total,
                montoPagado,
                saldoPendiente
        );
    }
}
