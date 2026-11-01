const { chromium } = require('playwright');const path=require('path');
(async()=>{const browser=await chromium.launch({args:['--use-gl=swiftshader','--enable-unsafe-swiftshader']});const page=await browser.newPage();
 await page.addInitScript(()=>{window.__headless=true});const errs=[];page.on('pageerror',e=>errs.push(e.message+' '+(e.stack||'').split('\n')[1]));
 await page.goto('file://'+path.join(__dirname,'three/p5.html'));await page.waitForTimeout(600);
 await page.evaluate(()=>{document.getElementById('start').click();document.getElementById('auto').click()});
 const secs=+(process.argv[2]||300),bat=+(process.argv[3]||100);
 for(let t=0;t<secs;t+=20){const r=await page.evaluate(([t,bat])=>{window.__bot();let s='';if(t===0)window.__lootTrace();if(t===bat)s=window.__rdbg('next');if(t>bat&&t%60===0)window.__rdbg(60);window.__step(20);const d=window.__dbg();return `t=${t+20} w=${d.wave} chest=${d.chest} mat=${d.mat} en=${d.enemies} ${s} `+window.__rdbg(0)+' '+JSON.stringify(window.__lt)},[t,bat]);console.log(r);if(errs.length)break}
 console.log(errs.slice(0,5));await browser.close()})();
