const { chromium } = require('playwright');const path=require('path');
(async()=>{const browser=await chromium.launch({args:['--use-gl=swiftshader','--enable-unsafe-swiftshader']});const page=await browser.newPage({viewport:{width:1100,height:680}});const errs=[];page.on('pageerror',e=>errs.push(e.message));
 await page.addInitScript(()=>{window.__headless=true});await page.goto('file://'+path.join(__dirname,'three/p5.html'));await page.waitForTimeout(700);
 const r=await page.evaluate(()=>{document.getElementById('start').click();document.getElementById('auto').click();for(let t=0;t<200;t+=10){window.__bot();window.__step(10)}const out=[];window.__forceEv='pirates';return out});
 for(let k=0;k<8;k++){const s=await page.evaluate(()=>{window.__step(15);const d=window.__dbg();return d.wave+' '+d.enemies+' '+d.ev},k);console.log(s)}
 console.log(errs);await browser.close()})();
