const { chromium } = require('playwright');
const assert = require('node:assert/strict');
const path = require('node:path');
const { mkdtempSync } = require('node:fs');
const os = require('node:os');

(async () => {
  const watchdog = setTimeout(() => { console.error('Extension test timed out'); process.exit(1); }, 60000);
  const context = await chromium.launchPersistentContext(mkdtempSync(path.join(os.tmpdir(), 'agy-extension-')), {
    channel: 'chromium', headless: true, ignoreDefaultArgs: ['--disable-extensions'], args: ['--enable-unsafe-extension-debugging']
  });
  const browser = context.browser();
  browser.on('disconnected', () => console.log('Test browser disconnected'));
  context.on('page', page => page.on('pageerror', error => console.error('Page error:', error.message)));
  const cdp = await browser.newBrowserCDPSession();
  try {
    const { id } = await cdp.send('Extensions.loadUnpacked', { path: path.resolve(__dirname, '../extension') });
    console.log('Loaded extension', id);
    const worker = context.serviceWorkers().find(w => w.url().startsWith('chrome-extension://' + id)) || await context.waitForEvent('serviceworker');
    assert.equal(await worker.evaluate(() => chrome.action.onClicked.hasListener(launch)), true);
    await context.route('https://*.annotator.test/**', route => route.fulfill({
      headers: { 'Content-Type': 'text/html', 'Content-Security-Policy': "script-src 'none'; require-trusted-types-for 'script'; trusted-types 'none'" },
      body: '<!doctype html><html><body><h1>Independent target site</h1><button id="target">Annotate me</button></body></html>'
    }));
    const first = await context.newPage(), second = await context.newPage();
    await first.goto('https://first.annotator.test/');
    await second.goto('https://second.annotator.test/');
    async function activate(page) {
      await page.bringToFront();
      const { targetInfos } = await cdp.send('Target.getTargets', { filter: [{ type: 'tab', exclude: false }] });
      const targetInfo = targetInfos.find(target => target.url === page.url());
      assert.ok(targetInfo, 'No browser tab target for ' + page.url());
      await cdp.send('Extensions.triggerAction', { id, targetId: targetInfo.targetId });
      await page.locator('#agy-main-toolbar').waitFor({ timeout: 10000 });
      console.log('Triggered action on', page.url());
    }
    assert.equal(await first.locator('#agy-main-toolbar').count(), 0);
    assert.equal(await second.locator('#agy-main-toolbar').count(), 0);
    await activate(first);
    await first.locator('#agy-main-toolbar').waitFor();
    assert.equal(await second.locator('#agy-main-toolbar').count(), 0);
    await first.bringToFront();
    await first.locator('#agy-toggle-btn').click(); await first.locator('#target').click();
    await first.locator('#agy-note-input').fill('first tab feedback'); await first.locator('#agy-save-btn').click();
    await activate(second); await second.locator('#agy-main-toolbar').waitFor();
    assert.equal(await second.locator('#agy-count').textContent(), '0');
    assert.equal(await first.locator('#agy-count').textContent(), '1');
    console.log('PASS real extension action and activeTab independently in two strict-CSP tabs');
    await activate(second);
    assert.equal(await second.locator('#agy-main-toolbar').count(), 1);
    assert.equal(await second.locator('#agy-btn-text').textContent(), '貼便條紙模式');
    await second.bringToFront(); await second.locator('#agy-exit-btn').click();
    assert.equal(await first.locator('#agy-main-toolbar').count(), 1);
    await activate(second); await second.locator('#agy-main-toolbar').waitFor();
    console.log('PASS repeated action, per-tab exit, and reactivation');
    await first.reload(); assert.equal(await first.locator('#agy-main-toolbar').count(), 0);
    await activate(first); await first.locator('#agy-main-toolbar').waitFor();
    assert.equal(await first.locator('#agy-count').textContent(), '1');
    console.log('PASS reload then extension activation restores draft');
    const restricted = await context.newPage();
    await restricted.goto('chrome://version'); await restricted.bringToFront();
    const { targetInfos } = await cdp.send('Target.getTargets', { filter: [{ type: 'tab', exclude: false }] });
    const target = targetInfos.find(t => t.url === restricted.url());
    const statusPromise = context.waitForEvent('page');
    await cdp.send('Extensions.triggerAction', { id, targetId: target.targetId });
    const statusPage = await statusPromise;
    await statusPage.locator('#reason').waitFor();
    assert.match(await statusPage.locator('#reason').textContent(), /受限制/);
    assert.equal(await restricted.locator('#agy-main-toolbar').count(), 0);
    console.log('PASS restricted tab shows explicit error page');
  } finally { await context.close(); clearTimeout(watchdog); }
})().catch(error => { console.error(error); process.exitCode = 1; });
