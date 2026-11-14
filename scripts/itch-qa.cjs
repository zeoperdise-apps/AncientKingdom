// Run against the actual itch archive, in a disposable browser context and owned servers.
const { chromium } = require('playwright-core');
const fs = require('node:fs'), path = require('node:path'), http = require('node:http');
const { execFileSync } = require('node:child_process');
const assert = require('node:assert/strict');
const root = path.resolve('artifacts/itch-runtime'), media = path.resolve('release/itch-media');
const prefix = '/html5/ancient-kingdom/';
const fixtures = JSON.parse(fs.readFileSync('artifacts/qa-fixtures.json', 'utf8'));
const checks = [], errors = [], failures = [], servers = [], embeddedAssets = [];
const mime = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.png': 'image/png', '.wav': 'audio/wav', '.txt': 'text/plain' };
function listen(handler) {
  const server = http.createServer(handler); servers.push(server);
  return new Promise(resolve => server.listen(0, '127.0.0.1', () => resolve(`http://127.0.0.1:${server.address().port}`)));
}
function serve(req, res) {
  const pathname = decodeURIComponent(new URL(req.url, 'http://localhost').pathname);
  const relative = pathname.startsWith(prefix) ? pathname.slice(prefix.length) : pathname === '/' ? 'index.html' : pathname.slice(1);
  const file = path.resolve(root, relative || 'index.html');
  if (path.relative(root, file).startsWith('..') || !fs.existsSync(file) || !fs.statSync(file).isFile()) { res.writeHead(404); res.end('Not found'); return; }
  res.writeHead(200, { 'Content-Type': mime[path.extname(file)] || 'application/octet-stream', 'Cache-Control': 'no-store' });
  fs.createReadStream(file).pipe(res);
}
function observe(page) {
  page.on('pageerror', e => errors.push(String(e)));
  page.on('console', m => { if (m.type() === 'error') errors.push(m.text()); });
  page.on('response', r => {
    if (r.status() >= 400) failures.push(`${r.status()} ${r.url()}`);
    const frameUrl = r.request().frame()?.url() || '';
    if (frameUrl.includes(prefix) && r.url().includes('/assets/')) embeddedAssets.push(r.url());
  });
  page.on('requestfailed', r => failures.push(`${r.url()}: ${r.failure()?.errorText}`));
}
async function visualReady(frame) {
  await frame.waitForFunction(() => document.querySelector('canvas')?.width > 0);
  await frame.evaluate(() => document.fonts.ready);
  await frame.waitForTimeout(300); // Allow the game camera and texture uploads to settle.
}
(async () => {
  fs.mkdirSync(root, { recursive: true }); fs.mkdirSync(media, { recursive: true });
  execFileSync('python', ['-c', 'from pathlib import Path; import zipfile; z=zipfile.ZipFile("release/AncientKingdom-itch.zip"); assert all(n=="index.html" or n=="THIRD_PARTY_LICENSES.txt" or n.startswith("assets/") for n in z.namelist()); z.extractall(Path("artifacts/itch-runtime"))']);
  const gameOrigin = await listen(serve);
  const parentOrigin = await listen((req, res) => { res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' }); res.end(`<!doctype html><html><head><meta name="viewport" content="width=device-width,initial-scale=1"><title>HTML5 embed validation</title><style>html,body{margin:0;width:100%;height:100%;overflow:hidden}iframe{display:block;width:100%;height:100%;border:0}</style></head><body><iframe title="古都" src="${gameOrigin}${prefix}" allow="autoplay; fullscreen" allowfullscreen sandbox="allow-scripts allow-same-origin allow-pointer-lock allow-downloads"></iframe></body></html>`); });
  const browser = await chromium.launch({ headless: true, channel: 'chrome' });
  try {
    const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
    await context.addInitScript(() => {
      // Browser-only observation: this instrumentation is never added to the shipped game.
      window.__ITCH_AUDIO = { contexts: [], decoded: 0, oscillatorStarts: 0, wavStarts: 0 };
      const Native = window.AudioContext;
      window.AudioContext = class extends Native { constructor(...args) { super(...args); window.__ITCH_AUDIO.contexts.push(this); } };
      const decode = Native.prototype.decodeAudioData;
      Native.prototype.decodeAudioData = function (...args) { return decode.apply(this, args).then(buffer => { window.__ITCH_AUDIO.decoded++; return buffer; }); };
      for (const [method, counter] of [['createOscillator', 'oscillatorStarts'], ['createBufferSource', 'wavStarts']]) {
        const create = Native.prototype[method]; Native.prototype[method] = function (...args) { const source = create.apply(this, args), start = source.start; source.start = function (...args) { window.__ITCH_AUDIO[counter]++; return start.apply(this, args); }; return source; };
      }
    });
    const page = await context.newPage(); observe(page);
    await page.goto(parentOrigin); const frame = page.frame({ url: new RegExp(prefix) }); assert(frame);
    await visualReady(frame);
    assert.equal(await frame.evaluate(() => typeof window.__AK_TEST), 'undefined');
    assert.equal(await frame.evaluate(() => document.documentElement.scrollWidth > innerWidth), false);
    await page.screenshot({ path: path.join(media, '01-title.png') });
    const button = action => frame.locator(`button[data-action='${JSON.stringify(action)}']`);
    const state = () => frame.evaluate(() => JSON.parse(JSON.parse(localStorage.getItem('ancient-kingdom.save.v1')).payload));
    await frame.locator('[data-ui="new"]').click(); await frame.locator('[data-origin="gale"]').click();
    await button({ type: 'enter' }).click(); await button({ type: 'move' }).click();
    await visualReady(frame); const before = await state(); assert.equal(before.phase, 'explore'); assert.equal(before.stats.steps, 1);
    await frame.waitForFunction(() => window.__ITCH_AUDIO.decoded === 2 && window.__ITCH_AUDIO.oscillatorStarts > 0);
    await page.waitForTimeout(180); await button({ type: 'move', backward: true }).click(); await button({ type: 'move' }).click();
    // Inspect a later real movement as well, so the decoded original step WAV is exercised.
    await page.waitForTimeout(180); await button({ type: 'turn', delta: 1 }).click(); await page.waitForTimeout(180); await button({ type: 'move' }).click();
    const audio = await frame.evaluate(() => ({ states: window.__ITCH_AUDIO.contexts.map(c => c.state), decoded: window.__ITCH_AUDIO.decoded, oscillatorStarts: window.__ITCH_AUDIO.oscillatorStarts, wavStarts: window.__ITCH_AUDIO.wavStarts }));
    assert.deepEqual(audio.states, ['running']); assert.equal(audio.decoded, 2); assert(audio.oscillatorStarts > 0);
    assert(audio.wavStarts > 0);
    checks.push('Extracted archive starts in sandboxed cross-origin iframe at a nested HTML5 URL; no production mutation API');
    checks.push('User click unlocks running Web Audio, schedules original MIDI notes and decodes both original WAV files');
    const saved = await state(); await page.reload(); const resumed = page.frame({ url: new RegExp(prefix) });
    await resumed.locator('[data-ui="continue"]').click();
    assert.deepEqual(await resumed.evaluate(() => JSON.parse(JSON.parse(localStorage.getItem('ancient-kingdom.save.v1')).payload)), saved);
    checks.push('New game, origin selection, camp, movement and exact auto-save reload/Continue work inside iframe');
    await resumed.locator('#tools [data-ui="map"]').click(); assert(await resumed.locator('dialog').isVisible());
    await resumed.locator('dialog [data-ui="close"]').first().click();
    await resumed.locator('#tools [data-ui="settings"]').click();
    await resumed.locator('#mute').check(); await resumed.locator('#volume').fill('20');
    await resumed.locator('dialog [data-ui="close"]').first().click();
    assert.equal(await resumed.evaluate(() => JSON.parse(localStorage.getItem('ancient-kingdom.settings')).volume), .2);
    // Capture representative states from validated, ordinary simulation-generated save files.
    await resumed.evaluate(raw => localStorage.setItem('ancient-kingdom.save.v1', raw), fixtures.branch || fixtures.chest);
    await page.reload(); let current = page.frame({ url: new RegExp(prefix) });
    await current.locator('[data-ui="continue"]').click(); await visualReady(current);
    await page.screenshot({ path: path.join(media, '02-dungeon.png') });
    await current.evaluate(raw => localStorage.setItem('ancient-kingdom.save.v1', raw), fixtures['boss-4']);
    await page.reload(); current = page.frame({ url: new RegExp(prefix) });
    await current.locator('[data-ui="continue"]').click(); await visualReady(current);
    await page.screenshot({ path: path.join(media, '03-battle.png') });
    assert(await current.locator('.enemy-info').isVisible());
    assert(embeddedAssets.length > 0 && embeddedAssets.every(url => new URL(url).pathname.startsWith(prefix + 'assets/')));
    for (const name of ['wall.png', 'title-ruins.png', 'teki.png', 'cave-notes.json', 'step.wav', 'crash.wav']) assert(embeddedAssets.some(url => url.endsWith('/' + name)), `Missing embedded asset: ${name}`);
    checks.push('Map and settings controls work; original white-knight texture loads in a saved battle');
    const sizes = [];
    for (const size of [{ width: 960, height: 600 }, { width: 360, height: 780 }, { width: 844, height: 390 }]) {
      await page.setViewportSize(size); await visualReady(current);
      const geometry = await current.evaluate(() => ({ width: innerWidth, height: innerHeight, overflow: document.documentElement.scrollWidth > innerWidth, canvas: !!document.querySelector('canvas')?.getContext('webgl2'), battleButtons: [...document.querySelectorAll('.battle-menu button')].map(b => { const r = b.getBoundingClientRect(); return r.left >= 0 && r.right <= innerWidth && r.top >= 0 && r.bottom <= innerHeight; }) }));
      assert.equal(geometry.overflow, false); assert(geometry.canvas); assert(geometry.battleButtons.every(Boolean)); sizes.push(geometry);
      await page.screenshot({ path: `artifacts/itch-${size.width}x${size.height}.png` });
    }
    checks.push('Embedded 960x600, 360x780 and 844x390 layouts fit and show all battle commands (desktop Chrome viewport emulation)');
    // Verify credits' runtime image URL and a normal root-served deployment as well.
    await page.setViewportSize({ width: 1440, height: 900 });
    const direct = await context.newPage(); observe(direct); await direct.goto(gameOrigin + '/');
    await direct.locator('[data-ui="credits"]').click();
    assert(await direct.locator('.credits img').evaluate(img => img.complete && img.naturalWidth > 0));
    await direct.locator('dialog [data-ui="close"]').first().click();
    checks.push('Root-served production title and credits still work with relative base');
    const coverContext = await browser.newContext({ viewport: { width: 630, height: 500 } });
    const cover = await coverContext.newPage(); observe(cover); await cover.goto(gameOrigin + prefix);
    await cover.addStyleTag({ content: '.title-copy{padding:32px 36px;max-width:100%}.title-copy h1{font-size:136px;margin-top:8px;letter-spacing:.18em}.subtitle{font-size:17px;letter-spacing:.25em}.title-story{font-size:13px;margin:20px 0 0}.title-menu,.title-side{display:none}.title-credit{margin-top:26px;font-size:10px}.title-memory{left:25%;opacity:.68}.game-shell{min-height:0}' });
    await visualReady(cover); await cover.screenshot({ path: path.join(media, 'cover-630x500.png') });
    await coverContext.close(); await context.close();
    assert.deepEqual(errors, []); assert.deepEqual(failures, []);
    const report = { checks, audio, sizes, embeddedAssets: [...new Set(embeddedAssets)].map(url => new URL(url).pathname), errors, failures, limitations: ['itch.io live upload and browser storage policy unverified', 'No Safari, Firefox, real mobile device, or auditory timbre evaluation'], media: fs.readdirSync(media) };
    fs.writeFileSync('artifacts/itch-qa.json', JSON.stringify(report, null, 2)); console.log(JSON.stringify(report, null, 2));
  } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; }).finally(async () => { await Promise.all(servers.map(server => new Promise(resolve => server.close(resolve)))); });
