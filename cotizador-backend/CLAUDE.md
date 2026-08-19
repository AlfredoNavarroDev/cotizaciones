# Backend — convenciones específicas (cotizador-backend/)

Carga solo al tocar este directorio. Reglas generales del proyecto: ver `../CLAUDE.md`.

- Paquete base: `com.alfredodev.cotizador_backend`.
- Patrón de campos calculados no persistidos aplicado a `Cotizacion`: `subtotal`, `igv`, `total`, `montoPagado`, `saldoPendiente` se calculan en `CotizacionService` a partir de `items`/`pagos` ya cargados — nunca son columnas. Ver spec sección 4 y 6.
- `incluyeIGV` en `Cotizacion` es `Boolean` (no `boolean` primitivo) con `@NotNull` — no tiene default, se fija explícito al crear.
- Al agregar una entity: invocar `spring-boot-pro` (skill global en `~/.claude/skills/spring-boot-pro/`, no específica de este proyecto — aplica SOLID y convenciones generales de Spring Boot). No improvisar estructura genérica sin revisarla primero. Seguir el checklist: entity → repository → dto → mapper → service → controller. Ningún cálculo de negocio (subtotal/igv/total/saldoPendiente) vive en la entity ni en el mapper — siempre en el service.
- Dinero siempre en `BigDecimal`, nunca `double`/`float`.
- Toda lógica de cálculo (montos, saldo pendiente) necesita test JUnit — es el código de más riesgo del proyecto (montos mal calculados = cotización real mal calculada). Ver spec sección 8 para el alcance de testing (backend: JUnit en cálculos; frontend: sin suite formal, verificación manual contra las plantillas del skill `cotizador-software`).
- No agregar Flyway/Liquibase u otra herramienta de migraciones sin que el usuario lo pida — hoy el proyecto usa `ddl-auto` de Hibernate en desarrollo.
- Tests que levantan el contexto de Spring (`@SpringBootTest`) usan Testcontainers (`PostgreSQLContainer` + `@ServiceConnection`, ver `CotizadorBackendApplicationTests`) — nunca el Postgres local de desarrollo (puerto 5433). Requiere Docker corriendo para `mvn test`. Testcontainers 2.x: los artifacts de `org.testcontainers` van prefijados (`testcontainers-postgresql`, `testcontainers-junit-jupiter`), no `postgresql`/`junit-jupiter` a secas.
