const { chromium } = require('playwright');const path=require('path');
(async()=>{const browser=await chromium.launch({args:['--use-gl=swiftshader','--enable-unsafe-swiftshader']});const page=await browser.newPage();
 await page.addInitScript(()=>{window.__headless=true});const errs=[];page.on('pageerror',e=>errs.push(e.message));
 await page.goto('file://'+path.join(__dirname,'three/p5.html'));await page.waitForTimeout(600);
 await page.evaluate(m=>{document.querySelector('[data-mode="'+m+'"]').click();document.getElementById('start').click()},process.env.MODE||'duelo');
 for(let t=0;t<+(process.argv[2]||120);t+=20){const r=await page.evaluate(t=>{if(t===40)window.__rdbg(60);window.__step(20);return JSON.stringify(window.__rpos())+window.__rdbg(0)},t);console.log('t='+(t+20),r)}
 console.log(errs);await browser.close()})();
