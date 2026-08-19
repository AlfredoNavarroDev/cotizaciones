package com.alfredodev.cotizador_backend.mapper;

import com.alfredodev.cotizador_backend.dto.PagoRequest;
import com.alfredodev.cotizador_backend.dto.PagoResponse;
import com.alfredodev.cotizador_backend.entity.Pago;

public class PagoMapper {

    private PagoMapper() {
    }

    public static Pago toEntity(PagoRequest request) {
        return Pago.builder()
                .monto(request.monto())
                .fecha(request.fecha())
                .metodo(request.metodo())
                .nota(request.nota())
                .build();
    }

    public static PagoResponse toResponse(Pago entity) {
        return new PagoResponse(
                entity.getId(),
                entity.getMonto(),
                entity.getFecha(),
                entity.getMetodo(),
                entity.getNota()
        );
    }
}
