const { chromium } = require('playwright');const path=require('path');
(async()=>{const b=await chromium.launch({args:['--use-gl=swiftshader','--enable-unsafe-swiftshader']});const p=await b.newPage({viewport:{width:1280,height:800}});const errs=[];p.on('pageerror',e=>errs.push(e.message));
 await p.addInitScript(()=>{window.__headless=true;try{localStorage.setItem('fortrex_tips','{"start":1,"auto":1,"shop":1,"build":1,"wave":1,"realm":1,"ward":1,"sappers":1,"bomb":1,"mason":1,"save":1}')}catch(e){}});await p.goto('file://'+path.join(__dirname,'three/p5.html'));await p.waitForTimeout(700);
 const r=await p.evaluate(()=>{document.getElementById('start').click();window.__step(1);const es=window.__spawnLook(['tecelao','tecelao'],2,100,126);for(const e of es){e.hp=e.maxhp=1e9;e.stun=0;e.lineup=false}for(let k=0;k<40;k++)window.__step(.5);const w=window.__webbed();return w.length?[w[0][0],w[0][1],w.length]:null});
 console.log(r);if(r){await p.evaluate((r)=>{window.__camSet(34,r[0]-6,r[1]-6,0.4,1.1);window.__headless=false},r);await p.waitForTimeout(900);await p.screenshot({path:'web_game.png'})}
 console.log(errs);await b.close()})();
