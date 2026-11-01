const { chromium } = require('playwright');const path=require('path');
(async()=>{const browser=await chromium.launch({args:['--use-gl=swiftshader','--enable-unsafe-swiftshader']});const page=await browser.newPage();const errs=[];page.on('pageerror',e=>errs.push(e.message));const toasts=[];await page.exposeFunction('__tl',t=>toasts.push(t));
 await page.addInitScript(()=>{window.__headless=true;addEventListener('DOMContentLoaded',()=>{new MutationObserver(ms=>{for(const m of ms)for(const n of m.addedNodes)if(n.nodeType===1)window.__tl(n.textContent)}).observe(document.getElementById('toasts'),{childList:true})})});await page.goto('file://'+path.join(__dirname,'three/p5.html'));await page.waitForTimeout(700);
 await page.evaluate(()=>{document.getElementById('start').click();window.__step(2);for(let k=0;k<12;k++){window.__bomb(60+k*3,60);window.__step(17)}});await page.waitForTimeout(300);
 console.log(toasts.filter(t=>t.includes('tesouro')).length,errs);await browser.close()})();
