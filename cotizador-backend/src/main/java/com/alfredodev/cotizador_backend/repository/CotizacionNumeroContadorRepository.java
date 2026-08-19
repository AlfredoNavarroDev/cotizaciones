package com.alfredodev.cotizador_backend.repository;

import com.alfredodev.cotizador_backend.entity.CotizacionNumeroContador;
import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;

import java.util.Optional;

public interface CotizacionNumeroContadorRepository extends JpaRepository<CotizacionNumeroContador, Long> {

    // Lock pesimista: serializa el acceso a la fila del contador — evita que dos cotizaciones
    // creadas casi simultáneamente lean el mismo "ultimoNumero" y terminen con el mismo numero.
    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("select c from CotizacionNumeroContador c where c.id = 1")
    Optional<CotizacionNumeroContador> buscarParaActualizar();
}
