# Cotizador de proyectos de software — Diseño

## 1. Resumen

Sistema personal (un solo usuario, Alfredo) para generar cotizaciones de proyectos de desarrollo de software/TI, con backend Spring Boot y frontend Next.js. Reemplaza el flujo manual del skill `cotizador-software` (que genera texto de cotización en el chat) por una aplicación real con persistencia, tarifario editable, y generación de PDF en dos versiones (corta y detallada), tal como definen las plantillas del skill.

Uso 100% local — sin autenticación, sin despliegue a internet.

## 2. Alcance

**Incluye:**
- CRUD de clientes, tarifario (roles/tarifas), planes de soporte post-venta.
- Armado de cotizaciones por fases/módulos con desglose técnico, cálculo de subtotal/IGV/total.
- Generación de PDF en dos versiones (corta y detallada) por cotización, igual que las plantillas del skill.
- Registro de pagos (adelanto, saldo, otros) asociados a una cotización, con saldo pendiente calculado.
- Historial/listado de cotizaciones y su estado (Borrador / Enviada / Aceptada / Rechazada).

**No incluye (fuera de alcance por ahora):**
- Autenticación / multi-usuario / multi-tenant.
- Envío de PDFs por correo.
- Despliegue a internet (aunque el diseño no lo impide a futuro).
- Múltiples monedas (solo PEN).

## 3. Arquitectura

- **Backend (Spring Boot, Java 21, Maven)** — API REST pura. Dueño de la base de datos y de toda la lógica de negocio (cálculo de subtotal/IGV/total, saldo pendiente, numeración de cotizaciones). No genera HTML ni PDF.
- **Frontend (Next.js, TypeScript, App Router, Tailwind)** — UI para gestionar clientes, tarifario y cotizaciones. Genera los PDFs client-side/server-side con `@react-pdf/renderer`, a partir de los datos que trae del backend por REST.
- **Base de datos**: PostgreSQL, orquestada junto con backend y frontend vía `docker-compose.yml` en la raíz del proyecto (`docker compose up` levanta los 3 servicios).
- **Comunicación**: Next.js consume el backend por `fetch` a `http://localhost:8080/api/...`. Sin autenticación.

### Dependencias del backend (ya generadas con Spring Initializr)

Confirmado en `cotizador-backend/pom.xml`: Spring Boot 4.1.0, Java 21, `spring-boot-starter-webmvc`, `spring-boot-starter-data-jpa`, `spring-boot-starter-validation`, driver `postgresql`, `lombok`, `spring-boot-devtools`.

> Nota de limpieza pendiente: el zip de Initializr se extrajo anidado (`cotizador-backend/cotizador-backend/...`). Antes de continuar con el código, hay que subir el contenido un nivel para que quede `cotizaciones/cotizador-backend/pom.xml` directamente.

## 4. Modelo de datos

- **ConfiguracionEmisor** (fila única, editable desde la app) — nombre/razón social, RUC/DNI, teléfono, email, dirección (opcional). Reemplaza los datos fijos del emisor en la plantilla del skill; se edita desde un apartado de "Mis datos" / Configuración y se inyecta en ambos PDFs.
- **Cliente** — nombre, empresa, RUC/DNI, contacto (teléfono/email).
- **RolTarifa** (tarifario editable, precargado desde `tarifario.md`) — nombre del rol, tarifa mínima, tarifa máxima, activo.
- **PlanSoporte** (precargado desde `tarifario.md`) — nombre (Básico/Estándar/Premium), descripción, precio mensual.
- **Cotizacion** — número autogenerado (`COT-AAAA-NNN`), fecha, cliente (FK), validez en días, moneda (fija en PEN), incluyeIGV (bool, sin default — se debe fijar explícitamente al crear), estado (Borrador/Enviada/Aceptada/Rechazada), plan de soporte asociado (FK, opcional), tarifa exacta de soporte fuera de garantía (S/ por hora), notas de costos no incluidos.
- **ItemCotizacion** — pertenece a una Cotización: nombre de fase/módulo, descripción técnica (lista de bullets), plazo en semanas, rol de tarifario asociado (FK, opcional, para sugerir precio), precio final de la fase.
- **Pago** — pertenece a una Cotización: monto, fecha, método (Transferencia/Yape/Otro), nota opcional.

