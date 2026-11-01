const { chromium } = require('playwright');const path=require('path');
(async()=>{const browser=await chromium.launch({args:['--use-gl=swiftshader','--enable-unsafe-swiftshader']});const T0=Date.now();const L=(...a)=>console.log(((Date.now()-T0)/1000).toFixed(1),...a);
 const page=await browser.newPage({viewport:{width:390,height:844},hasTouch:true,isMobile:true});page.on('pageerror',e=>L('PE',e.message));
 L('goto');await page.goto('file://'+path.join(__dirname,'three/'+(process.env.PAGE||'p5.html')+''),{timeout:120000});L('loaded');const info=await page.evaluate(()=>({dpr:devicePixelRatio,w:innerWidth,cw:document.querySelector('canvas').width,ch:document.querySelector('canvas').height}));L(JSON.stringify(info));
 await page.tap('#start');L('tapped');await page.waitForTimeout(2000);L('after wait',JSON.stringify(await page.evaluate(()=>({ph:window.__st().phase,run:window.__st().running}))));await browser.close()})();
