const { chromium } = require('playwright');const path=require('path');
(async()=>{const browser=await chromium.launch({args:['--use-gl=swiftshader','--enable-unsafe-swiftshader']});const page=await browser.newPage();
 await page.addInitScript(()=>{window.__headless=true});await page.goto('file://'+path.join(__dirname,'three/p5.html'));await page.waitForTimeout(700);
 console.log(await page.evaluate(()=>{document.getElementById('start').click();document.getElementById('auto').click();const W={};let t=0;
  while(t<1200){window.__bot();for(let k=0;k<5;k++){window.__step(2);t+=2;const y=window.__why();const w=y.w;W[w]=W[w]||{saved:false,block:{}};if(y.sw===w)W[w].saved=true;else if(y.ph==='rest'){const r=y.ch?'choosing':y.b?'battle':y.q?'quest':y.c?'caravan':y.e?'enemies':'other';W[w].block[r]=(W[w].block[r]||0)+2}}}
  return Object.entries(W).map(([w,o])=>w+':'+(o.saved?'ok':'NO '+JSON.stringify(o.block))).join(' | ')}));await browser.close()})();
