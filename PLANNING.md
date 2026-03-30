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

### FASE 5: Actualizador de Precios (Motor de Scraping) (Completada ✅)
- [x] **Arquitectura Segura y Orquestador**: Script independiente en `/src/scraper` que no contamina el servidor Express usando `node-cron` a medianoche.
- [x] **Desarrollar Proveedores (Cencosud)**: Extracción operativa leyendo desde las APIs internas ocultas de VTEX (Vea, Jumbo, Disco).
- [x] **Sistemas Anti-Bloqueo**: Cliente HTTP propio (`core/fetcher.ts`) con reintentos escalonados, rotación dinámica de `User-Agent`.
- [x] **Algoritmo de Homogeneización**: Sincronizador de base de datos (`sync.ts`) con matching difuso avanzado (sanitiza strings, detecta inclusiones) ignorando los fallos.
- [x] **Gestor de Alias Manual**: Inyectador `seed_aliases.ts` para mapeos directos en Edge-Cases muy crudos de nombres entre empresas.

### FASES FUTURAS (Roadmap 🚀)
- [ ] **Expansión a Nuevos Gigantes**: Scrapeo avanzado en plataformas VTEX IO/GraphQL (Carrefour, ChangoMás).
- [ ] **Experiencia Gráfica (Historiales)**: Paneles desplegables en el Frontend dibujando la caída/subida del precio a lo largo del mes con `Recharts`.
- [ ] **Gestión de Usuarios (Fase 6)**: Sistema de autenticación para guardar carritos en la nube, marcarlos como favoritos y generar "Ticket de Compra PDF" o links directos a WhatsApp.
- [ ] **Navegación por Categorías**: UI moderna para descubrir productos por departamento en lugar de una búsqueda a ciegas.
- [x] **Infraestructura Caché**: Implementación exitosa de capa `In-Memory TTL Cache` mitigando costos de transacciones difusas sin requerir contenedores Redis inmediatos.

## Notas para Desarrollo IA
Este documento servirá para no olvidar el contexto del proyecto y en qué fase estamos. Continuar refiriéndose a este `PLANNING.md` para seguir avanzando en cada tarea sugerida.
