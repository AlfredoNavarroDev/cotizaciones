package com.alfredodev.cotizador_backend.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;

@Entity
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Cotizacion {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true)
    private String numero;

    @Column(nullable = false)
    private LocalDate fecha;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "cliente_id", nullable = false)
    private Cliente cliente;

    @Column(nullable = false)
    private Integer validezDias;

    @Column(nullable = false)
    @Builder.Default
    private String moneda = "PEN";

    // Boolean (no boolean primitivo) + sin default silencioso — cambia un cálculo de dinero,
    // debe fijarse explícito al crear (CLAUDE.md, spec §4.1).
    @Column(nullable = false)
    private Boolean incluyeIGV;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    @Builder.Default
    private EstadoCotizacion estado = EstadoCotizacion.BORRADOR;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "plan_soporte_id")
    private PlanSoporte planSoporte;

    private BigDecimal tarifaSoporteFueraGarantia;

    @Column(columnDefinition = "TEXT")
    private String notasCostosNoIncluidos;

    @OneToMany(mappedBy = "cotizacion", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.LAZY)
    @Builder.Default
    private List<ItemCotizacion> items = new ArrayList<>();

    @OneToMany(mappedBy = "cotizacion", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.LAZY)
    @Builder.Default
    private List<Pago> pagos = new ArrayList<>();

    // Sincroniza ambos lados de la relación bidireccional — el caller no tiene que acordarse
    // de setear cotizacion en el item/pago cada vez.
    public void addItem(ItemCotizacion item) {
        items.add(item);
        item.setCotizacion(this);
    }

    public void addPago(Pago pago) {
        pagos.add(pago);
        pago.setCotizacion(this);
    }
}
