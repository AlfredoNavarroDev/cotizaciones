package com.alfredodev.cotizador_backend.config;

import com.alfredodev.cotizador_backend.entity.PlanSoporte;
import com.alfredodev.cotizador_backend.entity.RolTarifa;
import com.alfredodev.cotizador_backend.repository.PlanSoporteRepository;
import com.alfredodev.cotizador_backend.repository.RolTarifaRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.util.List;

// Precarga el tarifario del skill cotizador-software (references/tarifario.md) en el primer
// arranque. Solo inserta si las tablas están vacías: después de este punto el tarifario se
// edita desde la app (spec §4, "editable, no hardcodeado"), este seed no lo vuelve a tocar.
@Component
@RequiredArgsConstructor
public class TarifarioSeeder implements ApplicationRunner {

    private final RolTarifaRepository rolTarifaRepository;
    private final PlanSoporteRepository planSoporteRepository;

    @Override
    public void run(ApplicationArguments args) {
        if (rolTarifaRepository.count() == 0) {
            rolTarifaRepository.saveAll(List.of(
                    rol("Desarrollo Backend", "35", "45"),
                    rol("Desarrollo Frontend", "30", "40"),
                    rol("Full Stack", "40", "50"),
                    rol("Diseño UI/UX", "30", "40"),
                    rol("Base de datos / modelado", "35", "45"),
                    rol("Testing / QA", "25", "35"),
                    rol("Gestión de proyecto", "40", "50"),
                    rol("Despliegue / DevOps", "40", "55")
            ));
        }

        if (planSoporteRepository.count() == 0) {
            planSoporteRepository.saveAll(List.of(
                    plan("Básico", "Hasta 3h de soporte/mantenimiento al mes", "150"),
                    plan("Estándar", "Hasta 6h de soporte/mantenimiento al mes", "280"),
                    // tarifario.md no fija precio para Premium ("a cotizar según alcance");
                    // 500 es un piso de referencia editable desde la app, no un precio cerrado.
                    plan("Premium", "Horas extendidas / SLA prioritario (precio de referencia, ajustar según alcance)", "500")
            ));
        }
    }

    private RolTarifa rol(String nombre, String min, String max) {
        return RolTarifa.builder()
                .nombre(nombre)
                .tarifaMinima(new BigDecimal(min))
                .tarifaMaxima(new BigDecimal(max))
                .activo(true)
                .build();
    }

    private PlanSoporte plan(String nombre, String descripcion, String precioMensual) {
        return PlanSoporte.builder()
                .nombre(nombre)
                .descripcion(descripcion)
                .precioMensual(new BigDecimal(precioMensual))
                .activo(true)
                .build();
    }
}
