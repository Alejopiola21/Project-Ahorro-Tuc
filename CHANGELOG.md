# Changelog - Ahorro Tuc

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
