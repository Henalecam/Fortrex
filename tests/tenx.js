const { chromium } = require('playwright');const path=require('path');
(async()=>{const browser=await chromium.launch({args:['--use-gl=swiftshader','--enable-unsafe-swiftshader']});const page=await browser.newPage();const errs=[];page.on('pageerror',e=>errs.push(e.message));
 await page.addInitScript(()=>{window.__headless=true});await page.goto('file://'+path.join(__dirname,'three/p5.html'));await page.waitForTimeout(500);
 const r=await page.evaluate(()=>{document.getElementById('start').click();window.__step(1);const S=window.__st();S.wave=12;const res={};for(const tm of [false,true]){window.__noTM=tm;const by={};for(let k=0;k<400;k++){const [n,th]=window.__wspec(12);const t=th.split('+')[0];(by[t]=by[t]||[]).push(n)}for(const t in by)res[(tm?'off:':'on:')+t]=Math.round(by[t].reduce((a,b)=>a+b,0)/by[t].length)}return res});
 console.log(JSON.stringify(r),errs.slice(0,2));await browser.close()})();
