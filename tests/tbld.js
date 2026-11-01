const { chromium } = require('playwright');const path=require('path');
(async()=>{const browser=await chromium.launch({args:['--use-gl=swiftshader','--enable-unsafe-swiftshader']});const page=await browser.newPage({viewport:{width:1280,height:800}});const errs=[];page.on('pageerror',e=>errs.push(e.message));
 await page.addInitScript(()=>{window.__headless=true;try{localStorage.setItem('fortrex_tips','{"start":1,"auto":1,"shop":1,"build":1,"mason":1,"wave":1}')}catch(e){}});await page.goto('file://'+path.join(__dirname,'three/p5.html'));await page.waitForTimeout(700);
 console.log(await page.evaluate(()=>{document.getElementById('start').click();window.__step(2);window.__bld('forge');window.__bld('arcane');window.__bld('granary');window.__step(30);return window.__bld('market')}));
 await page.evaluate(()=>{window.__step(20);window.__cam(60,96,96);window.__headless=false});await page.waitForTimeout(2500);await page.screenshot({path:'bld.png',timeout:120000});
 await page.evaluate(()=>{const s=window.__headless;window.__headless=false});
 console.log(errs);await browser.close()})();
