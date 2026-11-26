const { chromium } = require('playwright');const path=require('path');const fs=require('fs');
(async()=>{const browser=await chromium.launch({args:['--use-gl=swiftshader','--enable-unsafe-swiftshader']});const out=[];
 for(const old of [0]){const page=await (await browser.newContext({viewport:{width:390,height:844},deviceScaleFactor:2,hasTouch:true,isMobile:true})).newPage();const errs=[];page.on('pageerror',e=>errs.push(e.message));
 const fx=fs.readFileSync('/home/claude/fortrex/tests/save_v060_w19.json','utf8');
 await page.addInitScript(([s,old])=>{window.__headless=true;if(old)window.__oldHlRows=1;localStorage.setItem('fortrex_save_v1',s)},[fx,old]);await page.goto('file://'+path.join(__dirname,'three/p5m.html'));await page.waitForTimeout(700);
 await page.evaluate(()=>{document.getElementById('continue').click()});await page.waitForTimeout(300);await page.evaluate(()=>{for(const b of document.querySelectorAll('button'))if(/Continuar jogando/.test(b.textContent)&&b.offsetParent)b.click();for(const b of document.querySelectorAll('#ftip button, .tipX'))b.click()});
 console.log(await page.evaluate(()=>{window.__fundWave();window.__step(3);const s=window.__hlSet({bomb:7,lure:2,chain:6,weak:3,fundLure:5});let k=0;while(k++<400){window.__killAll();window.__step(.25);const r=document.getElementById('report');if(r&&r.style.display==='block'&&r.querySelector('.hl'))break}const r=document.getElementById('report');const b=r.getBoundingClientRect();return [k,Math.round(b.height),r.querySelectorAll('.hl').length,r.innerText.slice(0,400)]}));
 await page.evaluate(()=>{window.__headless=false});await page.waitForTimeout(1200);await page.screenshot({path:old?'hl_old.png':'hl_new.png',timeout:120000});console.log(errs);await page.close()}
 await browser.close()})();
