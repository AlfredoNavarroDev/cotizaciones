package com.alfredodev.cotizador_backend.mapper;

import com.alfredodev.cotizador_backend.dto.PlanSoporteRequest;
import com.alfredodev.cotizador_backend.dto.PlanSoporteResponse;
import com.alfredodev.cotizador_backend.entity.PlanSoporte;

public class PlanSoporteMapper {

    private PlanSoporteMapper() {
    }

    public static PlanSoporte toEntity(PlanSoporteRequest request) {
        return PlanSoporte.builder()
                .nombre(request.nombre())
                .descripcion(request.descripcion())
                .precioMensual(request.precioMensual())
                .activo(request.activo() == null || request.activo())
                .build();
    }

    public static void actualizarEntity(PlanSoporte entity, PlanSoporteRequest request) {
        entity.setNombre(request.nombre());
        entity.setDescripcion(request.descripcion());
        entity.setPrecioMensual(request.precioMensual());
        if (request.activo() != null) {
            entity.setActivo(request.activo());
        }
    }

    public static PlanSoporteResponse toResponse(PlanSoporte entity) {
        return new PlanSoporteResponse(
                entity.getId(),
                entity.getNombre(),
                entity.getDescripcion(),
                entity.getPrecioMensual(),
                entity.getActivo()
        );
    }
}
