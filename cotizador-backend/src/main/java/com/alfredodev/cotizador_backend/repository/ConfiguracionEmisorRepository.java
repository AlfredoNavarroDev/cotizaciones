package com.alfredodev.cotizador_backend.repository;

import com.alfredodev.cotizador_backend.entity.ConfiguracionEmisor;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ConfiguracionEmisorRepository extends JpaRepository<ConfiguracionEmisor, Long> {
}
