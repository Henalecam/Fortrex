const { chromium } = require('playwright');const path=require('path');
(async()=>{const browser=await chromium.launch({args:['--use-gl=swiftshader','--enable-unsafe-swiftshader']});const page=await browser.newPage({viewport:{width:1280,height:800}});
 await page.addInitScript(()=>{window.__headless=true;window.__freeze=true;window.__revealHold=true;localStorage.setItem('fortrex_tips','{"start":1,"auto":1,"shop":1,"build":1,"wave":1,"bomb":1,"bless":1,"affix":1,"save":1,"castle":1,"cheer":1}')});
 await page.goto('file://'+path.join(__dirname,'three/p5.html'));await page.waitForTimeout(600);await page.evaluate(()=>{document.getElementById('start').click();window.__step(3)});
 for(const d of [999,60]){await page.evaluate(d=>{window.__accD=d;window.__step(.6);window.__freeze=false;window.__headless=false},d);await page.waitForTimeout(250);await page.screenshot({path:'acc_'+d+'.png',clip:{x:380,y:230,width:520,height:420}});await page.evaluate(()=>{window.__headless=true;window.__freeze=true})}
 await browser.close()})();
