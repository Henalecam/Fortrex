const { chromium } = require('playwright');const path=require('path');
(async()=>{const browser=await chromium.launch({args:['--use-gl=swiftshader','--enable-unsafe-swiftshader']});
 for(const k of ['none','veloz','blindados','semherois','bruma','semegide','pobre']){const page=await browser.newPage();const errs=[];page.on('pageerror',e=>errs.push(e.message));
 await page.addInitScript(()=>{window.__headless=true;window.__chestLog=[]});await page.goto('file://'+path.join(__dirname,'three/p5.html'));await page.waitForTimeout(500);
 const r=await page.evaluate(k=>{document.getElementById('start').click();if(k!=='none')window.__mod(k);if(k==='pobre'){}document.getElementById('auto').click();for(let t=0;t<420;t+=10){window.__bot();window.__step(10)}const d=window.__dbg();return k+': w='+d.wave+' chest='+d.chest+' hits='+window.__chestLog.length},k);console.log(r,errs.slice(0,1));await page.close()}
 await browser.close()})();
