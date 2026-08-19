package com.alfredodev.cotizador_backend.service;

import com.alfredodev.cotizador_backend.dto.ClienteRequest;
import com.alfredodev.cotizador_backend.dto.ClienteResponse;
import com.alfredodev.cotizador_backend.entity.Cliente;
import com.alfredodev.cotizador_backend.exception.RecursoDuplicadoException;
import com.alfredodev.cotizador_backend.exception.RecursoNoEncontradoException;
import com.alfredodev.cotizador_backend.mapper.ClienteMapper;
import com.alfredodev.cotizador_backend.repository.ClienteRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class ClienteService {

    private final ClienteRepository repository;

    @Transactional(readOnly = true)
    public Page<ClienteResponse> listar(Pageable pageable) {
        return repository.findAll(pageable).map(ClienteMapper::toResponse);
    }

    @Transactional(readOnly = true)
    public ClienteResponse obtener(Long id) {
        return ClienteMapper.toResponse(obtenerEntity(id));
    }

    // Expuesto para que CotizacionService resuelva el FK cliente al crear/editar una cotización.
    @Transactional(readOnly = true)
    public Cliente obtenerEntity(Long id) {
        return repository.findById(id)
                .orElseThrow(() -> new RecursoNoEncontradoException("Cliente %d no encontrado".formatted(id)));
    }

    @Transactional
    public ClienteResponse crear(ClienteRequest request) {
        try {
            return ClienteMapper.toResponse(repository.save(ClienteMapper.toEntity(request)));
        } catch (DataIntegrityViolationException ex) {
            throw new RecursoDuplicadoException("Ya existe un cliente con RUC/DNI %s".formatted(request.rucDni()));
        }
    }

    @Transactional
    public ClienteResponse actualizar(Long id, ClienteRequest request) {
        Cliente cliente = obtenerEntity(id);
        ClienteMapper.actualizarEntity(cliente, request);
        try {
            return ClienteMapper.toResponse(repository.save(cliente));
        } catch (DataIntegrityViolationException ex) {
            throw new RecursoDuplicadoException("Ya existe un cliente con RUC/DNI %s".formatted(request.rucDni()));
        }
    }

    @Transactional
    public void eliminar(Long id) {
        Cliente cliente = obtenerEntity(id);
        repository.delete(cliente);
    }
}
