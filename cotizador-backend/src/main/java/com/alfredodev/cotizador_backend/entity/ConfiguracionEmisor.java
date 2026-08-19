package com.alfredodev.cotizador_backend.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ConfiguracionEmisor {

    @Id
    private Long id;

    @Column(nullable = false)
    private String nombreRazonSocial;

    @Column(nullable = false)
    private String rucDni;

    @Column(nullable = false)
    private String telefono;

    @Column(nullable = false)
    private String email;

    private String direccion;
}
