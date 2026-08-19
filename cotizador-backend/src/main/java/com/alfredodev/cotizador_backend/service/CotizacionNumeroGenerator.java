package com.alfredodev.cotizador_backend.service;

import com.alfredodev.cotizador_backend.entity.CotizacionNumeroContador;
import com.alfredodev.cotizador_backend.repository.CotizacionNumeroContadorRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;

@Service
@RequiredArgsConstructor
public class CotizacionNumeroGenerator {

    private static final Long ID_CONTADOR = 1L;

    private final CotizacionNumeroContadorRepository repository;

    // Transacción corta: adquiere el lock, incrementa, libera — el año en el numero es el año de
    // creación, pero el contador nunca reinicia (correlativo global, spec §4.1).
    @Transactional
    public String generarSiguiente() {
        CotizacionNumeroContador contador = repository.buscarParaActualizar()
                .orElseGet(() -> repository.save(nuevoContador()));
        long siguiente = contador.getUltimoNumero() + 1;
        contador.setUltimoNumero(siguiente);
        repository.save(contador);
        int anioActual = LocalDate.now().getYear();
        return "COT-%d-%03d".formatted(anioActual, siguiente);
    }

    private CotizacionNumeroContador nuevoContador() {
        CotizacionNumeroContador contador = new CotizacionNumeroContador();
        contador.setId(ID_CONTADOR);
        contador.setUltimoNumero(0L);
        return contador;
    }
}
