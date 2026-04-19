import { describe, it, expect } from 'vitest';
import { 
    sanitizeString, 
    extractSignificantWords, 
    fuzzyMatch, 
    inferCategory,
    extractUnitInfo,
    ScrapedProduct
} from './sync';

describe('Scraper Core Data Normalization', () => {

    describe('sanitizeString', () => {
        it('should remove accents and special characters', () => {
            expect(sanitizeString('Lácteos, Azúcar & Café!')).toBe('lacteos azucar  cafe');
        });

        it('should normalize volume formats', () => {
            expect(sanitizeString('Leche 1 L')).toBe('leche 1l');
            expect(sanitizeString('Agua 500 ml')).toBe('agua 500ml');
        });

        it('should normalize weight formats', () => {
            expect(sanitizeString('Queso 500 gr')).toBe('queso 500g');
            expect(sanitizeString('Harina 1 kg')).toBe('harina 1kg');
            expect(sanitizeString('Pan 1000g')).toBe('pan 1kg');
            expect(sanitizeString('Carne 1500g')).toBe('carne 1.5kg');
        });
    });

    describe('extractSignificantWords', () => {
        it('should extract words with length > 2', () => {
            const words = extractSignificantWords('Leche entera La Serenísima 1L');
            expect(words).toEqual(['leche', 'entera', 'serenisima']);
            // Note: 1L becomes '1l' which length is 2, so it gets excluded. Wait, let's verify if length > 2 excludes 2-char words. Yes.
        });
    });

    describe('fuzzyMatch', () => {
        it('should return true if scraped name contains all significant words from dbName', () => {
            expect(fuzzyMatch('Leche Entera La Serenisima 1L', 'Leche Clasica Entera La Serenisima Sachet 1L')).toBe(true);
        });

        it('should return false if scraped name is missing a significant word', () => {
            expect(fuzzyMatch('Leche Entera La Serenisima 1L', 'Leche Descremada La Serenisima 1L')).toBe(false);
        });
    });

    describe('extractUnitInfo', () => {
        it('should extract kg correctly', () => {
            expect(extractUnitInfo('Queso Cremoso 1.5kg')).toEqual({ weight: '1.5kg', unitValue: 1.5, unitType: 'kg' });
        });

        it('should extract g and convert to kg', () => {
            expect(extractUnitInfo('Galletitas 500g')).toEqual({ weight: '500g', unitValue: 0.5, unitType: 'kg' });
        });

        it('should extract ml and convert to l', () => {
            expect(extractUnitInfo('Cerveza 473ml')).toEqual({ weight: '473ml', unitValue: 0.473, unitType: 'l' });
        });
        
        it('should extract units', () => {
            expect(extractUnitInfo('Huevos 6 unidades')).toEqual({ weight: null, unitValue: 6, unitType: 'u' });
        });
    });

    describe('inferCategory', () => {
        it('should map keywords to correct categories', () => {
            const milk: ScrapedProduct = { name: 'Leche Descremada', price: 100 };
            expect(inferCategory(milk)).toBe('Lácteos');

            const soap: ScrapedProduct = { name: 'Jabon Liquido Ala', price: 100 };
            expect(inferCategory(soap)).toBe('Limpieza');

            const meat: ScrapedProduct = { name: 'Milanesa de NALGA', price: 100 };
            expect(inferCategory(meat)).toBe('Carnes');
        });

        it('should return Otros if no match found', () => {
            const unknown: ScrapedProduct = { name: 'Pilas AAA Duracell', price: 100 };
            expect(inferCategory(unknown)).toBe('Otros');
        });
    });

});
