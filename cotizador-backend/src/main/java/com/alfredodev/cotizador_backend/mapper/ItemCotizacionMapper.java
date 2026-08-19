package com.alfredodev.cotizador_backend.mapper;

import com.alfredodev.cotizador_backend.dto.ItemCotizacionRequest;
import com.alfredodev.cotizador_backend.dto.ItemCotizacionResponse;
import com.alfredodev.cotizador_backend.entity.ItemCotizacion;
import com.alfredodev.cotizador_backend.entity.RolTarifa;

import java.util.ArrayList;

public class ItemCotizacionMapper {

    private ItemCotizacionMapper() {
    }

    // rolTarifa ya viene resuelto por el service (o null si el request no trae rolTarifaId) —
    // el mapper no consulta repositorios.
    public static ItemCotizacion toEntity(ItemCotizacionRequest request, RolTarifa rolTarifa) {
        return ItemCotizacion.builder()
                .nombreFase(request.nombreFase())
                .descripcionTecnica(request.descripcionTecnica() == null
                        ? new ArrayList<>()
                        : new ArrayList<>(request.descripcionTecnica()))
                .plazoSemanas(request.plazoSemanas())
                .rolTarifa(rolTarifa)
                .precioFinal(request.precioFinal())
                .build();
    }

    public static ItemCotizacionResponse toResponse(ItemCotizacion entity) {
        return new ItemCotizacionResponse(
                entity.getId(),
                entity.getNombreFase(),
                entity.getDescripcionTecnica(),
                entity.getPlazoSemanas(),
                entity.getRolTarifa() == null ? null : entity.getRolTarifa().getId(),
                entity.getPrecioFinal()
        );
    }
}
