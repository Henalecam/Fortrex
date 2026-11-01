const { chromium } = require('playwright');const path=require('path');
(async()=>{const browser=await chromium.launch({args:['--use-gl=swiftshader','--enable-unsafe-swiftshader']});const ctx=await browser.newContext();const errs=[];
 let page=await ctx.newPage();page.on('pageerror',e=>errs.push(e.message));await page.addInitScript(()=>{window.__headless=true});await page.goto('file://'+path.join(__dirname,'three/p5.html'));await page.waitForTimeout(700);
 console.log(await page.evaluate(()=>{document.getElementById('start').click();window.__step(3);const s=window.__siege();window.__step(2);return s+' save='+window.__save()+' battle='+JSON.stringify(window.__why().b)}));
 await page.close();page=await ctx.newPage();page.on('pageerror',e=>errs.push(e.message));await page.addInitScript(()=>{window.__headless=true});await page.goto('file://'+path.join(__dirname,'three/p5.html'));await page.waitForTimeout(700);
 console.log(await page.evaluate(()=>{document.getElementById('continue').click();const b=window.__why().b;for(let t=0;t<120;t+=10){window.__bot();window.__step(10)}return 'loaded battle='+b+' now w='+window.__dbg().wave}));console.log(errs);await browser.close()})();
