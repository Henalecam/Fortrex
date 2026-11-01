const { chromium } = require('playwright');const path=require('path');
(async()=>{const browser=await chromium.launch({args:['--use-gl=swiftshader','--enable-unsafe-swiftshader']});const page=await browser.newPage({viewport:{width:1280,height:800}});const errs=[];page.on('pageerror',e=>errs.push(e.message));
 await page.addInitScript(()=>{window.__revealHold=true});await page.goto('file://'+path.join(__dirname,'three/p5.html'));await page.waitForTimeout(4000);
 console.log(await page.evaluate(()=>[document.getElementById('news').hidden,document.getElementById('newsList').innerText.slice(0,300)]));
 await page.screenshot({path:'news.png',timeout:120000});console.log(errs);await browser.close()})();
