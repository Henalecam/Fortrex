const { chromium } = require('playwright');const path=require('path');
(async()=>{const b=await chromium.launch({args:['--use-gl=swiftshader','--enable-unsafe-swiftshader','--autoplay-policy=no-user-gesture-required']});const p=await b.newPage();const errs=[];p.on('pageerror',e=>errs.push(e.message));
await p.goto('file://'+path.join(__dirname,'three/p5.html'));await p.waitForTimeout(800);await p.evaluate(()=>document.getElementById('start').click());await p.waitForTimeout(8000);console.log(await p.evaluate(()=>typeof AudioContext));console.log(errs);await b.close()})();
