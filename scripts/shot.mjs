// One screenshot: node scripts/shot.mjs <screen-id> [waitMs] [out.png] [width] [height]
import { chromium } from 'playwright-core'
import { existsSync } from 'node:fs'

const [id = 'conv/signature', wait = '1600', out = 'shots/one.png', w = '390', h = '844'] = process.argv.slice(2)
const exe = [
  `${process.env.LOCALAPPDATA}/ms-playwright/chromium-1234/chrome-win64/chrome.exe`,
  'C:/Program Files/Google/Chrome/Application/chrome.exe',
].find(existsSync)
const b = await chromium.launch({ executablePath: exe, args: ['--use-fake-ui-for-media-stream', '--use-fake-device-for-media-stream'] })
const p = await b.newPage({ viewport: { width: +w, height: +h }, deviceScaleFactor: 2 })
p.on('pageerror', e => console.log('pageerror', e.message))
await p.goto(`http://localhost:5179/#/${id}`)
await p.waitForTimeout(+wait)
await p.screenshot({ path: out })
await b.close()
console.log(out)
