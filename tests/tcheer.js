const { chromium } = require('playwright');const path=require('path');
(async()=>{const browser=await chromium.launch({args:['--use-gl=swiftshader','--enable-unsafe-swiftshader']});const page=await browser.newPage({viewport:{width:390,height:844}});const errs=[];page.on('pageerror',e=>errs.push(e.message));
 await page.addInitScript(()=>{window.__headless=true;window.__revealHold=true;try{localStorage.setItem('fortrex_tips','{"start":1,"auto":1,"shop":1,"build":1,"wave":1,"realm":1,"ward":1,"sappers":1,"bomb":1,"mason":1,"save":1,"minions":1,"cheer":1}')}catch(e){}});await page.goto('file://'+path.join(__dirname,'three/p5.html'));await page.waitForTimeout(700);
 console.log(await page.evaluate(()=>{document.getElementById('start').click();window.__step(2);window.__card(3);return document.getElementById('mcard').innerText.slice(0,200)}));
 await page.evaluate(()=>{document.getElementById('cCheer').click();window.__step(.3)});
 console.log(await page.evaluate(()=>JSON.stringify([window.__cheer(),document.getElementById('mcard').innerText.slice(0,260)])));
 await page.evaluate(()=>{window.__headless=false});await page.waitForTimeout(700);await page.screenshot({path:'cheer.png',timeout:120000});console.log(errs);await browser.close()})();
