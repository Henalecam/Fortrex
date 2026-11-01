const { chromium } = require('playwright');const path=require('path');
(async()=>{const browser=await chromium.launch({args:['--use-gl=swiftshader','--enable-unsafe-swiftshader']});const page=await browser.newPage();page.on('console',m=>{if(m.type()==='warning')console.log('WARN',m.text().slice(0,300))});
 await page.addInitScript(()=>{window.__headless=true});await page.goto('file://'+path.join(__dirname,'three/p5.html'));await page.waitForTimeout(700);
 await page.evaluate(()=>{document.getElementById('start').click();document.getElementById('auto').click()});
 for(let t=0;t<400;t+=20){const r=await page.evaluate(()=>{for(let k=0;k<2;k++){window.__bot();window.__step(10)}return JSON.stringify(window.__why())});console.log(r)}
 await browser.close()})();
