# Plan de Proyecto: Ahorro Tuc

## 1. Visión General
**Ahorro Tuc** es una aplicación web (optimizada para dispositivos móviles y web) que permite a los usuarios de la provincia de Tucumán comparar precios de productos de supermercados (Coto, Carrefour, Jumbo, Vea, Disco, Día) en tiempo real, ayudándolos a encontrar la opción más barata. Además, permite cargar una lista de compras y calcular el total en cada supermercado y el ahorro estimado.

## 2. Arquitectura del Sistema (Tech Stack)
* **Frontend**: React (creado con Vite), TypeScript, CSS Vanilla (con variables y un diseño estético moderno, animado y glassmorphism).
* **Backend**: Node.js con Express, TypeScript (para seguridad de tipos).
* **Base de Datos**: PostgreSQL (ideal para búsquedas relacionadas y catálogos de productos grandes con variación de precios).
* **Scraping / Datos**: Scripts dedicados en Node.js (con Puppeteer o Cheerio) o Python (BeautifulSoup) para ingestar datos de precios diariamente.

## 3. Fases de Desarrollo

### FASE 1: Estructura Base y Mock Data (Actual)
- [x] Inicializar repositorio local monorepo (`frontend/` y `backend/`).
- [ ] Configurar TypeScript y CSS en el frontend, preparando un sistema de variables globales modernas.
- [ ] Configurar Express en el backend con TypeScript.
- [ ] Crear un catálogo de productos mockeados (JSON) que simulen tener diferentes precios en distintas cadenas.
- [ ] Conectar frontend y backend usando fetch o axios.

### FASE 2: UI Principal y Buscador (MVP Frontend)
- [ ] Diseñar Navbar y layout responsivo.
- [ ] Crear la página de Inicio con el **Buscador de autocompletado**.
- [ ] Crear tarjeta de Producto (Product Card) que muestre el precio en las distintas cadenas.
- [ ] Crear el "Carrito de Compras / Mi Lista".

### FASE 3: Lógica de Optimización
- [ ] Implementar la lógica en el backend que reciba una "Lista de productos deseados".
- [ ] El backend calculará, para esa lista particular, cuál supermercado ofrece el precio total más bajo.
- [ ] Mostrar en el frontend el Supermercado recomendado, el precio total, y el "Ahorro" vs la opción más cara.

### FASE 4: Base de Datos y APIs reales
- [ ] Configurar PostgreSQL local o en la nube (ej. Supabase o Neon).
- [ ] Crear esquemas: `Product`, `Supermarket`, `PriceHistory`, `UserList`.
- [ ] Hacer los endpoints conectados a la DB real.

### FASE 5: Actualizador de Precios (Scraper) / "Extras"
- [ ] Desarrollar script de scraping (Python o JS) para extraer info de Coto, Carrefour, Vea, Disco, Jumbo, Día.
- [ ] Exportación a PDF o WhatsApp de la lista recomendada.
- [ ] Sección de feedback y estadísticas en tiempo real.

## Notas para Desarrollo IA
Este documento servirá para no olvidar el contexto del proyecto y en qué fase estamos. Continuar refiriéndose a este `PLANNING.md` para seguir avanzando en cada tarea sugerida.
