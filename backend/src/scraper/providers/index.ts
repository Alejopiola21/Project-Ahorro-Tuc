import { BaseScraper } from '../core/BaseScraper';

import { VeaScraper } from './vea';
import { JumboScraper } from './jumbo';
import { DiscoScraper } from './disco';
import { CarrefourScraper } from './carrefour';
import { ChangomasScraper } from './changomas';
import { DiaScraper } from './dia';

// Cualquier scraper agregado aquí será ejecutado automáticamente en cron/batch
export const providersRegistry: BaseScraper[] = [
    new VeaScraper(),
    new JumboScraper(),
    new DiscoScraper(),
    new CarrefourScraper(),
    new ChangomasScraper(),
    new DiaScraper()
];
