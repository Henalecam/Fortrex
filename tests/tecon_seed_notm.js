const { chromium } = require('playwright');const path=require('path');
(async()=>{const secs=+(process.argv[2]||900);const browser=await chromium.launch({args:['--use-gl=swiftshader','--enable-unsafe-swiftshader']});const page=await browser.newPage();const errs=[];page.on('pageerror',e=>errs.push(e.message));
 await page.addInitScript(sd=>{window.__headless=true;window.__botPlus=true;if(sd)window.__freeze=true;if(sd)window.__noTM=true;if(sd){let a=sd>>>0;Math.random=function(){a|=0;a=a+0x6D2B79F5|0;let t=Math.imul(a^a>>>15,1|a);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296}}},+(process.env.SEED||0));await page.goto('file://'+path.join(__dirname,'three/p5econ.html'));await page.waitForTimeout(700);
 await page.evaluate(()=>{document.getElementById('start').click();document.getElementById('auto').click()});
 for(let t=0;t<secs;t+=60){await page.evaluate(()=>{for(let k=0;k<6;k++){window.__bot();window.__step(10)}})}
 const E=await page.evaluate(()=>JSON.stringify(window.__econ().log));for(const r of JSON.parse(E))console.log(JSON.stringify(r));console.log(errs.slice(0,3));await browser.close()})();
