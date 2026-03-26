# Changelog - Ahorro Tuc

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
