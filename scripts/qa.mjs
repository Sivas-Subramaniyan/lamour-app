// Demo QA: visits every screen at phone size, then plays the golden-path tour at desktop size.
// Usage: npm run dev (port 5179), then `node scripts/qa.mjs [--only=tonight/]`. Writes shots/*.png + shots/report.json + shots/index.html.
import { chromium } from 'playwright-core'
import { readFileSync, mkdirSync, writeFileSync, existsSync } from 'node:fs'
import { join } from 'node:path'

const BASE = process.env.QA_URL ?? 'http://localhost:5179/'
const only = process.argv.find(a => a.startsWith('--only='))?.split('=')[1]
const ids = [...readFileSync('src/shell/screens.ts', 'utf8').match(/SCREEN_IDS = \[([\s\S]*?)\] as const/)[1].matchAll(/'([a-z-]+\/[a-z-]+)'/g)].map(m => m[1]).filter(id => !only || id.startsWith(only))
const tourCount = [...readFileSync('src/shell/tour.ts', 'utf8').matchAll(/\{ screen: '/g)].length

const exe = [
  `${process.env.LOCALAPPDATA}\\ms-playwright\\chromium-1234\\chrome-win64\\chrome.exe`,
  'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
].find(existsSync)

mkdirSync('shots/screens', { recursive: true })
mkdirSync('shots/tour', { recursive: true })
const browser = await chromium.launch({ executablePath: exe, args: ['--use-fake-ui-for-media-stream', '--use-fake-device-for-media-stream', '--autoplay-policy=no-user-gesture-required'] })
const report = { screens: [], tour: [] }

async function audit(page) {
  return page.evaluate(() => {
    const root = document.querySelector('.viewport') ?? document.body
    const text = root.innerText
    const tiny = [...root.querySelectorAll('*')].filter(el => {
      if (!el.childNodes.length || ![...el.childNodes].some(n => n.nodeType === 3 && n.textContent.trim())) return false
      const cs = getComputedStyle(el)
      return parseFloat(cs.fontSize) < 10.9 && cs.visibility !== 'hidden' && el.getBoundingClientRect().width > 0
    }).slice(0, 5).map(el => `${parseFloat(getComputedStyle(el).fontSize)}px "${el.textContent.trim().slice(0, 30)}"`)
    const banned = (text.match(/\b(GraphRAG|telemetry|LLM|API|node|Epitom|unlock\w*|\d{1,3}(?:\.\d)?% (?:match|fit|synergy|harmon\w*))\b/gi) ?? []).slice(0, 5)
    return {
      stub: /Being drawn/.test(text),
      overflowX: document.documentElement.scrollWidth > window.innerWidth + 1,
      tiny, banned,
    }
  })
}

// 1) Every screen, phone size (full-screen app mode)
{
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, permissions: ['microphone'] })
  const page = await ctx.newPage()
  let errs = []
  page.on('pageerror', e => errs.push('pageerror: ' + e.message))
  page.on('console', m => m.type() === 'error' && !/favicon|ERR_|Failed to load resource/.test(m.text()) && errs.push('console: ' + m.text().slice(0, 200)))
  page.on('dialog', d => { errs.push('dialog: ' + d.message()); d.dismiss() })
  await page.goto(BASE)
  for (const id of ids) {
    errs = []
    await page.goto(`${BASE}#/${id}`)
    await page.reload()
    await page.waitForTimeout(1600)
    const file = `shots/screens/${id.replace('/', '__')}.png`
    await page.screenshot({ path: file })
    const a = await audit(page)
    report.screens.push({ id, file, errors: errs, ...a })
    process.stdout.write(`${a.stub ? 'STUB ' : errs.length ? 'ERR  ' : 'ok   '}${id}${errs.length ? ' ' + errs[0] : ''}${a.tiny.length ? ' tiny:' + a.tiny.join('|') : ''}${a.banned.length ? ' banned:' + a.banned.join('|') : ''}\n`)
  }
  await ctx.close()
}

// 2) The golden-path tour, desktop presentation, clicking the tour's Next arrow
if (!only) {
  const ctx = await browser.newContext({ viewport: { width: 1600, height: 960 }, permissions: ['microphone'] })
  const page = await ctx.newPage()
  let errs = []
  page.on('pageerror', e => errs.push('pageerror: ' + e.message))
  page.on('console', m => m.type() === 'error' && !/favicon|ERR_|Failed to load resource/.test(m.text()) && errs.push('console: ' + m.text().slice(0, 200)))
  await page.goto(BASE)
  await page.evaluate(() => localStorage.clear())
  await page.goto(`${BASE}#/arrival/splash`)
  await page.reload()
  await page.waitForTimeout(1200)
  for (let i = 0; i < tourCount; i++) {
    errs = []
    if (i > 0) { await page.click('button[aria-label="Next step"]'); await page.waitForTimeout(1800) }
    const id = (await page.evaluate(() => location.hash)).replace(/^#\//, '').split('?')[0]
    const file = `shots/tour/${String(i + 1).padStart(2, '0')}-${id.replace('/', '__')}.png`
    await page.screenshot({ path: file })
    const a = await audit(page)
    report.tour.push({ step: i + 1, id, file, errors: errs, ...a })
    process.stdout.write(`tour ${i + 1} ${id} ${a.stub ? 'STUB' : errs.length ? 'ERR ' + errs[0] : 'ok'}\n`)
  }
  await ctx.close()
}
await browser.close()

writeFileSync('shots/report.json', JSON.stringify(report, null, 2))
const card = r => `<figure><img src="${r.file.replace('shots/', '')}" loading="lazy"><figcaption>${r.step ? r.step + ' · ' : ''}${r.id}${r.stub ? ' · STUB' : ''}${r.errors.length ? ' · ERRORS' : ''}</figcaption></figure>`
writeFileSync('shots/index.html', `<!doctype html><meta charset="utf-8"><title>L'Amour QA</title><style>body{background:#120e12;color:#f3ebe0;font:14px system-ui;margin:24px}div{display:grid;grid-template-columns:repeat(auto-fill,minmax(220px,1fr));gap:16px}img{width:100%;border-radius:18px}figure{margin:0}figcaption{padding:6px 2px;color:#cdbfb2}</style><h1>Tour</h1><div>${report.tour.map(card).join('')}</div><h1>All screens</h1><div>${report.screens.map(card).join('')}</div>`)
const bad = report.screens.filter(r => r.stub || r.errors.length || r.overflowX || r.banned.length)
console.log(`\n${report.screens.length} screens · ${bad.length} need attention · tour ${report.tour.filter(t => !t.stub && !t.errors.length).length}/${report.tour.length} clean`)
