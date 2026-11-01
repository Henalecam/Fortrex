const { chromium } = require('playwright');const path=require('path');
(async()=>{const browser=await chromium.launch({args:['--use-gl=swiftshader','--enable-unsafe-swiftshader']});
 for(const ev of ['sandstorm']){const page=await browser.newPage({viewport:{width:1100,height:680}});const errs=[];page.on('pageerror',e=>errs.push(e.message));
 await page.addInitScript(()=>{window.__headless=true});await page.goto('file://'+path.join(__dirname,'three/p5.html'));await page.waitForTimeout(700);
 const r=await page.evaluate((ev)=>{document.getElementById('start').click();state=null;window.__step(3);window.__biome('deserto');window.__ev(ev);window.__state&&0;for(let k=0;k<4;k++)window.__step(2);return window.__dbg().enemies+' '+window.__dbg().ev},ev);
 await page.evaluate(()=>{window.__headless=false});await page.waitForTimeout(1800);await page.screenshot({path:`ev_${ev}.png`,timeout:120000});console.log(ev,r,errs);await page.close()}
 await browser.close()})();
