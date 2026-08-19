package com.alfredodev.cotizador_backend.controller;

import com.alfredodev.cotizador_backend.dto.RolTarifaRequest;
import com.alfredodev.cotizador_backend.dto.RolTarifaResponse;
import com.alfredodev.cotizador_backend.service.RolTarifaService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.net.URI;
import java.util.List;

@RestController
@RequestMapping("/api/tarifario")
@RequiredArgsConstructor
public class RolTarifaController {

    private final RolTarifaService service;

    @GetMapping
    public ResponseEntity<List<RolTarifaResponse>> listar() {
        return ResponseEntity.ok(service.listar());
    }

    @PostMapping
    public ResponseEntity<RolTarifaResponse> crear(@Valid @RequestBody RolTarifaRequest request) {
        RolTarifaResponse creado = service.crear(request);
        return ResponseEntity.created(URI.create("/api/tarifario/" + creado.id())).body(creado);
    }

    @PutMapping("/{id}")
    public ResponseEntity<RolTarifaResponse> actualizar(@PathVariable Long id, @Valid @RequestBody RolTarifaRequest request) {
        return ResponseEntity.ok(service.actualizar(id, request));
    }
}
