package com.alfredodev.cotizador_backend.service;

import com.alfredodev.cotizador_backend.dto.PlanSoporteRequest;
import com.alfredodev.cotizador_backend.dto.PlanSoporteResponse;
import com.alfredodev.cotizador_backend.entity.PlanSoporte;
import com.alfredodev.cotizador_backend.exception.RecursoNoEncontradoException;
import com.alfredodev.cotizador_backend.mapper.PlanSoporteMapper;
import com.alfredodev.cotizador_backend.repository.PlanSoporteRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class PlanSoporteService {

    private final PlanSoporteRepository repository;

    @Transactional(readOnly = true)
    public List<PlanSoporteResponse> listar() {
        return repository.findAll().stream().map(PlanSoporteMapper::toResponse).toList();
    }

    @Transactional(readOnly = true)
    public PlanSoporte obtenerEntity(Long id) {
        return repository.findById(id)
                .orElseThrow(() -> new RecursoNoEncontradoException("PlanSoporte %d no encontrado".formatted(id)));
    }

    @Transactional
    public PlanSoporteResponse crear(PlanSoporteRequest request) {
        return PlanSoporteMapper.toResponse(repository.save(PlanSoporteMapper.toEntity(request)));
    }

    @Transactional
    public PlanSoporteResponse actualizar(Long id, PlanSoporteRequest request) {
        PlanSoporte plan = obtenerEntity(id);
        PlanSoporteMapper.actualizarEntity(plan, request);
        return PlanSoporteMapper.toResponse(repository.save(plan));
    }
}
