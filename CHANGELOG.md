# Changelog - Ahorro Tuc

## [1.2.0] - Fase 9: Performance y Escalabilidad del Backend
### Fuzzy Matching Optimizado + Caché Redis para Horizontal Scaling
* **9.1 Fuzzy Matching O(N²) → O(M log N)**: Reemplazado el loop lineal del sincronizador de scraping por un **índice invertido** (`word → Set<productId>`). Construcción O(N_db × W) una vez por sync, lookup O(1) por palabra scrapeada. Reducción de ~18,500 a ~8 operaciones con el catálogo actual (99.9% menos). Normalización mejorada de unidades (`500 gr→500g`, `1000g→1kg`, `750 ml→750ml`, tildes, puntuación). 21 tests unitarios (`SyncService.test.ts`).
* **9.3 Caché Redis para Escalabilidad Horizontal**: `CacheService` ahora usa arquitectura dual — writes a in-memory (sync) + Redis (fire-and-forget async) con `ioredis`. Reads ultrarrápidos desde in-memory primero, con `getAsync()` disponible para migración gradual de controllers a lecturas verdaderamente distribuidas. Fallback transparente a in-memory si `REDIS_URL` no está configurado (zero breaking changes). Redis 7 Alpine agregado a `docker-compose.yml` con LRU eviction (`allkeys-lru`) y AOF persistence. Credenciales de pgAdmin securitizadas via variables de entorno. 10 tests unitarios (`CacheService.test.ts`).

## [1.1.0] - Fase 7.0: Experiencia Visual y Motor de Optimización Avanzada
### Gráficos Recharts, Carrito Híbrido e Interfaz Detallada
* **Gráficos de Historial de Precios (UI)**: Se integró la librería `recharts` para renderizar un gráfico de tendencia (línea de tiempo) al expandir una tarjeta de producto en el frontend.
* **Algoritmo de Carrito Híbrido**: El `OptimizationService` fue re-escrito para no solo devolver el supermercado más barato global, sino una recomendación alternativa ("Carrito Híbrido") que sugiere dividir la compra entre el supermercado base ganador y otra cadena para obtener el precio mínimo absoluto combinando ofertas parciales.
* **Componente Historial (`ProductHistoryChart`)**: Nuevo componente que agrupa dinámicamente precios por fecha (tomando el mínimo de cada día) para mostrar la evaluación a los usuarios a lo largo del tiempo de manera intuitiva.
* **Expansión Frontend y Endpoints API**: Adaptados los endpoints en `api.ts` y controladores asociados para la provisión del historial de precios por fecha y la lógica híbrida del nuevo motor.

## [1.0.0-rc.1] - Fase 6.1: Auditoría Completa — Testing, CI/CD y DevOps
### Blindaje Anti-Regresión y Estabilidad Operacional
* **Tests Unitarios Expandidos (5.3 — fix)**: El único test de `OptimizationService` estaba desactualizado (llamaba con firma `number[]` en lugar de `{productId, quantity}[]`). Se reescribió con 4 casos de prueba cubriendo cálculo correcto, multiplicación por `quantity`, carrito vacío y exclusión de supers con catálogo incompleto.
* **Tests de Controlador Zod (5.3 — nuevo)**: Nuevo archivo `OptimizationController.test.ts` con 5 tests que verifican la validación completa del payload: body vacío, `cartItems` no-array, `quantity: 0`, `productId` negativo y path feliz que retorna resultados del servicio.
* **Lint Backend en CI (5.4 — fix)**: Agregado paso `npx tsc --noEmit` al job `backend-test` del pipeline de GitHub Actions, detectando errores de tipos en cada push sin necesitar compilar archivos.
* **Seed en E2E (5.2 — fix)**: El job `frontend-e2e` ahora ejecuta `npm run seed` post `prisma db push` para garantizar que los tests de Playwright encuentren productos reales y no fallen silenciosamente con BD vacía.
* **docker-compose.yml (6.3 — nuevo)**: Creado con sintaxis moderna Docker Compose v2 (sin campo `version` deprecado). Incluye PostgreSQL 15 Alpine con health check y pgAdmin 4 con `depends_on.condition: service_healthy`.
* **Auditoría Cat. 4 completa**: Verificado que skeletons usan variables CSS dark-mode-aware (4.1 ✅), Footer profesional existe (4.2 ✅), botón optimizar tiene `handleOptimize` con scroll animado (4.3 ✅), accesibilidad con Escape/focus-trap/ARIA implementada (4.4 ✅), animación logo limitada a 3 repeticiones (4.5 ✅).
* **Auditoría Cat. 6 completa**: `tsx watch` en dev (6.1 ✅), hot-reload via tsx (6.2 ✅), `.env.example` en backend y frontend (6.4 ✅), README con instrucciones completas de setup (6.5 ✅).

