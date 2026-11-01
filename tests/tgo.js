const { chromium } = require('playwright');const path=require('path');
(async()=>{const browser=await chromium.launch({args:['--use-gl=swiftshader','--enable-unsafe-swiftshader']});const page=await browser.newPage({viewport:{width:390,height:844}});const errs=[];page.on('pageerror',e=>errs.push(e.message));
 await page.addInitScript(()=>{window.__headless=true});await page.goto('file://'+path.join(__dirname,'three/p5.html'));await page.waitForTimeout(700);
 await page.evaluate(()=>{document.getElementById('start').click();document.getElementById('auto').click();for(let t=0;t<120;t+=10){window.__bot();window.__step(10)}window.__gameOver()});
 await page.evaluate(()=>{window.__headless=false});await page.waitForTimeout(1500);await page.screenshot({path:'go.png',timeout:120000});
 console.log(await page.evaluate(()=>{document.getElementById('continue').click();window.__step(1);return JSON.stringify(window.__dbg()).slice(0,80)}));console.log(errs);await browser.close()})();
