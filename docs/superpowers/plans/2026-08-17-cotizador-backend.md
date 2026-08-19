# Cotizador Backend — Modelo de datos + API REST — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Construir el backend completo del Cotizador (Spring Boot 4.1.0 / Java 21): las 7 entidades del modelo de datos, su capa REST completa (entity → repository → dto → mapper → service → controller), la lógica de cálculo de montos, y la generación segura del número de cotización — dejando el backend listo para que el frontend consuma `http://localhost:8080/api/...`.

**Architecture:** Spring Boot en capas (`entity/repository/dto/mapper/service/controller/exception/config`), siguiendo `spring-boot-pro`. PostgreSQL vía Docker (`docker-compose.yml`, solo servicio `postgres` en este plan). Sin autenticación, sin Flyway/Liquibase — `ddl-auto=update` en desarrollo. Los campos calculados (`subtotal`, `igv`, `total`, `montoPagado`, `saldoPendiente`) viven solo en `CotizacionCalculoService`, nunca en la entity.

**Tech Stack:** Java 21, Spring Boot 4.1.0 (`spring-boot-starter-webmvc`, `spring-boot-starter-data-jpa`, `spring-boot-starter-validation`), Lombok, PostgreSQL, JUnit 5 + AssertJ (vía `spring-boot-starter-test`).

**Spec:** `docs/superpowers/specs/2026-08-16-cotizador-design.md` (secciones 3, 4, 4.1, 5, 9).

## Global Constraints

- Dinero siempre `BigDecimal`, nunca `double`/`float` (CLAUDE.md).
- Ningún cálculo de negocio (subtotal/igv/total/saldoPendiente) vive en la entity ni en el mapper — siempre en `CotizacionCalculoService` (CLAUDE.md, spec §4).
- `incluyeIGV` es `Boolean` (no `boolean`) con validación explícita — sin default silencioso (spec §4.1).
- No agregar Flyway/Liquibase — `ddl-auto` de Hibernate en desarrollo (CLAUDE.md).
- No agregar autenticación, Swagger, Actuator, rate limiting, ni idempotency keys — fuera de alcance para este proyecto personal de un solo usuario (spec §2, `spring-boot-pro` §17 YAGNI).
- Testing: solo `CotizacionCalculoService` lleva tests JUnit obligatorios (spec §8) — el resto de capas no lleva suite automatizada en este plan.
- **Nunca ejecutar `git commit`, `git add`, ni crear ramas** (CLAUDE.md). Cada tarea termina con un mensaje de commit en formato Conventional Commits listo para que el usuario lo ejecute — no lo ejecutes tú.
- RolTarifa y PlanSoporte usan soft-delete (`activo`) — nunca DELETE físico (spec §9 decisiones).
- `Cotizacion.numero` (`COT-AAAA-NNN`): correlativo global vía tabla contador + lock pesimista, nunca `MAX(numero)+1` en memoria (`spring-boot-pro` §9).

---

### Task 1: Setup — datasource, docker-compose (postgres), CORS

**Files:**
- Modify: `cotizador-backend/pom.xml` (ya corregido: dependencia de test única `spring-boot-starter-test`, no las 3 inexistentes `*-jpa-test`/`*-validation-test`/`*-webmvc-test`)
- Create: `cotizador-backend/src/main/resources/application.yml`
- Create: `docker-compose.yml` (raíz del proyecto)
- Create: `cotizador-backend/src/main/java/com/alfredodev/cotizador_backend/config/CorsConfig.java`

**Interfaces:**
- Produces: datasource Postgres en `localhost:5432/cotizador` (user/pass `cotizador`), CORS abierto para `http://localhost:3000` en `/api/**`.

- [ ] **Step 1: Confirmar que `pom.xml` ya tiene la dependencia de test corregida**

Ya aplicado directamente en esta sesión — verificar que el bloque de test en `cotizador-backend/pom.xml` sea exactamente:

```xml
<dependency>
    <groupId>org.springframework.boot</groupId>
    <artifactId>spring-boot-starter-test</artifactId>
    <scope>test</scope>
</dependency>
```

(Las 3 dependencias anteriores — `spring-boot-starter-data-jpa-test`, `spring-boot-starter-validation-test`, `spring-boot-starter-webmvc-test` — no son artifacts reales de Maven Central; `mvn test` fallaba al resolverlas.)

- [ ] **Step 2: Crear `application.yml`**

`cotizador-backend/src/main/resources/application.yml`:

```yaml
spring:
  application:
    name: cotizador-backend
  datasource:
    url: jdbc:postgresql://localhost:5432/cotizador
    username: cotizador
    password: cotizador
  jpa:
    hibernate:
      ddl-auto: update
    show-sql: true
    properties:
      hibernate:
        format_sql: true

server:
  port: 8080
```

- [ ] **Step 3: Crear `docker-compose.yml` (raíz, solo `postgres` por ahora)**

`docker-compose.yml`:

```yaml
services:
  postgres:
    image: postgres:16-alpine
    environment:
      POSTGRES_DB: cotizador
      POSTGRES_USER: cotizador
      POSTGRES_PASSWORD: cotizador
    ports:
      - "5432:5432"
    volumes:
      - cotizador_postgres_data:/var/lib/postgresql/data

volumes:
  cotizador_postgres_data:
```

Nota: los servicios `backend`/`frontend` con sus `Dockerfile` multi-stage son trabajo aparte (spec §7) — este plan solo necesita Postgres corriendo para desarrollo local.

- [ ] **Step 4: Crear `CorsConfig`**

`cotizador-backend/src/main/java/com/alfredodev/cotizador_backend/config/CorsConfig.java`:

```java
package com.alfredodev.cotizador_backend.config;

import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.CorsRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

@Configuration
public class CorsConfig implements WebMvcConfigurer {

    @Override
    public void addCorsMappings(CorsRegistry registry) {
        registry.addMapping("/api/**")
                .allowedOrigins("http://localhost:3000")
                .allowedMethods("GET", "POST", "PUT", "DELETE")
                .allowedHeaders("*");
    }
}
```

- [ ] **Step 5: Levantar Postgres y verificar que el proyecto compila**

Run: `docker compose up -d postgres`
Run: `cd cotizador-backend && ./mvnw -q compile`
Expected: `BUILD SUCCESS`, sin errores de resolución de dependencias.

- [ ] **Step 6: Mensaje de commit sugerido (el usuario lo ejecuta)**

```
chore: fix test deps, add datasource config, postgres compose and CORS

Co-Authored-By: (ninguno — sin coautoria por convencion del proyecto)
```

(Nota: no incluir trailer `Co-Authored-By` — el proyecto lo prohíbe explícitamente. Mensaje real a usar: `chore: fix test deps, add datasource config, postgres compose and CORS`)

---

### Task 2: Jerarquía de excepciones + manejador global

**Files:**
- Create: `cotizador-backend/src/main/java/com/alfredodev/cotizador_backend/exception/RecursoNoEncontradoException.java`
- Create: `cotizador-backend/src/main/java/com/alfredodev/cotizador_backend/exception/RecursoDuplicadoException.java`
- Create: `cotizador-backend/src/main/java/com/alfredodev/cotizador_backend/exception/ErrorResponse.java`
- Create: `cotizador-backend/src/main/java/com/alfredodev/cotizador_backend/exception/GlobalExceptionHandler.java`

**Interfaces:**
- Produces: `RecursoNoEncontradoException(String mensaje)` → 404, `RecursoDuplicadoException(String mensaje)` → 409. Todos los services posteriores lanzan estas dos.

- [ ] **Step 1: Crear las excepciones**

`exception/RecursoNoEncontradoException.java`:

```java
package com.alfredodev.cotizador_backend.exception;

public class RecursoNoEncontradoException extends RuntimeException {
    public RecursoNoEncontradoException(String mensaje) {
        super(mensaje);
    }
}
```

`exception/RecursoDuplicadoException.java`:

```java
package com.alfredodev.cotizador_backend.exception;

public class RecursoDuplicadoException extends RuntimeException {
    public RecursoDuplicadoException(String mensaje) {
        super(mensaje);
    }
}
```

- [ ] **Step 2: Crear el DTO de error**

`exception/ErrorResponse.java`:

```java
package com.alfredodev.cotizador_backend.exception;

import java.util.Map;

public record ErrorResponse(String mensaje, Map<String, String> errores) {
    public ErrorResponse(String mensaje) {
        this(mensaje, null);
    }
}
```

- [ ] **Step 3: Crear el manejador global**

`exception/GlobalExceptionHandler.java`:

