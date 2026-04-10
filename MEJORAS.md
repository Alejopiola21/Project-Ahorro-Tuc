# 🔍 Auditoría Completa y Mejoras Propuestas — Ahorro Tuc

> **Fecha de auditoría:** 28 de Marzo de 2026  
> **Archivos revisados:** Todos los archivos del proyecto (backend + frontend + CI/CD + configs)  
> **Objetivo:** Identificar problemas reales, mejoras de arquitectura y oportunidades de pulido sin romper nada existente.

---

## 🐛 Categoría 1: Bugs y Problemas Reales (Prioridad CRÍTICA)

### 1.1 `index.html` — SEO y metadata rotos (✅ COMPLETADO)
- **Archivo:** `frontend/index.html`
- **Problema:** El título dice `"frontend"` (genérico) y el idioma está en inglés (`lang="en"`) cuando la app es 100% en español.
- **Actual:**
```html
<title>frontend</title>
<html lang="en">
```
- **Fix:**
```html
<html lang="es">
<title>Ahorro Tuc — Comparador de precios en Tucumán</title>
<meta name="description" content="Compará precios de supermercados en Tucumán. Encontrá el más barato entre Coto, Carrefour, Jumbo, Vea, Día y más." />
```

---

### 1.2 Swagger `servers.url` hardcodeado en puerto incorrecto (✅ COMPLETADO)
- **Archivo:** `backend/src/swagger.ts` (línea 15)
- **Problema:** La URL del servidor Swagger apunta al puerto `5000`, pero el backend usa el puerto `3001`.
- **Actual:**
```ts
url: 'http://localhost:5000',
```
- **Fix:** Usar la variable `PORT` del entorno:
```ts
url: `http://localhost:${process.env.PORT || 3001}`,
```

---

### 1.3 `backend/.env` está ignorado por Git pero no hay `.env.example` (✅ COMPLETADO)
- **Archivo:** `.gitignore` / `backend/.env`
- **Problema:** El archivo `.env` tiene credenciales de la base de datos. Si alguien clona el repo, no tendrá `.env`, y el servidor crasheará sin un mensaje claro de qué configurar.
- **Fix:** Crear `backend/.env.example` con valores de ejemplo y documentar el setup en README:
```env
PORT=3001
NODE_ENV=development
DATABASE_URL="postgresql://USER:PASSWORD@localhost:5432/DB_NAME?schema=public"
```

---

### 1.4 El rate limiter es demasiado agresivo para desarrollo (✅ COMPLETADO)
- **Archivo:** `backend/src/index.ts` (línea 24-29)
- **Problema:** 100 requests en 15 minutos es muy bajo. En desarrollo con hot-reload y fetches automáticos del frontend, se alcanza fácilmente ese límite y el frontend se queda mostrando errores.
- **Fix:** Rate limit condicional según entorno:
```ts
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: process.env.NODE_ENV === 'development' ? 1000 : 100,
    message: 'Demasiadas peticiones desde esta IP, por favor intenta de nuevo más tarde.'
});
```

---

### 1.5 El backend seed se ejecuta en CADA arranque del servidor (✅ COMPLETADO)
- **Archivo:** `backend/src/index.ts` (línea 15)
- **Problema:** `seedDatabase()` se llama automáticamente en cada `main()`. Si la DB ya tiene datos reales del scraper, esto podría causar conflictos. Además, ralentiza cada arranque.
- **Actual:** El seed verifica con `prisma.supermarket.count()`, lo que mitiga parcialmente el problema, pero sigue ejecutando una query innecesaria cada vez.
- **Fix:** Convertirlo en un script separado:
```json
// package.json
"seed": "ts-node src/db/seed.ts"
```
Y agregar flag de bypass:
```ts
if (process.env.SKIP_SEED !== 'true') {
    await seedDatabase();
}
```

---

### 1.6 El `FRONTEND_URL` en CORS no contempla múltiples orígenes en producción (✅ COMPLETADO)
- **Archivo:** `backend/src/index.ts` (línea 31)
- **Problema:** Solo soporta un origen. Si se despliega con staging + producción, habrá conflictos de CORS.
- **Actual:**
```ts
const allowedOrigins = [process.env.FRONTEND_URL || 'http://localhost:5173'];
```
- **Fix:** Soportar múltiples orígenes separados por coma:
```ts
const allowedOrigins = (process.env.ALLOWED_ORIGINS || 'http://localhost:5173').split(',');
```

---

## 🏗️ Categoría 2: Arquitectura del Backend (Prioridad ALTA)

### 2.1 Falta middleware de logging de requests HTTP (✅ COMPLETADO)
- **Problema:** No hay logs de requests. En producción no se sabe qué endpoints se llaman, con qué frecuencia, ni cuáles fallan.
- **Mejora:** Agregar middleware de logging al `index.ts`:
```ts
app.use((req, res, next) => {
    const start = Date.now();
    res.on('finish', () => {
        console.log(`[${req.method}] ${req.originalUrl} → ${res.statusCode} (${Date.now() - start}ms)`);
    });
    next();
});
```

---

### 2.2 Los controladores repiten try/catch idénticos (✅ COMPLETADO)
- **Archivos:** `ProductController.ts`, `SupermarketController.ts`, `OptimizationController.ts`
- **Problema:** Los 3 controladores tienen el mismo patrón `try { ... } catch { console.error; res.status(500) }`. Código duplicado.
- **Mejora:** Crear un wrapper `asyncHandler` en un archivo `middleware/asyncHandler.ts`:
```ts
import { Request, Response, NextFunction } from 'express';

