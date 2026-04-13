import type { CartItem, CartTotals, Supermarket } from '../types';

interface PDFOptions {
    cart: CartItem[];
    cartTotals: CartTotals | null;
    optMode: 'single' | 'hybrid';
    supermarkets: Supermarket[];
    selectedSupermarket?: string;
}

/**
 * Genera un PDF profesional con la lista de compras optimizada.
 * Usa la API de impresión del navegador para generar el PDF.
 */
export async function generateCartPDF(options: PDFOptions): Promise<void> {
    const { cart, cartTotals, optMode, supermarkets, selectedSupermarket } = options;
    
    // Determinar el supermercado ganador
    let winnerSupermarket = '';
    let totalAmount = 0;
    let savings = 0;
    
    if (cartTotals && cartTotals.sortedTotals.length > 0) {
        const [bestSupId, bestTotal] = cartTotals.sortedTotals[0];
        winnerSupermarket = bestSupId;
        totalAmount = bestTotal;
        savings = cartTotals.maxSavings;
    }
    
    if (selectedSupermarket) {
        winnerSupermarket = selectedSupermarket;
    }
    
    // Crear contenido HTML para impresión
    const htmlContent = buildPDFHTML(cart, cartTotals, optMode, winnerSupermarket, totalAmount, savings, supermarkets);
    
    // Abrir ventana de impresión
    const printWindow = window.open('', '_blank', 'width=800,height=600');
    
    if (!printWindow) {
        throw new Error('No se pudo abrir la ventana de impresión. Verificá que el navegador no esté bloqueando pop-ups.');
    }
    
    printWindow.document.write(htmlContent);
    printWindow.document.close();
    
    // Esperar a que cargue y abrir diálogo de impresión
    printWindow.onload = () => {
        printWindow.focus();
        printWindow.print();
    };
}

/**
 * Construye el HTML para el PDF del ticket
 */
