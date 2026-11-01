const { chromium } = require('playwright');const path=require('path');
(async()=>{const browser=await chromium.launch({args:['--use-gl=swiftshader','--enable-unsafe-swiftshader']});const page=await browser.newPage();const errs=[];page.on('pageerror',e=>errs.push(e.message));
 await page.addInitScript(()=>{window.__headless=true});await page.goto('file://'+path.join(__dirname,'three/p5.html'));await page.waitForTimeout(700);
 console.log(await page.evaluate(()=>{document.getElementById('start').click();window.__step(5);const a=JSON.stringify(window.__rpos().sols);window.__rally(60,60);window.__step(15);const b=JSON.stringify(window.__rpos().sols);window.__step(25);const c=JSON.stringify(window.__rpos().sols);return a+'\n'+b+'\n'+c}));console.log(errs);await browser.close()})();
