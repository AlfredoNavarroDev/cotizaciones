package com.alfredodev.cotizador_backend.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;

public record ClienteRequest(
        @NotBlank String nombre,
        String empresa,
        @NotBlank String rucDni,
        String telefono,
        @Email String email
) {
}
