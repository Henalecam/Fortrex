const { chromium } = require('playwright');const path=require('path');
(async()=>{const browser=await chromium.launch({args:['--use-gl=swiftshader','--enable-unsafe-swiftshader']});const ctx=await browser.newContext({viewport:{width:1280,height:800}});
 let page=await ctx.newPage();await page.addInitScript(()=>{window.__headless=true});await page.goto('file://'+path.join(__dirname,'three/p5.html'));await page.waitForTimeout(700);
 await page.evaluate(()=>{document.getElementById('start').click();document.getElementById('auto').click()});
 for(let t=0;t<240;t+=60)await page.evaluate(()=>{for(let k=0;k<6;k++){window.__bot();window.__step(10)}});
 for(let k=0;k<200;k++){if(await page.evaluate(()=>{window.__step(.25);const w=window.__why();return w.ph==='rest'&&w.sw===w.w}))break}
 await page.close();page=await ctx.newPage();page.on('pageerror',e=>console.log('ERR',e.message));await page.goto('file://'+path.join(__dirname,'three/p5.html'));await page.waitForTimeout(2500);
 await page.screenshot({path:'save_start.png'});await page.evaluate(()=>document.getElementById('continue').click());await page.waitForTimeout(3500);await page.screenshot({path:'save_loaded.png'});await browser.close()})();
