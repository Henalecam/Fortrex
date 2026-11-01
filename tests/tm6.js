const { chromium } = require('playwright');const path=require('path');
(async()=>{const browser=await chromium.launch({args:['--use-gl=swiftshader','--enable-unsafe-swiftshader']});const page=await browser.newPage();
 await page.addInitScript(()=>{window.__headless=true});await page.goto('file://'+path.join(__dirname,'three/p5.html'));await page.waitForTimeout(600);
 await page.evaluate(()=>{document.getElementById('start').click();document.getElementById('auto').click()});
 for(let t=0;t<1600;t+=100){const r=await page.evaluate((t)=>{if(t===1100){window.__matTrace();window.__lootTrace()}for(let k=0;k<10;k++){window.__bot();window.__step(10)}return window.__dbg().mat+' '+(window.__matBig?JSON.stringify(window.__matBig()):'')+' '+JSON.stringify(window.__lt||{})},t);console.log(t+100,r)}
 await browser.close()})();
