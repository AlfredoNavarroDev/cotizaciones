-- Cotizador — esquema de referencia (PostgreSQL)
--
-- Este archivo NO se ejecuta automaticamente. El backend usa Hibernate ddl-auto
-- (application.yml, perfil dev) para crear/actualizar el esquema en local.
-- Este .sql es solo documentacion: refleja las tablas que Hibernate genera a
-- partir de las entities (com.alfredodev.cotizador_backend.entity.*), para
-- tener claro que se esta creando y como nota si en algun momento se sube
-- a una base de datos en la nube (ej. correr esto a mano via psql en vez
-- de dejar que ddl-auto genere el esquema en produccion).
--
-- Convencion de nombres: Hibernate 6 traduce camelCase -> snake_case por
-- default (nombreRazonSocial -> nombre_razon_social), y el nombre de clase
-- de la entity -> nombre de tabla en snake_case.

-- ============================================================
-- configuracion_emisor — fila unica (id fijo = 1), datos del emisor
-- ============================================================
CREATE TABLE configuracion_emisor (
    id                   BIGINT PRIMARY KEY,
    nombre_razon_social  VARCHAR(255) NOT NULL,
    ruc_dni              VARCHAR(255) NOT NULL,
    telefono             VARCHAR(255) NOT NULL,
    email                VARCHAR(255) NOT NULL,
    direccion            VARCHAR(255)
);

-- ============================================================
-- cliente
-- ============================================================
CREATE TABLE cliente (
    id       BIGSERIAL PRIMARY KEY,
    nombre   VARCHAR(255) NOT NULL,
    empresa  VARCHAR(255),
    ruc_dni  VARCHAR(255) NOT NULL,
    telefono VARCHAR(255),
    email    VARCHAR(255),
    CONSTRAINT uk_cliente_ruc_dni UNIQUE (ruc_dni)
);

-- ============================================================
-- rol_tarifa — tarifario editable, soft-delete via "activo"
-- ============================================================
CREATE TABLE rol_tarifa (
    id             BIGSERIAL PRIMARY KEY,
    nombre         VARCHAR(255) NOT NULL,
    tarifa_minima  NUMERIC(12,2) NOT NULL,
    tarifa_maxima  NUMERIC(12,2) NOT NULL,
    activo         BOOLEAN NOT NULL DEFAULT TRUE
);

-- ============================================================
-- plan_soporte — soft-delete via "activo", mismo patron que rol_tarifa
-- ============================================================
CREATE TABLE plan_soporte (
    id              BIGSERIAL PRIMARY KEY,
    nombre          VARCHAR(255) NOT NULL,
    descripcion     VARCHAR(1000),
    precio_mensual  NUMERIC(12,2) NOT NULL,
    activo          BOOLEAN NOT NULL DEFAULT TRUE
);

-- ============================================================
-- cotizacion_numero_contador — fila unica (id = 1), genera COT-AAAA-NNN
-- con NNN correlativo GLOBAL (no reinicia por año). Se lee/actualiza con
-- lock pesimista (SELECT ... FOR UPDATE) para evitar que dos cotizaciones
-- creadas casi al mismo tiempo terminen con el mismo numero.
-- ============================================================
CREATE TABLE cotizacion_numero_contador (
    id             BIGINT PRIMARY KEY,
    ultimo_numero  BIGINT NOT NULL
);

-- ============================================================
-- cotizacion
-- ============================================================
CREATE TABLE cotizacion (
    id                              BIGSERIAL PRIMARY KEY,
    numero                          VARCHAR(255) NOT NULL,
    fecha                           DATE NOT NULL,
    cliente_id                      BIGINT NOT NULL REFERENCES cliente(id),
    validez_dias                    INTEGER NOT NULL,
    moneda                          VARCHAR(10) NOT NULL DEFAULT 'PEN',
    incluye_igv                     BOOLEAN NOT NULL,
    estado                          VARCHAR(20) NOT NULL DEFAULT 'BORRADOR',
        -- valores validos: BORRADOR | ENVIADA | ACEPTADA | RECHAZADA
    plan_soporte_id                 BIGINT REFERENCES plan_soporte(id),
    tarifa_soporte_fuera_garantia   NUMERIC(12,2),
    notas_costos_no_incluidos       TEXT,
    CONSTRAINT uk_cotizacion_numero UNIQUE (numero)
);

-- ============================================================
-- item_cotizacion — fase/modulo de una cotizacion
-- ============================================================
CREATE TABLE item_cotizacion (
    id             BIGSERIAL PRIMARY KEY,
    cotizacion_id  BIGINT NOT NULL REFERENCES cotizacion(id) ON DELETE CASCADE,
    nombre_fase    VARCHAR(255) NOT NULL,
    plazo_semanas  INTEGER NOT NULL,
    rol_tarifa_id  BIGINT REFERENCES rol_tarifa(id),
    precio_final   NUMERIC(12,2) NOT NULL
);

-- descripcionTecnica: @ElementCollection (lista de bullets por item)
CREATE TABLE item_cotizacion_bullets (
    item_cotizacion_id  BIGINT NOT NULL REFERENCES item_cotizacion(id) ON DELETE CASCADE,
    orden               INTEGER NOT NULL,
    bullet              TEXT,
    PRIMARY KEY (item_cotizacion_id, orden)
);

-- ============================================================
-- pago — pagos registrados contra una cotizacion
-- ============================================================
CREATE TABLE pago (
    id             BIGSERIAL PRIMARY KEY,
    cotizacion_id  BIGINT NOT NULL REFERENCES cotizacion(id) ON DELETE CASCADE,
    monto          NUMERIC(12,2) NOT NULL,
    fecha          DATE NOT NULL,
    metodo         VARCHAR(20) NOT NULL,
        -- valores validos: TRANSFERENCIA | YAPE | OTRO
    nota           VARCHAR(1000)
);

-- ============================================================
-- Campos calculados (subtotal, igv, total, montoPagado, saldoPendiente)
-- NO tienen columna — se calculan en CotizacionCalculoService a partir
-- de item_cotizacion.precio_final y pago.monto. Ver spec §4 y §6.
-- ============================================================
