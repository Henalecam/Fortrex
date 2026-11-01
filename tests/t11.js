const { chromium } = require('playwright');const path=require('path');
(async()=>{const browser=await chromium.launch({args:['--use-gl=swiftshader','--enable-unsafe-swiftshader']});const page=await browser.newPage();
 await page.addInitScript(()=>{window.__headless=true});const errs=[];page.on('pageerror',e=>errs.push(e.message+' '+(e.stack||'').split('\n')[1]));
 await page.goto('file://'+path.join(__dirname,'three/p5.html'));await page.waitForTimeout(600);
 const r=await page.evaluate(()=>{document.getElementById('start').click();window.__step(5);const o=[];o.push(window.__rdbg('next'));window.__step(2);o.push(window.__rdbg(0));o.push(window.__rdbg('win'));window.__step(40);o.push(window.__rdbg(0));o.push(window.__rdbg('next'));window.__step(2);o.push(window.__rdbg(0));return o.join('\n')});
 console.log(r,errs);await browser.close()})();
