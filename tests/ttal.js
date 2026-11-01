const { chromium } = require('playwright');const path=require('path');const fs=require('fs');
(async()=>{const browser=await chromium.launch({args:['--use-gl=swiftshader','--enable-unsafe-swiftshader']});const page=await browser.newPage({viewport:{width:390,height:844}});const errs=[];page.on('pageerror',e=>errs.push(e.message));
 const fx=fs.readFileSync('/home/claude/fortrex/tests/save_v041_w13.json','utf8');
 await page.addInitScript(s=>{window.__headless=true;localStorage.setItem('fortrex_save_v1',s);localStorage.setItem('fortrex_tips','{"start":1,"auto":1,"shop":1,"build":1,"mason":1,"wave":1,"oil":1,"realm":1,"sappers":1,"hero":1}')},fx);await page.goto('file://'+path.join(__dirname,'three/p5.html'));await page.waitForTimeout(700);
 await page.evaluate(()=>{document.getElementById('continue').click();document.getElementById('newsOk').click()});await page.waitForTimeout(3500);
 console.log(await page.evaluate(()=>{const s=JSON.parse(localStorage.getItem('fortrex_save_v1'));return 'tal='+JSON.stringify(window.__dbgTal&&window.__dbgTal())}));
 await page.evaluate(()=>{window.__headless=false});await page.waitForTimeout(2000);await page.screenshot({path:'herobar.png',timeout:120000});console.log(errs);await browser.close()})();
