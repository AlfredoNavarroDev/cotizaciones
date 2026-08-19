# Cotizador — instrucciones de proyecto

Sistema personal (un solo usuario, Alfredo) de cotizaciones de proyectos de software/TI. Backend Spring Boot + frontend Next.js + PostgreSQL, 100% local, sin auth, sin despliegue.

- Diseño completo: `docs/superpowers/specs/2026-08-16-cotizador-design.md` — leer antes de tocar modelo de datos, API o reglas de cálculo. Si una decisión de código contradice la spec, actualizar la spec en el mismo cambio (no dejar que diverjan).
- Overview + cómo correr el proyecto: `README.md`.

## Skills a usar

- **Cualquier trabajo en `cotizador-backend/`** → ver `cotizador-backend/CLAUDE.md`.
- **Trabajo de frontend** (una vez exista `frontend/`) → `nextjs-performance` y `vercel-react-best-practices` para patrones de Next.js/React; `database-schema-designer` solo si hay que revisar el modelo de datos antes de migrarlo.
- **Antes de cualquier feature nueva o cambio de diseño** → `superpowers:brainstorming` primero (explorar intención/requisitos), luego `superpowers:writing-plans` si el alcance es multi-paso, y `superpowers:test-driven-development` al implementar.
- **Ante un bug o comportamiento inesperado** → `superpowers:systematic-debugging` antes de proponer un fix.
- **Al terminar una rama/feature** → `superpowers:finishing-a-development-branch`.
- **Docker/orquestación** → `docker-compose-orchestration` y `multi-stage-dockerfile` al escribir los `Dockerfile` de cada servicio.
- **Antes de dar por terminada una tarea de código** → `superpowers:verification-before-completion`.

## Procedimiento de trabajo

1. Revisar la spec (`docs/.../2026-08-16-cotizador-design.md`) antes de agregar entidades o endpoints — el modelo de datos y la API ya están definidos ahí; no inventar estructura nueva sin actualizarla primero.
2. PDF se genera en el frontend (`@react-pdf/renderer`), nunca en el backend — el backend solo expone JSON con los campos ya calculados.
3. Los datos del emisor (nombre, RUC/DNI, contacto) son editables desde la app (`ConfiguracionEmisor`, fila única) — no hardcodear esos datos en plantillas de PDF ni en el backend.
4. No agregar autenticación, multi-tenant, envío de correo, multi-moneda ni despliegue a internet — está explícitamente fuera de alcance (spec sección 2).
5. Backend: ver checklist específico en `cotizador-backend/CLAUDE.md`.

## Git

- No hay convención de commits establecida aún en el historial (repo recién iniciado) — usar Conventional Commits (`feat:`, `fix:`, `refactor:`, `test:`, `docs:`) al commitear.
- Confirmar con el usuario antes de crear commits, hacer push, o cualquier operación destructiva de git.
- **Prohibido hacer commits o crear ramas.** Nunca ejecutar `git commit`, `git checkout -b`, `git branch`, etc. Cuando corresponda commitear, dar el mensaje de commit listo (formato Conventional Commits) para que el usuario lo ejecute él mismo — sin coautoría ni firma propia (no `Co-Authored-By`).
- Leer este CLAUDE.md siempre al inicio, antes de tocar código.
