const { chromium } = require('playwright');const path=require('path');
(async()=>{const b=await chromium.launch({args:['--use-gl=swiftshader','--enable-unsafe-swiftshader']});const p=await b.newPage({viewport:{width:640,height:420}});const errs=[];p.on('pageerror',e=>errs.push(e.message));
 await p.addInitScript(()=>{window.__headless=true;try{localStorage.setItem('fortrex_tips','{"start":1,"auto":1,"shop":1,"build":1,"wave":1,"realm":1,"ward":1,"sappers":1,"bomb":1,"mason":1,"save":1}')}catch(e){}});await p.goto('file://'+path.join(__dirname,'three/p5.html'));await p.waitForTimeout(700);
 const T=(process.env.T||'flyer').split(','),X=+(process.env.X||168),Z=+(process.env.Z||60),D=+(process.env.D||7),P=+(process.env.P||.45);
 await p.evaluate(([T,X,Z,D,P])=>{document.getElementById('start').click();window.__step(1);window.__clearArea(X-12,X+12,Z-8,Z+8);const es=window.__spawnLook(T,T.length,X,Z);for(const e of es){e.hp=e.maxhp=1e9;e.stun=1e9;if(e.fly)e.group.position.y=e.gy+1.6}window.__camSet(D,X+(T.length-1)*1.1,Z,0,P);window.__headless=false},[T,X,Z,D,P]);
 await p.waitForTimeout(800);for(let k=0;k<12;k++){await p.screenshot({path:`wf_${k}.png`});await p.waitForTimeout(40)}
 console.log(errs);await b.close()})();
