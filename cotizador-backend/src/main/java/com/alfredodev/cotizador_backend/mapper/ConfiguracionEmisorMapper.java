package com.alfredodev.cotizador_backend.mapper;

import com.alfredodev.cotizador_backend.dto.ConfiguracionEmisorRequest;
import com.alfredodev.cotizador_backend.dto.ConfiguracionEmisorResponse;
import com.alfredodev.cotizador_backend.entity.ConfiguracionEmisor;

public class ConfiguracionEmisorMapper {

    private ConfiguracionEmisorMapper() {
    }

    public static ConfiguracionEmisorResponse toResponse(ConfiguracionEmisor entity) {
        return new ConfiguracionEmisorResponse(
                entity.getId(),
                entity.getNombreRazonSocial(),
                entity.getRucDni(),
                entity.getTelefono(),
                entity.getEmail(),
                entity.getDireccion()
        );
    }

    public static void actualizarEntity(ConfiguracionEmisor entity, ConfiguracionEmisorRequest request) {
        entity.setNombreRazonSocial(request.nombreRazonSocial());
        entity.setRucDni(request.rucDni());
        entity.setTelefono(request.telefono());
        entity.setEmail(request.email());
        entity.setDireccion(request.direccion());
    }
}
