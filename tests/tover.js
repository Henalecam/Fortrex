const { chromium } = require('playwright');const path=require('path');
(async()=>{const browser=await chromium.launch({args:['--use-gl=swiftshader','--enable-unsafe-swiftshader']});
 for(const w of [390,360]){const page=await browser.newPage({viewport:{width:w,height:800},hasTouch:true,isMobile:true});
 await page.goto('file://'+path.join(__dirname,'three/p5m.html'));await page.waitForTimeout(800);
 const f=async tag=>{const r=await page.evaluate(()=>{const W=document.documentElement.clientWidth;const out=[];for(const e of document.querySelectorAll('body *')){const cs=getComputedStyle(e);if(cs.display==='none'||cs.position==='fixed'&&false)continue;const r=e.getBoundingClientRect();if(r.width&&r.right>W+1)out.push((e.id||e.className||e.tagName).toString().slice(0,30)+':'+Math.round(r.left)+'-'+Math.round(r.right))}return {iw:innerWidth,cw:W,sw:document.documentElement.scrollWidth,out:out.slice(0,12)}});console.log(w,tag,JSON.stringify(r))};
 await f('title');await page.tap('#start');await page.waitForTimeout(1500);await page.evaluate(()=>window.__step&&window.__step(1));await f('game');await page.close()}
 await browser.close()})();
