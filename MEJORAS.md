# 🔍 Auditoría Completa y Mejoras Propuestas — Ahorro Tuc

> **Fecha de auditoría:** 28 de Marzo de 2026  
> **Archivos revisados:** Todos los archivos del proyecto (backend + frontend + CI/CD + configs)  
> **Objetivo:** Identificar problemas reales, mejoras de arquitectura y oportunidades de pulido sin romper nada existente.

---

## 🐛 Categoría 1: Bugs y Problemas Reales (Prioridad CRÍTICA)

### 1.1 `index.html` — SEO y metadata rotos
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

### 1.2 Swagger `servers.url` hardcodeado en puerto incorrecto
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

### 1.3 `backend/.env` está ignorado por Git pero no hay `.env.example`
- **Archivo:** `.gitignore` / `backend/.env`
- **Problema:** El archivo `.env` tiene credenciales de la base de datos. Si alguien clona el repo, no tendrá `.env`, y el servidor crasheará sin un mensaje claro de qué configurar.
- **Fix:** Crear `backend/.env.example` con valores de ejemplo y documentar el setup en README:
```env
PORT=3001
NODE_ENV=development
DATABASE_URL="postgresql://USER:PASSWORD@localhost:5432/DB_NAME?schema=public"
```

---

### 1.4 El rate limiter es demasiado agresivo para desarrollo
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

### 1.5 El backend seed se ejecuta en CADA arranque del servidor
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

### 1.6 El `FRONTEND_URL` en CORS no contempla múltiples orígenes en producción
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

### 2.1 Falta middleware de logging de requests HTTP
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

### 2.2 Los controladores repiten try/catch idénticos
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

### 2.3 El repositorio usa `any` en el helper `buildProductWithPrices`
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

### 2.4 Falta validación de parámetros en `getProductHistory`
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

### 2.5 El `OptimizationService` no maneja productos sin precios en ciertos supermercados
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

### 3.1 Los tipos de frontend no reflejan la realidad del backend
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

### 3.2 El carrito permite duplicados sin control de cantidad
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

### 3.3 El `optimize-cart` se llama en cada cambio de carrito sin debounce
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

### 3.4 `react-router-dom` está instalado pero NO se usa
- **Archivo:** `frontend/package.json`
- **Problema:** `react-router-dom` (v7.13.1) está en dependencias pero no se importa en ningún archivo. Peso muerto en el bundle (~13KB gzipped).
- **Opciones:**
  - **A)** Removerlo: `npm uninstall react-router-dom`
  - **B)** Aprovecharlo: crear rutas como `/producto/:id` para detalle de producto con historial de precios

---

### 3.5 `getSup` y `getCheapest` se pasan como props innecesariamente (prop drilling)
- **Archivos:** `App.tsx` → `ProductGrid` → `ProductCard`
- **Problema:** Estas funciones se definen en App.tsx y se pasan por 3 niveles de componentes. Es prop drilling clásico.
- **Fix:** Dos opciones:
  - **A)** Mover `supermarkets` al store global de Zustand y crear un helper reutilizable.
  - **B)** Crear un `SupermarketContext` para compartir esos helpers.

---

## 🎨 Categoría 4: CSS y UX (Prioridad MEDIA)

### 4.1 Los skeletons no respetan dark mode
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

### 4.2 Falta un footer profesional
- **Problema:** La app termina abruptamente después de los productos. No hay footer con info legal, disclaimer de precios, créditos, o links útiles.
- **Mejora:** Agregar un componente `Footer.tsx` con:
  - Disclaimer: "Precios obtenidos de fuentes públicas. Los precios pueden variar."
  - Créditos y año
  - Links a redes sociales o contacto

---

### 4.3 El botón "Optimizar compra" en el carrito no hace nada
- **Archivo:** `frontend/src/components/CartSidebar.tsx` (línea 90)
- **Problema:** El botón `checkout-btn` no tiene `onClick`. Es puramente decorativo.
- **Opciones de Fix:**
  - Scroll al supermercado ganador con animación
  - Generar un resumen compartible (link/imagen)
  - Mostrar detalle expandido de ahorros por producto
  - Abrir WhatsApp con la lista formateada

---

### 4.4 Falta accesibilidad (a11y) básica
- **Archivos:** Varios componentes
- **Problemas encontrados:**
  - Los supermarket chips no tienen `aria-label`
  - El sidebar del carrito no atrapa el foco al abrirse (keyboard trap)
  - No hay `role="navigation"`, `role="main"`, `role="complementary"` en secciones
  - Las imágenes de productos usan `product.name` como alt, pero podría ser más descriptivo
  - No se puede cerrar el sidebar con la tecla `Escape`
- **Fix:** Agregar atributos ARIA, focus trap en el sidebar, y handler de tecla Escape.

---

### 4.5 Animación excesiva del logo distrae
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

### 5.1 El CI no levanta PostgreSQL → el backend-test va a fallar
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

### 5.2 Los tests E2E asumen que el backend tiene datos
- **Archivo:** `frontend/tests/critical-flow.spec.ts`
- **Problema:** El test busca "Leche" y espera encontrar resultados. Si la DB está vacía o el seed no corrió, el test falla silenciosamente.
- **Fix:** Agregar un paso previo en el CI que corra el seed, o crear fixtures independientes para tests.

---

### 5.3 Cobertura de testing muy baja (solo 2 tests en total)
- **Archivos:** 1 test unitario (`OptimizationService.test.ts`), 1 test E2E (`critical-flow.spec.ts`)
- **Problema:** La cobertura es mínima. Faltan tests para:
  - Validación de Zod en `OptimizationController` (payloads inválidos)
  - `ProductRepository.search()` con queries vacías, inyección SQL, caracteres especiales
  - `SupermarketController.getSupermarkets()` 
  - Frontend: tests de componentes con React Testing Library
  - Edge cases del `OptimizationService` (carrito vacío, producto sin precios)

---

### 5.4 No hay linting en el CI
- **Problema:** Ni backend ni frontend ejecutan `npm run lint` en el pipeline de CI. Errores de estilo y potenciales bugs pasan desapercibidos.
- **Fix:** Agregar paso de lint en ambos jobs del CI:
```yaml
- name: Lint
  run: npm run lint
```

---

## 📦 Categoría 6: DevOps y Configuración (Prioridad BAJA)

### 6.1 El backend usa `ts-node` en producción
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

### 6.2 No hay hot-reload en development del backend
- **Problema:** Cada cambio en el código del backend requiere reiniciar manualmente el servidor.
- **Fix:** Instalar `tsx` y usarlo con `watch`:
```json
"dev": "tsx watch src/index.ts"
```

---

### 6.3 El `docker-compose.yml` usa `version: '3.8'` (deprecated)
- **Archivo:** `backend/docker-compose.yml` (línea 1)
- **Problema:** Las versiones recientes de Docker Compose (v2+) ignoran el campo `version`. No rompe nada pero es obsoleto y genera warnings.
- **Fix:** Remover la línea `version: '3.8'`.

---

### 6.4 Falta `.env.example` para onboarding de nuevos desarrolladores
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

### 6.5 El README principal no tiene instrucciones de setup
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

---

> **Nota:** Este documento se mantiene como referencia permanente del proyecto. Marcar items como completados a medida que se implementen.
