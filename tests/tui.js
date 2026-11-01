const { chromium } = require('playwright');const path=require('path');
(async()=>{const browser=await chromium.launch({args:['--use-gl=swiftshader','--enable-unsafe-swiftshader']});const errs=[];
 for(const [w,h,n] of [[1280,800,'d'],[390,844,'m']]){const page=await browser.newPage({viewport:{width:w,height:h}});page.on('pageerror',e=>errs.push(e.message));
 await page.addInitScript(()=>{window.__headless=true;try{localStorage.setItem('fortrex_tips','{"start":1,"auto":1,"shop":1,"build":1,"wave":1,"realm":1,"ward":1,"sappers":1,"bomb":1,"mason":1,"save":1,"saboteur":1,"affix":1,"heroes":1,"auto":0}')}catch(e){}});await page.goto('file://'+path.join(__dirname,'three/p5.html'));await page.waitForTimeout(700);
 await page.evaluate(()=>{document.getElementById('start').click();document.getElementById('auto').click();for(let i=0;i<20;i++){window.__bot();window.__step(10)}window.__cam(60,96,96);window.__headless=false});await page.waitForTimeout(500);
 for(const t of ['Ferraria','Santuário','Mercado','Celeiro','Caserna','Torre arcana','Carga de material','Escolher automaticamente'])if(await page.locator('text='+t).count()){await page.locator('text='+t).first().click().catch(()=>{});await page.waitForTimeout(200)}
 await page.screenshot({path:'ui_'+n+'.png',timeout:120000});await page.close()}console.log(errs);await browser.close()})();
