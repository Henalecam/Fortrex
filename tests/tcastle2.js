const { chromium } = require('playwright');const path=require('path');
(async()=>{const browser=await chromium.launch({args:['--use-gl=swiftshader','--enable-unsafe-swiftshader']});const page=await browser.newPage({viewport:{width:1280,height:800}});const errs=[];page.on('pageerror',e=>errs.push(e.message));
 await page.addInitScript(()=>{window.__headless=true;try{localStorage.setItem('fortrex_tips','{"start":1,"auto":1,"shop":1,"build":1,"wave":1,"realm":1,"ward":1,"sappers":1,"bomb":1,"mason":1,"save":1}')}catch(e){}});await page.goto('file://'+path.join(__dirname,'three/p5.html'));await page.waitForTimeout(700);
 const id=process.argv[2]||'colossal',T=+(process.argv[3]||40);
 console.log(await page.evaluate(([id,T])=>{document.getElementById('start').click();window.__step(2);const r=[window.__castle(id)];for(let t=0;t<T;t+=10){window.__step(10);r.push([window.__dbg().mat,...window.__ref()])}return JSON.stringify(r)},[id,T]));
 await page.evaluate(()=>{window.__cam(62,96,96);window.__headless=false});await page.waitForTimeout(500);await page.screenshot({path:'castle_dbg.png',timeout:120000});console.log(errs);await browser.close()})();
