# Mejoras y Optimizaciones (MejoyOPtis)

## Déficits y Tareas Pendientes
- **Persistencia Híbrida:** Ausencia de sincronización entre el estado local (`localStorage`) y la base de datos (nube). Si el usuario limpia el navegador o usa modo incógnito, pierde el carrito.
- **~~Cobertura de Testing en Extracción (Scrapers):~~** ✅ COMPLETADO. 20 tests unitarios en `providers.test.ts` cubriendo 4 patrones de parseo (VTEX Classic, VTEX IS, Coto ATG, Gómez Pardo Zod). Fixtures estáticos en `__fixtures__/`.
- **Alertas Proactivas de Integridad:** El equipo técnico no recibe notificaciones (Discord/Slack/Telegram) cuando un webhook o scraper falla durante el cron nocturno.
- **~~Timeout en Cron Job:~~** ✅ COMPLETADO. `worker.ts` ahora tiene `JOB_TIMEOUT_MS` (5 min, configurable vía ENV) con `Promise.race` + `lockDuration: 10min`. `CleanupService` tiene timeout individual (5 min) y global (12 min). `cron.ts` ya tenía `timeout: 30min` en `spawn`.
- **Seguridad y Prevención de Baneos:** Falta un pool de Proxies Residenciales Rotativos. Actualmente expuesto a bloqueos de IP en capa WAF (Cloudflare/Akamai).
- **Autenticación sin Contraseña:** El módulo `Magic Links` (Fase 8) permanece pendiente de implementación.

## Propuestas de Optimización Arquitectónica
- **Control de Subprocesos:** Inyectar parámetro `{ timeout: 1800000 }` (30 mins max) en la invocación de `spawn` de `backend/src/scraper/cron.ts` acoplado a un handler de destrucción de procesos muertos.
- **~~Fixtures de Regresión:~~** ✅ COMPLETADO. 4 archivos JSON estáticos en `__fixtures__/` (vtex_classic, vtex_intelligent_search, coto_response, gomez_pardo_response) con edge cases. Mock de `fetchWithRetry` elimina dependencia de red.
- **Integración Webhook:** Conectar las salidas de `ScraperLogRepository` con la red corporativa. Disparar alertas si `status === 'ERROR'` o `itemsScraped === 0`.
- **Indexación por Precio Unitario:** Modificar el motor Prisma y los endpoints del Frontend para permitir el filtrado y ordenamiento estricto por `unitPrice` (precio real por kg/litro) como vector principal, desplazando al precio nominal.

## Nuevas Mejoras Funcionales (Roadmap Avanzado)
- **Sustitución Heurística de Formato:** Interceptar el Carrito Híbrido y sugerir reducciones volumétricas rentables (ej: recomendar comprar 2x 500g en lugar de 1x 1kg de la misma marca si el PPU final es inferior).
- **CRUD Cloud de Listas:** Terminar los endpoints protegidos para que los usuarios registrados carguen, nombren y guarden múltiples carritos de compras paralelos de forma permanente.
- **Alertas PWA de "Drops":** Activar Web Push Notifications mediante Service Workers. Si el cron detecta una depreciación >20% en un producto de alto interés, notificar automáticamente a los clientes.
- **Geolocalización de Rentabilidad:** Computar la distancia de la sucursal sugerida contra la ubicación del dispositivo, penalizando el ahorro neto en base al costo del traslado físico.
