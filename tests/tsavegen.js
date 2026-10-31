const { chromium } = require('playwright');const path=require('path');
(async()=>{const secs=+(process.argv[2]||900);const browser=await chromium.launch({args:['--use-gl=swiftshader','--enable-unsafe-swiftshader']});const page=await browser.newPage();const errs=[];page.on('pageerror',e=>errs.push(e.message));
 await page.addInitScript(()=>{window.__headless=true;window.__botPlus=true;window.__econOn=true;try{localStorage.setItem('fortrex_opts',JSON.stringify({diff:'calmo'}))}catch(e){}});await page.goto('file://'+path.join(__dirname,'three/p5econ.html'));await page.waitForTimeout(700);
 await page.evaluate(()=>{document.getElementById('start').click();document.getElementById('auto').click()});
 for(let t=0;t<secs;t+=60){await page.evaluate(()=>{for(let k=0;k<6;k++){window.__bot();window.__step(10)}})}
 const sv=await page.evaluate(()=>{for(let i=0;i<400&&window.__st().phase==='wave';i++){window.__bot();window.__step(2)}for(let i=0;i<5;i++)window.__step(1);return [window.__st().wave,window.__st().phase,localStorage.getItem('fortrex_save_v1')]});console.log('SAVE',sv[0],sv[1],(sv[2]||'').length);if(sv[2])require('fs').writeFileSync('save_gen.json',sv[2]);
 const E=await page.evaluate(()=>JSON.stringify(window.__econ().log));for(const r of JSON.parse(E))console.log(JSON.stringify(r));console.log(errs.slice(0,3));await browser.close()})();
