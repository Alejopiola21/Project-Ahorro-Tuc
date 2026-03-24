import { test, expect } from '@playwright/test';

test('Critical Flow: Search, Add to Cart, Calculate Optimization', async ({ page }) => {
    page.on('console', msg => console.log('PAGE LOG:', msg.text()));
    page.on('pageerror', error => console.log('PAGE ERROR:', error.message));
    page.on('request', request => console.log('REQ:', request.method(), request.url()));
    page.on('response', response => console.log('RES:', response.status(), response.url()));

    // 1. Navegar a la página principal
    await page.goto('/');

    // 2. Esperar a que cargue el buscador
    const searchInput = page.locator('.search-box input');
    await expect(searchInput).toBeVisible();

    // Preparamos la promesa para interceptar la llamada de búsqueda *antes* de tipear
    const searchResponsePromise = page.waitForResponse(
        response => response.url().includes('/api/products') && response.status() === 200
    );

    // 3. Buscar un producto ("Leche")
    await searchInput.fill('Leche');

    // Esperar a la respuesta de la API después de los 350ms de debounce
    await searchResponsePromise;

    // 4. Agregar el primer producto al carrito
    const firstAddToCartBtn = page.locator('.product-card .add-to-cart-btn').first();
    await expect(firstAddToCartBtn).toBeVisible({ timeout: 10000 });
    await firstAddToCartBtn.click();

    // El Toast de Sonner debería aparecer
    await expect(page.locator('li[data-sonner-toast]')).toBeVisible();

    // 5. Verificar que el badge del carrito se actualice a 1
    const cartBadge = page.locator('.cart-btn .cart-badge');
    await expect(cartBadge).toHaveText('1');

    // 6. Abrir el Sidebar de carrito
    const cartBtn = page.locator('.cart-btn');
    await cartBtn.click();

    // 7. Verificar que el sidebar esté abierto y contenga el item
    const cartSidebar = page.locator('.cart-sidebar');
    await expect(cartSidebar).toHaveClass(/open/);

    const cartItem = cartSidebar.locator('.cart-item').first();
    await expect(cartItem).toBeVisible();

    // 8. Verificar que aparezca un ganador (winner) al tener items
    const winnerRow = cartSidebar.locator('.total-row.winner');
    await expect(winnerRow).toBeVisible({ timeout: 10000 });
});
