const { chromium } = require('playwright');
const assert = require('node:assert/strict');
const { readFileSync, mkdirSync } = require('node:fs');
const path = require('node:path');
const source = readFileSync(path.join(__dirname, '../resources/annotator-overlay.js'), 'utf8');
const fixture = `<!doctype html><html><head><meta charset="utf-8"><style>
body{margin:0;font:16px system-ui;min-height:1800px}main{padding:60px}button{padding:12px}#panel{margin:25px;background:#eee;padding:30px}#scroller{height:140px;overflow:auto;width:300px}#inside{margin-top:150px}#fixed{position:fixed;top:0;right:0}</style></head>
<body><main id="main"><button id="one">One</button><button id="two">Two</button><button id="three">Three</button><button id="four">Four</button><section id="panel"><button id="child">Child</button></section><div id="scroller"><button id="inside">Inside</button><div style="height:400px"></div></div></main><button id="fixed">Fixed</button>
<script>window.clicks=0;document.getElementById('one').onclick=()=>window.clicks++;</script></body></html>`;
(async () => {
  const browser = await chromium.launch({ headless: true, ...(process.env.CHROME_PATH ? { executablePath: process.env.CHROME_PATH } : {}) });
  const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
  page.setDefaultTimeout(7000);
  const errors = [];
  page.on('pageerror', e => errors.push(e.message));
  page.on('dialog', dialog => dialog.accept());
  const url = 'http://127.0.0.1/test';
  await page.route('http://127.0.0.1/**', route => route.fulfill({ contentType: 'text/html', body: fixture }));
  const inject = () => page.addScriptTag({ content: source });
  const pin = id => page.locator('.agy-sticky-pin').filter({ has: page.locator('.agy-card-text', { hasText: 'note-' + id }) });
  async function add(selector, text) {
    await page.locator(selector).click();
    await page.locator('#agy-note-input').fill(text);
    await page.locator('#agy-save-btn').click();
  }
  async function exportData() {
    const pending = page.waitForEvent('download');
    await page.getByRole('button', { name: '匯出 JSON', exact: true }).click();
    return JSON.parse(readFileSync(await (await pending).path(), 'utf8'));
  }
  async function nearTarget(id, target) {
    await page.waitForFunction(({ id, target }) => {
      const pin = [...document.querySelectorAll('.agy-sticky-pin')].find(p => p.firstChild.textContent === String(id));
      const a = pin.getBoundingClientRect(), b = document.querySelector(target).getBoundingClientRect();
      return Math.abs(a.left + 14 - (b.left + b.width / 2)) < 3 && Math.abs(a.top + 14 - (b.top + b.height / 2)) < 3;
    }, { id, target });
  }
  try {
    await page.goto(url); await inject();
    await page.locator('#agy-toggle-btn').click();
    await add('#one', 'note-1'); await add('#two', 'note-2'); await add('#three', 'note-3');
    await pin(2).hover(); await pin(2).locator('.agy-card-del-btn').click();
    await add('#four', 'note-4');
    let data = await exportData();
    assert.deepEqual(data.notes.map(n => n.id), [1, 3, 4]);
    console.log('PASS unique IDs after delete/add');
    await add('#child', '</textarea><img src=x onerror="window.injected=1">');
    assert.equal(await page.evaluate(() => window.injected), undefined);
    assert.equal(await page.locator('.agy-sticky-pin img').count(), 0);
    const last = page.locator('.agy-sticky-pin').last();
    await last.hover(); await last.locator('.agy-card-edit-btn').click();
    assert.match(await page.locator('#agy-note-input').inputValue(), /<img/);
    await page.locator('.agy-crumb-btn').filter({ hasText: /^section/ }).click();
    await page.locator('#agy-save-btn').click();
    data = await exportData(); assert.equal(data.notes.at(-1).anchor.css, '#panel');
    assert.match(data.notes.at(-1).selector, /section#panel/);
    console.log('PASS safe literal text and editing target');
    await page.evaluate(() => document.querySelector('#main').style.paddingTop = '160px');
    await nearTarget(1, '#one');
    await page.setViewportSize({ width: 900, height: 700 }); await nearTarget(1, '#one');
    await page.evaluate(() => window.scrollTo(0, 100)); await nearTarget(1, '#one');
    await page.evaluate(() => window.scrollTo(0, 0));
    await add('#fixed', 'fixed-note'); await page.evaluate(() => window.scrollTo(0, 100)); await nearTarget(6, '#fixed');
    await page.evaluate(() => { window.scrollTo(0, 0); document.querySelector('#scroller').scrollTop = 120; });
    await add('#inside', 'nested-note');
    await page.evaluate(() => document.querySelector('#scroller').scrollTop = 140); await nearTarget(7, '#inside');
    console.log('PASS layout shift, resize, page scroll, fixed target, nested scroll');
    await page.locator('#agy-exit-btn').click();
    await page.locator('#one').click(); assert.equal(await page.evaluate(() => window.clicks), 1);
    assert.equal(await page.locator('#agy-active-dialog').count(), 0);
    assert.equal(await page.locator('style').count(), 1);
    await inject(); assert.equal(await page.locator('.agy-sticky-pin').count(), 6);
    await page.reload(); await inject(); assert.equal(await page.locator('.agy-sticky-pin').count(), 6);
    console.log('PASS cleanup, reopening and draft restoration');
    await page.evaluate(() => document.querySelector('#one').remove());
    await page.waitForFunction(() => document.querySelector('.agy-sticky-pin').title.includes('失效'));
    data = await exportData(); assert.equal(data.notes[0].status, 'missing');
    await page.evaluate(() => history.pushState({}, '', '/other'));
    await page.waitForFunction(() => document.querySelector('#agy-count').textContent === '0');
    await page.evaluate(() => history.back());
    await page.waitForFunction(() => document.querySelector('#agy-count').textContent === '6');
    console.log('PASS missing anchor and SPA route separation');
    const screenshot = await page.screenshot();
    await page.locator('input[type=file][accept^="image/"]').setInputFiles({ name: 'screen.png', mimeType: 'image/png', buffer: screenshot });
    await page.getByRole('button', { name: '更換截圖 ✓', exact: true }).waitFor();
    data = await exportData(); assert.match(data.screenshot, /^data:image\/png;base64,/); assert.equal(data.viewport.width, 900);
    await page.getByRole('button', { name: '清除草稿', exact: true }).click();
    await page.locator('input[type=file][accept^=".json"]').setInputFiles({ name: 'data.json', mimeType: 'application/json', buffer: Buffer.from(JSON.stringify(data)) });
    await page.waitForFunction(() => document.querySelector('#agy-count').textContent === '6');
    await page.evaluate(() => { Object.defineProperty(navigator, 'clipboard', { configurable: true, value: undefined }); window.prompt = text => { window.promptText = text; }; });
    await page.locator('#agy-copy-btn').click(); assert.ok(await page.evaluate(() => window.promptText));
    console.log('PASS screenshot, JSON round-trip and clipboard fallback');
    const invalid = structuredClone(data); invalid.notes[1].id = invalid.notes[0].id;
    await page.locator('input[type=file][accept^=".json"]').setInputFiles({ name: 'bad.json', mimeType: 'application/json', buffer: Buffer.from(JSON.stringify(invalid)) });
    await page.getByText('匯入失敗：便條紙資料不完整', { exact: true }).waitFor();
    assert.equal(await page.locator('.agy-sticky-pin').count(), 6);
    console.log('PASS malformed import preserves current notes');
    await page.locator('#agy-toggle-btn').click();
    await page.locator('#two').click();
    await page.keyboard.press('Escape'); assert.equal(await page.locator('#agy-active-dialog').count(), 0);
    mkdirSync(path.join(__dirname, '../test-results'), { recursive: true });
    await page.screenshot({ path: path.join(__dirname, '../test-results/desktop.png') });
    await page.setViewportSize({ width: 390, height: 844 });
    await page.screenshot({ path: path.join(__dirname, '../test-results/mobile.png') });
    const toolbarBox = await page.locator('#agy-main-toolbar').boundingBox();
    assert.ok(toolbarBox.x >= 0 && toolbarBox.x + toolbarBox.width <= 390);
    await page.locator('#agy-exit-btn').click();
    const bookmarklet = readFileSync(path.join(__dirname, '../resources/bookmarklet.txt'), 'utf8').trim();
    await page.addScriptTag({ content: decodeURIComponent(bookmarklet.slice('javascript:'.length)) });
    assert.equal(await page.locator('#agy-main-toolbar').count(), 1);
    assert.equal(await page.locator('.agy-sticky-pin').count(), 6);
    await page.locator('#agy-exit-btn').click();
    const installer = readFileSync(path.join(__dirname, '../resources/bookmarklet-installer.html'), 'utf8');
    const marker = installer.indexOf('<!-- 內嵌即時運行的腳本邏輯 -->');
    const start = installer.indexOf('<script>', marker) + '<script>'.length;
    await page.evaluate(() => { const button = document.createElement('button'); button.id = 'tryDemoBtn'; button.textContent = 'Demo'; document.body.append(button); });
    await page.addScriptTag({ content: installer.slice(start, installer.indexOf('</script>', start)) });
    assert.equal(await page.locator('#agy-main-toolbar').count(), 0);
    await page.locator('#tryDemoBtn').click();
    assert.equal(await page.locator('#agy-main-toolbar').count(), 1);
    console.log('PASS generated bookmarklet and embedded installer script');
    await page.locator('#agy-toggle-btn').click();
    await page.mouse.click(360, 450);
    await page.locator('#agy-note-input').fill('blank-space'); await page.locator('#agy-save-btn').click();
    await page.locator('#agy-exit-btn').click(); await inject();
    data = await exportData(); assert.equal(data.notes.at(-1).status, 'resolved');
    await page.evaluate(() => { Storage.prototype.setItem = () => { throw new Error('Storage disabled'); }; });
    await page.locator('#agy-toggle-btn').click();
    await page.mouse.click(360, 470);
    await page.locator('#agy-note-input').fill('memory-only'); await page.locator('#agy-save-btn').click();
    await page.getByText('草稿保存失敗，請匯出 JSON 備份', { exact: true }).waitFor();
    data = await exportData(); assert.equal(data.notes.at(-1).text, 'memory-only');
    console.log('PASS blank-space restoration and storage failure export');
    assert.equal(errors.length, 0, errors.join('\n'));
    console.log('PASS no browser errors; desktop/mobile screenshots saved');
  } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
