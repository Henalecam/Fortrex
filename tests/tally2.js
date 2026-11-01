const { chromium } = require('playwright');const path=require('path');
(async()=>{const browser=await chromium.launch({args:['--use-gl=swiftshader','--enable-unsafe-swiftshader']});const page=await browser.newPage({viewport:{width:390,height:844}});const errs=[];page.on('pageerror',e=>errs.push(e.message));
 await page.addInitScript(()=>{window.__headless=true;try{localStorage.setItem('fortrex_tips','{"start":1,"auto":1,"shop":1,"build":1,"wave":1,"realm":1,"war":1}')}catch(e){}});await page.goto('file://'+path.join(__dirname,'three/p5.html'));await page.waitForTimeout(700);
 console.log(await page.evaluate(()=>{document.getElementById('start').click();window.__step(2);const r=window.__siege();window.__step(3);const h=window.__helpers();window.__rdbg('win');window.__step(3);return r+' helpers='+h+' after='+window.__helpers()}));
 await page.evaluate(()=>{window.__headless=false;0});await page.waitForTimeout(2000);await page.screenshot({path:'realm_m.png',timeout:120000});
 console.log(errs);await browser.close()})();
