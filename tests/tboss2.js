const { chromium } = require('playwright');const path=require('path');
(async()=>{const browser=await chromium.launch({args:['--use-gl=swiftshader','--enable-unsafe-swiftshader']});const page=await browser.newPage({viewport:{width:1280,height:800}});const errs=[];page.on('pageerror',e=>errs.push(e.message));
 await page.addInitScript(()=>{window.__headless=true;try{localStorage.setItem('fortrex_tips','{"start":1,"auto":1,"shop":1,"build":1,"wave":1,"realm":1,"ward":1,"sappers":1,"bomb":1,"mason":1,"save":1,"saboteur":1,"affix":1}')}catch(e){}});await page.goto('file://'+path.join(__dirname,'three/p5.html'));await page.waitForTimeout(700);
 const t=process.argv[2]||'boss';
 console.log(await page.evaluate((t)=>{document.getElementById('start').click();window.__step(1);document.getElementById('next').click();window.__step(.5);const b=window.__bossX(t,20);const log=[];let shot=false;
  for(let i=0;i<24;i++){window.__step(.25);const s=window.__bossSt();if(!s)break;if(i===30){for(const e of []);}log.push(s.ph+(s.mv?s.mv[0]:'.'));if(i===40||i===70)window.__hitBoss(.36);if(s.mv&&s.mv!=='slam'&&i>75&&!shot||s.mv==='slam'&&i>90&&!shot){shot=true;break}}
  return JSON.stringify([b,log.join(' ')])},t));
 await page.evaluate(()=>{const s=window.__bossSt();const e=window.__bpos();window.__cam(30,e.x,e.z);window.__headless=false});await page.waitForTimeout(400);await page.screenshot({path:'boss_'+t+'.png',timeout:120000});console.log(errs);await browser.close()})();
