import { GomezPardoScraper } from './src/scraper/providers/gomez_pardo';

async function run() {
  const scraper = new GomezPardoScraper();
  console.log('Testing...');
  try {
    const res = await scraper.scrape();
    console.log('Exito. Encontrados:', res.length, res.slice(0, 1));
  } catch (err) {
    console.error('Fallo:', err);
  }
}

run();
