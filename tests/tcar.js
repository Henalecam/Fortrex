const { chromium } = require('playwright');const path=require('path');
(async()=>{const browser=await chromium.launch({args:['--use-gl=swiftshader','--enable-unsafe-swiftshader']});const page=await browser.newPage({viewport:{width:1100,height:680}});const errs=[];page.on('pageerror',e=>errs.push(e.message));
 await page.addInitScript(()=>{window.__headless=true});await page.goto('file://'+path.join(__dirname,'three/p5.html'));await page.waitForTimeout(700);
 await page.evaluate(()=>{document.getElementById('start').click();window.__step(5);window.__caravan()});
 for(let k=0;k<12;k++)console.log(await page.evaluate(()=>{window.__step(5);return JSON.stringify(window.__q())}));
 await page.evaluate(()=>{window.__headless=false});await page.waitForTimeout(1500);await page.screenshot({path:'car.png',timeout:120000});console.log(errs);await browser.close()})();
