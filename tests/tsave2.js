const { chromium } = require('playwright');const path=require('path');
(async()=>{const browser=await chromium.launch({args:['--use-gl=swiftshader','--enable-unsafe-swiftshader']});const ctx=await browser.newContext();const errs=[];
 let page=await ctx.newPage();page.on('pageerror',e=>errs.push(e.message));await page.addInitScript(()=>{window.__headless=true});
 await page.goto('file://'+path.join(__dirname,'three/p5.html'));await page.waitForTimeout(700);
 await page.evaluate(()=>{document.getElementById('start').click();document.getElementById('auto').click()});
 for(let t=0;t<900;t+=60)await page.evaluate(()=>{for(let k=0;k<6;k++){window.__bot();window.__step(10)}});
 // wait for a rest phase and save
 let ok=false;for(let k=0;k<200&&!ok;k++){ok=await page.evaluate(()=>{window.__step(.25);const w=window.__why();return w.ph==='rest'&&w.sw===w.w})}
 const a=await page.evaluate(()=>JSON.stringify(window.__sig())+' size='+window.__saveSize()+' merch='+!!JSON.parse(localStorage.getItem('fortrex_save_v1')).state.merchant);require('fs').writeFileSync('/home/claude/fortrex/tests_save_fixture.json',await page.evaluate(()=>localStorage.getItem('fortrex_save_v1')));console.log('saved',ok,a);
 await page.close();page=await ctx.newPage();page.on('pageerror',e=>errs.push(e.message));await page.addInitScript(()=>{window.__headless=true});
 await page.goto('file://'+path.join(__dirname,'three/p5.html'));await page.waitForTimeout(700);
 console.log('btn',await page.evaluate(()=>document.getElementById('continue').hidden+' '+document.getElementById('continue').textContent));
 const t0=Date.now();await page.evaluate(()=>document.getElementById('continue').click());console.log('load ms',Date.now()-t0);
 console.log('loaded',await page.evaluate(()=>JSON.stringify(window.__sig())));
 for(let t=0;t<240;t+=60)await page.evaluate(()=>{for(let k=0;k<6;k++){window.__bot();window.__step(10)}});
 console.log('after',await page.evaluate(()=>JSON.stringify(window.__sig())+' '+JSON.stringify(window.__dbg()).slice(0,300)));
 console.log(errs);await browser.close()})();
