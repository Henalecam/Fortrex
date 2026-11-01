const { chromium } = require('playwright');const path=require('path');
(async()=>{const browser=await chromium.launch({args:['--use-gl=swiftshader','--enable-unsafe-swiftshader']});const page=await browser.newPage();
 await page.addInitScript(()=>{window.__headless=true});const errs=[];page.on('pageerror',e=>errs.push(e.message));
 await page.goto('file://'+path.join(__dirname,'three/p5.html'));await page.waitForTimeout(600);
 await page.evaluate(()=>{document.querySelector('[data-mode="conquista"]').click();document.getElementById('start').click();window.__step(5)});
 console.log(await page.evaluate(()=>{window.__step(140);return window.__rdbg(0)+' '+JSON.stringify(window.__rpos().sols)}));console.log(errs);await browser.close()})();
