---
description: Impeccable Design System & Visual Excellence Guidance for Ahorro Tuc Frontend
---

# Impeccable: Guía de Excelencia en Diseño y UX

Esta skill define las reglas de diseño visual, jerarquía tipográfica, estética moderna y prevención de anti-patrones de interfaz para **Ahorro Tuc**.

## Principios Fundamentales de Diseño

1. **Craft de Alto Nivel**: Evitar interfaces genéricas, aburridas o predecibles ("SaaS slop").
2. **Modo de Operación (`Operate`)**: Ahorro Tuc es una aplicación utilitaria/dashboard de presupuestos y precios. La escaneabilidad, contraste, coherencia y claridad de datos son prioritarias sin perder elegancia visual.
3. **Jerarquía Visual y Tipografía**:
   - Usar tipografía moderna con pesos bien contrastados (títulos fuertes, datos numéricos legibles).
   - Nunca usar texto gris sobre fondos de color sin suficiente contraste.
   - Evitar gris puro o negro puro (#000000); usar matices profundos (tinted darks/whites con sutiles matices HSL).
4. **Anti-Patrones Prohibidos**:
   - Evitar "Cards dentro de Cards" o anidamiento excesivo de contenedores.
   - Evitar fuentes sobreusadas o por defecto de navegador sin estilizado adecuado.
   - Evitar botones e íconos idénticos repetidos sin diferenciación jerárquica.
   - Evitar animaciones toscas; usar micro-interacciones suaves y transiciones sutiles (ease-out, spring suave).
5. **Color y Tematización**:
   - Paleta armónica con contraste accesible (WCAG AA/AAA).
   - Uso de glassmorphism sutil, bordes pulidos (`border-white/10` o similar) y sombras suaves multicapa.
   - Destacar ofertas y ahorros con colores vibrantes de acento pero sin sobrecargar visualmente.

## Comandos y Modos de Reflexión

- **Audit**: Evaluar accesibilidad, jerarquía visual y responsiveness.
- **Polish**: Pasada de acabado de detalles (márgenes, micro-spacing, hover states, badges).
- **Bolder / Quieter**: Ajustar la intensidad visual según el contexto de la información.
- **Typeset & Layout**: Optimizar legibilidad numérica y alineación de grids/listas de comparación.
