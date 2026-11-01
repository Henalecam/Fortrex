const { chromium } = require('playwright');const path=require('path');const fs=require('fs');
(async()=>{const browser=await chromium.launch({args:['--use-gl=swiftshader','--enable-unsafe-swiftshader']});const page=await browser.newPage({viewport:{width:1280,height:800}});
 const fx=fs.readFileSync(process.env.FX||'/home/claude/fortrex/tests/save_v78_w31.json','utf8');await page.addInitScript(s=>{window.__headless=true;window.__freeze=true;window.__revealHold=true;localStorage.setItem('fortrex_save_v1',s)},fx);
 await page.goto('file://'+path.join(__dirname,'three/p5econ.html'));await page.waitForTimeout(800);
 if(process.env.OLDF)await page.evaluate(()=>{window.__oldFluidLoad=true});const r0=await page.evaluate(()=>{document.getElementById('continue').click();const n=document.getElementById('news');if(n)n.hidden=true;window.__step(.5);return window.__bpStats()});console.log('load',JSON.stringify(r0));
 for(let t=0;t<6;t++){const r=await page.evaluate(()=>{window.__step(20);return window.__bpStats()});console.log('rest+'+(t+1)*20+'s',JSON.stringify(r))}
 
 console.log((await page.evaluate(()=>window.__cam?JSON.stringify(window.__cam()):'')));await browser.close()})();