```java
package com.alfredodev.cotizador_backend.exception;

import lombok.extern.slf4j.Slf4j;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.FieldError;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

import java.util.HashMap;
import java.util.Map;

@Slf4j
@RestControllerAdvice
public class GlobalExceptionHandler {

    @ExceptionHandler(RecursoNoEncontradoException.class)
    public ResponseEntity<ErrorResponse> handleNoEncontrado(RecursoNoEncontradoException ex) {
        return ResponseEntity.status(HttpStatus.NOT_FOUND).body(new ErrorResponse(ex.getMessage()));
    }

    @ExceptionHandler(RecursoDuplicadoException.class)
    public ResponseEntity<ErrorResponse> handleDuplicado(RecursoDuplicadoException ex) {
        return ResponseEntity.status(HttpStatus.CONFLICT).body(new ErrorResponse(ex.getMessage()));
    }

    // Constraint UNIQUE de la base de datos (ej. cliente.ruc_dni, cotizacion.numero) — es la defensa
    // real contra la carrera de check-then-act, no el pre-chequeo del service.
    @ExceptionHandler(DataIntegrityViolationException.class)
    public ResponseEntity<ErrorResponse> handleIntegridad(DataIntegrityViolationException ex) {
        return ResponseEntity.status(HttpStatus.CONFLICT)
                .body(new ErrorResponse("El recurso ya existe o viola una restricción de la base de datos"));
    }

    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<ErrorResponse> handleValidacion(MethodArgumentNotValidException ex) {
        Map<String, String> errores = new HashMap<>();
        for (FieldError error : ex.getBindingResult().getFieldErrors()) {
            errores.put(error.getField(), error.getDefaultMessage());
        }
        return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(new ErrorResponse("Datos inválidos", errores));
    }

    @ExceptionHandler(Exception.class)
    public ResponseEntity<ErrorResponse> handleGeneral(Exception ex) {
        // El detalle completo se loguea en el servidor; el cliente solo recibe un mensaje genérico.
        log.error("Error no controlado", ex);
        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(new ErrorResponse("Error interno del servidor"));
    }
}
```

- [ ] **Step 4: Compilar**

Run: `cd cotizador-backend && ./mvnw -q compile`
Expected: `BUILD SUCCESS`

- [ ] **Step 5: Mensaje de commit sugerido**

`feat: add global exception hierarchy and handler`

---

### Task 3: ConfiguracionEmisor (singleton, fila única)

**Files:**
- Create: `entity/ConfiguracionEmisor.java`
- Create: `repository/ConfiguracionEmisorRepository.java`
- Create: `dto/ConfiguracionEmisorRequest.java`, `dto/ConfiguracionEmisorResponse.java`
- Create: `mapper/ConfiguracionEmisorMapper.java`
- Create: `service/ConfiguracionEmisorService.java`
- Create: `controller/ConfiguracionEmisorController.java`

(Todas las rutas son relativas a `cotizador-backend/src/main/java/com/alfredodev/cotizador_backend/`.)

**Interfaces:**
- Consumes: `RecursoNoEncontradoException`, `RecursoDuplicadoException` (Task 2).
- Produces: `ConfiguracionEmisorService.obtener(): ConfiguracionEmisorResponse`, `ConfiguracionEmisorService.actualizar(ConfiguracionEmisorRequest): ConfiguracionEmisorResponse`.

- [ ] **Step 1: Entity**

`entity/ConfiguracionEmisor.java`:

```java
package com.alfredodev.cotizador_backend.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ConfiguracionEmisor {

    @Id
    private Long id;

    @Column(nullable = false)
    private String nombreRazonSocial;

    @Column(nullable = false)
    private String rucDni;

    @Column(nullable = false)
    private String telefono;

    @Column(nullable = false)
    private String email;

    private String direccion;
}
```

- [ ] **Step 2: Repository**

`repository/ConfiguracionEmisorRepository.java`:

```java
package com.alfredodev.cotizador_backend.repository;

import com.alfredodev.cotizador_backend.entity.ConfiguracionEmisor;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ConfiguracionEmisorRepository extends JpaRepository<ConfiguracionEmisor, Long> {
}
```

- [ ] **Step 3: DTOs**

`dto/ConfiguracionEmisorRequest.java`:

```java
package com.alfredodev.cotizador_backend.dto;

import jakarta.validation.constraints.NotBlank;

public record ConfiguracionEmisorRequest(
        @NotBlank String nombreRazonSocial,
        @NotBlank String rucDni,
        @NotBlank String telefono,
        @NotBlank String email,
        String direccion
) {
}
```

`dto/ConfiguracionEmisorResponse.java`:

```java
package com.alfredodev.cotizador_backend.dto;

public record ConfiguracionEmisorResponse(
        Long id,
        String nombreRazonSocial,
        String rucDni,
        String telefono,
        String email,
        String direccion
) {
}
```

- [ ] **Step 4: Mapper**

`mapper/ConfiguracionEmisorMapper.java`:

```java
package com.alfredodev.cotizador_backend.mapper;

import com.alfredodev.cotizador_backend.dto.ConfiguracionEmisorRequest;
import com.alfredodev.cotizador_backend.dto.ConfiguracionEmisorResponse;
import com.alfredodev.cotizador_backend.entity.ConfiguracionEmisor;

public class ConfiguracionEmisorMapper {

    private ConfiguracionEmisorMapper() {
    }

    public static ConfiguracionEmisorResponse toResponse(ConfiguracionEmisor entity) {
        return new ConfiguracionEmisorResponse(
                entity.getId(),
                entity.getNombreRazonSocial(),
                entity.getRucDni(),
                entity.getTelefono(),
                entity.getEmail(),
                entity.getDireccion()
        );
    }

    public static void actualizarEntity(ConfiguracionEmisor entity, ConfiguracionEmisorRequest request) {
        entity.setNombreRazonSocial(request.nombreRazonSocial());
        entity.setRucDni(request.rucDni());
        entity.setTelefono(request.telefono());
        entity.setEmail(request.email());
        entity.setDireccion(request.direccion());
    }
}
```

- [ ] **Step 5: Service**

`service/ConfiguracionEmisorService.java`:

```java
package com.alfredodev.cotizador_backend.service;

import com.alfredodev.cotizador_backend.dto.ConfiguracionEmisorRequest;
import com.alfredodev.cotizador_backend.dto.ConfiguracionEmisorResponse;
import com.alfredodev.cotizador_backend.entity.ConfiguracionEmisor;
import com.alfredodev.cotizador_backend.mapper.ConfiguracionEmisorMapper;
import com.alfredodev.cotizador_backend.repository.ConfiguracionEmisorRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class ConfiguracionEmisorService {

    // Fila única — todo el service lee/crea/actualiza siempre este mismo id.
    private static final Long ID_UNICO = 1L;

    private final ConfiguracionEmisorRepository repository;

    @Transactional(readOnly = true)
    public ConfiguracionEmisorResponse obtener() {
        ConfiguracionEmisor config = repository.findById(ID_UNICO).orElseGet(this::crearValoresIniciales);
        return ConfiguracionEmisorMapper.toResponse(config);
    }

    @Transactional
    public ConfiguracionEmisorResponse actualizar(ConfiguracionEmisorRequest request) {
        ConfiguracionEmisor config = repository.findById(ID_UNICO).orElseGet(this::crearValoresIniciales);
        ConfiguracionEmisorMapper.actualizarEntity(config, request);
        return ConfiguracionEmisorMapper.toResponse(repository.save(config));
    }

    // Valores iniciales del emisor precargados (spec §6) — el usuario los edita luego desde "Mis datos".
    private ConfiguracionEmisor crearValoresIniciales() {
        ConfiguracionEmisor config = ConfiguracionEmisor.builder()
                .id(ID_UNICO)
                .nombreRazonSocial("Alfredo Fabrizzio Navarro Tejeda")
                .rucDni("10706313031")
                .telefono("")
                .email("")
                .build();
        return repository.save(config);
    }
}
```

- [ ] **Step 6: Controller**

`controller/ConfiguracionEmisorController.java`:

```java
package com.alfredodev.cotizador_backend.controller;

import com.alfredodev.cotizador_backend.dto.ConfiguracionEmisorRequest;
import com.alfredodev.cotizador_backend.dto.ConfiguracionEmisorResponse;
import com.alfredodev.cotizador_backend.service.ConfiguracionEmisorService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/configuracion-emisor")
@RequiredArgsConstructor
public class ConfiguracionEmisorController {

    private final ConfiguracionEmisorService service;

    @GetMapping
    public ResponseEntity<ConfiguracionEmisorResponse> obtener() {
        return ResponseEntity.ok(service.obtener());
    }

    @PutMapping
    public ResponseEntity<ConfiguracionEmisorResponse> actualizar(@Valid @RequestBody ConfiguracionEmisorRequest request) {
        return ResponseEntity.ok(service.actualizar(request));
    }
}
```

- [ ] **Step 7: Compilar**

Run: `cd cotizador-backend && ./mvnw -q compile`
Expected: `BUILD SUCCESS`

- [ ] **Step 8: Mensaje de commit sugerido**

`feat: add ConfiguracionEmisor entity, service and REST endpoint`

---

### Task 4: Cliente

**Files:**
- Create: `entity/Cliente.java`, `repository/ClienteRepository.java`
- Create: `dto/ClienteRequest.java`, `dto/ClienteResponse.java`
- Create: `mapper/ClienteMapper.java`
- Create: `service/ClienteService.java`
- Create: `controller/ClienteController.java`

**Interfaces:**
- Produces: `ClienteResponse(Long id, String nombre, String empresa, String rucDni, String telefono, String email)` — usado por `CotizacionMapper` (Task 11) para anidar el cliente en `CotizacionResponse`. `ClienteService.obtenerEntity(Long id): Cliente` — usado por `CotizacionService` (Task 12) para resolver el FK al crear/editar una cotización.

- [ ] **Step 1: Entity**

`entity/Cliente.java`:

```java
package com.alfredodev.cotizador_backend.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Cliente {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String nombre;

    private String empresa;

    @Column(nullable = false, unique = true)
    private String rucDni;

    private String telefono;

    private String email;
}
```

- [ ] **Step 2: Repository**

`repository/ClienteRepository.java`:

