const { chromium } = require('playwright');const path=require('path');
(async()=>{const browser=await chromium.launch({args:['--use-gl=swiftshader','--enable-unsafe-swiftshader']});const page=await browser.newPage({viewport:{width:390,height:844}});const errs=[];page.on('pageerror',e=>errs.push(e.message));
 const toasts=[];await page.exposeFunction('__tlog',t=>toasts.push(t));
 await page.addInitScript(()=>{window.__headless=true;addEventListener('DOMContentLoaded',()=>{const b=document.getElementById('toasts');new MutationObserver(ms=>{for(const m of ms)for(const n of m.addedNodes)if(n.nodeType===1)window.__tlog(n.textContent.slice(0,90))}).observe(b,{childList:true})})});
 await page.goto('file://'+path.join(__dirname,'three/p5m.html'));await page.waitForTimeout(700);
 await page.evaluate(()=>{document.getElementById('start').click();document.getElementById('auto').click()});
 for(let t=0;t<480;t+=60)await page.evaluate(()=>{for(let k=0;k<6;k++){window.__bot();window.__step(10)}});
 await page.evaluate(()=>{window.__headless=false});await page.waitForTimeout(2000);await page.screenshot({path:'mob.png',timeout:120000});
 const c={};for(const t of toasts){const k=t.replace(/[0-9]+/g,'#').slice(0,50);c[k]=(c[k]||0)+1}console.log(Object.entries(c).sort((a,b)=>b[1]-a[1]).slice(0,25).map(x=>x[1]+' '+x[0]).join('\n'));console.log(errs);await browser.close()})();
