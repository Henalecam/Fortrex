const { chromium } = require('playwright');const path=require('path');
(async()=>{const browser=await chromium.launch({args:['--use-gl=swiftshader','--enable-unsafe-swiftshader']});const page=await browser.newPage();const errs=[];page.on('pageerror',e=>errs.push(e.message));
 await page.addInitScript(()=>{window.__headless=true});await page.goto('file://'+path.join(__dirname,'three/p5.html'));await page.waitForTimeout(700);
 console.log(await page.evaluate(()=>{document.getElementById('start').click();window.__step(2);return window.__aid()}));
 for(let t=0;t<240;t+=30){const r=await page.evaluate(()=>{window.__step(30);return JSON.stringify(window.__q())+' allies='+window.__allies()});console.log(r);if(r.includes('allies=') && !r.endsWith('allies='))break}
 console.log(errs);await browser.close()})();
