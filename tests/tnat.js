const { chromium } = require('playwright');const path=require('path');
(async()=>{const browser=await chromium.launch({args:['--use-gl=swiftshader','--enable-unsafe-swiftshader']});const page=await browser.newPage();const errs=[];page.on('pageerror',e=>errs.push(e.message));
 await page.addInitScript(()=>{window.__headless=true});await page.goto('file://'+path.join(__dirname,'three/p5.html'));await page.waitForTimeout(700);
 console.log(await page.evaluate(()=>{document.getElementById('start').click();window.__step(2);const c=window.__natCnt;const r={a:c()};window.__boom();window.__step(1);r.crater=c();window.__step(150);r.after=c();
  window.__save();window.__boom();window.__step(1);window.__save();window.__load();window.__step(1);r.loaded=c();window.__step(150);r.after2=c();return JSON.stringify(r)}));console.log(errs);await browser.close()})();
