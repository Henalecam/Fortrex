const { chromium } = require('playwright');const path=require('path');
(async()=>{const browser=await chromium.launch({args:['--use-gl=swiftshader','--enable-unsafe-swiftshader']});const page=await browser.newPage({viewport:{width:1280,height:800}});const errs=[];page.on('pageerror',e=>errs.push(e.message));
 await page.addInitScript(()=>{window.__headless=true;try{localStorage.setItem('fortrex_tips','{"start":1,"auto":1,"shop":1,"build":1,"wave":1,"hero":1}')}catch(e){}});await page.goto('file://'+path.join(__dirname,'three/p5.html'));await page.waitForTimeout(700);
 console.log(await page.evaluate(()=>{document.getElementById('start').click();window.__step(2);const a=window.__hero('priestess');window.__step(6);const cd=window.__useHero('priestess');window.__step(.2);return a+' cd='+cd}));
 await page.evaluate(()=>{window.__headless=false});await page.waitForTimeout(1200);await page.screenshot({path:'pri.png',timeout:120000});console.log(errs);await browser.close()})();
