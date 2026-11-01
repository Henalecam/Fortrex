const { chromium } = require('playwright');const path=require('path');
(async()=>{const R=+(process.argv[2]||0);const types=['cannon','chain','ballista'];
 const browser=await chromium.launch({args:['--use-gl=swiftshader','--enable-unsafe-swiftshader']});
 for(const t of types.flatMap(x=>[x,x])){const page=await browser.newPage();const errs=[];page.on('pageerror',e=>errs.push(e.message));await page.addInitScript(()=>{window.__headless=true});await page.goto('file://'+path.join(__dirname,'three/p5.html'));await page.waitForTimeout(400);
  const r=await page.evaluate(([t,R])=>{document.getElementById('start').click();window.__step(1);const n=window.__wtest(t,R);let s;for(let i=0;i<44;i++){s=window.__wtick();window.__step(1.5)}return n+' '+JSON.stringify(s)},[t,R]);
  console.log(t.padEnd(10),r,errs.length?errs[0]:'');await page.close()}await browser.close()})();
