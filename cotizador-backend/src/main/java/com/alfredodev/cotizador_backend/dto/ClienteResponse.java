package com.alfredodev.cotizador_backend.dto;

public record ClienteResponse(
        Long id,
        String nombre,
        String empresa,
        String rucDni,
        String telefono,
        String email
) {
}
