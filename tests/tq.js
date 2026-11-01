const { chromium } = require('playwright');const path=require('path');
(async()=>{const browser=await chromium.launch({args:['--use-gl=swiftshader','--enable-unsafe-swiftshader']});const page=await browser.newPage();const errs=[];page.on('pageerror',e=>errs.push(e.message));
 await page.addInitScript(()=>{window.__headless=true});await page.goto('file://'+path.join(__dirname,'three/p5.html'));await page.waitForTimeout(700);
 await page.evaluate(()=>{document.getElementById('start').click();document.getElementById('auto').click()});
 for(let t=0;t<900;t+=60){const r=await page.evaluate(()=>{for(let k=0;k<6;k++){window.__bot();window.__step(10)}const T=window.__traps();return `w=${window.__dbg().wave} traps=${T.n} pl=${T.pl} gone=${T.gone} hits=${T.hits} dis=${T.dis} tier=${T.tier} aff=${JSON.stringify(window.__aff())}`});if(t%180==0||t>=660)console.log(r)}
 console.log(errs);await browser.close()})();