```java
package com.alfredodev.cotizador_backend.repository;

import com.alfredodev.cotizador_backend.entity.Cliente;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ClienteRepository extends JpaRepository<Cliente, Long> {
}
```

- [ ] **Step 3: DTOs**

`dto/ClienteRequest.java`:

```java
package com.alfredodev.cotizador_backend.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;

public record ClienteRequest(
        @NotBlank String nombre,
        String empresa,
        @NotBlank String rucDni,
        String telefono,
        @Email String email
) {
}
```

`dto/ClienteResponse.java`:

```java
package com.alfredodev.cotizador_backend.dto;

public record ClienteResponse(
        Long id,
        String nombre,
        String empresa,
        String rucDni,
        String telefono,
        String email
) {
}
```

- [ ] **Step 4: Mapper**

`mapper/ClienteMapper.java`:

```java
package com.alfredodev.cotizador_backend.mapper;

import com.alfredodev.cotizador_backend.dto.ClienteRequest;
import com.alfredodev.cotizador_backend.dto.ClienteResponse;
import com.alfredodev.cotizador_backend.entity.Cliente;

public class ClienteMapper {

    private ClienteMapper() {
    }

    public static Cliente toEntity(ClienteRequest request) {
        return Cliente.builder()
                .nombre(request.nombre())
                .empresa(request.empresa())
                .rucDni(request.rucDni())
                .telefono(request.telefono())
                .email(request.email())
                .build();
    }

    public static void actualizarEntity(Cliente entity, ClienteRequest request) {
        entity.setNombre(request.nombre());
        entity.setEmpresa(request.empresa());
        entity.setRucDni(request.rucDni());
        entity.setTelefono(request.telefono());
        entity.setEmail(request.email());
    }

    public static ClienteResponse toResponse(Cliente entity) {
        return new ClienteResponse(
                entity.getId(),
                entity.getNombre(),
                entity.getEmpresa(),
                entity.getRucDni(),
                entity.getTelefono(),
                entity.getEmail()
        );
    }
}
```

- [ ] **Step 5: Service**

`service/ClienteService.java`:

```java
package com.alfredodev.cotizador_backend.service;

import com.alfredodev.cotizador_backend.dto.ClienteRequest;
import com.alfredodev.cotizador_backend.dto.ClienteResponse;
import com.alfredodev.cotizador_backend.entity.Cliente;
import com.alfredodev.cotizador_backend.exception.RecursoDuplicadoException;
import com.alfredodev.cotizador_backend.exception.RecursoNoEncontradoException;
import com.alfredodev.cotizador_backend.mapper.ClienteMapper;
import com.alfredodev.cotizador_backend.repository.ClienteRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class ClienteService {

    private final ClienteRepository repository;

    @Transactional(readOnly = true)
    public Page<ClienteResponse> listar(Pageable pageable) {
        return repository.findAll(pageable).map(ClienteMapper::toResponse);
    }

    @Transactional(readOnly = true)
    public ClienteResponse obtener(Long id) {
        return ClienteMapper.toResponse(obtenerEntity(id));
    }

    // Expuesto para que CotizacionService resuelva el FK cliente al crear/editar una cotización.
    @Transactional(readOnly = true)
    public Cliente obtenerEntity(Long id) {
        return repository.findById(id)
                .orElseThrow(() -> new RecursoNoEncontradoException("Cliente %d no encontrado".formatted(id)));
    }

    @Transactional
    public ClienteResponse crear(ClienteRequest request) {
        try {
            return ClienteMapper.toResponse(repository.save(ClienteMapper.toEntity(request)));
        } catch (DataIntegrityViolationException ex) {
            throw new RecursoDuplicadoException("Ya existe un cliente con RUC/DNI %s".formatted(request.rucDni()));
        }
    }

    @Transactional
    public ClienteResponse actualizar(Long id, ClienteRequest request) {
        Cliente cliente = obtenerEntity(id);
        ClienteMapper.actualizarEntity(cliente, request);
        try {
            return ClienteMapper.toResponse(repository.save(cliente));
        } catch (DataIntegrityViolationException ex) {
            throw new RecursoDuplicadoException("Ya existe un cliente con RUC/DNI %s".formatted(request.rucDni()));
        }
    }

    @Transactional
    public void eliminar(Long id) {
        Cliente cliente = obtenerEntity(id);
        repository.delete(cliente);
    }
}
```

- [ ] **Step 6: Controller**

`controller/ClienteController.java`:

```java
package com.alfredodev.cotizador_backend.controller;

import com.alfredodev.cotizador_backend.dto.ClienteRequest;
import com.alfredodev.cotizador_backend.dto.ClienteResponse;
import com.alfredodev.cotizador_backend.service.ClienteService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.net.URI;

@RestController
@RequestMapping("/api/clientes")
@RequiredArgsConstructor
public class ClienteController {

    private final ClienteService service;

    @GetMapping
    public ResponseEntity<Page<ClienteResponse>> listar(Pageable pageable) {
        return ResponseEntity.ok(service.listar(pageable));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ClienteResponse> obtener(@PathVariable Long id) {
        return ResponseEntity.ok(service.obtener(id));
    }

    @PostMapping
    public ResponseEntity<ClienteResponse> crear(@Valid @RequestBody ClienteRequest request) {
        ClienteResponse creado = service.crear(request);
        return ResponseEntity.created(URI.create("/api/clientes/" + creado.id())).body(creado);
    }

    @PutMapping("/{id}")
    public ResponseEntity<ClienteResponse> actualizar(@PathVariable Long id, @Valid @RequestBody ClienteRequest request) {
        return ResponseEntity.ok(service.actualizar(id, request));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> eliminar(@PathVariable Long id) {
        service.eliminar(id);
        return ResponseEntity.noContent().build();
    }
}
```

- [ ] **Step 7: Compilar**

Run: `cd cotizador-backend && ./mvnw -q compile`
Expected: `BUILD SUCCESS`

- [ ] **Step 8: Mensaje de commit sugerido**

`feat: add Cliente entity, service and REST endpoints`

---

### Task 5: RolTarifa (soft-delete)

**Files:**
- Create: `entity/RolTarifa.java`, `repository/RolTarifaRepository.java`
- Create: `dto/RolTarifaRequest.java`, `dto/RolTarifaResponse.java`
- Create: `mapper/RolTarifaMapper.java`
- Create: `service/RolTarifaService.java`
- Create: `controller/RolTarifaController.java`

**Interfaces:**
- Produces: `RolTarifaService.obtenerEntity(Long id): RolTarifa` — usado por `ItemCotizacionMapper` (Task 11) para resolver el FK opcional del item.

- [ ] **Step 1: Entity**

`entity/RolTarifa.java`:

```java
package com.alfredodev.cotizador_backend.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.math.BigDecimal;

@Entity
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class RolTarifa {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String nombre;

    @Column(nullable = false)
    private BigDecimal tarifaMinima;

    @Column(nullable = false)
    private BigDecimal tarifaMaxima;

    @Column(nullable = false)
    @Builder.Default
    private Boolean activo = true;
}
```

- [ ] **Step 2: Repository**

`repository/RolTarifaRepository.java`:

```java
package com.alfredodev.cotizador_backend.repository;

import com.alfredodev.cotizador_backend.entity.RolTarifa;
import org.springframework.data.jpa.repository.JpaRepository;

public interface RolTarifaRepository extends JpaRepository<RolTarifa, Long> {
}
```

- [ ] **Step 3: DTOs**

`dto/RolTarifaRequest.java`:

```java
package com.alfredodev.cotizador_backend.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;

import java.math.BigDecimal;

public record RolTarifaRequest(
        @NotBlank String nombre,
        @NotNull @Positive BigDecimal tarifaMinima,
        @NotNull @Positive BigDecimal tarifaMaxima,
        Boolean activo
) {
}
```

`dto/RolTarifaResponse.java`:

```java
package com.alfredodev.cotizador_backend.dto;

import java.math.BigDecimal;

public record RolTarifaResponse(
        Long id,
        String nombre,
        BigDecimal tarifaMinima,
        BigDecimal tarifaMaxima,
        Boolean activo
) {
}
```

- [ ] **Step 4: Mapper**

`mapper/RolTarifaMapper.java`:

```java
package com.alfredodev.cotizador_backend.mapper;

import com.alfredodev.cotizador_backend.dto.RolTarifaRequest;
import com.alfredodev.cotizador_backend.dto.RolTarifaResponse;
import com.alfredodev.cotizador_backend.entity.RolTarifa;

public class RolTarifaMapper {

    private RolTarifaMapper() {
    }

    public static RolTarifa toEntity(RolTarifaRequest request) {
        return RolTarifa.builder()
                .nombre(request.nombre())
                .tarifaMinima(request.tarifaMinima())
                .tarifaMaxima(request.tarifaMaxima())
                .activo(request.activo() == null || request.activo())
                .build();
    }

    public static void actualizarEntity(RolTarifa entity, RolTarifaRequest request) {
        entity.setNombre(request.nombre());
        entity.setTarifaMinima(request.tarifaMinima());
        entity.setTarifaMaxima(request.tarifaMaxima());
        if (request.activo() != null) {
            entity.setActivo(request.activo());
        }
    }

    public static RolTarifaResponse toResponse(RolTarifa entity) {
        return new RolTarifaResponse(
                entity.getId(),
                entity.getNombre(),
                entity.getTarifaMinima(),
                entity.getTarifaMaxima(),
                entity.getActivo()
        );
    }
}
```

