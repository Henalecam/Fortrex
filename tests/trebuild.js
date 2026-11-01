const { chromium } = require('playwright');const path=require('path');const fs=require('fs');
(async()=>{const browser=await chromium.launch({args:['--use-gl=swiftshader','--enable-unsafe-swiftshader']});const page=await browser.newPage();
 const fx=fs.readFileSync('/home/claude/fortrex/tests/save_v78_w31.json','utf8');await page.addInitScript(s=>{window.__headless=true;window.__freeze=true;window.__repLog={};localStorage.setItem('fortrex_save_v1',s)},fx);
 await page.goto('file://'+path.join(__dirname,'three/p5econ.html'));await page.waitForTimeout(800);
 await page.evaluate(m=>{document.getElementById('continue').click();const S=window.__st();S.auto=false;if(m){S.material=5000;S.rebBud=9999}window.__step(.5)},+process.env.RICH||0);
 for(let t=0;t<=240;t+=60){const r=await page.evaluate(()=>{const s=window.__bpStats();const S=window.__st();return {pend:s.pend,uns:s.uns,cost:s.cost,hi:s.hi,mat:Math.round(S.material),bud:S.rebBud,ph:S.phase,log:JSON.stringify(window.__repLog),hi:window.__hiStats().n}});console.log(t+'s',JSON.stringify(r));await page.evaluate(()=>{const S=window.__st();S.restT=999;window.__step(30)})}
 await browser.close()})();
