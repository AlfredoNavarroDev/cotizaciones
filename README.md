# Cotizador

Sistema personal (un solo usuario) para generar cotizaciones de proyectos de desarrollo de software/TI: clientes, tarifario editable, armado de cotizaciones por fases, pagos, y generación de PDF en dos versiones (corta y detallada).

Uso 100% local. Sin autenticación, sin despliegue a internet.

## Qué hace

- CRUD de clientes, tarifario (roles/tarifas) y planes de soporte post-venta.
- Arma cotizaciones por fases/módulos con desglose técnico, calcula subtotal, IGV y total.
- Genera el PDF de la cotización en dos versiones: corta (resumen ejecutivo) y detallada (alcance técnico, costos y tiempos por ítem, garantía y soporte).
- Registra pagos (adelanto, saldo, otros) por cotización y calcula el saldo pendiente.
- Lista el historial de cotizaciones con su estado (Borrador / Enviada / Aceptada / Rechazada).
- Permite editar los datos del emisor (los tuyos) que aparecen en los PDFs — ver [Mis datos](#mis-datos-emisor) abajo.

## Parte técnica

| Capa       | Stack                                                              |
|------------|---------------------------------------------------------------------|
| Backend    | Spring Boot 4.1.0, Java 21, Maven, Spring Data JPA, Validation      |
| Base de datos | PostgreSQL                                                       |
| Frontend   | Next.js (App Router), TypeScript, Tailwind CSS                     |
| PDF        | `@react-pdf/renderer` (generado en el frontend, sin backend HTML)   |
| Orquestación | Docker Compose (postgres + backend + frontend)                    |

Arquitectura: el backend es API REST pura, dueño de la base de datos y de toda la lógica de cálculo (subtotal/IGV/total, saldo pendiente, numeración de cotizaciones). El frontend consume la API y arma los PDFs a partir del JSON que devuelve `GET /api/cotizaciones/{id}` (ya con los campos calculados), sin duplicar lógica de negocio.

```
cotizaciones/
├── docker-compose.yml       ← postgres + backend + frontend
├── cotizador-backend/       ← API REST (Spring Boot)
└── frontend/                ← UI + generación de PDF (Next.js)
```

## Cómo se usa

### Requisitos

- Docker y Docker Compose.
- Para desarrollo sin Docker: Java 21 + Maven, y Node.js 20+.

### Levantar todo con Docker

```bash
docker compose up
```

- Backend: `http://localhost:8080`
- Frontend: `http://localhost:3000`
- Postgres: `localhost:5432`

### Desarrollo local (sin Docker)

Backend:

```bash
cd cotizador-backend
./mvnw spring-boot:run
```

Frontend:

```bash
cd frontend
npm install
npm run dev
```

## Mis datos (emisor)

Los datos que aparecen como emisor en los PDFs (nombre/razón social, RUC/DNI, teléfono, email, dirección) **no están fijos en la plantilla** — se editan desde la app, en el apartado **"Mis datos"** del frontend (`/configuracion` o similar dentro del menú de Configuración).

- Se guardan en el backend como una fila única (`ConfiguracionEmisor`), vía `GET/PUT /api/configuracion-emisor`.
- Cualquier cambio se refleja de inmediato en los próximos PDFs generados (versión corta y detallada), sin tocar código.
- Valor inicial precargado: Alfredo Fabrizzio Navarro Tejeda, RUC 10706313031.