- [ ] **Step 5: Service**

`service/RolTarifaService.java`:

```java
package com.alfredodev.cotizador_backend.service;

import com.alfredodev.cotizador_backend.dto.RolTarifaRequest;
import com.alfredodev.cotizador_backend.dto.RolTarifaResponse;
import com.alfredodev.cotizador_backend.entity.RolTarifa;
import com.alfredodev.cotizador_backend.exception.RecursoNoEncontradoException;
import com.alfredodev.cotizador_backend.mapper.RolTarifaMapper;
import com.alfredodev.cotizador_backend.repository.RolTarifaRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class RolTarifaService {

    private final RolTarifaRepository repository;

    @Transactional(readOnly = true)
    public List<RolTarifaResponse> listar() {
        return repository.findAll().stream().map(RolTarifaMapper::toResponse).toList();
    }

    // Usado por ItemCotizacionMapper para resolver el FK opcional del item — el rol puede estar inactivo,
    // se devuelve igual: un rol inactivo sigue siendo una referencia válida (spec §4.1).
    @Transactional(readOnly = true)
    public RolTarifa obtenerEntity(Long id) {
        return repository.findById(id)
                .orElseThrow(() -> new RecursoNoEncontradoException("RolTarifa %d no encontrado".formatted(id)));
    }

    @Transactional
    public RolTarifaResponse crear(RolTarifaRequest request) {
        return RolTarifaMapper.toResponse(repository.save(RolTarifaMapper.toEntity(request)));
    }

    @Transactional
    public RolTarifaResponse actualizar(Long id, RolTarifaRequest request) {
        RolTarifa rol = obtenerEntity(id);
        RolTarifaMapper.actualizarEntity(rol, request);
        return RolTarifaMapper.toResponse(repository.save(rol));
    }
}
```

- [ ] **Step 6: Controller**

`controller/RolTarifaController.java`:

```java
package com.alfredodev.cotizador_backend.controller;

import com.alfredodev.cotizador_backend.dto.RolTarifaRequest;
import com.alfredodev.cotizador_backend.dto.RolTarifaResponse;
import com.alfredodev.cotizador_backend.service.RolTarifaService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.net.URI;
import java.util.List;

@RestController
@RequestMapping("/api/tarifario")
@RequiredArgsConstructor
public class RolTarifaController {

    private final RolTarifaService service;

    @GetMapping
    public ResponseEntity<List<RolTarifaResponse>> listar() {
        return ResponseEntity.ok(service.listar());
    }

    @PostMapping
    public ResponseEntity<RolTarifaResponse> crear(@Valid @RequestBody RolTarifaRequest request) {
        RolTarifaResponse creado = service.crear(request);
        return ResponseEntity.created(URI.create("/api/tarifario/" + creado.id())).body(creado);
    }

    @PutMapping("/{id}")
    public ResponseEntity<RolTarifaResponse> actualizar(@PathVariable Long id, @Valid @RequestBody RolTarifaRequest request) {
        return ResponseEntity.ok(service.actualizar(id, request));
    }
}
```

- [ ] **Step 7: Compilar**

Run: `cd cotizador-backend && ./mvnw -q compile`
Expected: `BUILD SUCCESS`

- [ ] **Step 8: Mensaje de commit sugerido**

`feat: add RolTarifa entity, service and REST endpoints with soft-delete`

---

### Task 6: PlanSoporte (soft-delete)

**Files:**
- Create: `entity/PlanSoporte.java`, `repository/PlanSoporteRepository.java`
- Create: `dto/PlanSoporteRequest.java`, `dto/PlanSoporteResponse.java`
- Create: `mapper/PlanSoporteMapper.java`
- Create: `service/PlanSoporteService.java`
- Create: `controller/PlanSoporteController.java`

**Interfaces:**
- Produces: `PlanSoporteService.obtenerEntity(Long id): PlanSoporte`, `PlanSoporteMapper.toResponse(PlanSoporte): PlanSoporteResponse` — ambos usados por `CotizacionService`/`CotizacionMapper` (Tasks 11-12) para el FK opcional `planSoporte`.

- [ ] **Step 1: Entity**

`entity/PlanSoporte.java`:

```java
package com.alfredodev.cotizador_backend.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.math.BigDecimal;

@Entity
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PlanSoporte {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String nombre;

    private String descripcion;

    @Column(nullable = false)
    private BigDecimal precioMensual;

    @Column(nullable = false)
    @Builder.Default
    private Boolean activo = true;
}
```

- [ ] **Step 2: Repository**

`repository/PlanSoporteRepository.java`:

```java
package com.alfredodev.cotizador_backend.repository;

import com.alfredodev.cotizador_backend.entity.PlanSoporte;
import org.springframework.data.jpa.repository.JpaRepository;

public interface PlanSoporteRepository extends JpaRepository<PlanSoporte, Long> {
}
```

- [ ] **Step 3: DTOs**

`dto/PlanSoporteRequest.java`:

```java
package com.alfredodev.cotizador_backend.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;

import java.math.BigDecimal;

public record PlanSoporteRequest(
        @NotBlank String nombre,
        String descripcion,
        @NotNull @Positive BigDecimal precioMensual,
        Boolean activo
) {
}
```

`dto/PlanSoporteResponse.java`:

```java
package com.alfredodev.cotizador_backend.dto;

import java.math.BigDecimal;

public record PlanSoporteResponse(
        Long id,
        String nombre,
        String descripcion,
        BigDecimal precioMensual,
        Boolean activo
) {
}
```

- [ ] **Step 4: Mapper**

`mapper/PlanSoporteMapper.java`:

```java
package com.alfredodev.cotizador_backend.mapper;

import com.alfredodev.cotizador_backend.dto.PlanSoporteRequest;
import com.alfredodev.cotizador_backend.dto.PlanSoporteResponse;
import com.alfredodev.cotizador_backend.entity.PlanSoporte;

public class PlanSoporteMapper {

    private PlanSoporteMapper() {
    }

    public static PlanSoporte toEntity(PlanSoporteRequest request) {
        return PlanSoporte.builder()
                .nombre(request.nombre())
                .descripcion(request.descripcion())
                .precioMensual(request.precioMensual())
                .activo(request.activo() == null || request.activo())
                .build();
    }

    public static void actualizarEntity(PlanSoporte entity, PlanSoporteRequest request) {
        entity.setNombre(request.nombre());
        entity.setDescripcion(request.descripcion());
        entity.setPrecioMensual(request.precioMensual());
        if (request.activo() != null) {
            entity.setActivo(request.activo());
        }
    }

    public static PlanSoporteResponse toResponse(PlanSoporte entity) {
        return new PlanSoporteResponse(
                entity.getId(),
                entity.getNombre(),
                entity.getDescripcion(),
                entity.getPrecioMensual(),
                entity.getActivo()
        );
    }
}
```

- [ ] **Step 5: Service**

`service/PlanSoporteService.java`:

```java
package com.alfredodev.cotizador_backend.service;

import com.alfredodev.cotizador_backend.dto.PlanSoporteRequest;
import com.alfredodev.cotizador_backend.dto.PlanSoporteResponse;
import com.alfredodev.cotizador_backend.entity.PlanSoporte;
import com.alfredodev.cotizador_backend.exception.RecursoNoEncontradoException;
import com.alfredodev.cotizador_backend.mapper.PlanSoporteMapper;
import com.alfredodev.cotizador_backend.repository.PlanSoporteRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class PlanSoporteService {

    private final PlanSoporteRepository repository;

    @Transactional(readOnly = true)
    public List<PlanSoporteResponse> listar() {
        return repository.findAll().stream().map(PlanSoporteMapper::toResponse).toList();
    }

    @Transactional(readOnly = true)
    public PlanSoporte obtenerEntity(Long id) {
        return repository.findById(id)
                .orElseThrow(() -> new RecursoNoEncontradoException("PlanSoporte %d no encontrado".formatted(id)));
    }

    @Transactional
    public PlanSoporteResponse crear(PlanSoporteRequest request) {
        return PlanSoporteMapper.toResponse(repository.save(PlanSoporteMapper.toEntity(request)));
    }

    @Transactional
    public PlanSoporteResponse actualizar(Long id, PlanSoporteRequest request) {
        PlanSoporte plan = obtenerEntity(id);
        PlanSoporteMapper.actualizarEntity(plan, request);
        return PlanSoporteMapper.toResponse(repository.save(plan));
    }
}
```

- [ ] **Step 6: Controller**

`controller/PlanSoporteController.java`:

```java
package com.alfredodev.cotizador_backend.controller;

import com.alfredodev.cotizador_backend.dto.PlanSoporteRequest;
import com.alfredodev.cotizador_backend.dto.PlanSoporteResponse;
import com.alfredodev.cotizador_backend.service.PlanSoporteService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.net.URI;
import java.util.List;

@RestController
@RequestMapping("/api/planes-soporte")
@RequiredArgsConstructor
public class PlanSoporteController {

    private final PlanSoporteService service;

    @GetMapping
    public ResponseEntity<List<PlanSoporteResponse>> listar() {
        return ResponseEntity.ok(service.listar());
    }

    @PostMapping
    public ResponseEntity<PlanSoporteResponse> crear(@Valid @RequestBody PlanSoporteRequest request) {
        PlanSoporteResponse creado = service.crear(request);
        return ResponseEntity.created(URI.create("/api/planes-soporte/" + creado.id())).body(creado);
    }

    @PutMapping("/{id}")
    public ResponseEntity<PlanSoporteResponse> actualizar(@PathVariable Long id, @Valid @RequestBody PlanSoporteRequest request) {
        return ResponseEntity.ok(service.actualizar(id, request));
    }
}
```

