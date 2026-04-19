# Plan de Proyecto: Ahorro Tuc

## 1. Visión General
**Ahorro Tuc** es una aplicación web (optimizada para dispositivos móviles y web) que permite a los usuarios de la provincia de Tucumán comparar precios de productos de supermercados (Coto, Carrefour, Jumbo, Vea, Disco, Día, Gómez Pardo, ChangoMás, Libertad, Comodín) en tiempo real, ayudándolos a encontrar la opción más barata. Además, permite cargar una lista de compras y calcular el total en cada supermercado y el ahorro estimado.

## 2. Arquitectura del Sistema (Tech Stack)
* **Frontend**: React (creado con Vite), TypeScript, CSS Vanilla (con variables y un diseño estético moderno, animado y glassmorphism).
* **Backend**: Node.js con Express, TypeScript (para seguridad de tipos).
* **Base de Datos**: PostgreSQL (ideal para búsquedas relacionadas y catálogos de productos grandes con variación de precios). Prisma ORM como capa de acceso de datos.
* **Scraping / Datos**: Scripts dedicados en Node.js (con Puppeteer o Cheerio) o Python (BeautifulSoup) para ingestar datos de precios diariamente.

## 3. Fases de Desarrollo

### FASE 1: Estructura Base y Mock Data (Completada ✅)
- [x] Inicializar repositorio local monorepo (`frontend/` y `backend/`).
- [x] Configurar TypeScript y CSS en el frontend, preparando un sistema de variables globales modernas.
- [x] Configurar Express en el backend con TypeScript.
- [x] Crear un catálogo de productos mockeados (JSON) que simulen tener diferentes precios en distintas cadenas. (Hecho con SQLite)
- [x] Conectar frontend y backend usando fetch o axios.

### FASE 2: UI Principal y Buscador (Completada ✅)
- [x] Diseñar Navbar y layout responsivo.
- [x] Crear la página de Inicio con el **Buscador de autocompletado**.
- [x] Crear tarjeta de Producto (Product Card) que muestre el precio en las distintas cadenas.
- [x] Crear el "Carrito de Compras / Mi Lista".

### FASE 3: Lógica de Optimización (Completada ✅)
- [x] Implementar la lógica en el backend que reciba una "Lista de productos deseados".
- [x] El backend calculará, para esa lista particular, cuál supermercado ofrece el precio total más bajo.
- [x] Mostrar en el frontend el Supermercado recomendado, el precio total, y el "Ahorro" vs la opción más cara.

### FASE 3.5: Refactorización y Seguridad Extrema (Completada ✅)
- [x] Mover el monstruoso `App.tsx` a múltiples componentes ordenados (`Navbar`, `Sidebar`, etc.)
- [x] Implementar memoria caché (`localStorage`) estricta para guardar el changecart de usuario.
- [x] Implementar **Zod** para saneamiento estricto de endpoints POST.
- [x] Configurar CORS rígido y un silenciador de errores globales de Express (para no filtrar stack-traces).

### FASE 3.8: Arquitectura Escalable y UX Premium (Completada ✅)
- [x] **Backend**: Implementar patrón Controlador-Servicio (`controllers` y `services`).
- [x] **Backend**: Preparar ORM (Prisma) y arquitectura para PostgreSQL (Neon).
- [x] **Backend**: Configurar `Vitest` y escribir tests unitarios para `OptimizationService`.
- [x] **Frontend**: Refactorizar llamadas de backend usando `Axios` e Interceptores globales.
- [x] **Frontend**: Centralizar el estado del carrito usando `Zustand` globalmente (`store.ts`).
- [x] **Frontend**: Añadir Toast Notifications (`Sonner`) y Skeleton Loaders (animaciones completas en CSS) para UX.

