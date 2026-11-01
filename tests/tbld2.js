const { chromium } = require('playwright');const path=require('path');
(async()=>{const browser=await chromium.launch({args:['--use-gl=swiftshader','--enable-unsafe-swiftshader']});const page=await browser.newPage({viewport:{width:390,height:844}});const errs=[];page.on('pageerror',e=>errs.push(e.message));
 await page.addInitScript(()=>{window.__headless=true});await page.goto('file://'+path.join(__dirname,'three/p5.html'));await page.waitForTimeout(700);
 await page.evaluate(()=>{document.getElementById('start').click();window.__step(2);window.__headless=false;window.__offer()});await page.waitForTimeout(1500);await page.screenshot({path:'bld2.png',timeout:120000});
 await page.evaluate(()=>document.querySelector('#rewardCards .rcard').click());await page.waitForTimeout(500);console.log(await page.evaluate(()=>document.getElementById('reward').style.display));console.log(errs);await browser.close()})();
