const { chromium } = require('playwright');const path=require('path');
(async()=>{const roles=(process.argv[2]||'none,rep,col,gun,sol,med').split(',');const secs=+(process.argv[3]||600);
 const browser=await chromium.launch({args:['--use-gl=swiftshader','--enable-unsafe-swiftshader']});
 const run=async role=>{const page=await browser.newPage();const errs=[];page.on('pageerror',e=>errs.push(e.message));await page.addInitScript(()=>{window.__headless=true});await page.goto('file://'+path.join(__dirname,'three/p5.html'));await page.waitForTimeout(400);
  await page.evaluate(r=>{document.getElementById('start').click();document.getElementById('auto').click();if(r!=='none')window.__noRole(r)},role);
  for(let t=0;t<secs;t+=60)await page.evaluate(()=>{for(let k=0;k<6;k++){window.__bot();window.__step(10)}});
  const s=await page.evaluate(()=>JSON.stringify(window.__rsum()));console.log(role.padEnd(5),s,errs[0]||'');await page.close()};
 for(const r of roles)await run(r);await browser.close()})();
