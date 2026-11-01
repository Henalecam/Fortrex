const { chromium } = require('playwright');const path=require('path');
(async()=>{const browser=await chromium.launch({args:['--use-gl=swiftshader','--enable-unsafe-swiftshader']});const page=await browser.newPage({viewport:{width:1280,height:800}});const errs=[];page.on('pageerror',e=>errs.push(e.message));
 await page.addInitScript(()=>{window.__headless=true;try{localStorage.setItem('fortrex_tips','{"start":1,"auto":1,"shop":1,"build":1,"wave":1,"realm":1,"ward":1,"sappers":1,"bomb":1,"mason":1,"save":1,"minions":1,"cheer":1}')}catch(e){}});await page.goto('file://'+path.join(__dirname,'three/p5.html'),{timeout:120000});await page.waitForTimeout(700);
 const p=await page.evaluate(()=>{document.getElementById('start').click();window.__step(1);window.__wtest('chain',2);window.__wtick();window.__step(1.8);return [window.__wt.x,window.__wt.z]});
 await page.evaluate((p)=>{window.__cam(24,p[0]-5,p[1]-8,0.9);window.__headless=false},p);
 for(let i=0;i<6;i++){await page.evaluate(()=>{window.__headless=true;window.__wtick();const t=window.__wt.t;t.reload=0;window.__step(.05);window.__headless=false});await page.waitForTimeout(250)}
 await page.screenshot({path:'chain.png',timeout:120000});console.log(errs);await browser.close()})();
