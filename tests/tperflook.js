const { chromium } = require('playwright');const path=require('path');
(async()=>{const b=await chromium.launch({args:['--use-gl=swiftshader','--enable-unsafe-swiftshader']});const p=await b.newPage({viewport:{width:1280,height:800}});
 await p.addInitScript(()=>{window.__headless=true});await p.goto('file://'+path.join(__dirname,'three/p5.html'));await p.waitForTimeout(700);
 await p.evaluate(()=>{document.getElementById('start').click();window.__step(1)});
 const TS=(process.env.LT||'goblin,brute,shaman,sapper,imp,climber').split(',');const N=+(process.env.N||120),D=+(process.env.D||30);
 for(const rep of [0,1,2,3])for(const old of [1,0,]){const r=await p.evaluate(([old,N,D,TS])=>{window.__oldLook=old;const ts=TS;const es=window.__spawnLook(ts,N);window.__camSet(D,118,96,0,.6);window.__headless=false;const rm=[];for(let k=0;k<3;k++)rm.push(window.__renderMs(5));const ri=window.__renderInfo();window.__headless=true;window.__killLook(es);return {old,calls:ri.calls,rm:rm.sort((a,b)=>a-b)[1]}},[old,N,D,TS]);console.log(JSON.stringify(r))}
 await b.close()})();
