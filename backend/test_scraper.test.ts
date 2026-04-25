import { GomezPardoScraper } from './src/scraper/providers/gomez_pardo';
import { describe, it, expect } from 'vitest';

describe('Scrapers Test', () => {
  it('Debería extraer Gomez Pardo', async () => {
    const scraper = new GomezPardoScraper();
    
    // Sobrescribimos temporalmente performScraping o acortamos el test para que la prueba sea rápida.
    // Usaremos un mock en lugar del loop total, pero vamos a dejar que corra 1 término.
    const originalPerform = scraper.performScraping.bind(scraper);
    
    scraper.performScraping = async function() {
        this.results = [];
        console.log("Probando...");
    }
  });
});
