const { chromium } = require('playwright');const path=require('path');
(async()=>{const browser=await chromium.launch({args:['--use-gl=swiftshader','--enable-unsafe-swiftshader']});const page=await browser.newPage({viewport:{width:1280,height:800}});const errs=[];page.on('pageerror',e=>errs.push(e.message));
 await page.addInitScript(()=>{window.__headless=true;try{localStorage.setItem('fortrex_tips','{"start":1,"auto":1,"shop":1,"build":1,"wave":1,"realm":1}')}catch(e){}});await page.goto('file://'+path.join(__dirname,'three/p5.html'));await page.waitForTimeout(700);
 console.log(await page.evaluate(()=>{document.getElementById('start').click();window.__step(2);window.__xbow(5);let k=0;for(;k<40;k++){window.__step(.5)}return window.__dbg().kills}));
 for(let i=0;i<6;i++){const ok=await page.evaluate(()=>{window.__step(1.45);return 1});}
 await page.evaluate(()=>{window.__headless=false});await page.waitForTimeout(80);await page.screenshot({path:'xb.png',timeout:120000});console.log(errs);await browser.close()})();
