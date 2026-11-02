const { chromium } = require('playwright');const path=require('path');
(async()=>{const b=await chromium.launch({args:['--use-gl=swiftshader','--enable-unsafe-swiftshader']});const p=await b.newPage({viewport:{width:1280,height:800}});const errs=[];p.on('pageerror',e=>errs.push(e.message));
 await p.addInitScript(()=>{window.__headless=true;window.__botPlus=true});await p.goto('file://'+path.join(__dirname,'three/p5.html'));await p.waitForTimeout(700);
 await p.evaluate(()=>{document.getElementById('start').click();document.getElementById('auto').click();window.__forceEv='ladrao'});
 let shot=0;for(let t=0;t<200;t+=5){const r=await p.evaluate(()=>{window.__bot();window.__step(5);const th=(window.__dbgEnemies?window.__dbgEnemies():null);const s=window.__st();return {w:s.wave,ph:s.phase,seen:s.thiefSeen||0,kills:s.thiefKills||0}});
  if(!shot&&r.ph==='wave'&&r.seen>0){const pos=await p.evaluate(()=>{const e=window.__thiefPos&&window.__thiefPos();return e});if(pos){await p.evaluate(([x,z])=>{window.__camSet(16,x,z,0,.6);window.__headless=false;window.__step(.05)},pos);await p.waitForTimeout(1500);await p.screenshot({path:'thief_game.png',timeout:120000});await p.evaluate(()=>{window.__headless=true});shot=1}}
  if(t%60===55)console.log(JSON.stringify(r))}
 console.log(errs.slice(0,3));await b.close()})();
