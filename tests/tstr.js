const { chromium } = require('playwright');const path=require('path');
(async()=>{const browser=await chromium.launch({args:['--use-gl=swiftshader','--enable-unsafe-swiftshader']});const page=await browser.newPage({viewport:{width:390,height:844}});const errs=[];page.on('pageerror',e=>errs.push(e.message));
 await page.addInitScript(()=>{window.__headless=true});await page.goto('file://'+path.join(__dirname,'three/p5.html'));await page.waitForTimeout(700);
 console.log(await page.evaluate(()=>{document.getElementById('start').click();window.__step(2);return window.__stranger()}));
 await page.evaluate(()=>{window.__headless=false});await page.waitForTimeout(1500);await page.screenshot({path:'str.png',timeout:120000});
 console.log(await page.evaluate(()=>{const m0=window.__dbg().mat;document.querySelector('#rewardCards .rcard').click();return m0+'->'+window.__dbg().mat}));console.log(errs);await browser.close()})();
