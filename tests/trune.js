const { chromium } = require('playwright');const path=require('path');
(async()=>{const browser=await chromium.launch({args:['--use-gl=swiftshader','--enable-unsafe-swiftshader']});const page=await browser.newPage({viewport:{width:1280,height:800}});const errs=[];page.on('pageerror',e=>errs.push(e.message));
 await page.addInitScript(()=>{window.__headless=true;window.__RL=[];try{localStorage.setItem('fortrex_tips','{"start":1,"auto":1,"shop":1,"build":1,"wave":1}');localStorage.setItem('fortrex_tut','1')}catch(e){}});await page.goto('file://'+path.join(__dirname,'three/p5.html'));await page.waitForTimeout(500);
 await page.evaluate(()=>{document.getElementById('start').click();window.__step(1);window.__st().wave=35;document.getElementById('next').click();window.__step(1);window.__runico()});
 for(let s=0;s<3;s++){const k=await page.evaluate(()=>{const n=window.__RL.length;for(let i=0;i<80&&window.__RL.length===n;i++)window.__step(.25);window.__step(.35);return window.__RL[window.__RL.length-1]});await page.screenshot({path:'rune_'+s+'_'+k+'.png'})}
 console.log(errs.slice(0,3));await browser.close()})();
