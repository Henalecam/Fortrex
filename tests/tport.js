const { chromium } = require('playwright');const path=require('path');
(async()=>{const browser=await chromium.launch({args:['--use-gl=swiftshader','--enable-unsafe-swiftshader']});const page=await browser.newPage({viewport:{width:1280,height:800}});const errs=[];page.on('pageerror',e=>errs.push(e.message));
 await page.addInitScript(()=>{window.__headless=true;window.__lineupTypes=['brute','portador','wolf','escudeiro'];try{localStorage.setItem('fortrex_tips','{"start":1,"auto":1,"shop":1,"build":1,"wave":1,"realm":1,"ward":1,"sappers":1,"bomb":1,"mason":1,"save":1}')}catch(e){}});await page.goto('file://'+path.join(__dirname,'three/p5.html'));await page.waitForTimeout(700);
 const mode=process.argv[2]||'s';
 console.log(await page.evaluate((mode)=>{document.getElementById('start').click();window.__step(1);const r=mode==='b'?window.__lineupB():window.__lineup();window.__step(.3);if(mode==='h'){window.__hitAll(.5);window.__step(.15)}return r},mode));
 await page.evaluate((mode)=>{window.__cam(18,132,96);window.__headless=false},mode);await page.waitForTimeout(500);await page.screenshot({path:'line_port.png',timeout:120000});console.log(errs);await browser.close()})();
