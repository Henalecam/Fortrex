const { chromium } = require('playwright');const path=require('path');
(async()=>{const browser=await chromium.launch({args:['--use-gl=swiftshader','--enable-unsafe-swiftshader']});const errs=[];
 for(const [w,h,n] of [[1280,800,'d'],[390,844,'m']]){const page=await browser.newPage({viewport:{width:w,height:h}});page.on('pageerror',e=>errs.push(e.message));
 await page.addInitScript(()=>{try{localStorage.setItem('fortrex_tips','{"start":1,"auto":1,"shop":1,"build":1,"wave":1,"realm":1,"ward":1,"sappers":1,"bomb":1,"mason":1,"save":1,"saboteur":1,"affix":1,"heroes":1}')}catch(e){}});await page.goto('file://'+path.join(__dirname,'three/p5.html'));await page.waitForTimeout(1500);
 await page.screenshot({path:`st_${n}_start.png`,timeout:120000});
 await page.evaluate(()=>{window.__headless=true;document.getElementById('start').click();window.__step(3);window.__headless=false});await page.waitForTimeout(400);
 for(const [id,tag] of [['bBuild','build'],['bShop','shop'],['bArs','ars']]){await page.evaluate(id=>document.getElementById(id).click(),id);await page.waitForTimeout(500);await page.screenshot({path:`st_${n}_${tag}.png`,timeout:120000});await page.evaluate(id=>{document.getElementById(id).click()},id);await page.waitForTimeout(200)}
 await page.close()}console.log(errs);await browser.close()})();