### FASE 3.9: Pulido para Producción & Auditoría Integral (Completada ✅)
- [x] **Frontend**: Implementar Modo Oscuro (CSS Variables y `useTheme` hook).
- [x] **Frontend**: Convertir app a PWA instalable con `vite-plugin-pwa` e íconos.
- [x] **Frontend**: Crear pruebas E2E del Flujo Crítico con `Playwright`.
- [x] **Backend**: Integrar y autogenerar documentación de API con `Swagger UI`.
- [x] **DevOps**: Configurar CI/CD Pipeline automático usando GitHub Actions.
- [x] **Auditoría (MEJORAS.md)**: 30 mejoras implementadas incluyendo tipado estricto, debounce, middlewares de log, wrappers async, fixes SEO, y UI pulida (esqueletos, footer, accesibilidad).

### FASE 4: Migración a PostgreSQL con Prisma (Completada ✅)
- [x] **Schema Prisma Completo**: Modelos `Supermarket`, `Product`, `Price`, `PriceHistory`, `ProductAlias`, `UserList` con relaciones, índices y constraints.
- [x] **Campos avanzados en Product**: `ean` (Código de barras único), `brand` (Marca) y `weight` (Peso/Volumen) para matching exacto.
- [x] **Modelo ProductAlias**: Tabla relacional (`supermarketId`, `originalName`, `productId`) para mapear nombres entre supermercados.
- [x] **PriceHistory mejorado**: Campo `sourceUrl` para auditoría del origen de datos.
- [x] **Repositorio migrado a PrismaClient**: `repositories/index.ts` usa 100% Prisma con Fuzzy Search (`pg_trgm`).
- [x] **PrismaClient singleton**: `db/client.ts` con patrón singleton usando adapter `@prisma/adapter-pg`.
- [x] **Seed con Prisma**: `db/seed.ts` migrado para crear supermercados, productos, precios e historial usando PrismaClient.
- [x] **Base de Datos Cloud**: Transición a PostgreSQL Serverless con Neon.tech realizada exitosamente.
- [x] **Migraciones generadas**: Archivos SQL de migración aplicados directamente a esquema de base de datos nube (`prisma db push`).
- [x] **Ejecución de Migración**: Conectados a Neon.tech mediante variables de entorno, esquema sincronizado y base de datos con seeding inicial.

### FASE 5: Actualizador de Precios & Extractores Stealth (Completada ✅)
- [x] **Arquitectura Segura y Orquestador**: Script independiente en `/src/scraper` que no contamina el servidor Express usando `node-cron` a medianoche.
- [x] **Desarrollar Proveedores (Cencosud)**: Extracción operativa leyendo desde las APIs internas ocultas de VTEX (Vea, Jumbo, Disco).
- [x] **Sistemas Anti-Bloqueo**: Cliente HTTP propio (`core/fetcher.ts`) con reintentos escalonados, rotación dinámica de `User-Agent`.
- [x] **Algoritmo de Homogeneización**: Sincronizador de base de datos (`sync.ts`) con matching difuso avanzado (sanitiza strings, detecta inclusiones) ignorando los fallos.
- [x] **Gestor de Alias Manual**: Inyectador `seed_aliases.ts` para mapeos directos en Edge-Cases muy crudos de nombres entre empresas.

### FASE 9: Performance y Escalabilidad del Backend (Completada ✅)
- [x] **Fuzzy Matching O(N²) → O(M log N)**: Reemplazado el loop lineal por **índice invertido** (`word → Set<productId>`). Construcción O(N_db × W) una vez por sync, lookup O(1) por palabra scrapeada. Reducción de ~18,500 a ~8 operaciones con catálogo actual. Normalización mejorada de unidades (`500 gr→500g`, `1000g→1kg`, tildes, puntuación).
- [x] **Caché Redis para Escalabilidad Horizontal**: `CacheService` ahora usa arquitectura dual — writes a in-memory (sync) + Redis (fire-and-forget async). Reads ultrarrápidos desde in-memory con `getAsync()` disponible para migración gradual. Fallback transparente a in-memory si `REDIS_URL` no está configurado. Redis 7 Alpine agregado a `docker-compose.yml` con LRU eviction y AOF persistence. Credenciales de pgAdmin securitizadas via variables de entorno.

