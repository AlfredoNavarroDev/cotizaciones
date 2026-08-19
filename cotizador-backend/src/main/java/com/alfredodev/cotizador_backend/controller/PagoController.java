package com.alfredodev.cotizador_backend.controller;

import com.alfredodev.cotizador_backend.dto.PagoRequest;
import com.alfredodev.cotizador_backend.dto.PagoResponse;
import com.alfredodev.cotizador_backend.service.PagoService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.net.URI;

// Sin @RequestMapping de clase: los pagos cuelgan de dos rutas distintas (crear bajo la
// cotización padre, eliminar como recurso propio) — spec §5.
@RestController
@RequiredArgsConstructor
public class PagoController {

    private final PagoService service;

    @PostMapping("/api/cotizaciones/{cotizacionId}/pagos")
    public ResponseEntity<PagoResponse> agregar(@PathVariable Long cotizacionId, @Valid @RequestBody PagoRequest request) {
        PagoResponse creado = service.agregar(cotizacionId, request);
        return ResponseEntity.created(URI.create("/api/pagos/" + creado.id())).body(creado);
    }

    @DeleteMapping("/api/pagos/{id}")
    public ResponseEntity<Void> eliminar(@PathVariable Long id) {
        service.eliminar(id);
        return ResponseEntity.noContent().build();
    }
}
