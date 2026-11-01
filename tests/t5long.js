// Fortrex v0.5+ headless harness: node t5.js <secs> [render]
const { chromium } = require('playwright');const fs=require('fs');const path=require('path');
const html=fs.readFileSync('/home/claude/fortrex/index.html','utf8').replace(/<script src="https:\/\/cdnjs[^"]+"><\/script>/,'<script src="three.min.js"></script>').replace(/<link rel="stylesheet"[^>]+>/,'');
fs.writeFileSync(path.join(__dirname,'three/p5long.html'),'<!doctype html><html><head><meta charset="utf-8"></head><body>'+html+'</body></html>');
(async()=>{const secs=+(process.argv[2]||60);const browser=await chromium.launch({args:['--use-gl=swiftshader','--enable-unsafe-swiftshader']});const page=await browser.newPage({viewport:{width:1280,height:800}});
 if(!process.argv.includes('render'))await page.addInitScript(()=>{window.__headless=true});
 const errs=[];page.on('pageerror',e=>errs.push('PAGE '+e.message+' '+(e.stack||'').split('\n')[1]));page.on('console',m=>{if(m.type()==='error')errs.push(m.text())});
 await page.goto('file://'+path.join(__dirname,'three/p5long.html'));await page.waitForTimeout(600);
 await page.evaluate(()=>{document.getElementById('start').click();document.getElementById('auto').click()});
 const t0=Date.now();
 for(let t=0;t<secs;t+=10){const bot=await page.evaluate(()=>{const b=window.__bot();window.__step(10);return b});if(bot)console.log('  bot:',bot);const d=await page.evaluate(()=>window.__dbg());
   const roles={};for(const m of d.minions){const r=m.split(':')[0];roles[r]=(roles[r]||0)+1}const st={};for(const m of d.minions){const s=m.split(':')[1];st[s]=(st[s]||0)+1}
   if(d.plan>20)console.log("  plan:",d.planS);const F=await page.evaluate(()=>window.__fame?JSON.stringify(window.__fame()):'');console.log(F+` t=${t+10} w=${d.wave} mat=${d.mat} chest=${d.chest} en=${d.enemies}+${d.queue} kills=${d.kills} loot=${d.loot}/${d.lootFree} arm=${d.armory} plan=${d.plan} ev=${d.ev} tur=${d.turrets.join(',')} roles=${JSON.stringify(roles)} st=${JSON.stringify(st)}`);
   if(errs.length)break;if(d.chest===0){console.log('CHEST DEAD');break}}
 console.log('real secs',(Date.now()-t0)/1000,'errors',errs.slice(0,6));await browser.close()})();
