package com.alfredodev.cotizador_backend.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class CotizacionNumeroContador {

    @Id
    private Long id;

    @Column(nullable = false)
    private Long ultimoNumero;
}
