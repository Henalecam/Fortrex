const { chromium } = require('playwright');const path=require('path');const fs=require('fs');
(async()=>{const browser=await chromium.launch({args:['--use-gl=swiftshader','--enable-unsafe-swiftshader']});const page=await browser.newPage({viewport:{width:1280,height:800}});
 const fx=fs.readFileSync('/home/claude/fortrex/tests/save_v78_w31.json','utf8');await page.addInitScript(s=>{window.__headless=true;window.__revealHold=true;window.__rmLog={};localStorage.setItem('fortrex_save_v1',s);localStorage.setItem('fortrex_tips','{"start":1,"auto":1,"shop":1,"build":1,"wave":1,"bomb":1,"bless":1,"affix":1,"save":1,"castle":1,"cheer":1,"ward":1}')},fx);
 await page.goto('file://'+path.join(__dirname,'three/p5econ.html'));await page.waitForTimeout(800);
 await page.evaluate(()=>{document.getElementById('continue').click();const n=document.getElementById('news');if(n)n.hidden=true;document.getElementById('bless').hidden=true;window.__step(1)});
 for(const all of [true,false]){await page.evaluate(a=>{window.__planAll=a;window.__step(.5);window.__headless=false},all);await page.waitForTimeout(400);const c=await page.evaluate(()=>window.__pickObj(640,330).length);await page.screenshot({path:'plan_'+(all?'all':'new')+'.png',timeout:180000});await page.evaluate(()=>{window.__headless=true});console.log('planAll',all)}
 const rm=await page.evaluate(()=>{window.__rmLog={};window.__step(30);return window.__rmLog});console.log('removed in 30s rest (blueprint blocks by src:mat)',JSON.stringify(rm));
 await browser.close()})();
