import { test, expect } from '@playwright/test';

test('les pages et l’API portent les en-têtes de sécurité', async ({ page, request }) => {
  const res = await page.goto('/auth/admin-signin');
  const headers = res!.headers();
  expect(headers['x-frame-options']).toBe('SAMEORIGIN');
  expect(headers['x-content-type-options']).toBe('nosniff');
  expect(headers['content-security-policy']).toContain("frame-ancestors 'self'");
  expect(headers['x-powered-by']).toBeUndefined();

  const api = await request.get('http://127.0.0.1:8001/api/ping');
  expect(api.headers()['x-frame-options']).toBe('DENY');
  expect(api.headers()['content-security-policy']).toContain("default-src 'none'");
});

test('le visualiseur PDF s’affiche toujours dans un cadre de la même origine', async ({ page }) => {
  // X-Frame-Options SAMEORIGIN ne doit pas bloquer le visualiseur pdf.js intégré.
  await page.goto('/auth/admin-signin');
  await page.evaluate(() => {
    const f = document.createElement('iframe');
    f.id = 'v';
    f.src = '/pdfjs/web/viewer.html';
    document.body.appendChild(f);
  });
  const frame = page.frameLocator('#v');
  await expect(frame.locator('#viewerContainer')).toBeAttached();
});
