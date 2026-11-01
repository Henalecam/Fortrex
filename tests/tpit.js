const { chromium } = require('playwright');const path=require('path');const fs=require('fs');
(async()=>{const browser=await chromium.launch({args:['--use-gl=swiftshader','--enable-unsafe-swiftshader']});const page=await browser.newPage();const errs=[];page.on('pageerror',e=>errs.push(e.message));
 const fx=fs.readFileSync(process.env.FX||'/home/claude/fortrex/tests/save_v78_w31.json','utf8');const old=process.env.OLDPIT==='1';const secs=+(process.env.SECS||600);
 await page.addInitScript(([s,o])=>{window.__headless=true;window.__noLose=1;window.__setLog=[];if(o)window.__oldPit=1;localStorage.setItem('fortrex_save_v1',s)},[fx,old]);await page.goto('file://'+path.join(__dirname,'three/p5econ.html'));await page.waitForTimeout(700);
 const p0=await page.evaluate(()=>{document.getElementById('continue').click();window.__step(2);return window.__pitCnt()});
 let marks=[];
 for(let t=0;t<secs;t+=10){const r=await page.evaluate(()=>{window.__bot();if(window.__st().phase==='rest'&&window.__st().restT<20)document.getElementById('next').click();window.__step(10);return {w:window.__st().wave,p:window.__pitCnt()}});if(t%120===110)marks.push(r.w+':'+r.p)}
 const o=await page.evaluate(()=>{const L=window.__setLog||[];return {w:window.__st().wave,pits:window.__pitCnt(),fills:window.__pitN||0,col:L.length,blk:L.reduce((a,e)=>a+e.n,0),tu:L.reduce((a,e)=>a+(e.tu||0),0),big:L.filter(e=>e.n>=100).length,bigs:L.filter(e=>e.n>=100).map(e=>[e.t,e.n,e.bl,e.ymin,e.ymax,e.overFl,e.c.join('|'),(e.rm||[]).slice(-3).map(r=>typeof r==='string'?r:JSON.stringify(r)).join(';')]),chest:window.__dbg().chest}});
 console.log((old?'OLD':'NEW'),'p0',p0,JSON.stringify(o),marks.join(' '),errs.slice(0,2));await browser.close()})();
