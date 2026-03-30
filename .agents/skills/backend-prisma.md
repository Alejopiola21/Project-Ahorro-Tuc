---
description: Convenciones de Backend, Prisma y PostgreSQL.
---

# Skill: Backend Prisma & PostgreSQL

Este documento contiene las reglas estrictas de desarrollo para el backend de Ahorro Tuc (Express/Elysia/Hono + Prisma + Neon):

## 1. Repositorios (Patrón Repository)
- **Regla:** Ningún controlador del API o Motor de Extracción tiene permitido llamar a `prisma.user.findMany()`, `prisma.product.create()`, etc. directamente.
- Todo acceso a la Base de Datos debe pasar obligatoriamente por una clase Repositorio en `src/repositories/` (ej. `ProductRepository.ts`).
- Esto aísla la lógica de negocio del ORM y simplifica la migración a Neon.

## 2. Prisma Client
- El logueo de Prisma en producción debe limitarse a errores (`error`, `warn`), no full queries.
- Para inyecciones masivas (ej. el Scraper inyectando miles de productos), usar el método de Prisma `$transaction` y `createMany` para reducir la latencia de la red con la DB de Neon.

## 3. Types y Schema
- La validación del sistema de tipos debe estar conectada con los tipos generados automáticamente de `@prisma/client`.
- Todos los controladores o funciones mutadoras deben tipar sus argumentos con interfaces explícitas, en lugar de inferirlas genéricamente. No usar `any`.
