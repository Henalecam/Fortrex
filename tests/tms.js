const { chromium } = require('playwright');const path=require('path');
(async()=>{const browser=await chromium.launch({args:['--use-gl=swiftshader','--enable-unsafe-swiftshader']});const page=await browser.newPage({viewport:{width:1280,height:800}});const errs=[];page.on('pageerror',e=>errs.push(e.message));
 await page.addInitScript(()=>{window.__headless=true});await page.goto('file://'+path.join(__dirname,'three/p5.html'));await page.waitForTimeout(700);
 console.log(await page.evaluate(()=>{document.getElementById('start').click();window.__step(3);const a=JSON.stringify(window.__traps());window.__mason();const a2=JSON.stringify(window.__traps());window.__step(40);const b=JSON.stringify(window.__traps());window.__sap(3);window.__step(2);const c=JSON.stringify(window.__traps().n);return a2+"\n"+a+'\n'+b+'\n'+c}));
 await page.evaluate(()=>{window.__killAll()});await page.screenshot({path:'mason.png'});console.log(errs);await browser.close()})();
