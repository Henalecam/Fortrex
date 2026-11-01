const { chromium } = require('playwright');const path=require('path');
(async()=>{const browser=await chromium.launch({args:['--use-gl=swiftshader','--enable-unsafe-swiftshader']});const page=await browser.newPage({viewport:{width:390,height:844}});const errs=[];page.on('pageerror',e=>errs.push(e.message));
 await page.addInitScript(()=>{window.__headless=true;try{localStorage.setItem('fortrex_tips','{"start":1,"auto":1,"shop":1,"build":1,"wave":1,"realm":1,"war":1,"bearer":1}')}catch(e){}});await page.goto('file://'+path.join(__dirname,'three/p5.html'));await page.waitForTimeout(700);
 console.log(await page.evaluate(()=>{document.getElementById('start').click();window.__step(2);const hp=window.__bearer();window.__step(1);return 'hp='+Math.round(hp)}));
 await page.evaluate(()=>{window.__cam(26,CX+28,CZ)}).catch(()=>{});await page.evaluate(()=>{window.__cam(26,124,96);window.__headless=false});await page.waitForTimeout(1500);await page.screenshot({path:'bearer.png',timeout:120000});
 await page.evaluate(()=>{window.__headless=true;window.__step(40);window.__headless=false;document.getElementById('bRealm').click()});await page.waitForTimeout(1500);await page.screenshot({path:'realm_m2.png',timeout:120000});
 console.log(errs);await browser.close()})();