function buildPDFHTML(
    cart: CartItem[],
    cartTotals: CartTotals | null,
    optMode: 'single' | 'hybrid',
    winnerSupermarket: string,
    totalAmount: number,
    savings: number,
    supermarkets: Supermarket[]
): string {
    const supInfo = supermarkets.find(s => s.id === winnerSupermarket);
    const date = new Date().toLocaleDateString('es-AR', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
    
    // Construir lista de productos
    let productsHTML = '';
    cart.forEach((item, idx) => {
        const price = item.product.prices[winnerSupermarket];
        const itemTotal = price ? price * item.quantity : 0;
        productsHTML += `
            <tr class="${idx % 2 === 0 ? 'even' : 'odd'}">
                <td>${item.quantity}</td>
                <td>${item.product.name}</td>
                <td class="text-right">$${price ? price.toLocaleString('es-AR') : 'N/A'}</td>
                <td class="text-right">$${itemTotal.toLocaleString('es-AR')}</td>
            </tr>
        `;
    });
    
    // Sección híbrida si aplica
    let hybridSection = '';
    if (optMode === 'hybrid' && cartTotals?.hybridOptimization) {
        const hybrid = cartTotals.hybridOptimization;
        hybridSection = `
            <div class="hybrid-section">
                <h2>🔀 Compra Dividida (Híbrida)</h2>
                <div class="hybrid-info">
                    <p class="hybrid-total">Total Optimizado: <strong>$${hybrid.totalPrice.toLocaleString('es-AR')}</strong></p>
                    <p class="hybrid-savings">Ahorro Extra: <strong>$${hybrid.savingsFromSingle.toLocaleString('es-AR')}</strong></p>
                </div>
                <div class="hybrid-supers">
                    ${hybrid.supermarkets.map(supId => {
                        const sup = supermarkets.find(s => s.id === supId);
                        const items = hybrid.splits[supId];
                        const partial = items.reduce((acc, item) => acc + item.totalPrice, 0);
                        return `
                            <div class="hybrid-sup">
                                <h3 style="color: ${sup?.color || '#333'}">${sup?.name || supId}</h3>
                                <p class="partial-total">Subtotal: $${partial.toLocaleString('es-AR')}</p>
                                <ul>
                                    ${items.map(item => `<li>${item.name} x${item.quantity} - $${item.totalPrice.toLocaleString('es-AR')}</li>`).join('')}
                                </ul>
                            </div>
                        `;
                    }).join('')}
                </div>
            </div>
        `;
    }
    
    return `
<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <title>Ticket Ahorro Tuc</title>
    <style>
        @media print {
            @page {
                margin: 20mm;
                size: A4;
            }
        }
        
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        
        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 210mm;
            margin: 0 auto;
            padding: 20px;
            background: #f5f5f5;
        }
        
        @media print {
            body {
                background: white;
                padding: 0;
            }
        }
        
        .header {
            text-align: center;
            padding: 30px 0;
            border-bottom: 3px solid #4CAF50;
            margin-bottom: 30px;
        }
        
        .logo {
            font-size: 36px;
            font-weight: bold;
            color: #4CAF50;
            margin-bottom: 10px;
        }
        
        .tagline {
            color: #666;
            font-size: 16px;
        }
        
        .meta {
            background: #f9f9f9;
            padding: 15px;
            border-radius: 8px;
            margin-bottom: 30px;
            display: flex;
            justify-content: space-between;
        }
        
        .meta-item {
            flex: 1;
        }
        
        .meta-label {
            font-size: 12px;
            color: #666;
            text-transform: uppercase;
        }
        
        .meta-value {
            font-size: 16px;
            font-weight: bold;
            color: #333;
        }
        
        h2 {
            color: #4CAF50;
            margin-bottom: 20px;
            font-size: 24px;
        }
        
        table {
            width: 100%;
            border-collapse: collapse;
            background: white;
            box-shadow: 0 2px 8px rgba(0,0,0,0.1);
            margin-bottom: 30px;
        }
        
        thead {
            background: #4CAF50;
            color: white;
        }
        
        th {
            padding: 12px;
            text-align: left;
            font-weight: 600;
        }
        
        th.text-right {
            text-align: right;
        }
        
        td {
            padding: 12px;
            border-bottom: 1px solid #e0e0e0;
        }
        
        tr.even {
            background: #f9f9f9;
        }
        
        tr.odd {
            background: white;
        }
        
        .text-right {
            text-align: right;
        }
        
        .summary {
            background: white;
            padding: 20px;
            border-radius: 8px;
            box-shadow: 0 2px 8px rgba(0,0,0,0.1);
            margin-bottom: 30px;
        }
        
        .summary-row {
            display: flex;
            justify-content: space-between;
            padding: 10px 0;
            border-bottom: 1px solid #e0e0e0;
        }
        
        .summary-row:last-child {
            border-bottom: none;
            font-size: 24px;
            font-weight: bold;
            color: #4CAF50;
        }
        
        .savings-box {
            background: linear-gradient(135deg, #4CAF50, #45a049);
            color: white;
            padding: 20px;
            border-radius: 8px;
            text-align: center;
            margin-bottom: 30px;
        }
        
        .savings-amount {
            font-size: 32px;
            font-weight: bold;
        }
        
        .hybrid-section {
            background: white;
            padding: 20px;
            border-radius: 8px;
            box-shadow: 0 2px 8px rgba(0,0,0,0.1);
            margin-bottom: 30px;
        }
        
        .hybrid-info {
            display: flex;
            gap: 20px;
            margin-bottom: 20px;
        }
        
        .hybrid-total, .hybrid-savings {
            flex: 1;
            padding: 15px;
            background: #f9f9f9;
            border-radius: 8px;
            text-align: center;
            font-size: 18px;
        }
        
        .hybrid-supers {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 20px;
        }
        
        .hybrid-sup {
            padding: 15px;
            border: 2px solid #e0e0e0;
            border-radius: 8px;
        }
        
        .hybrid-sup h3 {
            margin-bottom: 10px;
        }
        
        .hybrid-sup ul {
            list-style: none;
            margin-top: 10px;
        }
        
        .hybrid-sup li {
            padding: 5px 0;
            border-bottom: 1px solid #f0f0f0;
        }
        
        .footer {
            text-align: center;
            padding: 30px 0;
            border-top: 2px solid #e0e0e0;
            color: #666;
            font-size: 14px;
        }
        
        .footer a {
            color: #4CAF50;
            text-decoration: none;
        }
        
        .no-print {
            text-align: center;
            margin: 20px 0;
        }
        
        button {
            padding: 12px 30px;
            font-size: 16px;
            background: #4CAF50;
            color: white;
            border: none;
            border-radius: 8px;
            cursor: pointer;
            font-weight: bold;
        }
        
        button:hover {
            background: #45a049;
        }
    </style>
</head>
<body>
    <div class="no-print">
        <button onclick="window.print()">🖨️ Imprimir / Guardar como PDF</button>
    </div>
    
    <div class="header">
        <div class="logo">🛒 Ahorro Tuc</div>
        <div class="tagline">Comparador de precios en Tucumán</div>
    </div>
    
    <div class="meta">
        <div class="meta-item">
            <div class="meta-label">Fecha</div>
            <div class="meta-value">${date}</div>
        </div>
        <div class="meta-item">
            <div class="meta-label">Productos</div>
            <div class="meta-value">${cart.length} ítems</div>
        </div>
        ${supInfo ? `
        <div class="meta-item">
            <div class="meta-label">Supermercado</div>
            <div class="meta-value" style="color: ${supInfo.color}">${supInfo.name}</div>
        </div>
        ` : ''}
    </div>
    
    <h2>📋 Lista de Compras</h2>
    
    <table>
        <thead>
            <tr>
                <th>Cant.</th>
                <th>Producto</th>
                <th class="text-right">Precio Unit.</th>
                <th class="text-right">Subtotal</th>
            </tr>
        </thead>
        <tbody>
            ${productsHTML}
        </tbody>
    </table>
    
    <div class="summary">
        <div class="summary-row">
            <span>Subtotal:</span>
            <span>$${totalAmount.toLocaleString('es-AR')}</span>
        </div>
        <div class="summary-row">
            <span>Total:</span>
            <span>$${totalAmount.toLocaleString('es-AR')}</span>
        </div>
    </div>
    
    ${savings > 0 ? `
    <div class="savings-box">
        <div>💰 Ahorro total comparado con la opción más cara</div>
        <div class="savings-amount">$${savings.toLocaleString('es-AR')}</div>
    </div>
    ` : ''}
    
    ${hybridSection}
    
    <div class="footer">
        <p>Generado por <a href="https://ahorro-tuc.com.ar">Ahorro Tuc</a></p>
        <p style="margin-top: 10px; font-size: 12px;">
            ⚠️ Los precios pueden variar. Verificá en el supermercado antes de comprar.
        </p>
    </div>
    
    <script>
        // Auto-print on load (optional)
        // window.print();
    </script>
</body>
</html>
    `;
}
