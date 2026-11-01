const { chromium } = require('playwright');const path=require('path');
(async()=>{const W=+(process.argv[2]||1280),H=+(process.argv[3]||800);const tag=W+'x'+H;const browser=await chromium.launch({args:['--use-gl=swiftshader','--enable-unsafe-swiftshader']});
 const page=await browser.newPage({viewport:{width:W,height:H},hasTouch:!!process.env.TOUCH,isMobile:!!process.env.TOUCH});const errs=[];page.on('pageerror',e=>errs.push('PE '+e.message));page.on('console',m=>{if(m.type()==='error')errs.push('CE '+m.text().slice(0,160))});
 const issues=[];const T0=Date.now();const log=(...a)=>console.log(tag,((Date.now()-T0)/1000).toFixed(1)+'s',...a);
 await page.goto('file://'+path.join(__dirname,'three/p5.html'));await page.waitForTimeout(1500);
 const vis=()=>page.evaluate(()=>{const ids=['buildPanel','arsenal','shop','codex','realm','hire','merchPanel','news','over','tut','rewardBox','autoPop'];const o=[];for(const id of ids){const e=document.getElementById(id);if(!e)continue;const cs=getComputedStyle(e);if(cs.display!=='none'&&cs.visibility!=='hidden'&&!e.hidden&&e.offsetParent!==null||(e.classList&&e.classList.contains('open')))o.push(id)}return o});
 const occl=(sel)=>page.evaluate(sel=>{const e=document.querySelector(sel);if(!e)return {missing:1};const r=e.getBoundingClientRect();if(!r.width)return {hidden:1};const cx=r.left+r.width/2,cy=r.top+r.height/2;if(cx<0||cy<0||cx>innerWidth||cy>innerHeight)return {offscreen:[Math.round(cx),Math.round(cy)]};const t=document.elementFromPoint(cx,cy);const ok=t&&(t===e||e.contains(t));return ok?{ok:1,x:cx,y:cy}:{blocked:(t?(t.id||t.className||t.tagName):'none').toString().slice(0,40),x:cx,y:cy}},sel);
 const click=async(sel,name)=>{const o=await occl(sel);if(!o.ok){issues.push(`${name||sel}: ${JSON.stringify(o)}`);log('ISSUE',name||sel,JSON.stringify(o));return false}await page.mouse.click(o.x,o.y);await page.waitForTimeout(250);return true};
 const shot=async n=>{await page.screenshot({path:`play_${tag}_${n}.png`})};
 // intro / news
 log('start-visible',JSON.stringify(await vis()));
 for(const id of ['newsOk']){const o=await occl('#'+id);if(o.ok){issues.push('news modal shown over title for a NEW player');await click('#'+id,id)}}
 await click('#start','start');await page.waitForTimeout(1200);log('after start',JSON.stringify(await vis()));
 for(const id of ['tutSkip','newsOk']){const o=await occl('#'+id);if(o.ok){await click('#'+id,id);log('closed',id)}}
 await shot('0start');
 // side panels
 for(const b of ['bBuild','bArs','bHire','bShop','bRealm','bCodex']){const before=await vis();const ok=await click('#'+b,b);await page.waitForTimeout(300);const after=await vis();log(b,'open->',JSON.stringify(after));if(ok&&JSON.stringify(after)===JSON.stringify(before))issues.push(`${b}: click changed nothing (${JSON.stringify(before)})`);
   if(after.length>1)issues.push(`${b}: ${after.length} panels at once ${JSON.stringify(after)}`);
   if(b==='bShop')await shot('1shop');if(b==='bBuild')await shot('1build');
   // close: click again
   const closer={bBuild:'#buildClose',bArs:'#arsClose',bShop:'#shopClose',bCodex:'#codexClose',bRealm:'#realmClose'}[b];const tg=await occl('#'+b);if(b==='bRealm'||(!tg.ok&&closer))await click(closer,b+' closer');else await click('#'+b,b+' (close)');await page.waitForTimeout(300);const closed=await vis();if(closed.length)issues.push(`${b}: still open after 2nd click ${JSON.stringify(closed)}`)}
 // cross: open two panels in sequence
 for(const [a,b] of [['bHire','bShop'],['bShop','bHire'],['bBuild','bArs'],['bArs','bCodex'],['bHire','bBuild']]){await click('#'+a,a);await click('#'+b,b);const v=await vis();const ov=await page.evaluate(v=>{const R=v.map(id=>document.getElementById(id).getBoundingClientRect());if(R.length<2)return 0;const a=R[0],b=R[1];return Math.max(0,Math.min(a.right,b.right)-Math.max(a.left,b.left))*Math.max(0,Math.min(a.bottom,b.bottom)-Math.max(a.top,b.top))},v);log('cross',a,b,JSON.stringify(v),'overlap px²',Math.round(ov));if(v.length>1&&ov>0)issues.push(`cross ${a}->${b}: ${JSON.stringify(v)} overlap ${Math.round(ov)}px²`);if(v.length>1&&ov>0)await shot('x_'+a+'_'+b);for(const id of v){const m={buildPanel:'#buildClose',arsenal:'#arsClose',shop:'#shopClose',codex:'#codexClose',hire:'#bHire'}[id];if(m)await click(m,id+' close')}}
 // shop buy
 await click('#bShop','bShop');await page.waitForTimeout(300);const m0=await page.evaluate(()=>window.__st().material);
 const bought=await page.evaluate(()=>{const s=document.getElementById('shop');const b=[...s.querySelectorAll('button')].find(x=>!x.disabled&&x.offsetParent&&!x.classList.contains('tab')&&!/close|fechar|×/i.test(x.id+x.textContent)&&/\d/.test(x.textContent));if(!b)return null;const r=b.getBoundingClientRect();return {x:r.left+r.width/2,y:r.top+r.height/2,t:b.textContent.trim().slice(0,40)}});
 if(bought){const t=await page.evaluate(([x,y])=>{const e=document.elementFromPoint(x,y);return e&&(e.id||e.className||e.tagName)},[bought.x,bought.y]);await page.mouse.click(bought.x,bought.y);await page.waitForTimeout(300);const m1=await page.evaluate(()=>window.__st().material);log('shop buy',bought.t,'mat',m0,'->',m1,'topEl',t);if(m1===m0)issues.push('shop: buy click did not spend material: '+bought.t)}else issues.push('shop: no enabled buy button');
 await click('#shopClose','shopClose');
 // build: place a block on the ground near the castle
 await click('#bBuild','bBuild');await page.waitForTimeout(300);const v0=await page.evaluate(()=>window.__st().material);
 const bl0=await page.evaluate(()=>window.__mem().blue);const pts=W<700?[[.5,.45],[.6,.5],[.45,.55]]:[[.55,.62],[.7,.62],[.62,.75]];for(const [fx,fy] of pts){const top=await page.evaluate(([x,y])=>{const e=document.elementFromPoint(x,y);return e&&(e.id||e.tagName)},[W*fx,H*fy]);await page.mouse.click(W*fx,H*fy);await page.waitForTimeout(250);log('build click at',fx,fy,'top',top)}
 const v1=await page.evaluate(()=>window.__st().material);const bl1=await page.evaluate(()=>window.__mem().blue);log('build clicks mat',v0,'->',v1,'blue',bl0,'->',bl1);if(bl1===bl0&&v1===v0)issues.push('build: 3 map clicks placed nothing');await shot('2build');
 await click('#buildClose','buildClose');
 // call wave, speed
 await click('#next','next');await page.waitForTimeout(500);const ph=await page.evaluate(()=>window.__st().phase);log('phase after next',ph);if(ph!=='wave')issues.push('next: wave did not start');
 const sp0=await page.evaluate(()=>document.getElementById('speed').textContent);await click('#speed','speed');const sp1=await page.evaluate(()=>document.getElementById('speed').textContent);log('speed',sp0,'->',sp1);if(sp0===sp1)issues.push('speed: label unchanged');
 // bomb
 await page.waitForTimeout(2500);const b0=await page.evaluate(()=>window.__st().material);await click('#bomb','bomb');await page.mouse.click(W*.5,H*.35);await page.waitForTimeout(400);const b1=await page.evaluate(()=>window.__st().material);log('bomb mat',b0,'->',b1);await shot('3wave');
 // finish wave quickly
 await page.evaluate(()=>{for(let i=0;i<40&&window.__st().phase==='wave';i++){window.__step(5)}});await page.waitForTimeout(800);
 const offer=await page.evaluate(()=>{const b=document.getElementById('bless');return b.hidden?null:b.className});log('bless panel',offer);await shot('4rest');
 if(offer==='offer'){const ok=await click('#bless .bc button','bless choice');const st=await page.evaluate(()=>({b:window.__st().bless,m:window.__st().merch}));log('chose',JSON.stringify(st))}
 // generic sweep: every visible button not covered
 const cov=await page.evaluate(()=>{const out=[];for(const e of document.querySelectorAll('button')){if(!e.offsetParent)continue;const r=e.getBoundingClientRect();if(r.width<4)continue;const cx=r.left+r.width/2,cy=r.top+r.height/2;if(cx<0||cy<0||cx>innerWidth||cy>innerHeight){out.push((e.id||e.textContent.trim().slice(0,12))+' offscreen');continue}const t=document.elementFromPoint(cx,cy);if(!(t===e||e.contains(t)))out.push((e.id||e.textContent.trim().slice(0,12))+' covered by '+(t?(t.id||String(t.className).slice(0,20)||t.tagName):'none'))}return out});
 for(const c of cov)issues.push('sweep: '+c);
 log('ISSUES',issues.length,JSON.stringify(issues,null,1));log('ERRS',JSON.stringify(errs));await browser.close()})();
