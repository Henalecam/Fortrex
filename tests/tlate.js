const { chromium } = require('playwright');const path=require('path');const fs=require('fs');
(async()=>{const secs=+(process.argv[2]||1200);const W=+(process.argv[3]||33);const mat=+(process.argv[4]||1500);const browser=await chromium.launch({args:['--use-gl=swiftshader','--enable-unsafe-swiftshader']});const page=await browser.newPage({viewport:{width:1280,height:800}});const errs=[];page.on('pageerror',e=>errs.push(e.message));
 const fx=fs.readFileSync('/home/claude/fortrex/tests/save_v060_w19.json','utf8');
 await page.addInitScript(s=>{window.__headless=true;window.__botPlus=true;window.__econOn=true;window.__RL=[];localStorage.setItem('fortrex_save_v1',s)},fx);await page.goto('file://'+path.join(__dirname,'three/p5econ.html'));await page.waitForTimeout(700);
 console.log(await page.evaluate(([W,mat])=>{document.getElementById('continue').click();const r=window.__lateGame(W,mat);return JSON.stringify(r)},[W,mat]));
 let shot=0;
 for(let t=0;t<secs;t+=10){const r=await page.evaluate(()=>{window.__bot();if(window.__st().phase==='rest'&&window.__st().restT<20)document.getElementById('next').click();window.__step(10);const s=window.__st();return {w:s.wave,boss:!!(s.boss&&!s.boss.dead&&s.boss.type==='runico'),rl:(window.__RL||[]).length}});
   if(r.boss&&shot<3&&t%30===0){await page.evaluate(()=>window.__step(.4));await page.screenshot({path:'late_'+shot+'.png'});shot++}}
 const E=await page.evaluate(()=>JSON.stringify({log:window.__econ().log.filter(r=>r.w>=30),boss:window.__bossLog,rl:(window.__RL||[]).reduce((a,k)=>(a[k]=(a[k]||0)+1,a),{})}));const o=JSON.parse(E);for(const r of o.log)console.log(r.w,r.t,r.L,r.tail,r.tt,r.cd,r.ev);console.log(JSON.stringify(o.boss),JSON.stringify(o.rl));console.log(errs.slice(0,3));await browser.close()})();