- [ ] **Step 7: Compilar**

Run: `cd cotizador-backend && ./mvnw -q compile`
Expected: `BUILD SUCCESS`

- [ ] **Step 8: Mensaje de commit sugerido**

`feat: add PlanSoporte entity, service and REST endpoints with soft-delete`

---

### Task 7: Generador de número de cotización (contador + lock pesimista)

**Files:**
- Create: `entity/CotizacionNumeroContador.java`
- Create: `repository/CotizacionNumeroContadorRepository.java`
- Create: `service/CotizacionNumeroGenerator.java`

**Interfaces:**
- Produces: `CotizacionNumeroGenerator.generarSiguiente(): String` — formato `COT-AAAA-NNN`, usado por `CotizacionService` (Task 12) al crear una cotización nueva.

- [ ] **Step 1: Entity contador (fila única, id=1)**

`entity/CotizacionNumeroContador.java`:

```java
package com.alfredodev.cotizador_backend.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class CotizacionNumeroContador {

    @Id
    private Long id;

    @Column(nullable = false)
    private Long ultimoNumero;
}
```

- [ ] **Step 2: Repository con lock pesimista**

`repository/CotizacionNumeroContadorRepository.java`:

```java
package com.alfredodev.cotizador_backend.repository;

import com.alfredodev.cotizador_backend.entity.CotizacionNumeroContador;
import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;

import java.util.Optional;

public interface CotizacionNumeroContadorRepository extends JpaRepository<CotizacionNumeroContador, Long> {

    // Lock pesimista: serializa el acceso a la fila del contador — evita que dos cotizaciones
    // creadas casi simultáneamente lean el mismo "ultimoNumero" y terminen con el mismo numero.
    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("select c from CotizacionNumeroContador c where c.id = 1")
    Optional<CotizacionNumeroContador> buscarParaActualizar();
}
```

- [ ] **Step 3: Service generador**

`service/CotizacionNumeroGenerator.java`:

```java
package com.alfredodev.cotizador_backend.service;

import com.alfredodev.cotizador_backend.entity.CotizacionNumeroContador;
import com.alfredodev.cotizador_backend.repository.CotizacionNumeroContadorRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;

@Service
@RequiredArgsConstructor
public class CotizacionNumeroGenerator {

    private static final Long ID_CONTADOR = 1L;

    private final CotizacionNumeroContadorRepository repository;

    // Transacción corta: adquiere el lock, incrementa, libera — el año en el numero es el año de
    // creación, pero el contador nunca reinicia (correlativo global, spec §4.1).
    @Transactional
    public String generarSiguiente() {
        CotizacionNumeroContador contador = repository.buscarParaActualizar()
                .orElseGet(() -> repository.save(nuevoContador()));
        long siguiente = contador.getUltimoNumero() + 1;
        contador.setUltimoNumero(siguiente);
        repository.save(contador);
        int anioActual = LocalDate.now().getYear();
        return "COT-%d-%03d".formatted(anioActual, siguiente);
    }

    private CotizacionNumeroContador nuevoContador() {
        CotizacionNumeroContador contador = new CotizacionNumeroContador();
        contador.setId(ID_CONTADOR);
        contador.setUltimoNumero(0L);
        return contador;
    }
}
```

- [ ] **Step 4: Compilar**

Run: `cd cotizador-backend && ./mvnw -q compile`
Expected: `BUILD SUCCESS`

- [ ] **Step 5: Mensaje de commit sugerido**

`feat: add global sequential Cotizacion numbering with pessimistic lock`

---

### Task 8: CotizacionCalculoService — TDD (código de mayor riesgo del proyecto)

**Files:**
- Create: `service/CotizacionCalculoService.java`
- Test: `src/test/java/com/alfredodev/cotizador_backend/service/CotizacionCalculoServiceTest.java`

**Interfaces:**
- Consumes: `ItemCotizacion.getPrecioFinal(): BigDecimal`, `Pago.getMonto(): BigDecimal` (entities de Task 9/10 — para este task alcanza con que compilen los tipos; las entities se crean en el Task 9, así que este Task debe ejecutarse **después** de Task 9 pese al orden lógico de "calcular antes de tener datos" — ver nota de reordenamiento abajo).
- Produces: `calcularSubtotal(List<ItemCotizacion>): BigDecimal`, `calcularIGV(BigDecimal subtotal, Boolean incluyeIGV): BigDecimal`, `calcularTotal(BigDecimal subtotal, BigDecimal igv): BigDecimal`, `calcularMontoPagado(List<Pago>): BigDecimal`, `calcularSaldoPendiente(BigDecimal total, BigDecimal montoPagado): BigDecimal` — todos usados por `CotizacionService` (Task 12).

> **Nota de orden:** aunque este plan lista el Task 8 antes del Task 9, `CotizacionCalculoService` depende de las entities `ItemCotizacion`/`Pago`. Si se ejecuta con `subagent-driven-development`, correr primero el Task 9 (entities) y luego este Task 8 — o, si se prefiere TDD puro sin esperar las entities, escribir los tests contra listas de `BigDecimal` en vez de listas de entities (ver Step 1 alternativo). Este plan usa la versión que trabaja directo sobre las entities porque es lo que `CotizacionService` va a necesitar.

- [ ] **Step 1: Escribir los tests (fallarán porque el service no existe)**

`src/test/java/com/alfredodev/cotizador_backend/service/CotizacionCalculoServiceTest.java`:

```java
package com.alfredodev.cotizador_backend.service;

import com.alfredodev.cotizador_backend.entity.ItemCotizacion;
import com.alfredodev.cotizador_backend.entity.MetodoPago;
import com.alfredodev.cotizador_backend.entity.Pago;
import org.junit.jupiter.api.Test;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;

class CotizacionCalculoServiceTest {

    private final CotizacionCalculoService service = new CotizacionCalculoService();

    @Test
    void calcularSubtotal_sumaPrecioFinalDeTodosLosItems() {
        List<ItemCotizacion> items = List.of(
                ItemCotizacion.builder().precioFinal(new BigDecimal("1500.00")).build(),
                ItemCotizacion.builder().precioFinal(new BigDecimal("2500.50")).build()
        );

        BigDecimal subtotal = service.calcularSubtotal(items);

        assertThat(subtotal).isEqualByComparingTo(new BigDecimal("4000.50"));
    }

    @Test
    void calcularSubtotal_listaVacia_devuelveCero() {
        BigDecimal subtotal = service.calcularSubtotal(List.of());

        assertThat(subtotal).isEqualByComparingTo(BigDecimal.ZERO);
    }

    @Test
    void calcularIGV_incluyeIGVTrue_aplica18Porciento() {
        BigDecimal igv = service.calcularIGV(new BigDecimal("1000.00"), true);

        assertThat(igv).isEqualByComparingTo(new BigDecimal("180.00"));
    }

    @Test
    void calcularIGV_incluyeIGVFalse_devuelveCero() {
        BigDecimal igv = service.calcularIGV(new BigDecimal("1000.00"), false);

        assertThat(igv).isEqualByComparingTo(BigDecimal.ZERO);
    }

    @Test
    void calcularTotal_sumaSubtotalMasIGV() {
        BigDecimal total = service.calcularTotal(new BigDecimal("1000.00"), new BigDecimal("180.00"));

        assertThat(total).isEqualByComparingTo(new BigDecimal("1180.00"));
    }

    @Test
    void calcularMontoPagado_sumaTodosLosPagos() {
        List<Pago> pagos = List.of(
                Pago.builder().monto(new BigDecimal("500.00")).fecha(LocalDate.now()).metodo(MetodoPago.YAPE).build(),
                Pago.builder().monto(new BigDecimal("300.00")).fecha(LocalDate.now()).metodo(MetodoPago.TRANSFERENCIA).build()
        );

        BigDecimal montoPagado = service.calcularMontoPagado(pagos);

        assertThat(montoPagado).isEqualByComparingTo(new BigDecimal("800.00"));
    }

    @Test
    void calcularMontoPagado_sinPagos_devuelveCero() {
        BigDecimal montoPagado = service.calcularMontoPagado(List.of());

        assertThat(montoPagado).isEqualByComparingTo(BigDecimal.ZERO);
    }

    @Test
    void calcularSaldoPendiente_restaMontoPagadoDelTotal() {
        BigDecimal saldo = service.calcularSaldoPendiente(new BigDecimal("1180.00"), new BigDecimal("800.00"));

        assertThat(saldo).isEqualByComparingTo(new BigDecimal("380.00"));
    }

    @Test
    void calcularSaldoPendiente_pagoMayorQueTotal_devuelveNegativo() {
        BigDecimal saldo = service.calcularSaldoPendiente(new BigDecimal("1000.00"), new BigDecimal("1200.00"));

        assertThat(saldo).isEqualByComparingTo(new BigDecimal("-200.00"));
    }
}
```

- [ ] **Step 2: Ejecutar los tests y verificar que fallan por compilación (falta la clase y las entities)**

