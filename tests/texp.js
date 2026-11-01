const { chromium } = require('playwright');const path=require('path');
(async()=>{const browser=await chromium.launch({args:['--use-gl=swiftshader','--enable-unsafe-swiftshader']});const page=await browser.newPage({viewport:{width:1280,height:800}});const errs=[];page.on('pageerror',e=>errs.push(e.message));
 await page.addInitScript(()=>{window.__headless=true});await page.goto('file://'+path.join(__dirname,'three/p5.html'));await page.waitForTimeout(700);
 await page.evaluate(()=>{document.getElementById('start').click();document.getElementById('auto').click();for(let t=0;t<120;t+=10){window.__bot();window.__step(10)}});
 // wait for rest
 for(let k=0;k<100;k++){if(await page.evaluate(()=>{window.__step(.5);return window.__why().ph==='rest'}))break}
 await page.evaluate(()=>{document.getElementById('bRealm').click()});await page.waitForTimeout(300);
 const r=await page.evaluate(()=>{const b=document.getElementById('expGo');if(!b)return 'nobutton '+document.getElementById('realmInfo').textContent.slice(-200);b.click();const w0=window.__dbg().wave;document.getElementById('realmClose').click();for(let t=0;t<200;t+=10){window.__bot();window.__step(10)}return 'w0='+w0+' w='+window.__dbg().wave+' minions='+window.__dbg().minions.length});console.log(r);console.log(errs);await browser.close()})();
