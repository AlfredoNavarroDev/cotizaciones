package com.alfredodev.cotizador_backend.dto;

public record ConfiguracionEmisorResponse(
        Long id,
        String nombreRazonSocial,
        String rucDni,
        String telefono,
        String email,
        String direccion
) {
}