Run: `cd cotizador-backend && ./mvnw -q test -Dtest=CotizacionCalculoServiceTest`
Expected: FAIL — `cannot find symbol: class CotizacionCalculoService` (y las entities `ItemCotizacion`/`Pago`/`MetodoPago` si Task 9/10 no se corrieron antes).

- [ ] **Step 3: Implementación mínima**

`service/CotizacionCalculoService.java`:

```java
package com.alfredodev.cotizador_backend.service;

import com.alfredodev.cotizador_backend.entity.ItemCotizacion;
import com.alfredodev.cotizador_backend.entity.Pago;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.List;

// Único lugar del backend donde se calculan subtotal/igv/total/montoPagado/saldoPendiente
// (CLAUDE.md, spec §4) — la entity Cotizacion nunca persiste estos valores.
@Service
public class CotizacionCalculoService {

    private static final BigDecimal TASA_IGV = new BigDecimal("0.18");

    public BigDecimal calcularSubtotal(List<ItemCotizacion> items) {
        return items.stream()
                .map(ItemCotizacion::getPrecioFinal)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
    }

    public BigDecimal calcularIGV(BigDecimal subtotal, Boolean incluyeIGV) {
        if (!Boolean.TRUE.equals(incluyeIGV)) {
            return BigDecimal.ZERO;
        }
        return subtotal.multiply(TASA_IGV).setScale(2, RoundingMode.HALF_UP);
    }

    public BigDecimal calcularTotal(BigDecimal subtotal, BigDecimal igv) {
        return subtotal.add(igv);
    }

    public BigDecimal calcularMontoPagado(List<Pago> pagos) {
        return pagos.stream()
                .map(Pago::getMonto)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
    }

    public BigDecimal calcularSaldoPendiente(BigDecimal total, BigDecimal montoPagado) {
        return total.subtract(montoPagado);
    }
}
```

- [ ] **Step 4: Ejecutar los tests y verificar que pasan**

Run: `cd cotizador-backend && ./mvnw -q test -Dtest=CotizacionCalculoServiceTest`
Expected: `Tests run: 9, Failures: 0, Errors: 0`

- [ ] **Step 5: Mensaje de commit sugerido**

`feat: add CotizacionCalculoService with full unit test coverage`

---

### Task 9: Entities Cotizacion + ItemCotizacion + enums

**Files:**
- Create: `entity/EstadoCotizacion.java`
- Create: `entity/Cotizacion.java`
- Create: `entity/ItemCotizacion.java`
- Create: `repository/CotizacionRepository.java`

**Interfaces:**
- Produces: `Cotizacion` (con `items: List<ItemCotizacion>`, `pagos: List<Pago>`, métodos `addItem`/`addPago`), `ItemCotizacion`, `EstadoCotizacion` enum (`BORRADOR`/`ENVIADA`/`ACEPTADA`/`RECHAZADA`) — usados por Tasks 8, 10, 11, 12, 13, 14.

- [ ] **Step 1: Enum de estado**

`entity/EstadoCotizacion.java`:

```java
package com.alfredodev.cotizador_backend.entity;

public enum EstadoCotizacion {
    BORRADOR, ENVIADA, ACEPTADA, RECHAZADA
}
```

- [ ] **Step 2: Entity ItemCotizacion**

`entity/ItemCotizacion.java`:

```java
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
```

- [ ] **Step 3: Entity Cotizacion**

`entity/Cotizacion.java`:

```java
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
```

- [ ] **Step 4: Repository**

`repository/CotizacionRepository.java`:

```java
package com.alfredodev.cotizador_backend.repository;

import com.alfredodev.cotizador_backend.entity.Cotizacion;
import org.springframework.data.jpa.repository.JpaRepository;

public interface CotizacionRepository extends JpaRepository<Cotizacion, Long> {
}
```

- [ ] **Step 5: Compilar**

Run: `cd cotizador-backend && ./mvnw -q compile`
Expected: `BUILD SUCCESS`

- [ ] **Step 6: Mensaje de commit sugerido**

`feat: add Cotizacion and ItemCotizacion entities`

---

### Task 10: Pago — entity, enum, repository, DTOs, mapper

**Files:**
- Create: `entity/MetodoPago.java`, `entity/Pago.java`
- Create: `repository/PagoRepository.java`
- Create: `dto/PagoRequest.java`, `dto/PagoResponse.java`
- Create: `mapper/PagoMapper.java`

**Interfaces:**
- Produces: `Pago` entity, `PagoMapper.toResponse(Pago): PagoResponse` — usado por `CotizacionMapper` (Task 11) para anidar pagos en `CotizacionResponse`, y por `PagoService` (Task 14).

- [ ] **Step 1: Enum**

`entity/MetodoPago.java`:

```java
package com.alfredodev.cotizador_backend.entity;

public enum MetodoPago {
    TRANSFERENCIA, YAPE, OTRO
}
```

- [ ] **Step 2: Entity**

`entity/Pago.java`:

```java
package com.alfredodev.cotizador_backend.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.LocalDate;

@Entity
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Pago {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "cotizacion_id", nullable = false)
    private Cotizacion cotizacion;

    @Column(nullable = false)
    private BigDecimal monto;

    @Column(nullable = false)
    private LocalDate fecha;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private MetodoPago metodo;

    private String nota;
}
```

- [ ] **Step 3: Repository**

`repository/PagoRepository.java`:

```java
package com.alfredodev.cotizador_backend.repository;

import com.alfredodev.cotizador_backend.entity.Pago;
import org.springframework.data.jpa.repository.JpaRepository;

public interface PagoRepository extends JpaRepository<Pago, Long> {
}
```

- [ ] **Step 4: DTOs**

`dto/PagoRequest.java`:

```java
package com.alfredodev.cotizador_backend.dto;

import com.alfredodev.cotizador_backend.entity.MetodoPago;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;

import java.math.BigDecimal;
import java.time.LocalDate;

public record PagoRequest(
        @NotNull @Positive BigDecimal monto,
        @NotNull LocalDate fecha,
        @NotNull MetodoPago metodo,
        String nota
) {
}
```

`dto/PagoResponse.java`:

```java
package com.alfredodev.cotizador_backend.dto;

import com.alfredodev.cotizador_backend.entity.MetodoPago;

import java.math.BigDecimal;
import java.time.LocalDate;

public record PagoResponse(
        Long id,
        BigDecimal monto,
        LocalDate fecha,
        MetodoPago metodo,
        String nota
) {
}
```

- [ ] **Step 5: Mapper**

`mapper/PagoMapper.java`:

```java
package com.alfredodev.cotizador_backend.mapper;

import com.alfredodev.cotizador_backend.dto.PagoRequest;
import com.alfredodev.cotizador_backend.dto.PagoResponse;
import com.alfredodev.cotizador_backend.entity.Pago;

public class PagoMapper {

    private PagoMapper() {
    }

    public static Pago toEntity(PagoRequest request) {
        return Pago.builder()
                .monto(request.monto())
                .fecha(request.fecha())
                .metodo(request.metodo())
                .nota(request.nota())
                .build();
    }

    public static PagoResponse toResponse(Pago entity) {
        return new PagoResponse(
                entity.getId(),
                entity.getMonto(),
                entity.getFecha(),
                entity.getMetodo(),
                entity.getNota()
        );
    }
}
```

- [ ] **Step 6: Compilar**

Run: `cd cotizador-backend && ./mvnw -q compile`
Expected: `BUILD SUCCESS`

- [ ] **Step 7: Mensaje de commit sugerido**

`feat: add Pago entity, repository, DTOs and mapper`

---

### Task 11: DTOs y mapper de Cotizacion / ItemCotizacion

**Files:**
- Create: `dto/ItemCotizacionRequest.java`, `dto/ItemCotizacionResponse.java`
- Create: `dto/CotizacionRequest.java`, `dto/CotizacionResponse.java`
- Create: `mapper/ItemCotizacionMapper.java`
- Create: `mapper/CotizacionMapper.java`

**Interfaces:**
- Consumes: `ClienteMapper.toResponse` (Task 4), `PlanSoporteMapper.toResponse` (Task 6), `PagoMapper.toResponse` (Task 10).
- Produces: `ItemCotizacionMapper.toEntity(ItemCotizacionRequest, RolTarifa rolTarifaOrNull): ItemCotizacion`, `ItemCotizacionMapper.toResponse(ItemCotizacion): ItemCotizacionResponse`, `CotizacionMapper.toEntity(CotizacionRequest, Cliente, PlanSoporte, String numero): Cotizacion` (sin items — se agregan aparte con `addItem`), `CotizacionMapper.toResponse(Cotizacion, BigDecimal subtotal, BigDecimal igv, BigDecimal total, BigDecimal montoPagado, BigDecimal saldoPendiente): CotizacionResponse` — todos usados por `CotizacionService` (Task 12).

- [ ] **Step 1: DTOs de ItemCotizacion**

`dto/ItemCotizacionRequest.java`:

```java
package com.alfredodev.cotizador_backend.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.PositiveOrZero;

import java.math.BigDecimal;
import java.util.List;

public record ItemCotizacionRequest(
        @NotBlank String nombreFase,
        List<String> descripcionTecnica,
        @NotNull @Positive Integer plazoSemanas,
        Long rolTarifaId,
        @NotNull @PositiveOrZero BigDecimal precioFinal
) {
}
```

`dto/ItemCotizacionResponse.java`:

