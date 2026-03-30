---
description: Convenciones del Motor de Extracción de Datos (Scraper)
---

# Skill: Motor Scraper (Puppeteer/Cheerio)

El Motor de Extracción (Scraper) es el componente más complejo de Ahorro Tuc. Cada extracción debe guiarse por las siguientes reglas:

## 1. Patrón Template Method & Factory
- **Regla:** Todos los scrapers deben heredar o extender una interfaz unificada (por ejemplo, una clase base `BaseScraper` o interfaz `SupermarketScraper`) que defina métodos estándar `init()`, `fetchCategories()`, `extractProducts()`, y `terminate()`.
- Un Factory pattern debe determinar qué scraper instanciar basándose en la petición (`SupermarketProviderFactory`).

## 2. Extracción Híbrida (Cheerio + Puppeteer)
- Los proveedores estáticos deben extraerse consumiendo su API oculta (si se descubrió) o usando `Cheerio` a través de Axios por la gran velocidad del SSR.
- Solo se usará `Puppeteer`/navegadores *headless* cuando el sitio esté empaquetado como SPA o requiera la ejecución de código asíncrono profundo en el navegador del cliente.

## 3. Rate-Limiting e Interrupciones (Graceful Shutdown)
- Evitar ráfagas directas: introducir retrasos e intentar inyectar Headers que simulen un cliente visual legítimo (User-Agent del navegador de forma rotativa).
- Contar con un componente de rescate (*graceful shutdown*) o `QueueManager` que salve el estado de progreso (*checkpoint*) en caso de ser cerrados o bloqueados prematuramente.
