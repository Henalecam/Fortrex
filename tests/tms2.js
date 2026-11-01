const { chromium } = require('playwright');const path=require('path');
(async()=>{const browser=await chromium.launch({args:['--use-gl=swiftshader','--enable-unsafe-swiftshader']});const errs=[];
 for(const [vw,vh,tag] of [[1280,800,'d'],[390,844,'m']]){const page=await browser.newPage({viewport:{width:vw,height:vh}});page.on('pageerror',e=>errs.push(e.message));
 await page.addInitScript(()=>{window.__headless=true});await page.goto('file://'+path.join(__dirname,'three/p5.html'));await page.waitForTimeout(700);
 await page.evaluate(t=>{document.getElementById('start').click();window.__step(3);if(t==='d'){window.__mason();window.__step(40);window.__sap(5);window.__step(1);window.__killAll();window.__step(.5)}else{window.__minCard()}},tag);
 await page.evaluate(()=>{window.__headless=false});await page.waitForTimeout(2500);await page.screenshot({path:`ms_${tag}.png`,timeout:120000});await page.close()}
 console.log(errs);await browser.close()})();