**Campos calculados (no se persisten)**, calculados en el backend y expuestos en el JSON de la cotización:
- `subtotal` = suma de `precio` de los ítems.
- `igv` = `subtotal * 0.18` si `incluyeIGV`, si no `0`.
- `total` = `subtotal + igv`.
- `montoPagado` = suma de `monto` de los pagos.
- `saldoPendiente` = `total - montoPagado`.

### 4.1 Detalle de campos por entidad

- **ConfiguracionEmisor** — fila única, `id` fijo `1L` (singleton por convención de service, sin constraint extra en DB). `nombreRazonSocial`, `rucDni`, `telefono` (`String`, `@NotBlank`), `email` (`String`, `@NotBlank`), `direccion` (`String`, opcional).
- **Cliente** — `nombre` (`@NotBlank`), `empresa` (opcional), `rucDni` (`@NotBlank`, **unique**), `telefono`, `email`.
- **RolTarifa** — `nombre` (`@NotBlank`), `tarifaMinima`/`tarifaMaxima` (`BigDecimal`, `@NotNull`), `activo` (`Boolean`, default `true`, soft-delete — nunca se borra físico porque `ItemCotizacion` puede referenciarlo).
- **PlanSoporte** — `nombre` (`@NotBlank`), `descripcion`, `precioMensual` (`BigDecimal`, `@NotNull`), `activo` (`Boolean`, default `true`, mismo patrón de soft-delete que `RolTarifa`).
- **Cotizacion** — `numero` (`String`, **unique**, autogenerado `COT-AAAA-NNN`; `NNN` es **correlativo global**, no reinicia por año — el año en el número refleja el año de creación pero el contador nunca vuelve a 001). `fecha` (`LocalDate`, asignada al crear). `cliente` (FK `@NotNull`). `validezDias` (`Integer`, `@NotNull`). `moneda` fija `"PEN"`, no editable vía API. `incluyeIGV` (`Boolean`, `@NotNull`, **sin default** — se fija explícito al crear). `estado` (enum `BORRADOR`/`ENVIADA`/`ACEPTADA`/`RECHAZADA`, **default `BORRADOR`** al crear). `planSoporte` (FK opcional). `tarifaSoporteFueraGarantia` (`BigDecimal`, opcional). `notasCostosNoIncluidos` (`String`, opcional).
- **ItemCotizacion** (pertenece a `Cotizacion`) — `cotizacion` (FK `@NotNull`). `nombreFase` (`@NotBlank`). `descripcionTecnica` (`List<String>` vía `@ElementCollection`, bullets). `plazoSemanas` (`Integer`, `@NotNull`). `rolTarifa` (FK opcional; si el rol referenciado se inactiva, el item **conserva la referencia sin cambios** — el precio final ya está fijado y no depende del estado del rol). `precioFinal` (`BigDecimal`, `@NotNull`).
- **Pago** (pertenece a `Cotizacion`) — `cotizacion` (FK `@NotNull`). `monto` (`BigDecimal`, `@NotNull`). `fecha` (`LocalDate`, `@NotNull`). `metodo` (**enum** `TRANSFERENCIA`/`YAPE`/`OTRO`). `nota` (opcional).

## 5. API REST (backend)

CRUD estándar sobre cada entidad principal, más un endpoint agregado para el detalle completo de una cotización:

- `GET/PUT /api/configuracion-emisor` (fila única, sin DELETE)
- `GET/POST /api/clientes`, `GET/PUT/DELETE /api/clientes/{id}`
- `GET/POST/PUT /api/tarifario` (roles), `GET/POST/PUT /api/planes-soporte`
- `GET/POST /api/cotizaciones`, `GET/PUT/DELETE /api/cotizaciones/{id}` — incluye ítems anidados en el body de creación/edición.
- `POST /api/cotizaciones/{id}/pagos`, `DELETE /api/pagos/{id}`
- `GET /api/cotizaciones/{id}` devuelve el objeto completo con `subtotal`, `igv`, `total`, `montoPagado`, `saldoPendiente` ya calculados, listo para que el frontend arme el PDF sin duplicar lógica de cálculo.

