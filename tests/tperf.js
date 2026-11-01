const { chromium } = require('playwright');const path=require('path');const fs=require('fs');
(async()=>{const browser=await chromium.launch({args:['--use-gl=swiftshader','--enable-unsafe-swiftshader']});const page=await browser.newPage();const errs=[];page.on('pageerror',e=>errs.push(e.message));
 const fx=fs.readFileSync('/home/claude/fortrex/tests/save_v060_w19.json','utf8');
 await page.addInitScript(s=>{window.__headless=true;localStorage.setItem('fortrex_save_v1',s)},fx);await page.goto('file://'+path.join(__dirname,'three/p5.html'));await page.waitForTimeout(700);
 await page.evaluate(()=>{document.getElementById('continue').click();window.__step(1);const a=document.getElementById('auto');if(!/on/.test(a.className))a.click();document.getElementById('next').click()});
 for(let t=0;t<60;t+=10)await page.evaluate(()=>{window.__bot();window.__step(10)});
 const cdp=await page.context().newCDPSession(page);await cdp.send('Profiler.enable');await cdp.send('Profiler.setSamplingInterval',{interval:500});await cdp.send('Profiler.start');
 const T=[];for(let t=0;t<120;t+=10){T.push(await page.evaluate(()=>{const t0=performance.now();window.__bot();window.__step(10);let n=0;return [Math.round(performance.now()-t0),window.__st().wave,window.__alive().split(' ').length]}))}
 const {profile}=await cdp.send('Profiler.stop');
 const self={};const byId={};for(const n of profile.nodes)byId[n.id]=n;const dt=profile.timeDeltas;const cnt={};profile.samples.forEach((id,i)=>{cnt[id]=(cnt[id]||0)+(dt[i]||0)});
 for(const [id,us] of Object.entries(cnt)){const n=byId[id];const k=n.callFrame.functionName+':'+n.callFrame.lineNumber;self[k]=(self[k]||0)+us}
 const par={};for(const n of profile.nodes)for(const c of (n.children||[]))par[c]=n.id;const cal={};for(const [id,us] of Object.entries(cnt)){let n=byId[id];if(n.callFrame.functionName!=='findPath'&&n.callFrame.functionName!=='heapPop')continue;let p=byId[par[id]];while(p&&(p.callFrame.functionName==='findPath'))p=byId[par[p.id]];let q=p&&byId[par[p.id]];const k=(p?p.callFrame.functionName:'?')+'<'+(q?q.callFrame.functionName:'?');cal[k]=(cal[k]||0)+us}console.log(JSON.stringify(Object.entries(cal).sort((a,b)=>b[1]-a[1]).slice(0,8)));console.log(JSON.stringify(T));const tot=Object.values(self).reduce((a,b)=>a+b,0);for(const [k,v] of Object.entries(self).sort((a,b)=>b[1]-a[1]).slice(0,25))console.log((v/tot*100).toFixed(1)+'%',k);
 console.log(errs.slice(0,3));await browser.close()})();
