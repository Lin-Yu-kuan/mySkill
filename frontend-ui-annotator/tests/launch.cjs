const { chromium } = require('playwright');
const assert = require('node:assert/strict');
const { readFileSync } = require('node:fs');
const path = require('node:path');
const root = path.join(__dirname, '..');
const source = readFileSync(path.join(root, 'resources/annotator-overlay.js'), 'utf8');
const bookmarklet = readFileSync(path.join(root, 'resources/bookmarklet.txt'), 'utf8').trim();

(async () => {
  const browser = await chromium.launch({ headless: true, ...(process.env.CHROME_PATH ? { executablePath: process.env.CHROME_PATH } : {}) });
  const page = await browser.newPage();
  const errors = [], dialogs = [];
  page.on('pageerror', e => errors.push(e.message));
  page.on('dialog', async dialog => { dialogs.push(dialog.message()); await dialog.accept(); });
  await page.route('http://127.0.0.1/**', route => route.fulfill({
    headers: { 'Content-Type': 'text/html', ...(route.request().url().includes('/strict') ? {
      'Content-Security-Policy': "require-trusted-types-for 'script'; trusted-types 'none'"
    } : {}) },
    body: '<html><head></head><body><button id="target">Test target</button></body></html>'
  }));
  try {
    // Follow the actual encoded javascript: URL rather than decoding it into a script tag.
    await page.goto('http://127.0.0.1/plain');
    await page.evaluate(href => {
      const link = document.createElement('a'); link.id = 'launch'; link.href = href; link.textContent = 'Launch'; document.body.append(link);
    }, bookmarklet);
    await page.locator('#launch').click();
    await page.locator('#agy-main-toolbar').waitFor();
    assert.equal(await page.locator('#agy-main-toolbar').count(), 1);
    await page.locator('#launch').click();
    await page.waitForFunction(() => document.querySelector('#agy-btn-text').textContent === '退出貼紙模式');
    assert.equal(await page.locator('#agy-btn-text').textContent(), '退出貼紙模式');
    await page.locator('#agy-exit-btn').click();
    console.log('PASS encoded javascript URL activation and repeat click');

    // DevTools execution supplies the bookmark code; DOM sinks remain subject to Trusted Types.
    // This does not assert that browser-blocked javascript: navigation can be bypassed.
    await page.goto('http://127.0.0.1/strict');
    assert.equal(await page.evaluate(() => {
      try { document.createElement('div').innerHTML = '<b>blocked</b>'; return false; } catch { return true; }
    }), true);
    await page.evaluate(source);
    await page.locator('#agy-toggle-btn').click(); await page.locator('#target').click();
    const text = '</textarea><img src=x onerror=alert(1)>';
    await page.locator('#agy-note-input').fill(text); await page.locator('#agy-save-btn').click();
    assert.equal(await page.locator('.agy-card-text').textContent(), text);
    assert.equal(await page.locator('.agy-sticky-pin img').count(), 0);
    await page.locator('.agy-sticky-pin').hover(); await page.locator('.agy-card-edit-btn').click();
    await page.locator('#agy-note-input').fill('updated'); await page.locator('#agy-save-btn').click();
    assert.equal(await page.locator('.agy-card-text').textContent(), 'updated');
    await page.locator('#agy-exit-btn').click();
    assert.equal(await page.locator('#agy-fixed-root').count(), 0);
    console.log('PASS strict Trusted Types startup, annotation, edit, exit');

    await page.evaluate(() => {
      window.__AGY_STICKY_LOADED__ = true;
      for (const id of ['agy-fixed-root', 'agy-scroll-root']) {
        const el = document.createElement('div'); el.id = id; document.body.append(el);
      }
    });
    await page.evaluate(source);
    assert.equal(await page.locator('#agy-fixed-root').count(), 1);
    assert.equal(await page.locator('#agy-main-toolbar').count(), 1);
    await page.locator('#agy-exit-btn').click();
    console.log('PASS recovery from stale loaded flag');

    await page.evaluate(() => {
      window.originalHeadAppend = document.head.appendChild;
      document.head.appendChild = () => { throw new Error('simulated startup failure'); };
      window.activeTimers = new Set();
      const originalSet = window.setInterval, originalClear = window.clearInterval;
      window.setInterval = (...args) => { const id = originalSet(...args); activeTimers.add(id); return id; };
      window.clearInterval = id => { activeTimers.delete(id); originalClear(id); };
    });
    await page.evaluate(source);
    assert.match(dialogs.at(-1), /simulated startup failure/);
    assert.equal(await page.locator('#agy-fixed-root').count(), 0);
    assert.equal(await page.evaluate(() => window.__AGY_STICKY_LOADED__), false);
    assert.equal(await page.evaluate(() => activeTimers.size), 0);
    await page.evaluate(() => { document.head.appendChild = window.originalHeadAppend; });
    await page.evaluate(source); assert.equal(await page.locator('#agy-main-toolbar').count(), 1);
    console.log('PASS startup failure message, cleanup, and retry');
    assert.deepEqual(errors, []);
    assert.equal(dialogs.length, 1);
  } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
