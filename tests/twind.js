const { chromium } = require('playwright');const path=require('path');
(async()=>{const browser=await chromium.launch({args:['--use-gl=swiftshader','--enable-unsafe-swiftshader']});const page=await browser.newPage({viewport:{width:1280,height:800}});const errs=[];page.on('pageerror',e=>errs.push(e.message));
 await page.addInitScript(()=>{window.__headless=true;try{localStorage.setItem('fortrex_tips','{"start":1,"auto":1,"shop":1,"build":1,"wave":1,"ward":1,"realm":1}')}catch(e){}});await page.goto('file://'+path.join(__dirname,'three/p5.html'));await page.waitForTimeout(700);
 const p=await page.evaluate(()=>{document.getElementById('start').click();window.__step(2);const p=window.__wind();window.__step(14);return p});console.log(JSON.stringify(p));
 await page.evaluate(p=>{window.__cam(48,p.x+6,p.z-6);window.__headless=false},p);await page.waitForTimeout(2500);await page.screenshot({path:'wind.png',timeout:120000});console.log(errs);await browser.close()})();
