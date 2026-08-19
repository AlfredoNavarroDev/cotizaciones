package com.alfredodev.cotizador_backend.exception;

import java.util.Map;

public record ErrorResponse(String mensaje, Map<String, String> errores) {
    public ErrorResponse(String mensaje) {
        this(mensaje, null);
    }
}
