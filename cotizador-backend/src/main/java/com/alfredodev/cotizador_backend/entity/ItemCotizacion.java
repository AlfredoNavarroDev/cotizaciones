package com.alfredodev.cotizador_backend.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;

@Entity
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ItemCotizacion {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "cotizacion_id", nullable = false)
    private Cotizacion cotizacion;

    @Column(nullable = false)
    private String nombreFase;

    @ElementCollection
    @CollectionTable(name = "item_cotizacion_bullets", joinColumns = @JoinColumn(name = "item_cotizacion_id"))
    @OrderColumn(name = "orden")
    @Column(name = "bullet", columnDefinition = "TEXT")
    @Builder.Default
    private List<String> descripcionTecnica = new ArrayList<>();

    @Column(nullable = false)
    private Integer plazoSemanas;

    // FK opcional para sugerir precio — si el rol se inactiva, el item conserva la referencia sin
    // cambios (precioFinal ya está fijado y no depende del estado del rol, spec §4.1).
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "rol_tarifa_id")
    private RolTarifa rolTarifa;

    @Column(nullable = false)
    private BigDecimal precioFinal;
}
