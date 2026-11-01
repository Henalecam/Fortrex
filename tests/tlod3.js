const { chromium } = require('playwright');const path=require('path');
(async()=>{const browser=await chromium.launch({args:['--use-gl=swiftshader','--enable-unsafe-swiftshader']});const page=await browser.newPage({viewport:{width:1280,height:800}});
 await page.addInitScript(()=>{window.__headless=true;window.__freeze=true;window.__revealHold=true;localStorage.setItem('fortrex_tips','{"start":1,"auto":1,"shop":1,"build":1,"wave":1,"bomb":1,"bless":1,"affix":1,"save":1,"castle":1,"cheer":1}')});
 await page.goto('file://'+path.join(__dirname,'three/p5.html'));await page.waitForTimeout(600);
 await page.evaluate(()=>{document.getElementById('start').click();window.__step(1);window.__etest('crawler',12,0);for(const t of ['crawler','wolf','climber','brute','spider','imp','beetle','flyer'])window.__etest&&0;});
 // spawn a lineup in view
 const r0=await page.evaluate(()=>{const n=window.__lineup?window.__lineup():null;window.__step(.2);return n});console.log('lineup',JSON.stringify(r0).slice(0,200));
 for(const k of [38,30,24]){const r=await page.evaluate(k=>{window.__lodKTest=k;window.__lodK=k;window.__step(.5);window.__headless=false;const ri=(window.__renderMs(1),window.__renderInfo());const b=window.__drawBreak();window.__headless=true;return {k,calls:ri.calls,en:b.en[0],types:b.perType.slice(0,6)}},k);console.log(JSON.stringify(r));await page.evaluate(()=>{window.__headless=false});await page.waitForTimeout(200);await page.screenshot({path:'lodl_'+k+'.png'});await page.evaluate(()=>{window.__headless=true})}
 await browser.close()})();
