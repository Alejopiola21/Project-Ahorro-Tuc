import React from 'react';
import { TrendingDown } from 'lucide-react';

export const Footer: React.FC = () => {
    const year = new Date().getFullYear();

    return (
        <footer className="app-footer" role="contentinfo">
            <div className="footer-container">
                <div className="footer-brand">
                    <div className="footer-logo">
                        <TrendingDown size={20} />
                        <span>Ahorro <strong>Tuc</strong></span>
                    </div>
                    <p className="footer-description">
                        Comparador de precios de supermercados en Tucumán.
                        Encontrá el más barato entre 11 cadenas al instante.
                    </p>
                </div>
                <div className="footer-legal">
                    <p className="footer-disclaimer">
                        Los precios son obtenidos de fuentes públicas y pueden variar.
                        Esta herramienta es informativa y no constituye una oferta comercial.
                    </p>
                    <p className="footer-copy">© {year} Ahorro Tuc. Hecho con ❤️ en Tucumán, Argentina.</p>
                </div>
            </div>
        </footer>
    );
};
