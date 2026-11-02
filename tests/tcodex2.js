const { chromium } = require('playwright');const path=require('path');
(async()=>{const b=await chromium.launch({args:['--use-gl=swiftshader','--enable-unsafe-swiftshader']});const p=await b.newPage({viewport:{width:1280,height:800}});const errs=[];p.on('pageerror',e=>errs.push(e.message));
 await p.addInitScript(()=>{window.__headless=true;try{localStorage.setItem('fortrex_tips','{"start":1,"auto":1,"shop":1,"build":1,"wave":1,"realm":1,"ward":1,"sappers":1,"bomb":1,"mason":1,"save":1}')}catch(e){}});await p.goto('file://'+path.join(__dirname,'three/p5.html'));await p.waitForTimeout(700);
 await p.evaluate(()=>{document.getElementById('start').click();window.__step(2);const s=window.__st();s.thiefSeen=7;s.thiefKills=5;window.__headless=false;document.getElementById('bCodex').click()});await p.waitForTimeout(800);
 await p.screenshot({path:'codex_thief.png'});console.log(errs);await b.close()})();
