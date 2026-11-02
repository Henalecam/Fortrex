const { chromium } = require('playwright');const path=require('path');
(async()=>{const b=await chromium.launch({args:['--use-gl=swiftshader','--enable-unsafe-swiftshader']});const p=await b.newPage();const errs=[];p.on('pageerror',e=>errs.push(e.message));
 await p.addInitScript(()=>{window.__headless=true;window.__botPlus=true;window.__thLog=[]});await p.goto('file://'+path.join(__dirname,'three/p5econ.html'));await p.waitForTimeout(700);
 await p.evaluate(()=>{document.getElementById('start').click();document.getElementById('auto').click()});
 const res=[];for(let t=0;t<900;t+=2){const r=await p.evaluate(()=>{const s=window.__st();window.__forceEv=s.wave>=5&&s.wave%5!==0?'ladrao':null;window.__bot();window.__step(2);const L=window.__thiefLead(1.35);if(L&&!window.__bombed){window.__bombed=1;window.__thFull=0;window.__bomb(L[0],L[1]);return {w:s.wave,hp:Math.round(L[2])}}if(!L)window.__bombed=0;return null});if(r)res.push(r)}
 console.log(JSON.stringify(res));console.log(JSON.stringify(await p.evaluate(()=>window.__thLog.filter(x=>x.r!=='spawn'))));console.log(errs.slice(0,3));await b.close()})();
