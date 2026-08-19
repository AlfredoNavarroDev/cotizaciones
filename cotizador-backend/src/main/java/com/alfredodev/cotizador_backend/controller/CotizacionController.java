package com.alfredodev.cotizador_backend.controller;

import com.alfredodev.cotizador_backend.dto.CotizacionRequest;
import com.alfredodev.cotizador_backend.dto.CotizacionResponse;
import com.alfredodev.cotizador_backend.service.CotizacionService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.net.URI;

@RestController
@RequestMapping("/api/cotizaciones")
@RequiredArgsConstructor
public class CotizacionController {

    private final CotizacionService service;

    @GetMapping
    public ResponseEntity<Page<CotizacionResponse>> listar(Pageable pageable) {
        return ResponseEntity.ok(service.listar(pageable));
    }

    @GetMapping("/{id}")
    public ResponseEntity<CotizacionResponse> obtener(@PathVariable Long id) {
        return ResponseEntity.ok(service.obtener(id));
    }

    @PostMapping
    public ResponseEntity<CotizacionResponse> crear(@Valid @RequestBody CotizacionRequest request) {
        CotizacionResponse creada = service.crear(request);
        return ResponseEntity.created(URI.create("/api/cotizaciones/" + creada.id())).body(creada);
    }

    @PutMapping("/{id}")
    public ResponseEntity<CotizacionResponse> actualizar(@PathVariable Long id, @Valid @RequestBody CotizacionRequest request) {
        return ResponseEntity.ok(service.actualizar(id, request));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> eliminar(@PathVariable Long id) {
        service.eliminar(id);
        return ResponseEntity.noContent().build();
    }
}