```java
package com.alfredodev.cotizador_backend.dto;

import java.math.BigDecimal;
import java.util.List;

public record ItemCotizacionResponse(
        Long id,
        String nombreFase,
        List<String> descripcionTecnica,
        Integer plazoSemanas,
        Long rolTarifaId,
        String rolTarifaNombre,
        BigDecimal precioFinal
) {
}
```

- [ ] **Step 2: Mapper de ItemCotizacion**

`mapper/ItemCotizacionMapper.java`:

```java
package com.alfredodev.cotizador_backend.mapper;

import com.alfredodev.cotizador_backend.dto.ItemCotizacionRequest;
import com.alfredodev.cotizador_backend.dto.ItemCotizacionResponse;
import com.alfredodev.cotizador_backend.entity.ItemCotizacion;
import com.alfredodev.cotizador_backend.entity.RolTarifa;

import java.util.ArrayList;

public class ItemCotizacionMapper {

    private ItemCotizacionMapper() {
    }

    public static ItemCotizacion toEntity(ItemCotizacionRequest request, RolTarifa rolTarifaOrNull) {
        return ItemCotizacion.builder()
                .nombreFase(request.nombreFase())
                .descripcionTecnica(request.descripcionTecnica() == null
                        ? new ArrayList<>()
                        : new ArrayList<>(request.descripcionTecnica()))
                .plazoSemanas(request.plazoSemanas())
                .rolTarifa(rolTarifaOrNull)
                .precioFinal(request.precioFinal())
                .build();
    }

    public static ItemCotizacionResponse toResponse(ItemCotizacion entity) {
        RolTarifa rol = entity.getRolTarifa();
        return new ItemCotizacionResponse(
                entity.getId(),
                entity.getNombreFase(),
                entity.getDescripcionTecnica(),
                entity.getPlazoSemanas(),
                rol == null ? null : rol.getId(),
                rol == null ? null : rol.getNombre(),
                entity.getPrecioFinal()
        );
    }
}
```

- [ ] **Step 3: DTOs de Cotizacion**

`dto/CotizacionRequest.java`:

```java
package com.alfredodev.cotizador_backend.dto;

import com.alfredodev.cotizador_backend.entity.EstadoCotizacion;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;

import java.math.BigDecimal;
import java.util.List;

public record CotizacionRequest(
        @NotNull Long clienteId,
        @NotNull @Positive Integer validezDias,
        @NotNull Boolean incluyeIGV,
        // Solo se usa en actualizaciones (PUT); en creación (POST) el service fuerza BORRADOR.
        EstadoCotizacion estado,
        Long planSoporteId,
        BigDecimal tarifaSoporteFueraGarantia,
        String notasCostosNoIncluidos,
        @NotEmpty List<@Valid ItemCotizacionRequest> items
) {
}
```

`dto/CotizacionResponse.java`:

```java
package com.alfredodev.cotizador_backend.dto;

import com.alfredodev.cotizador_backend.entity.EstadoCotizacion;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

public record CotizacionResponse(
        Long id,
        String numero,
        LocalDate fecha,
        ClienteResponse cliente,
        Integer validezDias,
        String moneda,
        Boolean incluyeIGV,
        EstadoCotizacion estado,
        PlanSoporteResponse planSoporte,
        BigDecimal tarifaSoporteFueraGarantia,
        String notasCostosNoIncluidos,
        List<ItemCotizacionResponse> items,
        List<PagoResponse> pagos,
        BigDecimal subtotal,
        BigDecimal igv,
        BigDecimal total,
        BigDecimal montoPagado,
        BigDecimal saldoPendiente
) {
}
```

- [ ] **Step 4: Mapper de Cotizacion**

`mapper/CotizacionMapper.java`:

```java
package com.alfredodev.cotizador_backend.mapper;

import com.alfredodev.cotizador_backend.dto.CotizacionRequest;
import com.alfredodev.cotizador_backend.dto.CotizacionResponse;
import com.alfredodev.cotizador_backend.entity.Cliente;
import com.alfredodev.cotizador_backend.entity.Cotizacion;
import com.alfredodev.cotizador_backend.entity.EstadoCotizacion;
import com.alfredodev.cotizador_backend.entity.PlanSoporte;

import java.math.BigDecimal;
import java.time.LocalDate;

public class CotizacionMapper {

    private CotizacionMapper() {
    }

    // Construye la entity SIN items/pagos — CotizacionService los agrega con addItem() luego de
    // resolver cada RolTarifa opcional, para no acoplar este mapper a un repository.
    public static Cotizacion toEntityNueva(CotizacionRequest request, String numero, Cliente cliente, PlanSoporte planSoporteOrNull) {
        return Cotizacion.builder()
                .numero(numero)
                .fecha(LocalDate.now())
                .cliente(cliente)
                .validezDias(request.validezDias())
                .incluyeIGV(request.incluyeIGV())
                .estado(EstadoCotizacion.BORRADOR)
                .planSoporte(planSoporteOrNull)
                .tarifaSoporteFueraGarantia(request.tarifaSoporteFueraGarantia())
                .notasCostosNoIncluidos(request.notasCostosNoIncluidos())
                .build();
    }

    // Actualiza los campos editables de una cotización existente — numero/fecha nunca cambian.
    public static void actualizarEntity(Cotizacion entity, CotizacionRequest request, Cliente cliente, PlanSoporte planSoporteOrNull) {
        entity.setCliente(cliente);
        entity.setValidezDias(request.validezDias());
        entity.setIncluyeIGV(request.incluyeIGV());
        if (request.estado() != null) {
            entity.setEstado(request.estado());
        }
        entity.setPlanSoporte(planSoporteOrNull);
        entity.setTarifaSoporteFueraGarantia(request.tarifaSoporteFueraGarantia());
        entity.setNotasCostosNoIncluidos(request.notasCostosNoIncluidos());
    }

    public static CotizacionResponse toResponse(
            Cotizacion entity,
            BigDecimal subtotal,
            BigDecimal igv,
            BigDecimal total,
            BigDecimal montoPagado,
            BigDecimal saldoPendiente
    ) {
        return new CotizacionResponse(
                entity.getId(),
                entity.getNumero(),
                entity.getFecha(),
                ClienteMapper.toResponse(entity.getCliente()),
                entity.getValidezDias(),
                entity.getMoneda(),
                entity.getIncluyeIGV(),
                entity.getEstado(),
                entity.getPlanSoporte() == null ? null : PlanSoporteMapper.toResponse(entity.getPlanSoporte()),
                entity.getTarifaSoporteFueraGarantia(),
                entity.getNotasCostosNoIncluidos(),
                entity.getItems().stream().map(ItemCotizacionMapper::toResponse).toList(),
                entity.getPagos().stream().map(PagoMapper::toResponse).toList(),
                subtotal,
                igv,
                total,
                montoPagado,
                saldoPendiente
        );
    }
}
```

- [ ] **Step 5: Compilar**

Run: `cd cotizador-backend && ./mvnw -q compile`
Expected: `BUILD SUCCESS`

- [ ] **Step 6: Mensaje de commit sugerido**

`feat: add Cotizacion and ItemCotizacion DTOs and mappers`

---

### Task 12: CotizacionService

**Files:**
- Create: `service/CotizacionService.java`

**Interfaces:**
- Consumes: `ClienteService.obtenerEntity` (Task 4), `PlanSoporteService.obtenerEntity` (Task 6), `RolTarifaService.obtenerEntity` (Task 5), `CotizacionNumeroGenerator.generarSiguiente` (Task 7), `CotizacionCalculoService.*` (Task 8), `CotizacionMapper.*`, `ItemCotizacionMapper.*` (Task 11), `CotizacionRepository` (Task 9).
- Produces: `listar(Pageable): Page<CotizacionResponse>`, `obtener(Long id): CotizacionResponse`, `crear(CotizacionRequest): CotizacionResponse`, `actualizar(Long id, CotizacionRequest): CotizacionResponse`, `eliminar(Long id): void`, `obtenerEntity(Long id): Cotizacion` (usado por `PagoService`, Task 14).

- [ ] **Step 1: Service**

`service/CotizacionService.java`:

