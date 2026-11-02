const { chromium } = require('playwright');const path=require('path');
(async()=>{const secs=+(process.argv[2]||420);const b=await chromium.launch({args:['--use-gl=swiftshader','--enable-unsafe-swiftshader']});const page=await b.newPage();
 await page.addInitScript(sd=>{window.__headless=true;window.__botPlus=true;if(location.hash==='#old')window.__oldLook=1;window.__freeze=true;let a=sd>>>0;const R=function(){a|=0;a=a+0x6D2B79F5|0;let t=Math.imul(a^a>>>15,1|a);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296};window.__rc={};window.__rngOn=false;Math.random=function(){if(window.__rngOn){const s=(new Error().stack||'').split('\n')[2]||'';const k=s.replace(/\(.*:(\d+):\d+\)/,':$1').trim();window.__rc[k]=(window.__rc[k]||0)+1}return R()}},1);
 await page.goto('file://'+path.join(__dirname,'three/p5econ.html')+(process.env.OLDLOOK?'#old':''));await page.waitForTimeout(700);
 await page.evaluate(()=>{document.getElementById('start').click();document.getElementById('auto').click();window.__rngOn=true});
 for(let t=0;t<secs;t+=60){await page.evaluate(()=>{for(let k=0;k<6;k++){window.__bot();window.__step(10)}})}
 console.log(JSON.stringify(await page.evaluate(()=>window.__rc)));await b.close()})();
