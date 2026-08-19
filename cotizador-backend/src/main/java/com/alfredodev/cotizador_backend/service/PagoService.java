package com.alfredodev.cotizador_backend.service;

import com.alfredodev.cotizador_backend.dto.PagoRequest;
import com.alfredodev.cotizador_backend.dto.PagoResponse;
import com.alfredodev.cotizador_backend.entity.Cotizacion;
import com.alfredodev.cotizador_backend.entity.Pago;
import com.alfredodev.cotizador_backend.exception.RecursoNoEncontradoException;
import com.alfredodev.cotizador_backend.mapper.PagoMapper;
import com.alfredodev.cotizador_backend.repository.PagoRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class PagoService {

    private final PagoRepository repository;
    private final CotizacionService cotizacionService;

    @Transactional
    public PagoResponse agregar(Long cotizacionId, PagoRequest request) {
        Cotizacion cotizacion = cotizacionService.obtenerEntity(cotizacionId);
        Pago pago = PagoMapper.toEntity(request);
        cotizacion.addPago(pago);
        return PagoMapper.toResponse(repository.save(pago));
    }

    @Transactional
    public void eliminar(Long id) {
        Pago pago = repository.findById(id)
                .orElseThrow(() -> new RecursoNoEncontradoException("Pago %d no encontrado".formatted(id)));
        repository.delete(pago);
    }
}