export const asyncHandler = (fn: Function) => 
    (req: Request, res: Response, next: NextFunction) => {
        Promise.resolve(fn(req, res, next)).catch(next);
    };
```
Así el error handler global los captura automáticamente.

---

### 2.3 El repositorio usa `any` en el helper `buildProductWithPrices` (✅ COMPLETADO)
- **Archivo:** `backend/src/repositories/index.ts` (línea 18)
- **Problema:** `function buildProductWithPrices(product: any)` pierde todo el beneficio de TypeScript. Prisma genera los tipos automáticamente.
- **Fix:** Usar tipos generados por Prisma:
```ts
import { Prisma } from '@prisma/client';

type ProductWithPricesPayload = Prisma.ProductGetPayload<{ include: typeof withCurrentPrices }>;

function buildProductWithPrices(product: ProductWithPricesPayload): ProductWithPrices {
    // ... mismo código pero ahora tipado
}
```

---

### 2.4 Falta validación de parámetros en `getProductHistory` (✅ COMPLETADO)
- **Archivo:** `backend/src/controllers/ProductController.ts` (línea 20-21)
- **Problema:** No valida que `id` sea un número válido. Si alguien hace `/products/abc/history/coto`, `Number("abc")` es `NaN` y la query fallaría de manera impredecible.
- **Actual:**
```ts
const id = Number(req.params.id); // Si pasan "abc" → NaN
const supermarketId = String(req.params.supermarketId);
```
- **Fix:**
```ts
const id = Number(req.params.id);
if (isNaN(id) || id <= 0) {
    return res.status(400).json({ error: 'ID de producto inválido' });
}
```

---

### 2.5 El `OptimizationService` no maneja productos sin precios en ciertos supermercados (✅ COMPLETADO)
- **Archivo:** `backend/src/services/OptimizationService.ts`
- **Problema:** Si un producto no tiene precio en un supermercado, `totals[sup]` se mantiene en 0 para ese supermercado en ese producto, distorsionando la comparativa. Un super parece más barato simplemente porque no tiene el producto.
- **Fix:** Solo contar supermercados que tienen TODOS los productos:
```ts
// Filtrar supermercados que no tienen todos los productos
const completeSupermarkets = supermarkets.filter(s => 
    products.every(p => p.prices[s.id] !== undefined)
);
```
O al menos advertir al usuario qué productos faltan en cada super.

---

## ⚛️ Categoría 3: Frontend — React y State Management (Prioridad ALTA)

### 3.1 Los tipos de frontend no reflejan la realidad del backend (✅ COMPLETADO)
- **Archivo:** `frontend/src/types.ts`
- **Problema:** El backend devuelve `brand`, `weight` y `ean`, pero el frontend no los tiene en la interface `Product`. Se pierde información útil.
- **Actual:**
```ts
export interface Product { id: number; name: string; category: string; image: string; prices: Record<string, number>; }
```
- **Fix:**
```ts
export interface Product {
    id: number;
    name: string;
    category: string;
    image: string;
    brand: string | null;
    weight: string | null;
    ean: string | null;
    prices: Record<string, number>;
}
```

---

### 3.2 El carrito permite duplicados sin control de cantidad (✅ COMPLETADO)
- **Archivo:** `frontend/src/store.ts`
- **Problema:** `addToCart` simplemente hace `[...state.cart, product]`. Si agregás 3 veces "Leche", hay 3 objetos idénticos. No se maneja `quantity`.
- **Fix:** Reemplazar el store por un modelo con cantidades:
```ts
interface CartItem {
    product: Product;
    quantity: number;
}

interface CartState {
    cart: CartItem[];
    addToCart: (product: Product) => void;
    removeFromCart: (productId: number) => void;
    updateQuantity: (productId: number, quantity: number) => void;
    clearCart: () => void;
}

