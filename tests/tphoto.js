const { chromium } = require('playwright');const path=require('path');
(async()=>{const browser=await chromium.launch({args:['--use-gl=swiftshader','--enable-unsafe-swiftshader']});const page=await browser.newPage({viewport:{width:1280,height:800}});const errs=[];page.on('pageerror',e=>errs.push(e.message));
 await page.addInitScript(()=>{window.__headless=true;window.__revealHold=true});await page.goto('file://'+path.join(__dirname,'three/p5.html'));await page.waitForTimeout(700);
 await page.evaluate(()=>{document.getElementById('start').click();window.__step(3);window.__cam(70,96,96,0.7)});
 console.log(await page.evaluate(()=>window.__photo()));await page.evaluate(()=>{window.__headless=false});await page.waitForTimeout(900);await page.screenshot({path:'photo.png',timeout:120000});console.log(errs);await browser.close()})();
