const { chromium } = require('playwright');const path=require('path');const fs=require('fs');
(async()=>{const secs=+(process.argv[2]||600);const browser=await chromium.launch({args:['--use-gl=swiftshader','--enable-unsafe-swiftshader']});const page=await browser.newPage();const errs=[];page.on('pageerror',e=>errs.push(e.message));
 const fx=fs.readFileSync('/home/claude/fortrex/tests/save_v060_w19.json','utf8');
 await page.addInitScript(s=>{window.__headless=true;localStorage.setItem('fortrex_save_v1',s)},fx);await page.goto('file://'+path.join(__dirname,'three/p5.html'));await page.waitForTimeout(700);
 await page.evaluate(()=>{document.getElementById('continue').click();window.__step(1);const a=document.getElementById('auto');if(!/on/.test(a.className))a.click();document.getElementById('next').click()});
 for(let t=0;t<secs;t+=60){await page.evaluate(()=>{for(let k=0;k<6;k++){window.__bot();window.__step(10)}})}
 console.log(JSON.stringify(await page.evaluate(()=>[window.__stuckLog||[],window.__sig()])).slice(0,1500));
 const E=await page.evaluate(()=>JSON.stringify(window.__econ().log));for(const r of JSON.parse(E))console.log(r.w,r.t,r.L,r.U,r.M);console.log(errs.slice(0,3));await browser.close()})();