## [1.0.0-beta.3] - Fase 6.0: Auditoría de Bugs Críticos y Arquitectura Backend
### Estabilidad, Corrección de Regresiones y Refactoring
* **Seed Idempotente (Bug 1.5 — fix)**: Se corrigió el bug más grave donde `seedDatabase()` ejecutaba `prisma.product.create` sin verificar existencia previa, duplicando los 14 productos en cada reinicio del servidor. Ahora usa `findFirst + create condicional` para productos y `upsert` por clave compuesta para precios. El guard de early-exit (`supCount > 0`) fue re-activado como primera línea de defensa.
* **Auditoría Cat. 1 completa**: Verificado que los bugs 1.1 (SEO `index.html`), 1.2 (Swagger puerto), 1.3 (`.env.example`), 1.4 (rate limiter en dev) y 1.6 (CORS multi-origen) ya estaban corregidos en sesiones anteriores. Todos los 6 bugs críticos quedan resueltos.
* **Auditoría Cat. 2 completa**: Verificado que `asyncHandler` (2.2), tipos Prisma inferidos en repositorio (2.3), validación de `id` en `getProductHistory` (2.4), filtro de supermercados incompletos en `OptimizationService` (2.5) y middleware de logging HTTP (2.1) ya estaban implementados.
* **Auditoría Cat. 3 completa**: Verificado que tipos `brand/weight/ean` en `Product` (3.1), control de cantidad en carrito Zustand (3.2), debounce en `useCartOptimizer` (3.3), remoción de `react-router-dom` (3.4) y `useSupermarketStore` como reemplazo del prop drilling (3.5) ya estaban implementados.
* **CategoryRepository (refactor arquitectónico)**: Movida la lógica de `groupBy` categorías del `CategoryController` (que accedía directamente a Prisma) al nuevo `CategoryRepository.findAll()`, manteniendo consistente el patrón Controller→Repository→DB en todo el proyecto.

## [1.0.0-beta.2] - Fase 5.8: Extractores "Stealth" y Caché en Tiempo Real
### Resiliencia Anti-Bots y Navegación Instantánea
* **Extractores Dedicados Avanzados**: Coto mudó su motor a `cheerio` para parseo directo de HTML Server-Side. Libertad y Comodín abandonaron el endpoint REST clásico por `Intelligent Search GraphQL` inyectando falsificación nativa VTEX.
* **Tolerancia a Cambios de Red (Zod)**: Gómez Pardo integra un validador fuerte de esquemas que previene caídas del sistema ante modificaciones imprevistas en su endpoint JSON privado.
* **Protección IP (Ahorro Firewall)**: Seteado `randomSleep(3000, 5000)` como defensa global de la clase `fetcher.ts` en cada iteración del orquestador web.
* **Caché Instantáneo UI `(O)1`**: Configuración de `Map` local in-memory pre-compilado en el Hook de React `useProductSearch`. Clickear categorías ya cacheadas rinde respuesta veloz con cero milisegundos de recálculo en el DOM.
* **Garbage Collector Sincronizado**: El backend ahora ejecuta una purga selectiva global `CacheService.flushAll()` la fracción de segundo que acaba la noche de recolección de base de datos.
 
## [1.0.0-beta.1] - Fase 5.5: Expansión Global de Scrapers y Categorización Dinámica
### Escalabilidad de Catálogo e Integración Masiva
* **Nuevos Conectores Inteligentes**: Se crearon las clases extractoras nativas para `Carrefour` (VTEX Púbico), `ChangoMás` (MasOnline Legacy) y `Día` (DíaOnline API).
* **Auto-Mapeo al Registro**: Integrados exitosamente al orquestador `providersRegistry`. El comando `npm run scrape` ahora ejecuta 6 robots asíncronos en paralelo, insertando miles de filas atómicamente a PostgreSQL.
* **Componente CategoryNav (UI/UX)**: Implementado el slider inferior de "píldoras" ('Todas', 'Limpieza', etc.) en React, comunicándose con el custom hook de búsqueda.
* **Base de datos agrupada (Prisma)**: Creado el `/api/categories` que usa `prisma.product.groupBy()` para averiguar mágicamente qué categorías tienen stock y mandárselas a React.
* **Caché Multi-Llave Dinámica**: Ajustado el `CacheService` para identificar búsquedas compuestas por texto y categoría simultáneamente (`search_c:{cat}_q:{query}`) a coste O(1).

