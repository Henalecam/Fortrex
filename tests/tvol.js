const { chromium } = require('playwright');const path=require('path');
(async()=>{const browser=await chromium.launch({args:['--use-gl=swiftshader','--enable-unsafe-swiftshader']});const page=await browser.newPage({viewport:{width:1280,height:800}});const errs=[];page.on('pageerror',e=>errs.push(e.message));
 await page.addInitScript(()=>{window.__headless=true;try{localStorage.setItem('fortrex_tips','{"start":1,"auto":1,"shop":1,"build":1,"wave":1,"ward":1,"realm":1,"sappers":1}')}catch(e){}});await page.goto('file://'+path.join(__dirname,'three/p5.html'));await page.waitForTimeout(700);
 console.log(await page.evaluate(()=>{window.__biome('vulcao');document.getElementById('start').click();window.__step(2);document.getElementById('next').click();window.__step(14.6);return 'ok'}));
 await page.evaluate(()=>{window.__cam(80,96,96);window.__headless=false});await page.waitForTimeout(600);await page.screenshot({path:'vol.png',timeout:120000});
 await page.evaluate(()=>{window.__headless=true;window.__step(60)});console.log(errs);await browser.close()})();
