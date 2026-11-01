const { chromium } = require('playwright');const path=require('path');
(async()=>{const browser=await chromium.launch({args:['--use-gl=swiftshader','--enable-unsafe-swiftshader']});const ctx=await browser.newContext();const page=await ctx.newPage();const errs=[];page.on('pageerror',e=>errs.push('PE '+e.message));page.on('console',m=>{if(m.type()==='error')errs.push('CE '+m.text().slice(0,160))});
 await page.addInitScript(()=>{window.__headless=true});await page.goto('file://'+path.join(__dirname,'three/p5.html'));await page.waitForTimeout(500);
 const snap=()=>page.evaluate(()=>{const S=window.__st();return {wave:S.wave,phase:S.phase,mat:Math.round(S.material),merch:S.merch||null,pact:S.pact||0,rh:S.runeHeart||0,bless:S.bless||null,offer:S.blessOffer||null,hold:S.holdT||0,auto:!!S.auto,blessUi:document.getElementById('bless').hidden?'hidden':document.getElementById('bless').className,autoTxt:document.getElementById('auto').textContent,inv:(S.inv.turrets||[]).length,mem:window.__mem()}});
 // scenario: wave 12 rest, rune heart lv2, merchant open, auto on (hold running)
 await page.evaluate(()=>{document.getElementById('start').click();window.__step(1);const S=window.__st();S.wave=12;S.maxWave=12;S.material=400;window.__runeHeart(2);window.__merch();document.getElementById('auto').click();S.restT=0.5;window.__step(3)});
 const a=await snap();const ok=await page.evaluate(()=>window.__save());console.log('SAVED',ok,JSON.stringify({...a,mem:undefined}));
 await page.reload();await page.waitForTimeout(600);await page.evaluate(()=>{document.getElementById('continue').click()});await page.evaluate(()=>window.__step(1));
 const b=await snap();console.log('LOADED',JSON.stringify({...b,mem:undefined}));console.log('objs before/after',a.mem.objs,b.mem.objs);
 // after load: pick pact then save/load again before calling the wave
 const c=await page.evaluate(()=>{const btn=document.querySelector('#bless button[data-mc="pact"]');if(btn)btn.click();return {clicked:!!btn,pact:window.__st().pact}});console.log('PACT',JSON.stringify(c));
 const sv2=await page.evaluate(()=>{const S=window.__st();return {ok:window.__save(),run:S.running,ph:S.phase,ch:S.choosing,en:window.__dbg().enemies}});console.log('SAVE2',JSON.stringify(sv2));await page.reload();await page.waitForTimeout(600);await page.evaluate(()=>{document.getElementById('continue').click();window.__step(1)});
 const d=await snap();console.log('LOADED2',JSON.stringify({...d,mem:undefined}));
 const e=await page.evaluate(()=>{const S=window.__st();const q0=(S.nextQ&&S.nextQ.q.length)||0;document.getElementById('next').click();window.__step(.5);return {q0,q:S.queue.length,pactAfter:S.pact,phase:S.phase}});console.log('WAVE',JSON.stringify(e));
 // obelisk present?
 const f=await page.evaluate(()=>{let n=0;window.__st();return window.__mem().objs});
 console.log('ERRS',JSON.stringify(errs));await browser.close()})();
