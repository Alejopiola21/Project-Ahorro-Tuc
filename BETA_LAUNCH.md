# 🚀 Ahorro Tuc: Plan Estratégico de Lanzamiento (Beta Abierta v1.0.0-beta)

Este documento centraliza el estado actual, checklist de verificación y directivas operativas para el lanzamiento de la Beta Abierta pública del sistema.

## 1. Viabilidad Estructural Confirmada

La aplicación cumple con los requerimientos base de robustez y concurrencia para exponerse de manera segura a un grupo focal o público en general:

*   **Estabilidad Backend/Infraestructura:** Integración de PostgreSQL Serverless mediante Neon con `pg_trgm`, acoplado a un motor paralelo de caché asíncrona L2 en Redis. Despliegue de BullMQ que amortigua sobrecargas operativas de los web-scrapers protegiendo el pipeline central.
*   **Robustez Frontend:** Implementación de listados por cursores para grandes catálogos sin castigo a la memoria (DOM limits predefinidos, queries optimizados de 200 items inyectados post-Fuzzy). PWA funcional con persistencia en `localStorage`.
*   **Optimizaciones Analíticas:** Cálculo heurístico comparativo (Carrito Híbrido) estable. Visualización limpia y acelerada usando Recharts sobre historiales de precios auditados temporalmente.
*   **Manejo Asíncrono Defensivo:** Recolectores de datos (Coto, Vea, Jumbo, Libertad, Gómez Pardo, etc.) están paralelizados e interbloqueados por timeouts máximos de 120s para prevenir paralización global del host (Bloqueo OOM).

## 2. Déficits Operativos (Aceptados y No Bloqueantes)

Las siguientes ausencias son tecnológicamente conocidas y aceptadas de manera temporal dadas las metas primarias del entorno de la Fase Beta:

*   **Persistencia Híbrida de Carritos (Cloud vs Local):** Carecemos de un CRUD que sincronice la lista en la nube. Actualmente, una sesión de navegador anónima purgará/destruirá el estado del carrito si es reseteada. 
*   **Magic Links (Auth sin Contraseña):** Fase de autorización pospuesta para una posterior actualización.
*   **Proxies Residenciales Anti-Ban:** Los scrapper tools funcionan mediante rotación superficial de User-Agents y demoras escalonadas. Un baneo IP masivo a nivel local por Akamai o Cloudflare frenará la provisión temporalmente.
*   **Alarmas Proactivas de Supervivencia:** Faltan los Webhooks directos hacia Discord/Slack si un proveedor arroja `itemsScraped === 0` durante un ciclo completo de orquestación nocturna.

## 3. Estrategia de Despliegue (Checklist de Operaciones)

*   [ ] Asignar base de datos segregada para entorno de producción (Neon DB - Branch Productiva).
*   [ ] Inyectar todos los Tokens API de seguridad (`JWT_SECRET`, `DATABASE_URL`, variables `REDIS_URL` para BullMQ) en el panel del hosting.
*   [ ] Validar regeneración dinámica del SEO `index.html` frente a crawlers (Googlebot, Meta).
*   [ ] Monitorear picos en memoria (Heap Allocation > 512MB) durante los escaneos sincronizados simultáneos de 13 cadenas y Redis Eviction rate en las primeras 48 hs.
*   [ ] Auditar proyecciones de latencia (Latencia Media < 200ms por request gracias a Caché dual).

## 4. Métricas Clave de Evaluación de la Beta

Para transicionar de la Beta (v1) a la Fase Operativa Estable (v2), se medirán los siguientes KPIs (Key Performance Indicators) de fallo cero:

*   **Sobrevivencia Diaria del Scraper:** Porcentaje de ejecución completada de orquestadores mediante métrica interna de `ScraperLogRepository`. El motor de recolección debe superar tasas de >95% de completitud diaria.
*   **Tiempo de Resolución de Emparejamiento (Fuzzy):** Mantener el cálculo computacional por debajo de `O(M log N) == 5ms` usando los algoritmos de árbol invertido tras adiciones a catálogos densos.
*   **Reportes Ciudadanos:** Tasa de correos reportando diferencias en precios críticos mostrados Vs góndola (Delta Rate).

---
*Control de versiones cerrado.*
