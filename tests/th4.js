const { chromium } = require('playwright');const path=require('path');
(async()=>{const browser=await chromium.launch({args:['--use-gl=swiftshader','--enable-unsafe-swiftshader']});const page=await browser.newPage({viewport:{width:390,height:844}});const errs=[];page.on('pageerror',e=>errs.push(e.message));
 await page.addInitScript(()=>{window.__headless=true;try{localStorage.setItem('fortrex_tips','{"start":1,"auto":1,"shop":1,"build":1,"wave":1,"hero":1}')}catch(e){}});await page.goto('file://'+path.join(__dirname,'three/p5.html'));await page.waitForTimeout(700);
 await page.evaluate(()=>{document.getElementById('start').click();window.__step(2);for(const h of ['paladin','archer','mage','priestess'])window.__hero(h);window.__step(1);dispatchEvent(new Event('resize'))});
 await page.evaluate(()=>{window.__headless=false});await page.waitForTimeout(1500);await page.screenshot({path:'h4.png',timeout:120000});console.log(errs);await browser.close()})();
