const { chromium } = require('playwright');const path=require('path');
(async()=>{const browser=await chromium.launch({args:['--use-gl=swiftshader','--enable-unsafe-swiftshader']});const page=await browser.newPage({viewport:{width:390,height:844}});
 await page.addInitScript(()=>{window.__headless=true});await page.goto('file://'+path.join(__dirname,'three/p5.html'));await page.waitForTimeout(700);
 await page.evaluate(()=>{document.querySelector('[data-bio="neve"]').click();window.__headless=false});await page.waitForTimeout(1500);await page.screenshot({path:'bio.png',timeout:120000});
 console.log(await page.evaluate(()=>{window.__headless=true;document.getElementById('start').click();return window.__dbg().biome||document.querySelector('[data-bio].on').dataset.bio}));await browser.close()})();
