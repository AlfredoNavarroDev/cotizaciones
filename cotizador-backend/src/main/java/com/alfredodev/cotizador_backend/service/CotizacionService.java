package com.alfredodev.cotizador_backend.service;

import com.alfredodev.cotizador_backend.dto.CotizacionRequest;
import com.alfredodev.cotizador_backend.dto.CotizacionResponse;
import com.alfredodev.cotizador_backend.dto.ItemCotizacionRequest;
import com.alfredodev.cotizador_backend.entity.Cliente;
import com.alfredodev.cotizador_backend.entity.Cotizacion;
import com.alfredodev.cotizador_backend.entity.ItemCotizacion;
import com.alfredodev.cotizador_backend.entity.Pago;
import com.alfredodev.cotizador_backend.entity.PlanSoporte;
import com.alfredodev.cotizador_backend.entity.RolTarifa;
import com.alfredodev.cotizador_backend.exception.RecursoNoEncontradoException;
import com.alfredodev.cotizador_backend.mapper.CotizacionMapper;
import com.alfredodev.cotizador_backend.mapper.ItemCotizacionMapper;
import com.alfredodev.cotizador_backend.repository.CotizacionRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.List;

@Service
@RequiredArgsConstructor
public class CotizacionService {

    // Alícuota fija: el proyecto solo cotiza en Perú, sin multi-moneda ni tasas configurables (spec §2/§9).
    private static final BigDecimal TASA_IGV = new BigDecimal("0.18");
    private static final int ESCALA_DINERO = 2;

    private final CotizacionRepository repository;
    private final ClienteService clienteService;
    private final PlanSoporteService planSoporteService;
    private final RolTarifaService rolTarifaService;
    private final CotizacionNumeroGenerator numeroGenerator;

    @Transactional(readOnly = true)
    public Page<CotizacionResponse> listar(Pageable pageable) {
        return repository.findAll(pageable).map(this::toResponseConCalculos);
    }

    @Transactional(readOnly = true)
    public CotizacionResponse obtener(Long id) {
        return toResponseConCalculos(obtenerEntity(id));
    }

    // Expuesto para que PagoService cargue la cotización padre al registrar/quitar un pago.
    @Transactional(readOnly = true)
    public Cotizacion obtenerEntity(Long id) {
        return repository.findById(id)
                .orElseThrow(() -> new RecursoNoEncontradoException("Cotizacion %d no encontrada".formatted(id)));
    }

    @Transactional
    public CotizacionResponse crear(CotizacionRequest request) {
        Cliente cliente = clienteService.obtenerEntity(request.clienteId());
        PlanSoporte planSoporte = resolverPlanSoporte(request.planSoporteId());

        Cotizacion cotizacion = CotizacionMapper.toEntity(request, numeroGenerator.generarSiguiente(), cliente, planSoporte);
        agregarItems(cotizacion, request.items());

        return toResponseConCalculos(repository.save(cotizacion));
    }

    @Transactional
    public CotizacionResponse actualizar(Long id, CotizacionRequest request) {
        Cotizacion cotizacion = obtenerEntity(id);
        Cliente cliente = clienteService.obtenerEntity(request.clienteId());
        PlanSoporte planSoporte = resolverPlanSoporte(request.planSoporteId());

        CotizacionMapper.actualizarEntity(cotizacion, request, cliente, planSoporte);

        // orphanRemoval=true en Cotizacion.items: limpiar y re-agregar borra en BD los ítems que ya
        // no vienen en el request, sin tener que diffear manualmente cuál cambió.
        cotizacion.getItems().clear();
        agregarItems(cotizacion, request.items());

        return toResponseConCalculos(repository.save(cotizacion));
    }

    @Transactional
    public void eliminar(Long id) {
        repository.delete(obtenerEntity(id));
    }

    private PlanSoporte resolverPlanSoporte(Long planSoporteId) {
        return planSoporteId == null ? null : planSoporteService.obtenerEntity(planSoporteId);
    }

    private void agregarItems(Cotizacion cotizacion, List<ItemCotizacionRequest> items) {
        for (ItemCotizacionRequest itemRequest : items) {
            RolTarifa rolTarifa = itemRequest.rolTarifaId() == null
                    ? null
                    : rolTarifaService.obtenerEntity(itemRequest.rolTarifaId());
            ItemCotizacion item = ItemCotizacionMapper.toEntity(itemRequest, rolTarifa);
            cotizacion.addItem(item);
        }
    }

    private CotizacionResponse toResponseConCalculos(Cotizacion cotizacion) {
        BigDecimal subtotal = calcularSubtotal(cotizacion);
        BigDecimal igv = calcularIgv(subtotal, cotizacion.getIncluyeIGV());
        BigDecimal total = subtotal.add(igv);
        BigDecimal montoPagado = calcularMontoPagado(cotizacion);
        BigDecimal saldoPendiente = total.subtract(montoPagado);

        return CotizacionMapper.toResponse(cotizacion, subtotal, igv, total, montoPagado, saldoPendiente);
    }

    private BigDecimal calcularSubtotal(Cotizacion cotizacion) {
        return cotizacion.getItems().stream()
                .map(ItemCotizacion::getPrecioFinal)
                .reduce(BigDecimal.ZERO, BigDecimal::add)
                .setScale(ESCALA_DINERO, RoundingMode.HALF_UP);
    }

    private BigDecimal calcularIgv(BigDecimal subtotal, boolean incluyeIGV) {
        if (!incluyeIGV) {
            return BigDecimal.ZERO.setScale(ESCALA_DINERO, RoundingMode.HALF_UP);
        }
        return subtotal.multiply(TASA_IGV).setScale(ESCALA_DINERO, RoundingMode.HALF_UP);
    }

    private BigDecimal calcularMontoPagado(Cotizacion cotizacion) {
        return cotizacion.getPagos().stream()
                .map(Pago::getMonto)
                .reduce(BigDecimal.ZERO, BigDecimal::add)
                .setScale(ESCALA_DINERO, RoundingMode.HALF_UP);
    }
}
