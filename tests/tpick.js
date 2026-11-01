const { chromium } = require('playwright');const path=require('path');const fs=require('fs');
(async()=>{const browser=await chromium.launch({args:['--use-gl=swiftshader','--enable-unsafe-swiftshader']});const page=await browser.newPage({viewport:{width:1280,height:800}});
 const fx=fs.readFileSync('/home/claude/fortrex/tests/save_v78_w31.json','utf8');await page.addInitScript(s=>{window.__headless=true;window.__revealHold=true;localStorage.setItem('fortrex_save_v1',s)},fx);
 await page.goto('file://'+path.join(__dirname,'three/p5econ.html'));await page.waitForTimeout(800);
 await page.evaluate(()=>{document.getElementById('continue').click();const n=document.getElementById('news');if(n)n.hidden=true;window.__step(1);window.__headless=false});await page.waitForTimeout(500);
 const pts=[[640,250],[640,330],[560,300],[720,300],[640,400],[600,200]];for(const [x,y] of pts)console.log(x,y,JSON.stringify(await page.evaluate(([x,y])=>window.__pickObj(x,y),[x,y])));
 await browser.close()})();
