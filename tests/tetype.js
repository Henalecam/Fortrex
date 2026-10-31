const { chromium } = require('playwright');const path=require('path');
(async()=>{const W=+(process.argv[2]||5);const types=(process.argv[3]||'crawler,wolf,spider,slime,imp,brute,beetle,climber,sapper,ram,flyer,shaman,goblin,escudeiro,cavador,bombardeiro,mimico,cristal,cavaleiro').split(',');
 const browser=await chromium.launch({args:['--use-gl=swiftshader','--enable-unsafe-swiftshader']});
 for(const t of types){const page=await browser.newPage();const errs=[];page.on('pageerror',e=>errs.push(e.message));await page.addInitScript(()=>{window.__headless=true});await page.goto('file://'+path.join(__dirname,'three/p5.html'));await page.waitForTimeout(400);
  const r=await page.evaluate(([t,W,N])=>{document.getElementById('start').click();window.__step(1);window.__chestDmg={};window.__etest(t,W,N);let s;for(let i=0;i<45;i++){window.__step(2);s=window.__etStat();if(s.alive===0)break}s.cd=Object.entries(window.__chestDmg).map(([k,v])=>k+':'+Math.round(v)).join(' ');return s},[t,W,+(process.env.N||6)]);
  console.log(t.padEnd(12),JSON.stringify(r),errs.length?errs[0]:'');await page.close()}await browser.close()})();
