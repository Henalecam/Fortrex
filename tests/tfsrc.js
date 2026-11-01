const { chromium } = require('playwright');const path=require('path');
(async()=>{const browser=await chromium.launch({args:['--use-gl=swiftshader','--enable-unsafe-swiftshader']});const ctx=await browser.newContext();const page=await ctx.newPage();
 await page.addInitScript(()=>{window.__headless=true});await page.goto('file://'+path.join(__dirname,'three/p5.html'));await page.waitForTimeout(500);
 const a=await page.evaluate(()=>{document.getElementById('start').click();window.__step(2);const s=window.__bpStats();window.__save();return {src:s.F.src,w:s.F.w,l:s.F.l}});
 await page.reload();await page.waitForTimeout(600);const b=await page.evaluate(()=>{document.getElementById('continue').click();window.__step(.2);const s=window.__bpStats();return {src:s.F.src,w:s.F.w,l:s.F.l}});
 console.log('before save',JSON.stringify(a),'after load',JSON.stringify(b));await browser.close()})();