// En addToCart:
addToCart: (product) => set((state) => {
    const existing = state.cart.find(i => i.product.id === product.id);
    if (existing) {
        return { cart: state.cart.map(i => 
            i.product.id === product.id 
                ? { ...i, quantity: i.quantity + 1 } 
                : i
        )};
    }
    return { cart: [...state.cart, { product, quantity: 1 }] };
}),
```

---

### 3.3 El `optimize-cart` se llama en cada cambio de carrito sin debounce (✅ COMPLETADO)
- **Archivo:** `frontend/src/App.tsx` (líneas 54-63)
- **Problema:** El `useEffect` para optimizar el carrito se dispara en cada cambio de estado del carrito. Si el usuario agrega 5 productos rápido, se hacen 5 requests al backend seguidas.
- **Fix:** Agregar debounce al optimize-cart:
```ts
useEffect(() => {
    if (cart.length === 0) { setCartTotals(null); return; }
    const timer = setTimeout(() => {
        const productIds = cart.map(p => p.id);
        api.post('/optimize-cart', { productIds })
            .then(r => setCartTotals(r.data))
            .catch(() => {});
    }, 500);
    return () => clearTimeout(timer);
}, [cart, supermarkets]);
```

---

### 3.4 `react-router-dom` está instalado pero NO se usa (✅ COMPLETADO)
- **Archivo:** `frontend/package.json`
- **Problema:** `react-router-dom` (v7.13.1) está en dependencias pero no se importa en ningún archivo. Peso muerto en el bundle (~13KB gzipped).
- **Opciones:**
  - **A)** Removerlo: `npm uninstall react-router-dom`
  - **B)** Aprovecharlo: crear rutas como `/producto/:id` para detalle de producto con historial de precios

---

### 3.5 `getSup` y `getCheapest` se pasan como props innecesariamente (prop drilling — ✅ COMPLETADO)
- **Archivos:** `App.tsx` → `ProductGrid` → `ProductCard`
- **Problema:** Estas funciones se definen en App.tsx y se pasan por 3 niveles de componentes. Es prop drilling clásico.
- **Fix:** Dos opciones:
  - **A)** Mover `supermarkets` al store global de Zustand y crear un helper reutilizable.
  - **B)** Crear un `SupermarketContext` para compartir esos helpers.

---

## 🎨 Categoría 4: CSS y UX (Prioridad MEDIA)

### 4.1 Los skeletons no respetan dark mode (✅ COMPLETADO)
- **Archivo:** `frontend/src/index.css` (líneas 906-918)
- **Problema:** Los colores del skeleton están hardcodeados en tonos claros. En dark mode, se ven como parches blancos brillantes.
- **Actual:**
```css
.skeleton {
    background: #e2e8f0;
    background: linear-gradient(110deg, #eceff1 8%, #f5f5f5 18%, #eceff1 33%);
}
```
- **Fix:**
```css
.skeleton {
    background: var(--border);
    background: linear-gradient(110deg, var(--border) 8%, var(--surface) 18%, var(--border) 33%);
    background-size: 200% 100%;
    animation: 1.5s shine linear infinite;
}
```

---

### 4.2 Falta un footer profesional (✅ COMPLETADO)
- **Problema:** La app termina abruptamente después de los productos. No hay footer con info legal, disclaimer de precios, créditos, o links útiles.
- **Mejora:** Agregar un componente `Footer.tsx` con:
  - Disclaimer: "Precios obtenidos de fuentes públicas. Los precios pueden variar."
  - Créditos y año
  - Links a redes sociales o contacto

---

### 4.3 El botón "Optimizar compra" en el carrito no hace nada (✅ COMPLETADO)
- **Archivo:** `frontend/src/components/CartSidebar.tsx` (línea 90)
- **Problema:** El botón `checkout-btn` no tiene `onClick`. Es puramente decorativo.
- **Opciones de Fix:**
  - Scroll al supermercado ganador con animación
  - Generar un resumen compartible (link/imagen)
  - Mostrar detalle expandido de ahorros por producto
  - Abrir WhatsApp con la lista formateada

---

### 4.4 Falta accesibilidad (a11y) básica (✅ COMPLETADO)
- **Archivos:** Varios componentes
- **Problemas encontrados:**
  - Los supermarket chips no tienen `aria-label`
  - El sidebar del carrito no atrapa el foco al abrirse (keyboard trap)
  - No hay `role="navigation"`, `role="main"`, `role="complementary"` en secciones
  - Las imágenes de productos usan `product.name` como alt, pero podría ser más descriptivo
  - No se puede cerrar el sidebar con la tecla `Escape`
- **Fix:** Agregar atributos ARIA, focus trap en el sidebar, y handler de tecla Escape.

---

### 4.5 Animación excesiva del logo distrae (✅ COMPLETADO)
- **Archivo:** `frontend/src/index.css` (líneas 102-117)
- **Problema:** La animación `pulse` del logo es `infinite`. Es una distracción sutil pero constante.
- **Fix:**
```css
.logo-icon {
    animation: pulse 3s ease 3; /* Solo 3 repeticiones al cargar */
}
```

---

## 🧪 Categoría 5: Testing y CI/CD (Prioridad MEDIA)

### 5.1 El CI no levanta PostgreSQL → el backend-test va a fallar (✅ COMPLETADO)
- **Archivo:** `.github/workflows/ci.yml`
- **Problema:** El job `backend-test` genera Prisma y corre tests, pero no hay un servicio PostgreSQL disponible. Si los tests o el build requieren la DB, fallarán.
- **Fix:** Agregar servicio PostgreSQL al job:
```yaml
backend-test:
    runs-on: ubuntu-latest
    services:
      postgres:
        image: postgres:15-alpine
        env:
          POSTGRES_USER: test_user
          POSTGRES_PASSWORD: test_pass
          POSTGRES_DB: test_db
        ports:
          - 5432:5432
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
    env:
      DATABASE_URL: postgresql://test_user:test_pass@localhost:5432/test_db?schema=public
```

---

### 5.2 Los tests E2E asumen que el backend tiene datos (✅ COMPLETADO)
- **Archivo:** `frontend/tests/critical-flow.spec.ts`
- **Problema:** El test busca "Leche" y espera encontrar resultados. Si la DB está vacía o el seed no corrió, el test falla silenciosamente.
- **Fix:** Agregar un paso previo en el CI que corra el seed, o crear fixtures independientes para tests.

---

### 5.3 Cobertura de testing muy baja (solo 2 tests en total — ✅ COMPLETADO)
- **Archivos:** 1 test unitario (`OptimizationService.test.ts`), 1 test E2E (`critical-flow.spec.ts`)
- **Problema:** La cobertura es mínima. Faltan tests para:
  - Validación de Zod en `OptimizationController` (payloads inválidos)
  - `ProductRepository.search()` con queries vacías, inyección SQL, caracteres especiales
  - `SupermarketController.getSupermarkets()` 
  - Frontend: tests de componentes con React Testing Library
  - Edge cases del `OptimizationService` (carrito vacío, producto sin precios)

---

### 5.4 No hay linting en el CI (✅ COMPLETADO)
- **Problema:** Ni backend ni frontend ejecutan `npm run lint` en el pipeline de CI. Errores de estilo y potenciales bugs pasan desapercibidos.
- **Fix:** Agregar paso de lint en ambos jobs del CI:
```yaml
- name: Lint
  run: npm run lint
```

---

## 📦 Categoría 6: DevOps y Configuración (Prioridad BAJA)

### 6.1 El backend usa `ts-node` en producción (✅ COMPLETADO)
- **Archivo:** `backend/package.json`
- **Problema:** Tanto `dev` como `start` usan `ts-node src/index.ts`. En producción, `ts-node` es significativamente más lento y consume más memoria que ejecutar JavaScript compilado.
- **Actual:**
```json
"dev": "ts-node src/index.ts",
"start": "ts-node src/index.ts"
```
- **Fix:**
```json
"dev": "tsx watch src/index.ts",
"start": "node dist/index.js",
"build": "tsc"
```

---

### 6.2 No hay hot-reload en development del backend (✅ COMPLETADO)
- **Problema:** Cada cambio en el código del backend requiere reiniciar manualmente el servidor.
- **Fix:** Instalar `tsx` y usarlo con `watch`:
```json
"dev": "tsx watch src/index.ts"
```

---

### 6.3 El `docker-compose.yml` usa `version: '3.8'` (deprecated — ✅ COMPLETADO)
- **Archivo:** `backend/docker-compose.yml` (línea 1)
- **Problema:** Las versiones recientes de Docker Compose (v2+) ignoran el campo `version`. No rompe nada pero es obsoleto y genera warnings.
- **Fix:** Remover la línea `version: '3.8'`.

---

### 6.4 Falta `.env.example` para onboarding de nuevos desarrolladores (✅ COMPLETADO)
- **Problema:** Alguien nuevo que clone el proyecto no sabe qué variables de entorno necesita configurar.
- **Fix:** Crear archivos `.env.example` en `backend/` y `frontend/`:

**`backend/.env.example`:**
```env
PORT=3001
NODE_ENV=development
DATABASE_URL="postgresql://USER:PASSWORD@localhost:5432/DATABASE?schema=public"
ALLOWED_ORIGINS=http://localhost:5173
SKIP_SEED=false
```

**`frontend/.env.example`:**
```env
VITE_API_URL=http://localhost:3001/api
```

---

### 6.5 El README principal no tiene instrucciones de setup (✅ COMPLETADO)
- **Archivo:** `README.md`
- **Problema:** El README no incluye instrucciones paso a paso para instalar, configurar y correr el proyecto localmente.
- **Fix:** Agregar sección de setup con:
  1. Requisitos previos (Node.js, PostgreSQL)
  2. Clonar el repo
  3. Configurar `.env` (copiar de `.env.example`)
  4. Instalar dependencias (`npm install` en ambos directorios)
  5. Configurar base de datos
  6. Correr el proyecto (`npm run dev` en ambos)

---

## 📊 Resumen Ejecutivo

| Prioridad | Categoría | Items | Esfuerzo estimado |
|---|---|---|---|
| 🔴 CRÍTICA | Bugs y Problemas Reales | 6 | ~1 hora |
| 🟠 ALTA | Arquitectura Backend | 5 | ~2 horas |
| 🟠 ALTA | Frontend React/State | 5 | ~2 horas |
| 🟡 MEDIA | CSS y UX | 5 | ~1.5 horas |
| 🟡 MEDIA | Testing y CI/CD | 4 | ~2 horas |
| 🟢 BAJA | DevOps y Config | 5 | ~1 hora |
| | **TOTAL** | **30** | **~9.5 horas** |

## Orden Recomendado de Ejecución

1. **Cat. 1** — Arreglar bugs críticos (lo que está roto hoy)
2. **Cat. 2 + 3** — Solidificar arquitectura backend + frontend
3. **Cat. 4** — Pulir la experiencia visual
4. **Cat. 5** — Blindar contra regresiones con tests
5. **Cat. 6** — Mejorar experiencia de desarrollo



## 🚀 Categoría 7: Roadmap Fase 7+ (Escalabilidad y UX Premium)

La auditoría inicial (Cats 1-6) está 100% completada, dejando el proyecto listo para producción. Las siguientes propuestas buscan escalar la arquitectura y añadir valor real al usuario en un contexto de tráfico masivo.

### 🛒 7.1 UX y Experiencia del Usuario (✅ COMPLETADO)
* **Gráficos de Inflación / Historial de Precios (`Recharts`):** Implementado el componente `ProductHistoryChart` que visualiza la tendencia de precios consumiendo el historial de la DB.
* **"Rutas de Compra" (Carrito Híbrido):** El optimizador ahora calcula y muestra el ahorro adicional al dividir la compra entre los dos mejores supermercados.
* **Sesiones Clientes Compartidas (Magic Links):** (Pendiente para Fase 8) Implementar Auth ligera sin contraseñas.

### ⚙️ 7.2 Motor de Scraping y Sistema Anti-Ban
* **Expansión de Términos de Búsqueda (✅ COMPLETADO — 10/04/2026):** Los 11 scrapers existentes pasaron de 4-8 términos a **34 términos** organizados en 10 categorías (Lácteos, Almacén, Limpieza, Bebidas, Carnes, Panadería, Mascotas, Perfumería, Verdulería, Congelados). Impacto estimado: **x5-x7** más productos por cadena.
* **Maxiconsumo (✅ COMPLETADO — 10/04/2026):** Nuevo scraper VTEX Classic añadido. 12° cadena. Color naranja `#ff8c00`.
* **La Anónima (✅ COMPLETADO — 10/04/2026):** Nuevo scraper VTEX Classic añadido. 13° cadena. Color navy `#1a5276`.
* **Proxies Residenciales Rotativos:** Escalar el `fetchWithRetry` actual (User-Agents + delay aleatorio) hacia un pool de proxys (BrightData/Oxylabs) para prevenir baneos de IP por parte de los WAF (Cloudflare/Akamai) desplegados por las cadenas grandes como Coto o Jumbo.
* **Alertas Inteligentes (Webhooks):** Conectar el nuevo endpoint `/api/scraper/status` con Discord, Slack o Telegram para notificar al equipo técnico en tiempo real si un proveedor de datos cae u obtiene 0 `itemsScraped`, previniendo que la plataforma se quede estancada por días.

### 🧱 7.3 Arquitectura Backend y DevOps
* **Migrar `CacheService` in-memory a Redis:** Si la plataforma escala y requiere balanceo horizontal (múltiples instancias Node), `globalCache.flushAll()` actual provocará desincronización de catálogos en distintas regiones. Redis es imperativo para caché unificado.
* **MeiliSearch / Typesense:** Cambiar de la extensión `pg_trgm` de PostgreSQL hacia un motor de búsqueda NoSQL especializado. Al manejar +5,000 productos web-scraped, permitirá respuestas <10ms en "Búsqueda a medida que escribes", con Type Tolerance total.
* **Colas de Tareas (BullMQ):** Reemplazar `node-cron` por un sistema robusto de Message Queueing respaldado por Redis para programar, encolar, y reintentar tareas asíncronas de scrape unitarias en lugar de un proceso *batch* monolítico.

---

## 🐛 Categoría 8: Seguridad, Autenticación y Escalabilidad (Prioridad CRÍTICA)

### 8.1 Sin autenticación ni autorización en ningún endpoint (✅ COMPLETADO — 10/04/2026)
- **Archivos:** Todos los endpoints de la API
- **Problema:** No existía modelo `User`, no había JWT, no había middleware de auth. El campo `UserList.userId` era un placeholder sin relación.
- **Implementado:**
  - ✅ Modelo `User` en Prisma con `id`, `email`, `passwordHash`, `name`, `createdAt`
  - ✅ AuthService con bcrypt + jsonwebtoken
  - ✅ Middleware `authenticateToken` para proteger rutas
  - ✅ AuthController con Zod validation: `POST /auth/register`, `POST /auth/login`, `GET /auth/me`
  - ✅ Frontend: AuthModal, useAuthStore (Zustand + persist), Axios 401 interceptor
  - ✅ Header con login/logout y saludo al usuario

---

### 8.2 Scraper health se pierde al reiniciar el servidor (✅ COMPLETADO — 10/04/2026)
- **Problema:** El estado del scraper se almacenaba solo en `globalCache` (in-memory). Si el servidor se reiniciaba, el endpoint `/api/scraper/status` devolvía `UNKNOWN`.
- **Implementado:**
  - ✅ Modelo `ScraperLog` en Prisma con `provider`, `status`, `itemsScraped`, `errors`, `errorMessage`, `startedAt`, `finishedAt`
  - ✅ `ScraperLogRepository` con `createLog()`, `createGlobalSummary()`, `getLatestByProvider()`, `getRecentLogs()`
  - ✅ Scraper orquestador persiste logs por proveedor y resumen global en cada ejecución
  - ✅ `ScraperController` consulta DB primero (sobrevive reinicios), fallback a caché
  - ✅ Nuevo endpoint `GET /api/scraper/logs?limit=N` para auditoría
- **Archivo:** `backend/src/scraper/index.ts`, `ScraperController.ts`
- **Problema:** El estado del scraper se almacena solo en `globalCache` (in-memory). Si el servidor se reinicia, el endpoint `/api/scraper/status` devuelve `UNKNOWN` aunque el scraping nocturno haya funcionado correctamente hace minutos.
- **Impacto:** No hay forma de auditar si el scraping funcionó anoche sin revisar logs manualmente.
- **Mejora:**
  - Crear modelo `ScraperLog` en Prisma con `provider`, `status`, `itemsScraped`, `errors`, `startedAt`, `finishedAt`
  - Cada ejecución del orquestador persiste un registro en la DB
  - `ScraperController.getStatus` consulta los últimos logs de la DB + cache actual
  - Dashboard visual en frontend con historial de scraping

---

### 8.3 Sin alertas proactivas ante fallos de scraping (⬜ PENDIENTE)
- **Archivo:** `backend/src/scraper/index.ts`, `cron.ts`
- **Problema:** Si un proveedor cambia su estructura web y el scraper falla, nadie es notificado. Los precios quedan desactualizados silenciosamente.
- **Impacto:** La plataforma muestra precios viejos sin que el equipo técnico lo sepa.
- **Mejora:**
  - Variable de entorno `DISCORD_WEBHOOK_URL` o `SLACK_WEBHOOK_URL`
  - Al finalizar el cron, si algún provider tiene `itemsScraped === 0` o errores fatales, enviar webhook
  - Mensaje con: provider fallido, error, timestamp, intento de retry
  - Endpoint opcional para re-trigger manual del scraping

---

### 8.4 pgAdmin expuesto con credenciales por defecto (⬜ PENDIENTE)
- **Archivo:** `backend/docker-compose.yml`
- **Problema:** pgAdmin se expone en puerto `5050` con credenciales `admin/admin`. Si se despliega en producción sin cambiar esto, cualquiera accede a la base de datos.
- **Fix:**
```yaml
environment:
  PGADMIN_DEFAULT_EMAIL: ${PGADMIN_EMAIL:-admin@ahorrotuc.local}
  PGADMIN_DEFAULT_PASSWORD: ${PGADMIN_PASSWORD:-cambiar_en_produccion}
```
- Y documentar que estas credenciales deben rotarse en producción.

---

## 🏗️ Categoría 9: Performance y Escalabilidad del Backend (Prioridad ALTA)

### 9.1 Fuzzy Matching O(N²) en el sincronizador (✅ COMPLETADO — 10/04/2026)
- **Implementado:**
  - ✅ Índice invertido (`word → Set<productId>`) construido una vez por sync run
  - ✅ `searchWithInvertedIndex()`: voting/scoring por palabra, fuzzy match solo en top candidatos
  - ✅ Normalización mejorada: `500 gr→500g`, `1000g→1kg`, tildes, puntuación, unidades
  - ✅ Reducción de ~18,500 a ~8 operaciones con catálogo actual (99.9% menos)
  - ✅ 21 tests unitarios pasando (`SyncService.test.ts`)
- **Archivo:** `backend/src/scraper/core/sync.ts`
- **Problema original:** Por cada producto scrapeado, se iteraban TODOS los productos de la DB para encontrar coincidencias fuzzy. Con 500+ productos scrapeados y catálogo creciente, era O(N²).
- **Complejidad resultante:** Antes O(N_scraped × N_db), ahora O(W_scraped × avg_products_per_word) donde W << N_db

---

### 9.2 Sin paginación en endpoints de listado (✅ COMPLETADO — 10/04/2026)
- **Implementado:**
  - ✅ `ProductRepository.findAllPaginated()` con cursor-based pagination
  - ✅ `ProductController` acepta `?cursor=X&limit=Y`, retorna `{ products, nextCursor }`
  - ✅ Frontend `useProductSearch` con `hasMore` y `loadMore()` function
  - ✅ Swagger docs actualizados con nuevos parámetros
- **Archivos:** `ProductRepository.findAll()`, `SupermarketRepository.findAll()`
- **Problema:** `findAll()` tiene un hard limit de `take: 100`. Si el catálogo crece, los productos después del #100 nunca se muestran. No hay cursor ni offset pagination.
- **Impacto:** Límite artificial de 100 productos, sin forma de ver el resto.
- **Mejora:**
  - Implementar cursor-based pagination (recomendado para datasets grandes):
```ts
findAll: async (cursor?: number, limit = 50) => {
    return prisma.product.findMany({
        take: limit,
        skip: cursor ? 1 : 0,
        cursor: cursor ? { id: cursor } : undefined,
        orderBy: { id: 'asc' },
        include: withCurrentPrices
    });
}
```
  - Actualizar endpoint para recibir `?cursor=X&limit=Y`
  - Devolver `{ products, nextCursor }` en la respuesta

---

### 9.3 Caché in-memory no escala horizontalmente (✅ COMPLETADO — 10/04/2026)
- **Implementado:**
  - ✅ `RedisClient` (ioredis) con auto-reconnect, SCAN-based purge, TTL nativo
  - ✅ `CacheService` con arquitectura dual: in-memory (sync) + Redis (fire-and-forget async)
  - ✅ `getAsync()` disponible para migración gradual de controllers a lecturas distribuidas
  - ✅ Fallback transparente a in-memory si `REDIS_URL` no está configurado
  - ✅ Zero breaking changes: API 100% síncrona como antes
  - ✅ Redis 7 Alpine en `docker-compose.yml` con LRU eviction (`allkeys-lru`) y AOF persistence
  - ✅ Credenciales de pgAdmin securitizadas via `${PGADMIN_EMAIL}` y `${PGADMIN_PASSWORD}`
  - ✅ 10 tests unitarios pasando (`CacheService.test.ts`)
- **Archivo:** `backend/src/services/CacheService.ts`, `backend/src/services/RedisClient.ts`
- **Problema original:** `CacheService` era un `Map` singleton en memoria del proceso. Múltiples instancias de Node = caches desincronizados. `flushAll()` solo limpiaba una instancia.
- **Arquitectura actual:** Write-through strategy — writes a in-memory (instantáneo) + Redis (async). Reads desde in-memory primero (ultrarrápido). Redis sincroniza entre instancias para horizontal scaling.

---

### 9.4 Scrapers se ejecutan secuencialmente (⬜ PENDIENTE)
- **Archivo:** `backend/src/scraper/index.ts`
- **Problema:** Los 10 providers se ejecutan uno tras otro. Cada uno duerme 3-7 segundos entre requests. Un scrape completo tarda 2-5 minutos.
- **Impacto:** Ventana de scraping larga, mayor chance de timeout o bloqueo.
- **Mejora:**
  - Ejecutar providers independientes en paralelo con `Promise.allSettled()`
  - Agrupar por familia de plataforma (VTEX: Vea/Jumbo/Disco juntos; Coto solo; etc.)
  - Respetar rate limits por dominio sin bloquear otros providers
  - Timeout global por provider (ej. 60s máximo por cada uno)

---

## 🎨 Categoría 10: UX y Frontend (Prioridad MEDIA)

### 10.1 Sin loading state durante optimización del carrito (⬜ PENDIENTE)
- **Archivo:** `frontend/src/hooks/useCartOptimizer.ts`
- **Problema:** El hook tiene debounce de 500ms pero no expone estado de `isOptimizing`. El usuario no sabe si el cálculo está en progreso.
- **Mejora:**
  - Agregar `isOptimizing: boolean` al return del hook
  - Mostrar spinner skeleton en `CartSidebar` mientras optimiza
  - Deshabilitar botón de checkout durante optimización

---

### 10.2 Sin estado vacío para búsquedas sin resultados (✅ COMPLETADO — 10/04/2026)
- **Implementado:**
  - ✅ Componente `EmptyState` con icono `SearchX`, título contextual, descripción y sugerencias
  - ✅ Integrado en `ProductGrid` con animaciones y dark mode
- **Archivo:** `frontend/src/components/ProductGrid.tsx`
- **Problema:** Cuando `products` está vacío (búsqueda sin resultados), el grid simplemente no muestra nada. No hay mensaje amigable.
- **Mejora:**
  - Componente `EmptyState` con:
    - Icono de lupa (Lucide `SearchX`)
    - Texto: "No encontramos productos para '{query}'"
    - Sugerencias: "Probá con otro término" o "Revisá la categoría 'Todas'"
  - Mostrar cuando `products.length === 0 && searchQuery.length > 0`

---

### 10.3 Sin cálculo de precio por unidad (⬜ PENDIENTE)
- **Problema:** No se puede comparar justamente "Leche 1L a $1200" vs "Leche 500ml a $700". El usuario debe hacer la cuenta mentalmente.
- **Mejora:**
  - Agregar campo `unitPrice` al modelo `Product` (precio por litro/kg/unidad)
  - Calcular en el seed y en el scraper: `price / volume_in_units`
  - Mostrar en `ProductCard`: `$1200/L` vs `$1400/L` junto al precio normal
  - Badge visual "Mejor precio por unidad" que puede diferir del "más barato"

---

### 10.4 Botón "Optimizar compra" no genera link compartible (⬜ PENDIENTE)
- **Archivo:** `frontend/src/components/CartSidebar.tsx`
- **Problema:** El botón solo hace scroll al ganador. No genera un resumen para compartir ni abre WhatsApp con la lista formateada.
- **Mejora:**
  - Generar texto formateado:
```
🛒 Mi lista de compras en Ahorro Tuc:

✅ COTO - Total: $15,230
- Leche Entera x2: $2,400
- Pan Lactal x1: $1,850
...

💰 Ahorro vs más caro: $3,120

Compará en: https://ahorrotuc.com
```
  - Botón primario: "Compartir por WhatsApp" → `https://wa.me/?text={encoded}`
  - Botón secundario: "Copiar al portapapeles"

---

### 10.5 Sin warning si localStorage es purgado (⬜ PENDIENTE)
- **Archivo:** `frontend/src/store.ts`
- **Problema:** Si el usuario limpia datos del navegador o entra en modo incógnito, el carrito desaparece sin aviso ni opción de recovery.
- **Mejora:**
  - Detectar si `localStorage` está disponible al montar la app
  - Si no está disponible, mostrar toast: "El carrito se guarda localmente. Si limpiás el navegador, se perderá."
  - En Phase 8: botón "Guardar lista en la nube" (requiere auth)

---

## 🧪 Categoría 11: Testing y Deuda Técnica (Prioridad MEDIA)

### 11.1 Cero cobertura de tests para scrapers (⬜ PENDIENTE)
- **Archivos:** `backend/src/scraper/` (todos los providers, `sync.ts`, `fetcher.ts`, `BaseScraper.ts`)
- **Problema:** No existe un solo test para la lógica de extracción. Si un provider cambia su API, no hay forma automatizada de detectar la rotura antes de deployar.
- **Mejora:**
  - Tests unitarios para `fuzzyMatch()` en `sync.ts` con casos conocidos
  - Tests para `sanitizeName()` con edge cases (tildes, comas, 1L vs 1lt)
  - Mock de `fetchWithRetry` para testear retry logic y backoff
  - Tests de integración con fixtures HTML de cada proveedor (archivos `.html` en `tests/fixtures/`)

---

### 11.2 Dependencias muertas en package.json (✅ COMPLETADO — 10/04/2026)
- **Implementado:**
  - ✅ Removidos `ts-node` y `@types/helmet` del backend
  - ✅ `react-router-dom` ya estaba removido del frontend
- **Archivo:** `backend/package.json`, `frontend/package.json`
- **Problema:**
  - Backend: `ts-node` instalado pero no se usa (reemplazado por `tsx`), `@types/helmet` innecesario (tipos incluidos en helmet)
  - Frontend: `react-router-dom` instalado pero nunca importado (~13KB gzipped desperdiciados)
- **Fix:**
```bash
cd backend && npm uninstall ts-node @types/helmet
cd frontend && npm uninstall react-router-dom
```

---

### 11.3 Tipos `any` dispersos en servicios y controladores (✅ COMPLETADO — 10/04/2026)
- **Implementado:**
  - ✅ `OptimizationService`: `bestHybrid: HybridResult | null`, `currentSplits: Record<string, HybridSplitItem[]>`
  - ✅ `asyncHandler`: `Promise<unknown>` en vez de `Promise<any>`
  - ✅ Global error handler: `Error & { statusCode?: number }` en vez de `any`
  - ✅ `sync.ts`: `_deprecated: undefined` en vez de `_prisma: any`
  - ✅ `scraper/index.ts`: `ScrapeStat` interface tipada
- **Archivos:** `OptimizationService.ts` (línea 58: `let bestHybrid: any`), `scraper/index.ts` (línea 12: `const scrapeStats: any[]`)
- **Problema:** TypeScript pierde toda su utilidad con `any`. Si cambia la estructura de datos, el compilador no avisa.
- **Fix:**
```ts
// OptimizationService.ts
interface HybridResult {
    supermarket1: { id: number; name: string; total: number; items: CartItem[] };
    supermarket2: { id: number; name: string; total: number; items: CartItem[] };
    combinedTotal: number;
    savings: number;
}
let bestHybrid: HybridResult | null = null;

// scraper/index.ts
interface ScrapeStat {
    provider: string;
    itemsScraped: number;
    errors: number;
    duration: number;
}
const scrapeStats: ScrapeStat[] = [];
```

---

### 11.4 Sin timeout en proceso scraper del cron (⬜ PENDIENTE)
- **Archivo:** `backend/src/scraper/cron.ts`
- **Problema:** El `spawn()` del scraper no tiene timeout. Si un provider se cuelga indefinidamente, el proceso cron nunca termina y el siguiente cron se superpone.
- **Mejora:**
```ts
const scraper = spawn('node', ['dist/scraper/index.js'], { timeout: 30 * 60 * 1000 }); // 30 min max
scraper.on('error', (err) => { /* handle */ });
scraper.on('close', (code) => {
    if (code === null) {
        console.error('Scraper process timed out after 30 minutes');
        // send alert webhook
    }
});
```

---

### 11.5 Error handler global no respeta status codes de errores conocidos (⬜ PENDIENTE)
- **Archivo:** `backend/src/index.ts` (error handler middleware)
- **Problema:** El global error handler devuelve `{ error: 'Error Interno del Servidor' }` para TODOS los errores, incluyendo 400s que slipped through validation. Debería respetar `err.statusCode` si existe.
- **Fix:**
```ts
app.use((err: any, req: Request, res: Response, _next: NextFunction) => {
    const status = err.statusCode || 500;
    const message = status === 500 ? 'Error Interno del Servidor' : err.message;
    res.status(status).json({ error: message });
});
```

---

## 📊 Resumen Ejecutivo Actualizado

| Prioridad | Categoría | Items | Esfuerzo estimado |
|---|---|---|---|
| 🔴 CRÍTICA | Bugs y Problemas Reales (Cat. 1) | 6 | ~1 hora |
| 🔴 CRÍTICA | Seguridad y Autenticación (Cat. 8) | 4 | ~8 horas |
| 🟠 ALTA | Arquitectura Backend (Cat. 2) | 5 | ~2 horas |
| 🟠 ALTA | Performance y Escalabilidad (Cat. 9) | 4 | ~6 horas |
| 🟠 ALTA | Frontend React/State (Cat. 3) | 5 | ~2 horas |
| 🟡 MEDIA | CSS y UX (Cat. 4) | 5 | ~1.5 horas |
| 🟡 MEDIA | UX y Frontend (Cat. 10) | 5 | ~3 horas |
| 🟡 MEDIA | Testing y Deuda Técnica (Cat. 11) | 5 | ~4 horas |
| 🟡 MEDIA | Testing y CI/CD (Cat. 5) | 4 | ~2 horas |
| 🟢 BAJA | DevOps y Config (Cat. 6) | 5 | ~1 hora |
| | **TOTAL** | **48** | **~30 horas** |

## Orden Recomendado de Ejecución

1. **Cat. 8** — Autenticación y seguridad (bloquea Phase 8)
2. **Cat. 11** — Limpiar deuda técnica y tests (estabilidad)
3. **Cat. 9** — Performance y escalabilidad (crecimiento)
4. **Cat. 10** — UX y frontend (experiencia de usuario)
5. **Cat. 1-7** — Ya completados ✅
