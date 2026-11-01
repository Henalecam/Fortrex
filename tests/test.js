// Headless test harness for Fortrex: loads index.html with local three.js, runs N seconds, reports state.
const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');
const SCR = __dirname;
const html = fs.readFileSync('/home/claude/fortrex/index.html', 'utf8')
  .replace(/<script src="https:\/\/cdnjs[^"]+"><\/script>/, '<script src="three.min.js"></script>')
  .replace(/<link rel="stylesheet"[^>]+>/, '')
  .replace("function damageVox(i,d,fromEnemy){if(!vox[i])return false;const mat=vox[i];","function damageVox(i,d,fromEnemy){if(!vox[i])return false;const mat=vox[i];if(mat===5&&hp[i]-d<=0)console.log('CHEST_DMG',d,new Error().stack.split('\\n').slice(1,4).join(' | '));")
  .replace("let fell=0;for(let i=0;i<N;i++)if(vox[i]&&!seen[i]&&!FLUID(vox[i])){","let fell=0;for(let i=0;i<N;i++)if(vox[i]&&!seen[i]&&!FLUID(vox[i])){if(vox[i]===5)console.log('CHEST_FELL',i);");
fs.writeFileSync(path.join(SCR, 'three/page.html'), '<!doctype html><html><head><meta charset="utf-8"></head><body>' + html + '</body></html>');
fs.copyFileSync(path.join(SCR, 'three/package/build/three.min.js'), path.join(SCR, 'three/three.min.js'));

(async () => {
  const secs = Number(process.argv[2] || 30);
  const browser = await chromium.launch({ args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader'] });
  const page = await browser.newPage({ viewport: { width: 1200, height: 800 } });
  if(!process.argv.includes('render')) await page.addInitScript(()=>{window.__headless=true});
  const errors = [];
  page.on('pageerror', e => errors.push(e.message));
  page.on('console', m => { if (m.type() === 'error') errors.push(m.text()); if(/CHEST/.test(m.text()))console.log(m.text().slice(0,500)); });
  await page.goto('file://' + path.join(SCR, 'three/page.html'));
  await page.waitForTimeout(800);
  await page.click('#start');
  await page.waitForTimeout(300);
  await page.click('#next');
  const samples = [];
  for (let t = 0; t < secs; t += 10) {
    await page.evaluate((t)=>{if(t===10){window.__bomb(8,20);window.__bomb(20,8)}if(t===30){window.__buy('mortar');window.__buy('greek')}window.__step(10)},t);
    const s = await page.evaluate(() => ({
      wave: document.getElementById('wave').textContent,
      mat: document.getElementById('mat').textContent,
      minions: document.getElementById('mcount').textContent + document.getElementById('wounded').textContent,
      alive: document.getElementById('alive').textContent,
      next: document.getElementById('next').textContent,
      dbg: window.__dbg ? window.__dbg() : null,
    }));
    samples.push({ t: t + 10, ...s });
    console.log(JSON.stringify(samples.at(-1)));
    if (/rest|Chamar/.test(s.next) && process.argv[3] === 'auto') { await page.click('#next'); }
  }
  await page.screenshot({ path: path.join(SCR, 'shot.png') });
  console.log('errors:', errors.slice(0, 10));
  await browser.close();
})();
