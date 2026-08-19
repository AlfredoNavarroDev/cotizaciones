package com.alfredodev.cotizador_backend.service;

import com.alfredodev.cotizador_backend.dto.CotizacionResponse;
import com.alfredodev.cotizador_backend.entity.Cliente;
import com.alfredodev.cotizador_backend.entity.Cotizacion;
import com.alfredodev.cotizador_backend.entity.ItemCotizacion;
import com.alfredodev.cotizador_backend.entity.MetodoPago;
import com.alfredodev.cotizador_backend.entity.Pago;
import com.alfredodev.cotizador_backend.repository.CotizacionRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.time.LocalDate;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.when;

// Unitario: cubre el cálculo de subtotal/igv/total/montoPagado/saldoPendiente, la lógica de más
// riesgo del proyecto (CLAUDE.md #4) — sin contexto de Spring, dependencias mockeadas.
@ExtendWith(MockitoExtension.class)
class CotizacionServiceTest {

    @Mock
    private CotizacionRepository repository;
    @Mock
    private ClienteService clienteService;
    @Mock
    private PlanSoporteService planSoporteService;
    @Mock
    private RolTarifaService rolTarifaService;
    @Mock
    private CotizacionNumeroGenerator numeroGenerator;

    private CotizacionService serviceConMocks() {
        return new CotizacionService(repository, clienteService, planSoporteService, rolTarifaService, numeroGenerator);
    }

    private Cliente clienteDePrueba() {
        return Cliente.builder().id(1L).nombre("Cliente Test").rucDni("12345678").build();
    }

    private Cotizacion cotizacionBase(boolean incluyeIGV) {
        return Cotizacion.builder()
                .id(1L)
                .numero("COT-2026-001")
                .fecha(LocalDate.now())
                .cliente(clienteDePrueba())
                .validezDias(15)
                .incluyeIGV(incluyeIGV)
                .build();
    }

    @Test
    void obtener_conIGV_calculaSubtotalIgvYTotalCorrectamente() {
        Cotizacion cotizacion = cotizacionBase(true);
        cotizacion.addItem(item("Fase 1", "1000.00"));
        cotizacion.addItem(item("Fase 2", "500.00"));
        when(repository.findById(1L)).thenReturn(java.util.Optional.of(cotizacion));

        CotizacionResponse response = serviceConMocks().obtener(1L);

        assertThat(response.subtotal()).isEqualByComparingTo("1500.00");
        assertThat(response.igv()).isEqualByComparingTo("270.00");
        assertThat(response.total()).isEqualByComparingTo("1770.00");
    }

    @Test
    void obtener_sinIGV_igvEsCeroYTotalIgualaSubtotal() {
        Cotizacion cotizacion = cotizacionBase(false);
        cotizacion.addItem(item("Fase 1", "1000.00"));
        when(repository.findById(1L)).thenReturn(java.util.Optional.of(cotizacion));

        CotizacionResponse response = serviceConMocks().obtener(1L);

        assertThat(response.igv()).isEqualByComparingTo("0.00");
        assertThat(response.total()).isEqualByComparingTo(response.subtotal());
    }

    @Test
    void obtener_sinItems_subtotalYTotalSonCero() {
        Cotizacion cotizacion = cotizacionBase(true);
        when(repository.findById(1L)).thenReturn(java.util.Optional.of(cotizacion));

        CotizacionResponse response = serviceConMocks().obtener(1L);

        assertThat(response.subtotal()).isEqualByComparingTo("0.00");
        assertThat(response.total()).isEqualByComparingTo("0.00");
    }

    @Test
    void obtener_conPagos_calculaMontoPagadoYSaldoPendiente() {
        Cotizacion cotizacion = cotizacionBase(true);
        cotizacion.addItem(item("Fase 1", "1000.00"));
        cotizacion.addPago(pago("300.00"));
        cotizacion.addPago(pago("200.00"));
        when(repository.findById(1L)).thenReturn(java.util.Optional.of(cotizacion));

        CotizacionResponse response = serviceConMocks().obtener(1L);

        // total = 1000 + 180 (igv 18%) = 1180.00
        assertThat(response.montoPagado()).isEqualByComparingTo("500.00");
        assertThat(response.saldoPendiente()).isEqualByComparingTo("680.00");
    }

    @Test
    void obtener_sinPagos_saldoPendienteIgualaTotal() {
        Cotizacion cotizacion = cotizacionBase(false);
        cotizacion.addItem(item("Fase 1", "1000.00"));
        when(repository.findById(1L)).thenReturn(java.util.Optional.of(cotizacion));

        CotizacionResponse response = serviceConMocks().obtener(1L);

        assertThat(response.montoPagado()).isEqualByComparingTo("0.00");
        assertThat(response.saldoPendiente()).isEqualByComparingTo(response.total());
    }

    private ItemCotizacion item(String nombreFase, String precio) {
        return ItemCotizacion.builder()
                .nombreFase(nombreFase)
                .plazoSemanas(2)
                .precioFinal(new BigDecimal(precio))
                .build();
    }

    private Pago pago(String monto) {
        return Pago.builder()
                .monto(new BigDecimal(monto))
                .fecha(LocalDate.now())
                .metodo(MetodoPago.TRANSFERENCIA)
                .build();
    }
}
