const { chromium } = require('playwright');const path=require('path');
(async()=>{const vp=(process.argv[2]||'1280x800').split('x').map(Number);const browser=await chromium.launch({args:['--use-gl=swiftshader','--enable-unsafe-swiftshader']});const page=await browser.newPage({viewport:{width:vp[0],height:vp[1]}});const errs=[];page.on('pageerror',e=>errs.push(e.message));
 await page.addInitScript(()=>{window.__headless=true;try{localStorage.setItem('fortrex_seenVer','99')}catch(e){}});await page.goto('file://'+path.join(__dirname,'three/p5.html'),{timeout:120000});await page.waitForTimeout(1500);
 console.log(await page.evaluate(()=>{document.getElementById('tutBtn').click();document.getElementById('tutNext').click();return document.getElementById('tutCard').innerText.slice(0,60)}));
 await page.evaluate(()=>{window.__headless=false});await page.waitForTimeout(800);await page.screenshot({path:'tut_'+vp[0]+'.png',timeout:120000});console.log(errs);await browser.close()})();
