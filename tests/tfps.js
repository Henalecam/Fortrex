const { chromium } = require('playwright');const path=require('path');const fs=require('fs');
(async()=>{const browser=await chromium.launch({args:['--use-gl=swiftshader','--enable-unsafe-swiftshader']});const page=await browser.newPage({viewport:{width:390,height:844}});const errs=[];page.on('pageerror',e=>errs.push(e.message));
 const fx=fs.readFileSync('/home/claude/fortrex/tests/save_v060_w19.json','utf8');
 await page.addInitScript(s=>{window.__headless=true;localStorage.setItem('fortrex_save_v1',s)},fx);await page.goto('file://'+path.join(__dirname,'three/p5.html'));await page.waitForTimeout(700);
 await page.evaluate(()=>{document.getElementById('continue').click();document.getElementById('newsOk').click();document.getElementById('next').click();window.__step(15)});
 await page.evaluate(()=>{window.__headless=false});await page.waitForTimeout(1500);
 console.log(await page.evaluate(()=>new Promise(r=>{let n=0;const t0=performance.now();function f(){n++;if(performance.now()-t0<5000)requestAnimationFrame(f);else r('fps '+(n/5).toFixed(1)+' '+JSON.stringify(window.__vdbg?window.__vdbg():{}))}requestAnimationFrame(f)})));
 await page.screenshot({path:'w19m.png',timeout:120000});console.log(errs);await browser.close()})();
