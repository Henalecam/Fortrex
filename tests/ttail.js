const { chromium } = require('playwright');const path=require('path');
(async()=>{const secs=+(process.argv[2]||900);const browser=await chromium.launch({args:['--use-gl=swiftshader','--enable-unsafe-swiftshader']});const page=await browser.newPage();const errs=[];page.on('pageerror',e=>errs.push(e.message));
 await page.addInitScript(()=>{window.__headless=true});await page.goto('file://'+path.join(__dirname,'three/p5econ.html'));await page.waitForTimeout(700);
 await page.evaluate(()=>{document.getElementById('start').click();document.getElementById('auto').click()});
 for(let t=0;t<secs;t+=60){await page.evaluate(()=>{for(let k=0;k<6;k++){window.__bot();window.__step(10)}})}
 console.log("TAIL",JSON.stringify(await page.evaluate(()=>[window.__st().natCarve,window.__tailDbg||[]])));const E=await page.evaluate(()=>JSON.stringify(window.__econ().log));for(const r of JSON.parse(E))console.log(JSON.stringify(r));console.log(errs.slice(0,3));await browser.close()})();
