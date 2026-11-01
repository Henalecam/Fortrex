const { chromium } = require('playwright');const path=require('path');
(async()=>{const browser=await chromium.launch({args:['--use-gl=swiftshader','--enable-unsafe-swiftshader']});const page=await browser.newPage({viewport:{width:1280,height:800}});const errs=[];page.on('pageerror',e=>errs.push(e.message));
 await page.addInitScript(()=>{window.__headless=true;try{localStorage.setItem('fortrex_tips','{"start":1,"auto":1,"shop":1,"build":1,"mason":1,"wave":1,"oil":1}')}catch(e){}});await page.goto('file://'+path.join(__dirname,'three/p5.html'));await page.waitForTimeout(700);
 console.log(await page.evaluate(()=>{document.getElementById('start').click();window.__step(2);const n=window.__hunt();window.__step(1);return 'alpha='+n}));
 await page.evaluate(()=>{window.__headless=false});await page.waitForTimeout(2000);await page.screenshot({path:'hunt.png',timeout:120000});await page.evaluate(()=>{window.__headless=true});
 console.log(await page.evaluate(()=>{window.__step(150);const w=window.__why();return 'after90 alive='+w.e+' sw='+w.sw}));console.log(errs);await browser.close()})();
