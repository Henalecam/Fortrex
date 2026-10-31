const { chromium } = require('playwright');const path=require('path');
(async()=>{const W=+(process.argv[2]||26);const types=(process.argv[3]||'ram,rammer').split(',');const N=+(process.argv[4]||3);
 const browser=await chromium.launch({args:['--use-gl=swiftshader','--enable-unsafe-swiftshader']});
 for(const t of types){const page=await browser.newPage();const errs=[];page.on('pageerror',e=>errs.push(e.message));await page.addInitScript(()=>{window.__headless=true});await page.goto('file://'+path.join(__dirname,'three/p5.html'));await page.waitForTimeout(400);
  const r=await page.evaluate(([t,W,N])=>{document.getElementById('start').click();window.__step(1);window.__chestDmg={};const c0=window.__ramChest(t,W,N);const log=[];let s;for(let i=0;i<90;i++){window.__step(1);s=window.__rcStat();log.push(s.chest);if(s.chest===0||s.alive===0)break}return {c0,s,cd:window.__chestDmg,log:log.slice(-3).join(',')}},[t,W,N]);
  console.log(t.padEnd(8),JSON.stringify(r),errs.length?errs[0]:'');await page.close()}await browser.close()})();
