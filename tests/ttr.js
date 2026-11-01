const { chromium } = require('playwright');const path=require('path');
(async()=>{const browser=await chromium.launch({args:['--use-gl=swiftshader','--enable-unsafe-swiftshader']});const page=await browser.newPage({viewport:{width:1280,height:800}});page.on('pageerror',e=>console.log('ERR',e.message));
 await page.addInitScript(()=>{window.__headless=true;try{localStorage.setItem('fortrex_tips',JSON.stringify({start:1,wave:1,auto:1,shop:1,build:1,realm:1,mason:1,sappers:1,affix:1}))}catch(e){}});await page.goto('file://'+path.join(__dirname,'three/p5.html'));await page.waitForTimeout(700);
 await page.evaluate(()=>{document.getElementById('start').click();window.__step(3);window.__sap(5);window.__step(.3);window.__killAll();window.__cam(34)});
 await page.evaluate(()=>{window.__headless=false});await page.waitForTimeout(3000);await page.screenshot({path:'traps.png'});await browser.close()})();