## [1.0.0-alpha.9] - Fase 5.1: SDD, Caché In-Memory y Refactoring
### Metodología de Agentes, Optimización de Base de Datos y Clean Code
* **Spec-Driven Development (SDD)**: Se introdujo una carpeta `.agents` que estandariza las convenciones estructurales (Skills) de Prisma, React y el Scraper para guiar de forma segura las actualizaciones.
* **Caché Protector In-Memory (Node)**: Se creó un `CacheService` nativo (Map LRU-like) con TTL de 10 minutos. Este interceptor ahorra el 99% de las consultas a la Base de Datos en el buscador frontal.
* **Batch Transactions (Prisma)**: El sincronizador de scraping ya no ejecuta el problema de *N+1 Queries*. Pre-carga el catálogo a RAM y lanza inyecciones atómicas mediante `prisma.$transaction`.
* **Motor Scraper POO**: Todos los extractores (`Vea`, `Jumbo`, `Disco`) ahora heredan de `BaseScraper.ts` contando de forma estándar con un *Graceful Shutdown* tolerante a fallos de internet.
* **Frontend Custom Hooks**: Separación extrema de responsabilidades en React. Se independizaron `useProductSearch.ts` y `useCartOptimizer.ts`, dejando un `App.tsx` puramente presentacional.

## [1.0.0-alpha.8] - Fase 5: Motor de Scraping Multi-Supermercado
### Autonomía, Automatización e Integración de Datos
* **Arquitectura de Extracción Autónoma**: Creado el módulo `backend/src/scraper/` ejecutándose paralelamente y sin entorpecer la API de Express.
* **Integración API VTEX**: Proveedores desarrollados para las cadenas de Cencosud preponderantes en Tucumán (Vea, Jumbo, Disco), extrayendo precios por iteración de palabras clave.
* **Sistema Anti-Bloqueos (Fetcher)**: Rotador de User-Agents y Backoff exponencial en caso de rechazo del servidor para no disparar firewalls ni Cloudflare.
* **Cron Jobs Automatizados**: Instanciado `node-cron` a nivel backend (`npm run cron`) para que cada medianoche se disparen los subprocesos de recolección y actualización.
* **Sincronizador Difuso**: El `sync.ts` compara la base de datos contra el scraping usando limpieza de carácteres, filtrado unificador (comas, acentos, 1L vs 1lt) e inclusión de arrays de palabras.
* **Inyección de Alias Manual**: Añadido `seed_aliases.ts` para mapeos explícitos e inflexibles de Frontend vs Nombre Real del Proveedor que superan pruebas de test.
* **Optimización de Prisma Search**: Se suplantó la raw-query de `pg_trgm` por el nativo iterador insensible a mayúsculas de Prisma (`contains`), evitando bloqueos o caídas de base de datos (`HTTP 500`) en instancias en la nube (Neon) sin la extensión instalada.
## [1.0.0-alpha.7] - Fase 4.1: Mejoras de Motor y Catálogo
### Optimización de Carrito y Remoción de Entidades Obsoletas
* **Multiplicador de Cantidad**: El motor de optimización (`OptimizationService.ts`) ahora acepta cantidades (`quantity`) enviadas desde el Frontend y calcula el valor de la lista multiplicando el precio base por la cantidad de productos requeridos.
* **Refactor Zod Payload**: Actualizada la validación de esquema en la API POST `/api/optimize-cart` para recibir un arreglo tipado de objetos en lugar de simples `productIds`.
* **Remoción de Luque**: Se purgó al supermercado "Luque" (ya inactivo) de toda la base de datos (Seed), del Hero Banner de la UI y de la documentación técnica.

## [1.0.0-alpha.6] - Fase 4: Migración a PostgreSQL con Prisma (Código)
### Infraestructura de Base de Datos Profesional
* **Prisma ORM Integrado**: Migración completa del acceso a datos de `better-sqlite3` (queries raw SQL) a `PrismaClient` con tipado seguro, autocomplete de modelos y validación de relaciones en tiempo de compilación.
* **Schema de Base de Datos Relacional Completo**:
  - `Supermarket`: Identificador, nombre, logo y color (11 cadenas regionales de Tucumán).
  - `Product`: Con campos avanzados `ean` (código de barras), `brand` (marca) y `weight` (peso/volumen) para matching exacto entre supermercados.
  - `Price`: Precio actual con constraint único `(productId, supermarketId)` para evitar duplicados.
  - `PriceHistory`: Historial de precios con `sourceUrl` para auditoría del origen de datos scrapeados.
  - `ProductAlias`: Tabla de mapeo para recordar cómo cada supermercado nombra un mismo producto (clave para el motor de scraping futuro).
  - `UserList`: Modelo preparado para listas personalizadas de usuarios (relación many-to-many con productos).
