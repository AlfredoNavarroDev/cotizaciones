package com.alfredodev.cotizador_backend.repository;

import com.alfredodev.cotizador_backend.entity.Cotizacion;
import org.springframework.data.jpa.repository.JpaRepository;

public interface CotizacionRepository extends JpaRepository<Cotizacion, Long> {
}
