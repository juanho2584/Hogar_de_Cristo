import { test, expect } from '@playwright/test';

test.describe('Flujo E2E de Autenticación y Navegación', () => {
  test('debe cargar la página de login con formulario y credenciales demo', async ({ page }) => {
    await page.goto('/login');

    // Verificar presencia del logo y campos
    await expect(page.locator('text=Hogar de Dios')).toBeVisible();
    await expect(page.locator('#login-email')).toBeVisible();
    await expect(page.locator('#login-password')).toBeVisible();
    await expect(page.locator('#btn-login')).toBeVisible();
  });

  test('debe iniciar sesión con credenciales de administrador y acceder al Dashboard', async ({ page }) => {
    await page.goto('/login');

    await page.fill('#login-email', 'admin@hogar.edu');
    await page.fill('#login-password', 'Hogar2025');
    await page.click('#btn-login');

    // Debe navegar a /dashboard
    await expect(page).toHaveURL(/.*dashboard/);
    await expect(page.locator('text=Dashboard')).toBeVisible();
  });
});
