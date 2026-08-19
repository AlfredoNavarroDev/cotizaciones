package com.alfredodev.cotizador_backend.mapper;

import com.alfredodev.cotizador_backend.dto.ClienteRequest;
import com.alfredodev.cotizador_backend.dto.ClienteResponse;
import com.alfredodev.cotizador_backend.entity.Cliente;

public class ClienteMapper {

    private ClienteMapper() {
    }

    public static Cliente toEntity(ClienteRequest request) {
        return Cliente.builder()
                .nombre(request.nombre())
                .empresa(request.empresa())
                .rucDni(request.rucDni())
                .telefono(request.telefono())
                .email(request.email())
                .build();
    }

    public static void actualizarEntity(Cliente entity, ClienteRequest request) {
        entity.setNombre(request.nombre());
        entity.setEmpresa(request.empresa());
        entity.setRucDni(request.rucDni());
        entity.setTelefono(request.telefono());
        entity.setEmail(request.email());
    }

    public static ClienteResponse toResponse(Cliente entity) {
        return new ClienteResponse(
                entity.getId(),
                entity.getNombre(),
                entity.getEmpresa(),
                entity.getRucDni(),
                entity.getTelefono(),
                entity.getEmail()
        );
    }
}
