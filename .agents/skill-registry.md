---
description: Índice Maestro de Skills y Convenciones de Ahorro Tuc
---

# Skill Registry (Catálogo de Habilidades)

Este registro es el índice central de todas las reglas de código, patrones y convenciones estrictas (Skills) adoptadas en el desarrollo de **Ahorro Tuc**. 
Cada vez que el agente inicie una fase de "Implementación", consultará automáticamente las convenciones pertinentes mapeadas a continuación:

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

> Nota para el agente: Si se crea una nueva tecnología importante (por ejemplo, una integración de caching con Redis), crea un nuevo archivo de skill en `.agents/skills/` y regístralo aquí.
