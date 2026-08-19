package com.alfredodev.cotizador_backend.controller;

import com.alfredodev.cotizador_backend.dto.ConfiguracionEmisorRequest;
import com.alfredodev.cotizador_backend.dto.ConfiguracionEmisorResponse;
import com.alfredodev.cotizador_backend.service.ConfiguracionEmisorService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/configuracion-emisor")
@RequiredArgsConstructor
public class ConfiguracionEmisorController {

    private final ConfiguracionEmisorService service;

    @GetMapping
    public ResponseEntity<ConfiguracionEmisorResponse> obtener() {
        return ResponseEntity.ok(service.obtener());
    }

    @PutMapping
    public ResponseEntity<ConfiguracionEmisorResponse> actualizar(@Valid @RequestBody ConfiguracionEmisorRequest request) {
        return ResponseEntity.ok(service.actualizar(request));
    }
}