### FASES FUTURAS (Roadmap 🚀)
- [x] **Expansión a Nuevos Gigantes**: Scrapeo avanzado en plataformas VTEX IO/GraphQL (Carrefour, ChangoMás, Día).
- [x] **Scraping Complejo "Stealth"**: Uso cruzado de `cheerio` para parsear HTML de Coto, inyecciones Header en Libertad/Comodín y validadores orgánicos `Zod` (G. Pardo) junto a iteradores anti-bloqueo aleatorio.
- [x] **Experiencia Gráfica (Historiales)**: Paneles desplegables en el Frontend dibujando la caída/subida del precio a lo largo del mes con `Recharts`.
- [ ] **Gestión de Usuarios (Fase 8)**: Sistema de autenticación para guardar carritos en la nube, marcarlos como favoritos y generar "Ticket de Compra PDF" o links directos a WhatsApp.
- [x] **Navegación Intuitiva de Categorías `O(1)`**: UI paralela interactiva con prefetching `in-memory` alojado a nivel del DOM reactivo.
- [x] **Infraestructura Caché Automática**: Implementación exitosa de capa `In-Memory TTL Cache` amortizando la DB y un `flushAll()` dinámico atado al crontab del backend.
- [x] **Filtros Avanzados de Búsqueda**: Filtros por precio, marca, stock y ordenamiento. FilterBar UI con panel colapsable. Backend con query params avanzados.
- [x] **Compartir por WhatsApp**: Botón en `CartSidebar` con texto formateado de lista optimizada + ahorros.
- [x] **Generación de Ticket PDF**: PDF profesional descargable desde el carrito con lista de compras, precios y totales.

### FASE 7: Motor Híbrido y Visualización (Completada ✅)
- [x] **Cálculo de Carrito Híbrido**: El optimizador ahora te indica cómo dividir la compra en dos cadenas para lograr el precio mínimo absoluto.
- [x] **Integración Visual (Recharts)**: Las tarjetas de los productos ahora se expanden revelando un gráfico de curvas suave indicando la evolución de los precios en el tiempo.

### PROPUESTAS DE ARQUITECTURA (Mejoras Sugeridas 💡)
- [ ] **Data-Lake Engine**: Desacoplar la base de datos Scraper hacia una base analítica paralela separada del Backend de React (Ej: BigQuery) si almacenamos históricamente años de precios diarios.
- [ ] **Alerta de Ofertón (Notificaciones)**: Implementar Web Push Notifications. El Backend, al ver un "Drop" (descuento del 40% súbito en Leche) alerta a los usuarios suscriptos de la bajada masiva.
- [ ] **Monitor de Integridad & Logs vía Bot**: Si el diseño web de Coto cambia y rompe las estrofas de `cheerio`, un bot de Discord de la aplicación detecta el error en Try/Catch nocturno y avisa a los ingenieros de la rotura para un fix Rápido.

### FASE 13: Mejoras de Scraping y Catálogo Dinámico (Completada ✅)
- [x] **Endpoint HTTP para Trigger Manual**: `POST /api/scraper/trigger` ejecuta scraping síncrono sin BullMQ/Redis. Opcional `?provider=X`.
- [x] **Paginación en Intelligent-Search**: Carrefour, Libertad, Comodin ahora traen hasta 5 páginas (75 productos vs 15 anteriores).
- [x] **Creación Automática de Productos**: Sync engine crea productos nuevos cuando no encuentra match. Inferencia de categoría y extracción de peso/volumen.
- [x] **Catálogo Dinámico**: El catálogo crece automáticamente con cada scrapeo, sin intervención manual.

