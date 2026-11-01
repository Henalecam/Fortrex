const { chromium } = require('playwright');const path=require('path');
(async()=>{const browser=await chromium.launch({args:['--use-gl=swiftshader','--enable-unsafe-swiftshader','--autoplay-policy=no-user-gesture-required']});const page=await browser.newPage({viewport:{width:640,height:400}});const errs=[];page.on('pageerror',e=>errs.push(e.message));
 await page.goto('file://'+path.join(__dirname,'three/p5.html'),{timeout:120000});await page.waitForTimeout(1000);
 await page.click('#newsOk');await page.click('#start');await page.waitForTimeout(3000);
 await page.evaluate(()=>{document.getElementById('next').click()});await page.waitForTimeout(4000);
 await page.evaluate(()=>{window.__bossX&&window.__bossX('boss')});await page.waitForTimeout(3000);
 await page.click('#snd').catch(()=>{});await page.waitForTimeout(1500);await page.click('#snd').catch(()=>{});await page.waitForTimeout(1500);
 console.log(await page.evaluate(()=>[typeof AC,window.__st().phase]));console.log(errs);await browser.close()})();
