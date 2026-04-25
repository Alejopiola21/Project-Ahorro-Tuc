import { BaseScraper } from '../core/BaseScraper';

import { VeaScraper } from './vea';
import { JumboScraper } from './jumbo';
import { DiscoScraper } from './disco';
import { CarrefourScraper } from './carrefour';
import { ChangomasScraper } from './changomas';
import { DiaScraper } from './dia';
import { CotoScraper } from './coto';
import { GomezPardoScraper } from './gomez_pardo';
import { LibertadScraper } from './libertad';
import { ComodinScraper } from './comodin';
import { MaxiconsumoScraper } from './maxiconsumo';
import { LaAnonimaScraper } from './laanonima';
import { MakroScraper } from './makro';

// Cualquier scraper agregado aquí será ejecutado automáticamente en cron/batch
export const providersRegistry: BaseScraper[] = [
    new VeaScraper(),
    new JumboScraper(),
    new DiscoScraper(),
    new CarrefourScraper(),
    new ChangomasScraper(),
    new DiaScraper(),
    new CotoScraper(),
    new GomezPardoScraper(),
    new LibertadScraper(),
    new ComodinScraper(),
    new MaxiconsumoScraper(),
    new LaAnonimaScraper(),
    new MakroScraper(),
];
