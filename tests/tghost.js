const { chromium } = require('playwright');const path=require('path');
(async()=>{const b=await chromium.launch({args:['--use-gl=swiftshader','--enable-unsafe-swiftshader']});const p=await b.newPage();const errs=[];p.on('pageerror',e=>errs.push(e.message));await p.addInitScript(()=>{window.__headless=true});await p.goto('file://'+path.join(__dirname,'three/p5.html'),{timeout:120000});await p.waitForTimeout(700);
 console.log(JSON.stringify(await p.evaluate(()=>{document.getElementById('start').click();window.__step(1);return window.__ghost()})));console.log(errs);await b.close()})();
