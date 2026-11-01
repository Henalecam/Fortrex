const { chromium } = require('playwright');const path=require('path');const fs=require('fs');
(async()=>{const browser=await chromium.launch({args:['--use-gl=swiftshader','--enable-unsafe-swiftshader']});const page=await browser.newPage();
 const fx=fs.readFileSync('/home/claude/fortrex/tests/save_v78_w31.json','utf8');await page.addInitScript(s=>{window.__headless=true;window.__freeze=true;localStorage.setItem('fortrex_save_v1',s)},fx);
 await page.goto('file://'+path.join(__dirname,'three/p5econ.html'));await page.waitForTimeout(800);
 console.log(JSON.stringify(await page.evaluate(()=>{document.getElementById('continue').click();window.__step(.3);return window.__hiStats()})));await browser.close()})();
