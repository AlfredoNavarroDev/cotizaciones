package com.alfredodev.cotizador_backend.service;

import com.alfredodev.cotizador_backend.dto.ConfiguracionEmisorRequest;
import com.alfredodev.cotizador_backend.dto.ConfiguracionEmisorResponse;
import com.alfredodev.cotizador_backend.entity.ConfiguracionEmisor;
import com.alfredodev.cotizador_backend.mapper.ConfiguracionEmisorMapper;
import com.alfredodev.cotizador_backend.repository.ConfiguracionEmisorRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class ConfiguracionEmisorService {

    // Fila única — todo el service lee/crea/actualiza siempre este mismo id.
    private static final Long ID_UNICO = 1L;

    private final ConfiguracionEmisorRepository repository;

    @Transactional
    public ConfiguracionEmisorResponse obtener() {
        ConfiguracionEmisor config = repository.findById(ID_UNICO).orElseGet(this::crearValoresIniciales);
        return ConfiguracionEmisorMapper.toResponse(config);
    }

    @Transactional
    public ConfiguracionEmisorResponse actualizar(ConfiguracionEmisorRequest request) {
        ConfiguracionEmisor config = repository.findById(ID_UNICO).orElseGet(this::crearValoresIniciales);
        ConfiguracionEmisorMapper.actualizarEntity(config, request);
        return ConfiguracionEmisorMapper.toResponse(repository.save(config));
    }

    // Fila semilla vacía: CLAUDE.md prohíbe hardcodear datos del emisor en el backend — el usuario
    // los llena desde "Mis datos" en su primer uso.
    private ConfiguracionEmisor crearValoresIniciales() {
        ConfiguracionEmisor config = ConfiguracionEmisor.builder()
                .id(ID_UNICO)
                .nombreRazonSocial("")
                .rucDni("")
                .telefono("")
                .email("")
                .build();
        return repository.save(config);
    }
}
