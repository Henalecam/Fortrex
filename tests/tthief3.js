const { chromium } = require('playwright');const path=require('path');
(async()=>{const b=await chromium.launch({args:['--use-gl=swiftshader','--enable-unsafe-swiftshader']});const p=await b.newPage();const errs=[];p.on('pageerror',e=>errs.push(e.message));
 await p.addInitScript(sd=>{window.__headless=true;window.__botPlus=true;window.__thLog=[];window.__thSrc={};window.__freeze=true;let a=sd>>>0;Math.random=function(){a|=0;a=a+0x6D2B79F5|0;let t=Math.imul(a^a>>>15,1|a);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296}},+(process.env.SEED||1));await p.goto('file://'+path.join(__dirname,'three/p5econ.html'));await p.waitForTimeout(700);
 await p.evaluate(()=>{document.getElementById('start').click();document.getElementById('auto').click()});
 const secs=+(process.argv[2]||900);for(let t=0;t<secs;t+=10){await p.evaluate(()=>{const s=window.__st();window.__forceEv=s.wave>=5&&s.wave%5!==0?'ladrao':null;window.__bot();window.__step(10)})}
 console.log(JSON.stringify(await p.evaluate(()=>window.__thLog)));console.log(JSON.stringify(await p.evaluate(()=>window.__thSrc)));console.log(errs.slice(0,3));await b.close()})();
