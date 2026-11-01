const { chromium } = require('playwright');const fs=require('fs');const path=require('path');
const html=fs.readFileSync('/home/claude/fortrex/index.html','utf8').replace(/<script src="https:\/\/cdnjs[^"]+"><\/script>/,'<script src="three.min.js"></script>').replace(/<link rel="stylesheet"[^>]+>/,'')
 .replace("function damageVox(i,d,fromEnemy){if(!vox[i])return false;const mat=vox[i];","function damageVox(i,d,fromEnemy){if(!vox[i])return false;const mat=vox[i];if(mat===5&&hp[i]-d<=0)console.log('CHEST_DMG',d,new Error().stack.split('\\n').slice(1,5).join(' | '));");
fs.writeFileSync(path.join(__dirname,'three/trace.html'),'<!doctype html><html><head><meta charset="utf-8"></head><body>'+html+'</body></html>');
(async()=>{const browser=await chromium.launch();const page=await browser.newPage();await page.addInitScript(()=>{window.__headless=true});
page.on('console',m=>{const t=m.text();if(/CHEST|rror/.test(t))console.log(t.slice(0,400))});page.on('pageerror',e=>console.log('PAGEERR',e.message));
await page.goto('file://'+path.join(__dirname,'three/trace.html'));await page.waitForTimeout(500);await page.click('#start');await page.click('#next');
for(let t=0;t<60;t+=10){await page.evaluate((t)=>{if(t===10){window.__bomb(8,20);window.__bomb(20,8)}if(t===30){window.__buy('mortar');window.__buy('greek')}window.__step(10)},t);const c=await page.evaluate(()=>window.__dbg().chest);console.log('t',t+10,'chest',c);if(c===0)break;}
await browser.close()})();