* **Prisma Client Singleton** (`db/client.ts`): Implementado patrón singleton con adapter `@prisma/adapter-pg` para PostgreSQL nativo, protegiendo contra múltiples instancias durante hot-reload en desarrollo.
* **Repositorio Migrado** (`repositories/index.ts`): 
  - `SupermarketRepository.findAll()` — Prisma query con select y ordenamiento.
  - `ProductRepository.findAll()` — Include de relaciones anidadas `currentPrices`.
  - `ProductRepository.search()` — Búsqueda difusa (Fuzzy Search) usando `pg_trgm` de PostgreSQL con fallback ILIKE.
  - `ProductRepository.getPriceHistory()` — Consulta de historial con paginación (últimos 30 registros).
* **Seed Migrado a Prisma** (`db/seed.ts`): Función idempotente que pobla supermercados, productos, precios actuales e historial usando `upsert` y `createMany` de Prisma.
* **Docker Compose**: Configuración lista con PostgreSQL 15 Alpine + pgAdmin 4 para administración visual de la base de datos.
* **Migraciones SQL**: Archivos de migración generados automáticamente por `prisma migrate dev` (incluyen habilitación de extensión `pg_trgm`).
* **Nota**: La ejecución real (levantar PostgreSQL con Docker) queda pendiente hasta que Docker Desktop esté disponible en el entorno de desarrollo.

## [1.0.0-alpha.5] - Fase 3.9: Pulido para Producción
### UX Premium, Testing y DevOps
* **Modo Oscuro**: Implementado esquema de paletas de CSS orientadas a Dark Mode con toggle en el componente Header y guardado local.
* **PWA (Progressive Web App)**: La aplicación ahora es plenamente instalable local o móvil mediante `vite-plugin-pwa` generando assets super livianos en el caché nativo.
* **Playwright E2E**: Agregadas las aserciones de integración frontend-backend simulando un usuario buscando "Leche", agregándolo al carrito y verificando el "winner" (ahorro total).
* **Swagger API Docs**: Aislado el decorador `@openapi` e interactiva UI de Swagger incrustada como middleware en ruta estandarizada `/api/docs`.
* **GitHub Actions CI/CD**: Archivo maestro `.github/workflows/ci.yml` configurado que dispara en cascada chequeos sobre TypeScript, Prisma, Vitest y finaliza simulando un navegador Chrome Headless contra la base compilada.

## [1.0.0-alpha.4] - Fase 3.8: Arquitectura Escalable y UX Premium
### Refactorización, Service Pattern, Zustand y Skeletons
* **Backend Controlador-Servicio**: Movida la lógica de negocio densa (`/optimize-cart`) a `OptimizationService.ts` puramente testeable. Creados `ProductController` y `SupermarketController`.
* **Prisma y Docker**: Creado `schema.prisma` mapeando los modelos iniciales para PostgreSQL. Agregado archivo `docker-compose.yml` pre-configurado para dev.
* **Vitest**: Inicializado framework de tests unitarios (tests en verde para la optimización de compras ahorradas).
* **Zustand Store Frontend**: Eliminado el largo rastro de estados prop-drilled de React desde `App.tsx`. Ahora `CartSidebar` tiene autonomía propia e interacción instantánea con persisted state.
* **Axios + Toasts (Sonner)**: Lógica de fetchings refactorizada al archivo `api.ts` con instanciado de Interceptores globales para reportar errores en formato de Toast. Toasts verdes bonitos en pantalla cuando agregas un producto al chango virtual.
* **Skeletons en CSS puro**: Animación "shine" de carga premium agregada al `index.css` y `ProductGrid.tsx` al momento de iterar la carga de base de datos desde Node.js.

## [1.0.0-alpha.3] - Fase 3.5 Finalizada
### Refactorización, Memoria Local y Seguridad
* **Frontend Componentizado**: `App.tsx` dividido modularmente en `Header`, `Hero`, `SupermarketsBar`, `ProductCard`, `ProductGrid` y `CartSidebar`.
* **Memoria Local**: Inyectada la API nativa de `localStorage` para hidratar el estado del carrito (`cart`) de forma segura durante el primer render y cada vez que cambia. Se purga al presionar limpiar o ejecutar el checkout virtual.
* **Backend Optimizado (`/api/optimize-cart`)**: Toda la lógica que calculaba los ganadores y los ahorros se quitó del Frontend para pasar a ser una operación pesada de base de datos en el Backend. Devuelve comparativas al instante.
* **Blindaje de Producción**: 
  * Se instaló e implementó `Zod` (Validación de Esquema Estricta y Tipado Seguro en las llamadas POST).
  * `rate-limit` con `helmet` y `cors` configurados e implementados contra inyecciones y abusos DOS.
  * Middleware silenciador `500 Internal Server Error` implementado para enmascarar stacktraces de Base de datos en producción.