## 6. Generación de PDF (frontend)

- Librería: `@react-pdf/renderer` (renderiza PDF con componentes React — `Document`, `Page`, `View`, `Text` — sin navegador headless).
- Dos componentes de documento, reflejando las plantillas del skill:
  - **Versión corta**: resumen del proyecto, qué incluye (en lenguaje de beneficio), inversión total y tiempo estimado, forma de pago, nota de costos no incluidos.
  - **Versión detallada**: datos del emisor/cliente, alcance técnico por fase (con bullets), tabla de costos y tiempos por ítem, infraestructura de terceros (si aplica), garantía y soporte post-venta (incluye la tarifa exacta de soporte y el plan de soporte elegido), condiciones de pago, firma.
- Ambos PDFs se generan a partir del mismo JSON de `GET /api/cotizaciones/{id}` — no hay lógica de cálculo duplicada en el frontend, solo formato/layout.
- Reglas heredadas del skill que aplican igual aquí: nunca mostrar el IGV en 0 si no aplica (se omite la línea), la tarifa de soporte por hora siempre es un monto exacto (no rango). Los datos del emisor ya NO van fijos en la plantilla: se leen de `ConfiguracionEmisor` (editable desde "Mis datos" en el frontend), precargados con los datos actuales (Alfredo Fabrizzio Navarro Tejeda, RUC 10706313031) como valor inicial.

## 7. Estructura de proyecto

```
cotizaciones/
├── docker-compose.yml          ← postgres + backend + frontend
├── cotizador-backend/          ← Spring Boot (ya generado con Initializr)
│   └── Dockerfile              ← build multi-stage (Maven → jar)
└── frontend/                   ← Next.js (por crear)
    └── Dockerfile              ← build multi-stage (npm → next build)
```

`docker-compose.yml` define 3 servicios: `postgres` (imagen oficial, volumen para persistencia, puerto 5432), `backend` (build desde `cotizador-backend/`, puerto 8080, variables de entorno de conexión a `postgres`), `frontend` (build desde `frontend/`, puerto 3000, `NEXT_PUBLIC_API_URL=http://localhost:8080`).

## 8. Testing

Alcance acotado por tratarse de un proyecto personal:
- Backend: tests unitarios (JUnit) para el cálculo de subtotal/IGV/total/saldo pendiente — es la lógica con más riesgo de error silencioso (montos mal calculados en una cotización real).
- Frontend: sin suite formal por ahora — verificación manual de que los dos PDFs generados coinciden con las plantillas del skill.

## 9. Decisiones registradas (para no re-preguntar)

- Uso personal, sin login, sin despliegue a internet.
- Rubro: desarrollo de software/TI (mismo dominio que el tarifario del skill).
- Tarifario editable desde la app, no hardcodeado.
- Ítems de cotización estructurados por fase con desglose técnico (no líneas libres tipo factura).
- PDF se genera en el frontend (Next.js + `@react-pdf/renderer`), no en el backend.
- Postgres vía Docker, orquestado junto con backend y frontend en un solo `docker-compose.yml`.
- Se agrega seguimiento de pagos (entidad `Pago`) además de solo mostrar condiciones de pago en el PDF.
- Datos del emisor editables desde la app (`ConfiguracionEmisor`, fila única), no hardcodeados en la plantilla del PDF.
- `Cotizacion.numero` (`COT-AAAA-NNN`): `NNN` correlativo global, no reinicia por año.
- `RolTarifa` y `PlanSoporte` usan soft-delete (`activo`), nunca DELETE físico — protege el historial de cotizaciones que ya los referencian.
- Frontend inicializado con `create-next-app` (TypeScript, App Router, Tailwind, `src/`) y `@react-pdf/renderer` instalado.
