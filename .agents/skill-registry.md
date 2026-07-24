---
description: Índice Maestro de Skills y Convenciones de Ahorro Tuc
---

# Skill Registry (Catálogo de Habilidades)

Este registro es el índice central de todas las reglas de código, patrones y convenciones estrictas (Skills) adoptadas en el desarrollo de **Ahorro Tuc**.

### 1. Arquitectura de Backend y Base de Datos
- **Ruta:** `.agents/skills/backend-prisma.md`
- **Área:** PostgreSQL, Prisma ORM, Repositorios (`src/repositories/`), Modelos de Base de Datos.
- **Uso:** Modificar esquemas de bases de datos, inyectar transacciones o mutar datos críticos.

### 2. Motor de Extracción de Datos (Scraper)
- **Ruta:** `.agents/skills/motor-scraper.md`
- **Área:** Scraper distribuido, Cheerio, Puppeteer, Colas de Trabajo, Proveedores (`src/scraper/providers/`).
- **Uso:** Parsear supermercados, lidiar con bloqueos, inyectar headers estáticos e indexar catálogos.

### 3. Interfaz Gráfica (Frontend)
- **Ruta:** `.agents/skills/frontend-react.md`
- **Área:** React 19, componentes de interfaz de usuario (`src/components/`), Tailwind CSS, Zustand, Axios.
- **Uso:** Implementación del frontend del PWA, consumo de APIs y manejo state management unificado.

### 4. Excelencia en Diseño Visual y UX (Impeccable)
- **Ruta:** `.agents/skills/impeccable.md`
- **Área:** Diseño UI/UX, jerarquía visual, contraste HSL, animaciones fluidas, prevención de anti-patrones (SaaS slop).
- **Uso:** Rediseño de interfaz, componentes visuales, estados vacíos, feedback táctil y estética premium.

### 5. Disciplina y Minimalismo Senior (Ponytail)
- **Ruta:** `.agents/skills/ponytail.md`
- **Área:** Escalera de eficiencia de 7 peldaños (YAGNI, reutilización, APIs nativas, diffs mínimos).
- **Uso:** Mantener la arquitectura ligera, código libre de abstracciones innecesarias y máxima mantenibilidad.
