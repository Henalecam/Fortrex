const { chromium } = require('playwright');const path=require('path');
(async()=>{const browser=await chromium.launch({args:['--use-gl=swiftshader','--enable-unsafe-swiftshader']});
 for(const b of ['neve','deserto','pantano','vulcao']){const page=await browser.newPage();const errs=[];page.on('pageerror',e=>errs.push(e.message));
 await page.addInitScript(()=>{window.__headless=true});await page.goto('file://'+path.join(__dirname,'three/p5.html'));await page.waitForTimeout(500);
 const r=await page.evaluate(b=>{window.__biome(b);document.getElementById('start').click();document.getElementById('auto').click();for(let t=0;t<480;t+=10){window.__bot();window.__step(10)}const d=window.__dbg();return b+' w='+d.wave+' chest='+d.chest},b);console.log(r,errs.slice(0,2));await page.close()}
 await browser.close()})();