```java
package com.alfredodev.cotizador_backend.service;

import com.alfredodev.cotizador_backend.dto.CotizacionRequest;
import com.alfredodev.cotizador_backend.dto.CotizacionResponse;
import com.alfredodev.cotizador_backend.dto.ItemCotizacionRequest;
import com.alfredodev.cotizador_backend.entity.Cliente;
import com.alfredodev.cotizador_backend.entity.Cotizacion;
import com.alfredodev.cotizador_backend.entity.ItemCotizacion;
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

@Service
@RequiredArgsConstructor
public class CotizacionService {

    private final CotizacionRepository repository;
    private final ClienteService clienteService;
    private final PlanSoporteService planSoporteService;
    private final RolTarifaService rolTarifaService;
    private final CotizacionNumeroGenerator numeroGenerator;
    private final CotizacionCalculoService calculoService;

    @Transactional(readOnly = true)
    public Page<CotizacionResponse> listar(Pageable pageable) {
        return repository.findAll(pageable).map(this::construirResponse);
    }

    @Transactional(readOnly = true)
    public CotizacionResponse obtener(Long id) {
        return construirResponse(obtenerEntity(id));
    }

    // Expuesto para PagoService — necesita la entity completa (con items/pagos cargados) para
    // recalcular el saldo después de agregar/borrar un pago.
    @Transactional(readOnly = true)
    public Cotizacion obtenerEntity(Long id) {
        return repository.findById(id)
                .orElseThrow(() -> new RecursoNoEncontradoException("Cotizacion %d no encontrada".formatted(id)));
    }

    @Transactional
    public CotizacionResponse crear(CotizacionRequest request) {
        Cliente cliente = clienteService.obtenerEntity(request.clienteId());
        PlanSoporte planSoporte = resolverPlanSoporte(request.planSoporteId());
        String numero = numeroGenerator.generarSiguiente();

        Cotizacion cotizacion = CotizacionMapper.toEntityNueva(request, numero, cliente, planSoporte);
        agregarItems(cotizacion, request.items());

        return construirResponse(repository.save(cotizacion));
    }

    @Transactional
    public CotizacionResponse actualizar(Long id, CotizacionRequest request) {
        Cotizacion cotizacion = obtenerEntity(id);
        Cliente cliente = clienteService.obtenerEntity(request.clienteId());
        PlanSoporte planSoporte = resolverPlanSoporte(request.planSoporteId());

        CotizacionMapper.actualizarEntity(cotizacion, request, cliente, planSoporte);

        // orphanRemoval=true en Cotizacion.items: limpiar y reconstruir la lista borra en cascada
        // los items que ya no están en el request y guarda los nuevos/editados.
        cotizacion.getItems().clear();
        agregarItems(cotizacion, request.items());

        return construirResponse(repository.save(cotizacion));
    }

    @Transactional
    public void eliminar(Long id) {
        repository.delete(obtenerEntity(id));
    }

    private void agregarItems(Cotizacion cotizacion, Iterable<ItemCotizacionRequest> itemsRequest) {
        for (ItemCotizacionRequest itemRequest : itemsRequest) {
            RolTarifa rolTarifa = itemRequest.rolTarifaId() == null
                    ? null
                    : rolTarifaService.obtenerEntity(itemRequest.rolTarifaId());
            ItemCotizacion item = ItemCotizacionMapper.toEntity(itemRequest, rolTarifa);
            cotizacion.addItem(item);
        }
    }

    private PlanSoporte resolverPlanSoporte(Long planSoporteId) {
        return planSoporteId == null ? null : planSoporteService.obtenerEntity(planSoporteId);
    }

    // Punto único donde se arma el response completo con los 5 campos calculados (spec §4/§6).
    private CotizacionResponse construirResponse(Cotizacion cotizacion) {
        BigDecimal subtotal = calculoService.calcularSubtotal(cotizacion.getItems());
        BigDecimal igv = calculoService.calcularIGV(subtotal, cotizacion.getIncluyeIGV());
        BigDecimal total = calculoService.calcularTotal(subtotal, igv);
        BigDecimal montoPagado = calculoService.calcularMontoPagado(cotizacion.getPagos());
        BigDecimal saldoPendiente = calculoService.calcularSaldoPendiente(total, montoPagado);
        return CotizacionMapper.toResponse(cotizacion, subtotal, igv, total, montoPagado, saldoPendiente);
    }
}
```

- [ ] **Step 2: Compilar**

Run: `cd cotizador-backend && ./mvnw -q compile`
Expected: `BUILD SUCCESS`

- [ ] **Step 3: Mensaje de commit sugerido**

`feat: add CotizacionService orchestrating numbering, items and calculated totals`

---

### Task 13: CotizacionController

**Files:**
- Create: `controller/CotizacionController.java`

**Interfaces:**
- Consumes: `CotizacionService.*` (Task 12).

- [ ] **Step 1: Controller**

`controller/CotizacionController.java`:

```java
package com.alfredodev.cotizador_backend.controller;

import com.alfredodev.cotizador_backend.dto.CotizacionRequest;
import com.alfredodev.cotizador_backend.dto.CotizacionResponse;
import com.alfredodev.cotizador_backend.service.CotizacionService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.net.URI;

@RestController
@RequestMapping("/api/cotizaciones")
@RequiredArgsConstructor
public class CotizacionController {

    private final CotizacionService service;

    @GetMapping
    public ResponseEntity<Page<CotizacionResponse>> listar(Pageable pageable) {
        return ResponseEntity.ok(service.listar(pageable));
    }

    @GetMapping("/{id}")
    public ResponseEntity<CotizacionResponse> obtener(@PathVariable Long id) {
        return ResponseEntity.ok(service.obtener(id));
    }

    @PostMapping
    public ResponseEntity<CotizacionResponse> crear(@Valid @RequestBody CotizacionRequest request) {
        CotizacionResponse creada = service.crear(request);
        return ResponseEntity.created(URI.create("/api/cotizaciones/" + creada.id())).body(creada);
    }

    @PutMapping("/{id}")
    public ResponseEntity<CotizacionResponse> actualizar(@PathVariable Long id, @Valid @RequestBody CotizacionRequest request) {
        return ResponseEntity.ok(service.actualizar(id, request));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> eliminar(@PathVariable Long id) {
        service.eliminar(id);
        return ResponseEntity.noContent().build();
    }
}
```

- [ ] **Step 2: Compilar**

Run: `cd cotizador-backend && ./mvnw -q compile`
Expected: `BUILD SUCCESS`

- [ ] **Step 3: Mensaje de commit sugerido**

`feat: add CotizacionController REST endpoints`

---

### Task 14: PagoService + PagoController

**Files:**
- Create: `service/PagoService.java`
- Create: `controller/PagoController.java`

**Interfaces:**
- Consumes: `CotizacionService.obtenerEntity` (Task 12), `PagoRepository`, `PagoMapper` (Task 10).

- [ ] **Step 1: Service**

`service/PagoService.java`:

```java
package com.alfredodev.cotizador_backend.service;

import com.alfredodev.cotizador_backend.dto.PagoRequest;
import com.alfredodev.cotizador_backend.dto.PagoResponse;
import com.alfredodev.cotizador_backend.entity.Cotizacion;
import com.alfredodev.cotizador_backend.entity.Pago;
import com.alfredodev.cotizador_backend.exception.RecursoNoEncontradoException;
import com.alfredodev.cotizador_backend.mapper.PagoMapper;
import com.alfredodev.cotizador_backend.repository.PagoRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class PagoService {

    private final PagoRepository repository;
    private final CotizacionService cotizacionService;

    @Transactional
    public PagoResponse registrar(Long cotizacionId, PagoRequest request) {
        Cotizacion cotizacion = cotizacionService.obtenerEntity(cotizacionId);
        Pago pago = PagoMapper.toEntity(request);
        cotizacion.addPago(pago);
        // cascade=ALL en Cotizacion.pagos: guardar el pago vía la colección administrada por
        // Hibernate evita un save() explícito del Pago suelto.
        repository.save(pago);
        return PagoMapper.toResponse(pago);
    }

    @Transactional
    public void eliminar(Long pagoId) {
        Pago pago = repository.findById(pagoId)
                .orElseThrow(() -> new RecursoNoEncontradoException("Pago %d no encontrado".formatted(pagoId)));
        repository.delete(pago);
    }
}
```

- [ ] **Step 2: Controller**

`controller/PagoController.java`:

```java
package com.alfredodev.cotizador_backend.controller;

import com.alfredodev.cotizador_backend.dto.PagoRequest;
import com.alfredodev.cotizador_backend.dto.PagoResponse;
import com.alfredodev.cotizador_backend.service.PagoService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequiredArgsConstructor
public class PagoController {

    private final PagoService service;

    @PostMapping("/api/cotizaciones/{cotizacionId}/pagos")
    public ResponseEntity<PagoResponse> registrar(@PathVariable Long cotizacionId, @Valid @RequestBody PagoRequest request) {
        return ResponseEntity.status(201).body(service.registrar(cotizacionId, request));
    }

    @DeleteMapping("/api/pagos/{id}")
    public ResponseEntity<Void> eliminar(@PathVariable Long id) {
        service.eliminar(id);
        return ResponseEntity.noContent().build();
    }
}
```

- [ ] **Step 3: Compilar y correr toda la suite**

Run: `cd cotizador-backend && ./mvnw -q compile test`
Expected: `BUILD SUCCESS`, los 9 tests de `CotizacionCalculoServiceTest` pasan.

- [ ] **Step 4: Mensaje de commit sugerido**

`feat: add PagoService and PagoController endpoints`

---

## Verificación manual final (con Postgres corriendo)

Después del Task 14, con `docker compose up -d postgres` y `./mvnw spring-boot:run` desde `cotizador-backend/`:

1. `GET http://localhost:8080/api/configuracion-emisor` → debe devolver los valores iniciales (Alfredo Fabrizzio Navarro Tejeda, RUC 10706313031).
2. `POST /api/clientes` con un cliente de prueba → `201` con `Location`.
3. `POST /api/tarifario` con un rol → `201`.
4. `POST /api/cotizaciones` con `clienteId`, `incluyeIGV: true`, un `item` con `precioFinal` → `201`, response con `numero` tipo `COT-2026-001`, `subtotal`/`igv`/`total` correctos.
5. `POST /api/cotizaciones/{id}/pagos` con un monto parcial → `201`, luego `GET /api/cotizaciones/{id}` debe mostrar `montoPagado`/`saldoPendiente` actualizados.
6. Repetir el `POST /api/cotizaciones` una segunda vez → el `numero` debe ser `COT-2026-002` (correlativo, no se repite).
