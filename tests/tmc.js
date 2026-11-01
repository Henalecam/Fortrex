const { chromium } = require('playwright');const path=require('path');
(async()=>{const browser=await chromium.launch({args:['--use-gl=swiftshader','--enable-unsafe-swiftshader']});const page=await browser.newPage({viewport:{width:390,height:844}});page.on('pageerror',e=>console.log('ERR',e.message));
 await page.addInitScript(()=>{window.__headless=true});await page.goto('file://'+path.join(__dirname,'three/p5.html'));await page.waitForTimeout(700);
 console.log(await page.evaluate(()=>{document.getElementById('start').click();window.__step(3);window.__minCard();const c=document.getElementById('mcard');const r=c.getBoundingClientRect();return c.style.display+' '+JSON.stringify(r)+' '+c.innerHTML.length+' '+getComputedStyle(c).display}));
 await page.evaluate(()=>{window.__headless=false;const t=document.getElementById('ftip');if(t)t.style.display='none'});await page.waitForTimeout(2000);await page.screenshot({path:'ms_m.png'});await browser.close()})();
