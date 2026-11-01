const { chromium } = require('playwright');const path=require('path');
(async()=>{const browser=await chromium.launch({args:['--use-gl=swiftshader','--enable-unsafe-swiftshader']});const page=await browser.newPage({viewport:{width:1280,height:800}});const errs=[];page.on('pageerror',e=>errs.push(e.message));
 await page.addInitScript(()=>{window.__headless=true;window.__revealHold=true});await page.goto('file://'+path.join(__dirname,'three/p5.html'));await page.waitForTimeout(700);
 await page.evaluate(()=>{document.getElementById('start').click();document.getElementById('auto').click();for(let k=0;k<60&&window.__st().wave<6;k++){window.__bot();window.__step(10)}document.getElementById('auto').click()});
 for(let r=0;r<3;r++){
  const info=await page.evaluate(()=>{const S=window.__st();const t0=JSON.stringify(window.__tlog());if(S.phase!=='wave')document.getElementById('next').click();for(let i=0;i<60&&S.phase==='wave';i++){window.__bot();window.__step(5)}const ta=window.__tlog();window.__step(8);const tb=window.__tlog();const d={};for(const k in tb){const o=JSON.parse(t0)[k]||0;if(tb[k]>o)d[k]=tb[k]-o}return {w:S.wave,phase:S.phase,toasts:d,offer:S.blessOffer,merch:!!S.merchant}});
  console.log(JSON.stringify(info));await page.evaluate(()=>{window.__headless=false});await page.waitForTimeout(700);await page.screenshot({path:'rest_'+r+'.png',timeout:120000});await page.evaluate(()=>{window.__headless=true;window.__step(10)})}
 console.log(errs);await browser.close()})();
