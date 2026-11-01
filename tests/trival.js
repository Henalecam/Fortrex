const { chromium } = require('playwright');const path=require('path');
(async()=>{const browser=await chromium.launch({args:['--use-gl=swiftshader','--enable-unsafe-swiftshader']});const page=await browser.newPage({viewport:{width:1280,height:800}});const errs=[];page.on('pageerror',e=>errs.push(e.message));
 await page.addInitScript(()=>{window.__headless=true;try{localStorage.setItem('fortrex_tips','{"start":1,"auto":1,"shop":1,"build":1,"wave":1,"realm":1,"ward":1,"sappers":1,"bomb":1,"mason":1,"save":1}')}catch(e){}});await page.goto('file://'+path.join(__dirname,'three/p5.html'));await page.waitForTimeout(700);
 const mode=process.argv[2]||'s';
 console.log(await page.evaluate((mode)=>{document.getElementById('start').click();window.__step(1);window.__rdbg('next');window.__step(1);const r=window.__battlePos();window.__bp=r;window.__step(.5);if(mode==='h'){window.__hitAll(.5);window.__step(.15)}return r},mode));
 await page.evaluate((mode)=>{window.__cam(34,window.__bp.x,window.__bp.z+4);window.__headless=false},mode);await page.waitForTimeout(500);await page.screenshot({path:'rival.png',timeout:120000});console.log(errs);await browser.close()})();
