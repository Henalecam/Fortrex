const { chromium } = require('playwright');const path=require('path');
(async()=>{const W=+(process.argv[2]||390),H=+(process.argv[3]||844);const browser=await chromium.launch({args:['--use-gl=swiftshader','--enable-unsafe-swiftshader']});
 const ctx=await browser.newContext({viewport:{width:W,height:H},hasTouch:true,isMobile:true});const page=await ctx.newPage();const cdp=await ctx.newCDPSession(page);
 const errs=[];page.on('pageerror',e=>errs.push('PE '+e.message));page.on('console',m=>{if(m.type()==='error')errs.push('CE '+m.text().slice(0,160))});
 const T0=Date.now();const log=(...a)=>console.log(((Date.now()-T0)/1000).toFixed(0)+'s',...a);const issues=[];
 const shot=async n=>{await page.screenshot({path:`first_${W}_${n}.png`})};
 const touch=async(type,pts)=>cdp.send('Input.dispatchTouchEvent',{type,touchPoints:pts.map(([x,y],i)=>({x,y,id:i}))});
 const drag=async(pts0,pts1,steps=8)=>{await touch('touchStart',pts0);for(let k=1;k<=steps;k++){await touch('touchMove',pts0.map((p,i)=>[p[0]+(pts1[i][0]-p[0])*k/steps,p[1]+(pts1[i][1]-p[1])*k/steps]));await page.waitForTimeout(30)}await touch('touchEnd',[]);await page.waitForTimeout(200)};
 const small=()=>page.evaluate(()=>{const o=[];for(const e of document.querySelectorAll('button,[role=button],.tab')){if(!e.offsetParent)continue;const r=e.getBoundingClientRect();if(r.width<1)continue;if(r.width<36||r.height<36)o.push((e.id||e.textContent.trim().slice(0,14))+` ${Math.round(r.width)}×${Math.round(r.height)}`)}return o});
 const over=()=>page.evaluate(()=>{const W=document.documentElement.clientWidth;const o=[];for(const e of document.querySelectorAll('body *')){if(!e.offsetParent)continue;const r=e.getBoundingClientRect();if(r.width&&(r.right>W+1||r.left<-1))o.push((e.id||String(e.className)||e.tagName).slice(0,24)+`:${Math.round(r.left)}-${Math.round(r.right)}`)}return o.slice(0,10)});
 await page.goto('file://'+path.join(__dirname,'three/p5m.html'));await page.waitForTimeout(1500);await shot('0title');
 log('title small targets',JSON.stringify(await small()));
 // tutorial
 if(await page.$('#tutBtn')){await page.tap('#tutBtn');await page.waitForTimeout(500);for(let k=0;k<8;k++){const t=await page.evaluate(()=>{const e=document.getElementById('tut');if(!e||e.hidden||getComputedStyle(e).display==='none')return null;const r=e.getBoundingClientRect();return {txt:e.innerText.slice(0,120).replace(/\n/g,' | '),top:Math.round(r.top),bot:Math.round(r.bottom),sh:e.scrollHeight,ch:e.clientHeight}});if(!t)break;log('tut',k,JSON.stringify(t));if(t.bot>H||t.top<0)issues.push('tutorial box off-screen step '+k);if(k===0)await shot('1tut');const nx=await page.$('#tutNext');if(!nx||!(await nx.isVisible()))break;await page.tap('#tutNext');await page.waitForTimeout(400)}}
 const st=await page.evaluate(()=>window.__st().running);log('running after tutorial',st);
 if(!st){await page.tap('#start');await page.waitForTimeout(1200)}
 await shot('2start');log('game small targets',JSON.stringify(await small()));log('overflow',JSON.stringify(await over()));
 // camera gestures
 const c0=await page.evaluate(()=>window.__cam());await drag([[W*.5,H*.4]],[[W*.8,H*.4]]);const c1=await page.evaluate(()=>window.__cam());log('1-finger drag cam',JSON.stringify(c0),'->',JSON.stringify(c1));if(c0.yaw===c1.yaw)issues.push('1-finger drag did not rotate');
 await drag([[W*.4,H*.45],[W*.6,H*.45]],[[W*.3,H*.45],[W*.7,H*.45]]);const c2=await page.evaluate(()=>window.__cam());log('pinch out',JSON.stringify(c2));await shot('2a_pinch');if(c2.d>=c1.d)issues.push('pinch out did not zoom in');
 await drag([[W*.4,H*.45],[W*.6,H*.45]],[[W*.4,H*.3],[W*.6,H*.3]]);const c3=await page.evaluate(()=>window.__cam());log('2-finger pan',JSON.stringify(c3));if(c3.x===c2.x&&c3.z===c2.z)issues.push('2-finger drag did not pan');
 const yawSame=c3.yaw===c2.yaw;log('yaw unchanged during 2-finger',yawSame);if(!yawSame)issues.push('2-finger gesture also rotated camera');
 await page.tap('#camHome').catch(e=>log('camHome tap fail',e.message.slice(0,80)));await page.waitForTimeout(300);log('after camHome',JSON.stringify(await page.evaluate(()=>window.__cam())));await shot('2b_home');
 // build by dragging
 await page.tap('#bBuild');await page.waitForTimeout(500);await shot('3build');await page.waitForTimeout(1500);await shot('3build_b');log('cam at build',JSON.stringify(await page.evaluate(()=>window.__cam())));const b0=await page.evaluate(()=>window.__mem().blue);
 await page.tap('.tab:nth-child(1)').catch(()=>{});
 await drag([[W*.35,H*.3]],[[W*.65,H*.3]],10);const b1=await page.evaluate(()=>window.__mem().blue);log('drag-build blue',b0,'->',b1);if(b1-b0<2)issues.push(`drag to build placed ${b1-b0} blocks`);
 await drag([[W*.4,H*.25],[W*.6,H*.25]],[[W*.3,H*.25],[W*.7,H*.25]]);const b2=await page.evaluate(()=>window.__mem().blue);log('pinch while building blue',b1,'->',b2);if(b2!==b1)issues.push('pinch in build mode placed blocks');
 await shot('4built');await page.tap('#buildClose');await page.waitForTimeout(300);
 // first wave
 await page.tap('#next');await page.waitForTimeout(500);await page.evaluate(()=>window.__step(8));await shot('5wave');log('wave toasts/tips',JSON.stringify(await page.evaluate(()=>[...document.querySelectorAll('#toasts > *, #ftip')].filter(e=>e.offsetParent).map(e=>e.innerText.slice(0,80)))));
 await page.evaluate(()=>{for(let i=0;i<30&&window.__st().phase==='wave';i++)window.__step(4)});await page.waitForTimeout(600);await shot('6rest');
 log('rest small',JSON.stringify(await small()));log('rest overflow',JSON.stringify(await over()));
 log('ISSUES',JSON.stringify(issues,null,1));log('ERRS',JSON.stringify(errs));await browser.close()})();
