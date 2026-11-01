const { chromium } = require('playwright');const path=require('path');
(async()=>{const [w,h]=(process.argv[2]||'390x844').split('x').map(Number);const browser=await chromium.launch({args:['--use-gl=swiftshader','--enable-unsafe-swiftshader']});const page=await browser.newPage({viewport:{width:w,height:h},isMobile:true,hasTouch:true,deviceScaleFactor:1});const errs=[];page.on('pageerror',e=>errs.push(e.message));
 await page.addInitScript(()=>{window.__headless=true;window.__revealHold=true});await page.goto('file://'+path.join(__dirname,'three/p5.html'));await page.waitForTimeout(700);
 const tag=w+'x'+h;const shot=async(n)=>{await page.evaluate(()=>{window.__headless=false});await page.waitForTimeout(700);await page.screenshot({path:'m_'+tag+'_'+n+'.png',timeout:120000});await page.evaluate(()=>{window.__headless=true})};
 await shot('0title');
 await page.evaluate(()=>{document.getElementById('start').click();window.__step(2);const S=window.__st();S.wave=8;S.maxWave=8;document.getElementById('next').click();window.__step(12);window.__edgeShow=true;window.__step(.4)});await shot('1wave');
 await page.evaluate(()=>{window.__mark(10)});await shot('2mark');
 await page.evaluate(()=>{for(let i=0;i<14;i++)window.__step(5)});
 for(const [id,n] of [['bBuild','3build'],['bArs','4ars'],['bRealm','5realm']]){await page.evaluate((id)=>{document.querySelectorAll('.panel.open .x,.close').forEach(b=>{});const b=document.getElementById(id);b&&b.click();window.__step(.2)},id);await shot(n);await page.evaluate((id)=>{const b=document.getElementById(id);b&&b.click();document.dispatchEvent(new KeyboardEvent('keydown',{key:'Escape'}));window.__step(.2)},id)}
 // touch target audit
 console.log(JSON.stringify(await page.evaluate(()=>[...document.querySelectorAll('button,.btn')].filter(b=>b.offsetParent).map(b=>{const r=b.getBoundingClientRect();return [b.id||b.textContent.trim().slice(0,12),Math.round(r.width),Math.round(r.height)]}).filter(x=>x[1]<32||x[2]<32))));
 console.log(errs);await browser.close()})();
