package com.alfredodev.cotizador_backend.mapper;

import com.alfredodev.cotizador_backend.dto.RolTarifaRequest;
import com.alfredodev.cotizador_backend.dto.RolTarifaResponse;
import com.alfredodev.cotizador_backend.entity.RolTarifa;

public class RolTarifaMapper {

    private RolTarifaMapper() {
    }

    public static RolTarifa toEntity(RolTarifaRequest request) {
        return RolTarifa.builder()
                .nombre(request.nombre())
                .tarifaMinima(request.tarifaMinima())
                .tarifaMaxima(request.tarifaMaxima())
                .activo(request.activo() == null || request.activo())
                .build();
    }

    public static void actualizarEntity(RolTarifa entity, RolTarifaRequest request) {
        entity.setNombre(request.nombre());
        entity.setTarifaMinima(request.tarifaMinima());
        entity.setTarifaMaxima(request.tarifaMaxima());
        if (request.activo() != null) {
            entity.setActivo(request.activo());
        }
    }

    public static RolTarifaResponse toResponse(RolTarifa entity) {
        return new RolTarifaResponse(
                entity.getId(),
                entity.getNombre(),
                entity.getTarifaMinima(),
                entity.getTarifaMaxima(),
                entity.getActivo()
        );
    }
}
