package com.alfredodev.cotizador_backend.repository;

import com.alfredodev.cotizador_backend.entity.Pago;
import org.springframework.data.jpa.repository.JpaRepository;

public interface PagoRepository extends JpaRepository<Pago, Long> {
}
