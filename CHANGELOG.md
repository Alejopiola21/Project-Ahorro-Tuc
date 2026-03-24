# Changelog - Ahorro Tuc

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
