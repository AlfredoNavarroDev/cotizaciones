package com.alfredodev.cotizador_backend.controller;

import com.alfredodev.cotizador_backend.dto.PlanSoporteRequest;
import com.alfredodev.cotizador_backend.dto.PlanSoporteResponse;
import com.alfredodev.cotizador_backend.service.PlanSoporteService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.net.URI;
import java.util.List;

@RestController
@RequestMapping("/api/planes-soporte")
@RequiredArgsConstructor
public class PlanSoporteController {

    private final PlanSoporteService service;

    @GetMapping
    public ResponseEntity<List<PlanSoporteResponse>> listar() {
        return ResponseEntity.ok(service.listar());
    }

    @PostMapping
    public ResponseEntity<PlanSoporteResponse> crear(@Valid @RequestBody PlanSoporteRequest request) {
        PlanSoporteResponse creado = service.crear(request);
        return ResponseEntity.created(URI.create("/api/planes-soporte/" + creado.id())).body(creado);
    }

    @PutMapping("/{id}")
    public ResponseEntity<PlanSoporteResponse> actualizar(@PathVariable Long id, @Valid @RequestBody PlanSoporteRequest request) {
        return ResponseEntity.ok(service.actualizar(id, request));
    }
}
