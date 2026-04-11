# 🛒 Ahorro Tuc

> **Comparador inteligente de precios de supermercados para Tucumán, Argentina.**

[![CI/CD](https://github.com/Alejopiola21/Project-Ahorro-Tuc/actions/workflows/ci.yml/badge.svg)](https://github.com/Alejopiola21/Project-Ahorro-Tuc/actions)

**Ahorro Tuc** es una plataforma web inteligente diseñada específicamente para los habitantes de San Miguel de Tucumán y alrededores. Nuestra misión es ayudar a las familias tucumanas a combatir la inflación y ahorrar dinero en sus compras cotidianas comparando precios en tiempo real entre **11 cadenas de supermercados**.

## 🌟 ¿Por qué Ahorro Tuc?

En un contexto de constante variación de precios, saber dónde comprar puede significar un ahorro de miles de pesos al mes. **Ahorro Tuc** centraliza la información de las principales cadenas de supermercados de la provincia para que no tengas que recorrerlos físicamente.

## 🚀 Funcionalidades

| Feature | Descripción |
|---------|-------------|
| 🔍 **Buscador Pro (MeiliSearch)** | Búsqueda ultra-rápida con Typo Tolerance (soporta errores ortográficos). |
| 🥇 **Indicador de Mejor Precio** | Resalta automáticamente el súper más barato. Ahora incluye **Precio por Unidad** ($/Kg, $/L). |
| 🛒 **Carrito Híbrido** | El optimizador te dice si conviene dividir tu compra en dos locales para ahorrar el máximo posible. |
| 📱 **Compartir Lista** | Exportá tu lista optimizada directamente a WhatsApp o copiala al portapapeles. |
| 💰 **Cálculo de Ahorro** | Visualizá cuánto dinero ahorrás eligiendo la opción ganadora vs la más cara. |
| 🌙 **Modo Oscuro** | Toggle de tema claro/oscuro con persistencia local. |
| 📱 **PWA Instalable** | Instalá la app en tu celular o PC como una app nativa offline-ready. |

## 🏪 Supermercados Incluidos

`Coto` · `Carrefour` · `Jumbo` · `Vea` · `Disco` · `Día` · `Gómez Pardo` · `ChangoMás` · `Libertad` · `Comodín` · `Maxiconsumo` · `La Anónima`

## 🆕 Novedades Recientes (10/04/2026)

| Feature | Descripción |
|---------|-------------|
| 🚀 **Arquitectura 7.3** | Integración de **Redis** (Caché L2), **BullMQ** (Colas de Scraping) y **MeiliSearch**. |
| ⚖️ **Normalización de Unidades** | Cálculo automático de precio por Kg/L para comparaciones justas entre envases. |
| 🔗 **WhatsApp Share** | Generador de mensajes enriquecidos para compartir listas de compras optimizadas. |
| 🔐 **Autenticación JWT** | Registro, login y perfil de usuario con sesión persistente. |
| 📊 **Scraper de 13 Cadenas** | Maxiconsumo y La Anónima añadidos. Más de 34 categorías de productos por cadena. |
| 💡 **Aviso de Persistencia** | Alertas inteligentes al usar modo incógnito para evitar pérdida accidental del carrito. |

## 🛠️ Stack Tecnológico

### Frontend
- **React 19** + **TypeScript** + **Vite 7**
- **CSS Vanilla** con sistema de variables (Glassmorphism, animaciones, dark mode)
- **Zustand** para estado global del carrito (persistido en localStorage)
- **Axios** con interceptores globales + **Sonner** para toast notifications
- **Lucide React** para iconografía consistente
- **PWA** con `vite-plugin-pwa` (instalable, offline-ready)

### Backend
- **Node.js** + **Express 5** + **TypeScript**
- **BullMQ** para gestión de tareas asíncronas de scraping
- **MeiliSearch** para motor de búsqueda ultra-rápido NoSQL
- **Redis** para caché distribuida (L2) y respaldo de colas
- **Prisma ORM** con adapter nativo para PostgreSQL
- **Zod** para validación estricta de requests
- **Swagger** (OpenAPI 3.0) para documentación de API

### Base de Datos
- **PostgreSQL 15** con extensión `pg_trgm` para búsqueda difusa ultrarrápida
- Schema relacional con 6 modelos: `Supermarket`, `Product`, `Price`, `PriceHistory`, `ProductAlias`, `UserList`
- Soporte para código de barras (EAN), marcas y pesos para matching exacto
- **Neon.tech** como proveedor Serverless (100% en la nube, sin dependencias locales)

### DevOps & Testing
- **GitHub Actions** CI/CD pipeline automático
- **Vitest** para tests unitarios del backend
- **Playwright** para tests E2E del flujo crítico
- **ESLint** + **TypeScript** strict mode

## 📦 Estructura del Proyecto

```
ahorro-tuc/
├── frontend/                # React + Vite + TypeScript
│   ├── src/
│   │   ├── components/      # Header, Hero, ProductCard, ProductGrid, CartSidebar, SupermarketsBar
│   │   ├── hooks/           # useTheme (dark mode)
│   │   ├── api.ts           # Axios instance + interceptores
│   │   ├── store.ts         # Zustand cart store
│   │   ├── types.ts         # TypeScript interfaces
│   │   └── index.css        # Sistema de diseño completo
│   └── tests/               # Playwright E2E
├── backend/
│   ├── src/
│   │   ├── controllers/     # ProductController, SupermarketController, OptimizationController
│   │   ├── services/        # OptimizationService
│   │   ├── repositories/    # Data access layer (PrismaClient)
│   │   ├── routes/          # Express routes con Swagger docs
│   │   └── db/              # Prisma client singleton + seed
│   ├── prisma/
│   │   ├── schema.prisma    # Modelos de base de datos
│   │   └── migrations/      # Migraciones SQL
│   └── tests/               # Vitest unit tests
└── .github/workflows/       # CI/CD pipeline
```

## ⚡ Inicio Rápido

### Prerrequisitos
- Node.js 18+
- Una cuenta gratuita en [Neon.tech](https://neon.tech/) para la base de datos

### 1. Clonar e instalar
```bash
git clone https://github.com/Alejopiola21/Project-Ahorro-Tuc.git
cd Project-Ahorro-Tuc

# Instalar dependencias
cd frontend && npm install && cd ..
cd backend && npm install && cd ..

# Configurar variables de entorno (copiar de los de ejemplo)
cp frontend/.env.example frontend/.env
cp backend/.env.example backend/.env
```

### 2. Configurar la base de datos (Neon.tech)
Asegurate de pegar tu `DATABASE_URL` (proveída por Neon) en el archivo `backend/.env`. Luego corre:
```bash
cd backend
npx prisma db push
npx prisma db seed
```

### 3. Iniciar el proyecto
```bash
# Terminal 1 - Backend
cd backend && npm run dev

# Terminal 2 - Frontend
cd frontend && npm run dev
```

### 4. Abrir en el navegador
- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:3001/api
- **Swagger Docs**: http://localhost:3001/api/docs

## 🏗️ Estado del Proyecto

| Fase | Nombre | Estado |
|------|--------|--------|
| ... | ... | ... |
| 7.3 | Arquitectura Escalable (Redis + BullMQ + MeiliSearch) | ✅ Completada |
| 10.3 | Normalización de Precios por Unidad ($/Kg, $/L) | ✅ Completada |
| 10.4 | Generador de Listas Compartibles (WhatsApp) | ✅ Completada |
| 10.5 | Avisos de Persistencia (UX) | ✅ Completada |
| 8.0 | Gestión de Sesiones y Expansión Global | 🔧 En Progreso |


> 📋 Ver [PLANNING.md](./PLANNING.md) para detalles completos de cada fase.
> 📝 Ver [CHANGELOG.md](./CHANGELOG.md) para el historial de cambios detallado.

## 📄 Licencia

ISC

---

Diseñado con ❤️ para Tucumán.
