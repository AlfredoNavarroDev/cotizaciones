package com.alfredodev.cotizador_backend.dto;

import jakarta.validation.constraints.NotBlank;

public record ConfiguracionEmisorRequest(
        @NotBlank String nombreRazonSocial,
        @NotBlank String rucDni,
        @NotBlank String telefono,
        @NotBlank String email,
        String direccion
) {
}
