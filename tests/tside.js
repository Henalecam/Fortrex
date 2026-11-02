const { chromium } = require('playwright');const path=require('path');
(async()=>{const b=await chromium.launch({args:['--use-gl=swiftshader','--enable-unsafe-swiftshader']});const p=await b.newPage({viewport:{width:1280,height:800}});const errs=[];p.on('pageerror',e=>errs.push(e.message));
 await p.addInitScript(()=>{window.__headless=true;try{localStorage.setItem('fortrex_tips','{"start":1,"auto":1,"shop":1,"build":1,"wave":1,"realm":1,"ward":1,"sappers":1,"bomb":1,"mason":1,"save":1}')}catch(e){}});await p.goto('file://'+path.join(__dirname,'three/p5.html'));await p.waitForTimeout(700);
 const c=(process.env.CAM||'14,96,100,0,.45').split(',').map(Number);const X=+(process.env.X||90),Z=+(process.env.Z||103);
 console.log(await p.evaluate(([c,X,Z])=>{document.getElementById('start').click();window.__step(3);const es=window.__spawnLook(['goblin','brute','imp','knight','wolf','archer'],6,X,Z);for(const e of es)e.stun=999;window.__camSet(c[0],c[1],c[2],c[3],c[4]);window.__headless=false;return es.length},[c,X,Z]));
 await p.waitForTimeout(500);await p.screenshot({path:process.env.OUT||'side.png',timeout:120000});console.log(errs);await b.close()})();
