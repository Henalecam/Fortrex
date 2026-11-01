const { chromium } = require('playwright');const path=require('path');const fs=require('fs');
(async()=>{const browser=await chromium.launch({args:['--use-gl=swiftshader','--enable-unsafe-swiftshader']});const page=await browser.newPage();const errs=[];page.on('pageerror',e=>errs.push(e.message));
 const fx=fs.readFileSync(process.argv[2]||'/home/claude/fortrex/tests/save_v041_w13.json','utf8');
 await page.addInitScript(s=>{window.__headless=true;window.__oldGround=true;localStorage.setItem('fortrex_save_v1',s)},fx);await page.goto('file://'+path.join(__dirname,'three/p5.html'));await page.waitForTimeout(700);
 console.log(await page.evaluate(()=>{document.getElementById('continue').click();return JSON.stringify(window.__sig())}));
 for(let t=0;t<180;t+=60)await page.evaluate(()=>{for(let k=0;k<6;k++){window.__bot();window.__step(10)}});
 console.log(await page.evaluate(()=>JSON.stringify(window.__dbg()).slice(0,160)));console.log(errs);await browser.close()})();
