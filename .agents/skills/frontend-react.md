---
description: Convenciones de UI y Frontend de la Aplicación.
---

# Skill: Frontend React 19 & PWA

Reglas estilísticas, de arquitectura y código para el cliente web de Ahorro Tuc en React:

## 1. Estado Global 
- **Regla:** Prop Drilling queda completamente prohibido cuando sobrepasa 2 niveles de profundidad.
- Usar exclusivamente **Zustand** para la gestión del estado global (ej. `cartStore`, `supermarketStore`), y para inyectarlo en componentes persistentes (`CartSidebar`).
- La persistencia de datos del usuario debe integrarse con `persist` middleware de Zustand (y guardar en LocalStorage).

## 2. API calls (Axios y Mutaciones)
- Todas las peticiones al backend deben realizarse mediante la instancia global provista por `axios` (ej. en `src/api/client.ts`), equipada con interceptores de errores.
- Notificar globalmente errores al usuario utilizando librerías estandarizadas en el proyecto como `sonner`.

## 3. Interfaz Visual Premium y Componentes
- Basar el estilizado en **Tailwind CSS**, priorizando variables que se ajusten a la identidad (Dark Modes, paletas sofisticadas).
- Dividir `App.tsx` en pequeños componentes puros y dedicados ubicados en la carpeta `/src/components` (e.g. `Header.tsx`, `Hero.tsx`, `ProductCard.tsx`).
- Evitar lógicas complejas de mutación dentro de sub-componentes UI (separación de las responsabilidades).
