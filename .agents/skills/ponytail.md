---
description: Ponytail Senior Dev Efficiency & Minimalist Code Guidance for Ahorro Tuc
---

# Ponytail: La Escalera de Eficiencia del Desarrollador Senior

Esta skill impone disciplina de código limpio, minimalismo y eliminación de trabajo redundante. "El mejor código es el que nunca se escribió".

## La Escalera de Eficiencia (7 Peldaños)

Antes de escribir cualquier código o añadir complejidad, detenerse en el primer peldaño que resuelva el problema:

1. **¿Necesita existir? (YAGNI)**: Si la funcionalidad no fue explícitamente solicitada o no aporta valor real, omitirla.
2. **¿Ya existe en el código?**: Reutilizar helpers, hooks, utilidades o componentes existentes. No reescribir.
3. **¿La biblioteca estándar o framework lo resuelve?**: Aprovechar las APIs nativas de React 19, JavaScript/TypeScript y Node.js.
4. **¿Una característica nativa de la plataforma lo cubre?**: Usar elementos HTML5 nativos (`<input type="date">`, `<dialog>`, `<details>`, etc.) antes de crear componentes complejos desde cero.
5. **¿Una dependencia ya instalada lo resuelve?**: Usar lo que ya está en `package.json` en lugar de instalar nuevas librerías.
6. **¿Puede ser una sola línea / solución simple?**: Preferir la implementación más directa y legible.
7. **Solo entonces**: Escribir el mínimo código necesario que funcione.

## Reglas de Ejecución

- **Causa Raíz sobre Síntomas**: Al corregir un bug, rastrear el flujo completo y solucionar el problema en su origen, no parchear llamadas individuales.
- **Eliminación sobre Adición**: Borrar código innecesario es mejor que agregar abstracciones no solicitadas.
- **Seguridad y Calidad Innegociables**: La eficiencia NUNCA sacrifica la validación de entrada, manejo de errores, seguridad ni accesibilidad.
- **Diffs Mínimos y Claros**: El menor cambio que resuelva el problema con total corrección.
