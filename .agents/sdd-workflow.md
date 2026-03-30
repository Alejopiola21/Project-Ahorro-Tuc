---
description: Spec-Driven Development Workflow for Ahorro Tuc
---

# Spec-Driven Development (SDD) Workflow

Este documento estandariza el flujo de trabajo que el agente (Antigravity/Gemini) debe seguir estrictamente para la implementación de tareas complejas, refactorizaciones y creación de nuevas features en el proyecto Ahorro Tuc. No está permitido saltarse fases.

En lugar de saltar directamente a programar o modificar archivos aleatoriamente, se debe ejecutar el siguiente ciclo:

### 1. Explore (Explorar)
- **Objetivo:** Comprender el contexto existente.
- **Acciones:** Usar comandos de búsqueda (`grep_search`, `list_dir`) y lectura de archivos (`view_file`) para mapear dependencias y leer cómo interactúa el área a modificar con el resto del ecosistema (Frontend, Base de datos Prisma o Sistema Scraper). No se permite escribir al disco en esta etapa.

### 2. Propose (Proponer)
- **Objetivo:** Plantear una solución arquitectónica.
- **Acciones:** Evaluar el estado actual frente al deseado. Presentar el enfoque técnico (ej. qué tablas de DB cambiarán, qué componentes React se crearán) sin escribir el código final.

### 3. Spec (Especificar)
- **Objetivo:** Definir casos de uso, restricciones y edge-cases.
- **Acciones:** Acordar el contrato de datos (interfaces Typecript), la estructura del payload (ej. Zod) y cómo manejar posibles fallos (ej. transacciones fallidas en PostgreSQL o bloqueos en Cheerio). 

### 4. Design (Diseñar)
- **Objetivo:** Estructurar los archivos a nivel de pseudocódigo o plan de acción incremental.
- **Acciones:** Establecer un listado de los archivos que serán tocados, el rol de cada uno y su firma. Se puede generar un artefacto de Implementation Plan para la revisión del usuario humano.

### 5. Implement (Implementar)
- **Objetivo:** Codificar la solución aprobada.
- **Acciones:** Seguir el diseño pieza a pieza, cumpliendo rigurosamente los "Skills" definidos en el Skill Registry del proyecto (ej. `backend-prisma.md`, `frontend-react.md`).

### 6. Verify (Verificar)
- **Objetivo:** Comprobar que el sistema sigue estable y el feature funciona.
- **Acciones:** Ejecutar scripts de validación, compilación (TypeScript), o testing en terminal (`npm run dev / build`). Solicitar al usuario una validación visual si corresponde a la Interfaz Gráfica o a los logs extraídos de Neon DB.
