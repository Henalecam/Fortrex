const { chromium } = require('playwright');const path=require('path');const fs=require('fs');
(async()=>{const browser=await chromium.launch({args:['--use-gl=swiftshader','--enable-unsafe-swiftshader']});const page=await browser.newPage({viewport:{width:1280,height:800}});
 const fx=fs.readFileSync('/home/claude/fortrex/tests/save_v060_w19.json','utf8');
 await page.addInitScript(s=>{window.__headless=true;localStorage.setItem('fortrex_save_v1',s);localStorage.setItem('fortrex_opts','{"lowGfx":true}')},fx);await page.goto('file://'+path.join(__dirname,'three/p5.html'));await page.waitForTimeout(700);
 await page.evaluate(()=>{document.getElementById('continue').click();document.getElementById('newsOk').click();document.getElementById('next').click();window.__step(15);window.__headless=false});await page.waitForTimeout(1000);
 const c=await page.context().newCDPSession(page);await c.send('Profiler.enable');await c.send('Profiler.start');await page.waitForTimeout(8000);const {profile}=await c.send('Profiler.stop');
 const byId={};for(const nd of profile.nodes)byId[nd.id]=nd;const cnt={};profile.samples.forEach((s,i)=>{cnt[s]=(cnt[s]||0)+(profile.timeDeltas[i]||0)});const self={};
 for(const id in cnt){const nd=byId[id];const k=nd.callFrame.functionName+':'+nd.callFrame.lineNumber;self[k]=(self[k]||0)+cnt[id]}
 console.log(Object.entries(self).sort((a,b)=>b[1]-a[1]).slice(0,18).map(([k,v])=>k+' '+(v/1000).toFixed(0)+'ms').join('\n'));await browser.close()})();
