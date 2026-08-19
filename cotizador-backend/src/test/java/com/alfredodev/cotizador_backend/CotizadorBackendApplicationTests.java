package com.alfredodev.cotizador_backend;

import org.junit.jupiter.api.Test;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.testcontainers.service.connection.ServiceConnection;
import org.testcontainers.containers.PostgreSQLContainer;
import org.testcontainers.junit.jupiter.Container;
import org.testcontainers.junit.jupiter.Testcontainers;

// Postgres efímero vía Testcontainers: el context-load no debe depender del Postgres de
// desarrollo (localhost:5433) ni insertar datos ahí como efecto secundario del seeder.
@Testcontainers
@SpringBootTest
class CotizadorBackendApplicationTests {

	@Container
	@ServiceConnection
	static PostgreSQLContainer<?> postgres = new PostgreSQLContainer<>("postgres:16-alpine");

	@Test
	void contextLoads() {
	}

}
