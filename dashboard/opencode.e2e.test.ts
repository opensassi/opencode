import { test, expect } from '@playwright/test';
import { execSync, spawn, type ChildProcess } from 'node:child_process';
import { resolve } from 'node:path';

const ROOT = resolve(import.meta.dirname ?? '.', '..');
let server: ChildProcess;
const PORT = 3098;

test.beforeAll(() => {
  server = spawn(process.execPath, [resolve(ROOT, 'scripts/dashboard.js'), '--port', String(PORT)], {
    cwd: ROOT,
    stdio: 'pipe',
  });
  const maxWait = 15000;
  const start = Date.now();
  while (Date.now() - start < maxWait) {
    try {
      execSync(`curl -sf http://127.0.0.1:${PORT}/api/health`, { stdio: 'ignore' });
      break;
    } catch {
      execSync('sleep 0.3');
    }
  }
});

test.afterAll(() => {
  if (server) server.kill();
});

test.describe('opencode dashboard CLI', () => {
  test('npx command starts server and health returns ok', async () => {
    const res = await fetch(`http://127.0.0.1:${PORT}/api/health`);
    expect(res.ok).toBe(true);
    const body = await res.json();
    expect(body.status).toBe('ok');
    expect(body.days_count).toBeGreaterThan(0);
  });

  test('api/days returns opencode dates', async () => {
    const res = await fetch(`http://127.0.0.1:${PORT}/api/days`);
    expect(res.ok).toBe(true);
    const body = await res.json();
    expect(body.days.length).toBeGreaterThanOrEqual(4);
    expect(body.days).toContain('2026-05-16');
  });

  test('api/days/latest returns latest day', async () => {
    const res = await fetch(`http://127.0.0.1:${PORT}/api/days/latest`);
    expect(res.ok).toBe(true);
    const body = await res.json();
    expect(body.date).toBeTruthy();
    expect(body.total_sessions).toBeGreaterThan(0);
  });

  test('api/sessions returns sessions list', async () => {
    const res = await fetch(`http://127.0.0.1:${PORT}/api/sessions`);
    expect(res.ok).toBe(true);
    const body = await res.json();
    expect(body.total).toBeGreaterThan(0);
    expect(body.sessions.length).toBeGreaterThan(0);
    expect(body.sessions[0].entry).toHaveProperty('session_id');
  });

  test('api/stats returns aggregated stats', async () => {
    const res = await fetch(`http://127.0.0.1:${PORT}/api/stats`);
    expect(res.ok).toBe(true);
    const body = await res.json();
    expect(body.total_days).toBeGreaterThan(0);
    expect(body.total_sessions).toBeGreaterThan(0);
    expect(body.per_day.length).toBeGreaterThan(0);
  });

  test('frontend serves index.html', async ({ page }) => {
    await page.goto(`http://127.0.0.1:${PORT}/`);
    await expect(page.locator('nav')).toBeVisible();
    await expect(page.locator('.nav-brand')).toHaveText('opencode');
  });

  test('overview page shows stats', async ({ page }) => {
    await page.goto(`http://127.0.0.1:${PORT}/#/`);
    await expect(page.getByRole('heading', { name: 'Overview' })).toBeVisible();
    await expect(page.locator('.stats-grid')).toBeVisible();
  });

  test('daily page lists dates', async ({ page }) => {
    await page.goto(`http://127.0.0.1:${PORT}/#/daily`);
    await expect(page.locator('.page-title')).toHaveText('Daily Reports');
    const links = page.locator('a[href^="#/daily/"]');
    const count = await links.count();
    expect(count).toBeGreaterThanOrEqual(4);
  });

  test('sessions page shows session cards', async ({ page }) => {
    await page.goto(`http://127.0.0.1:${PORT}/#/sessions`);
    await expect(page.locator('.page-title')).toHaveText(/All Sessions/);
    await page.waitForSelector('.session-card');
    const cards = await page.locator('.session-card').count();
    expect(cards).toBeGreaterThan(0);
  });
});
