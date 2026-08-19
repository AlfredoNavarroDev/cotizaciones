package com.alfredodev.cotizador_backend.service;

import com.alfredodev.cotizador_backend.dto.RolTarifaRequest;
import com.alfredodev.cotizador_backend.dto.RolTarifaResponse;
import com.alfredodev.cotizador_backend.entity.RolTarifa;
import com.alfredodev.cotizador_backend.exception.RecursoNoEncontradoException;
import com.alfredodev.cotizador_backend.mapper.RolTarifaMapper;
import com.alfredodev.cotizador_backend.repository.RolTarifaRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class RolTarifaService {

    private final RolTarifaRepository repository;

    @Transactional(readOnly = true)
    public List<RolTarifaResponse> listar() {
        return repository.findAll().stream().map(RolTarifaMapper::toResponse).toList();
    }

    // Usado por ItemCotizacionMapper para resolver el FK opcional del item — el rol puede estar inactivo,
    // se devuelve igual: un rol inactivo sigue siendo una referencia válida (spec §4.1).
    @Transactional(readOnly = true)
    public RolTarifa obtenerEntity(Long id) {
        return repository.findById(id)
                .orElseThrow(() -> new RecursoNoEncontradoException("RolTarifa %d no encontrado".formatted(id)));
    }

    @Transactional
    public RolTarifaResponse crear(RolTarifaRequest request) {
        return RolTarifaMapper.toResponse(repository.save(RolTarifaMapper.toEntity(request)));
    }

    @Transactional
    public RolTarifaResponse actualizar(Long id, RolTarifaRequest request) {
        RolTarifa rol = obtenerEntity(id);
        RolTarifaMapper.actualizarEntity(rol, request);
        return RolTarifaMapper.toResponse(repository.save(rol));
    }
}