### FASE 8: Gestión de Usuarios, Seguridad y Escalabilidad (En Progreso �)
- [x] **Modelo User en Prisma**: Creado `User` con `id`, `email`, `passwordHash`, `name`, `createdAt`. Relación `UserList.userId` → `User.id` lista para Fase 8.2.
- [x] **Autenticación JWT**: AuthService con bcrypt + jsonwebtoken. Middleware `authenticateToken`. Endpoints `/api/auth/register`, `/api/auth/login`, `/api/auth/me`.
- [x] **Frontend Auth**: AuthModal (Login ↔ Register), useAuthStore (Zustand + persist), Axios 401 interceptor, Header con login/logout.
- [x] **Scraper Health Persistence**: Modelo `ScraperLog` con logs por proveedor y resumen global. Endpoint `/api/scraper/status` consulta DB (sobrevive reinicios). Nuevo `/api/scraper/logs`.
- [ ] **Magic Links (Auth sin contraseña)**: Alternativa opcional — envío de email con token de un solo uso.
- [ ] **CRUD de Listas de Usuario**: Endpoints protegidos para guardar/carritos entre dispositivos.
- [ ] **Favoritos de Productos**: Modelo `UserFavorite` (`userId`, `productId`).
- [ ] **Alertas Discord/Slack**: Webhook `DISCORD_WEBHOOK_URL` al fallar un provider.
- [x] **Generación de Ticket PDF**: PDF profesional descargable desde el carrito con lista de compras, precios y totales.
- [x] **Compartir por WhatsApp**: Botón en `CartSidebar` con texto formateado con lista optimizada + ahorros.
- [x] **Cursor-based Pagination**: `ProductRepository.findAllPaginated()` con `?cursor=X&limit=Y`. Frontend `loadMore()`.
- [x] **Optimización de Fuzzy Matching**: Reducir O(N²) a O(M log N) con índice invertido.
- [x] **Scrapers en Paralelo**: `Promise.allSettled()` con timeout individual.
- [x] **Migrar CacheService a Redis**: Adapter opcional con `REDIS_URL`, fallback a in-memory.
- [ ] **Timeout en Cron Scraper**: `spawn()` con timeout de 30 minutos.
- [x] **Estado Vacío de Búsqueda**: Componente `EmptyState` con icono, mensaje y sugerencias.
- [x] **Precio por Unidad**: Campo `unitPrice` en modelo `Product`. (Normalización Kg/L/U)
- [x] **Loading State en Optimización**: `isOptimizing` en hook + spinner.
- [x] **Persistencia Warning**: Toast si `localStorage` no está disponible.
- [x] **Tests de Scrapers**: Tests unitarios para `fuzzyMatch()`, `sanitizeName()`, retry logic.
- [x] **Limpiar Dependencias Muertas**: Removidos `ts-node`, `@types/helmet`, `react-router-dom`.
- [x] **Tipar todos los `any`**: `HybridResult`, `ScrapeStat`, `Error & { statusCode }`.
- [x] **pgAdmin Credenciales Seguras**: Variables de entorno en docker-compose.
- [x] **Expansión de Scrapers — Términos x5**: 11 scrapers de 4-8 términos a **34 términos** (10 categorías).
- [x] **Maxiconsumo**: 12° cadena agregada (VTEX Classic, `#ff8c00`).
- [x] **La Anónima**: 13° cadena agregada (VTEX Classic, `#1a5276`).
- [x] **Backend Performance (Compresión)**: Middleware `compression` activo.
- [x] **Política de Retención**: Limpieza semanal de datos > 3 meses.
- [x] **Concurrencia Configurable**: `SCRAPER_CONCURRENCY` vía ENV.
- [x] **Frontend Performance**: Bundle shaving (-57%), Lazy Loading, Memoization y Image optimization.

## Notas para Desarrollo IA
Este documento servirá para no olvidar el contexto del proyecto y en qué fase estamos. Continuar refiriéndose a este `PLANNING.md` para seguir avanzando en cada tarea sugerida.
