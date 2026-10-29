// ───────── main: waves, events, game flow, input, loop
function waveSpec(w){const list=[];const n=5+Math.floor(w*1.9+(w>10?(w-10)*1.5:0));for(let i=0;i<n;i++)list.push('crawler');for(let i=0;i<Math.floor((w-1)/2+(w>12?(w-12)/2:0));i++)list.push('ram');
  if(w>=3)for(let i=0;i<Math.floor((w-1)/2);i++)list.push('climber');if(w>=4)for(let i=0;i<Math.floor(w/3);i++)list.push('sapper');
  if(w>=6)for(let i=0;i<Math.floor((w-3)/3);i++)list.push('flyer');if(w>=6)for(let i=0;i<Math.floor((w-3)/4);i++)list.push('shaman');
  if(w>12)for(let i=0;i<(w-12)*2;i++)list.push(pick(['crawler','climber','ram','sapper','flyer']));
  shuffle(list);if(w%20===0)list.push('titan');else if(w%15===0)list.push('queen');else if(w%10===0)list.push('colossus');else if(w%5===0)list.push('boss');if(w>=25&&w%5===0)list.push('boss');return list}
const EVENTS={
  elite:{n:'Horda de elite',d:'Devoradores mais fortes e rápidos. Recruta garantido.',css:'r1',w:3},
  mist:{n:'Noite de bruma',d:'Armas enxergam menos; Devoradores surgem perto. Material em dobro.',css:'r1',w:4},
  ambush:{n:'Emboscada',d:'Devoradores surgem dentro da ilha!',css:'r2',w:5},
  meteor:{n:'Chuva de meteoros',d:'Meteoros caem na ilha. Crateras, fogo e loot raro onde caem.',css:'r3',w:6},
  siege:{n:'Cerco',d:'Três hordas seguidas sem descanso. Peça Épica garantida.',css:'r2',w:7},
  storm:{n:'Tempestade',d:'Raios caem na ilha e o vento espalha o fogo. Devoradores na água viram condutores.',css:'r2',w:5},
  golden:{n:'Horda dourada',d:'Todos os Devoradores são Raros ou acima. Curta e brutal.',css:'r3',w:8},
};
function rollEvent(w){if(w<3||w%5===0||Math.random()<.5)return null;return pick(Object.keys(EVENTS).filter(k=>EVENTS[k].w<=w))}
function startWave(){if(state.choosing||state.phase==='wave')return;state.phase='wave';state.wk=0;state.wwound=0;state.ev=state.siege>0?'siege':rollEvent(state.wave);state.queue=waveSpec(state.wave);state.meteorT=3;if(isNight()){for(let k=0;k<Math.ceil(state.queue.length*.25);k++)state.queue.push(pick(['crawler','climber','flyer']));toast('É noite: a bruma vem mais forte','r2')}
  if(state.ev==='siege'&&state.siege===0)state.siege=3;if(state.ev==='golden')state.queue=state.queue.slice(0,Math.ceil(state.queue.length*.5));
  state.spawnT=0;$('report').style.display='none';
  if(state.ev){const E=EVENTS[state.ev];toast(`${E.n}: ${E.d}`,E.css);$('event').style.display='inline-flex';$('event').textContent=E.n+(state.ev==='siege'?` ${4-state.siege}/3`:'');$('event').style.color=`var(--${E.css})`}else $('event').style.display='none';
  const w=state.wave;toast(w%20===0?`Horda ${w}: o TITÃ DE LAVA desperta! Use água e gelo.`:w%15===0?`Horda ${w}: a RAINHA DA BRUMA invoca enxames!`:w%10===0?`Horda ${w}: o COLOSSO chegou. Mire nas pernas!`:w%5===0?`Horda ${w}: um Devorador se aproxima!`:`Horda ${w}`,w%10===0||w%15===0?'r4':w%5===0?'r3':'r0');updateHud()}
function spawnFromQueue(dt){state.spawnT-=dt;if(state.spawnT>0||!state.queue.length)return;state.spawnT=rnd(.2,.55);const type=state.queue.shift();const side=rint(0,3),mg=state.ev==='mist'?6:1;let x,z;
  if(side===0){x=rnd(2,W-2);z=mg}else if(side===1){x=rnd(2,W-2);z=D-mg}else if(side===2){x=mg;z=rnd(2,D-2)}else{x=W-mg;z=rnd(2,D-2)}{const B=battle();if(B&&Math.abs(x-B.cx)<B.wr+6&&Math.abs(z-B.cz)<B.wr+6){x=W-x;z=D-z}}
  if(state.ev==='ambush'&&Math.random()<.5&&!BIG(type)){x=rnd(5,16);z=rnd(5,D-5);if(Math.random()<.5)x=W-x}
  let r=type==='titan'||type==='queen'?Math.max(3,rollRarity(.15)):type==='colossus'?Math.max(2,rollRarity(.1)):type==='boss'?Math.max(1,rollRarity(.05)):rollRarity(state.wave*.004);if(state.ev==='elite')r=Math.min(4,r+1);if(state.ev==='golden')r=Math.max(2,r);
  const e=makeEnemy(type,r,x,z);if(r>=2&&!BIG(type))toast(`${e.T.n} ${RARITY[r].n} apareceu!`,RARITY[r].css)}
function meteorTick(dt){state.meteorT-=dt;if(state.meteorT>0)return;state.meteorT=rnd(2,3.5);const near=Math.random()<.3;const x=near?rnd(WA-4,WB+4):rnd(2,W-2),z=near?rnd(WA-4,WB+4):rnd(2,D-2);
  const m=new THREE.Mesh(new THREE.DodecahedronGeometry(.8,0),lmat(0x5a3a2a,.6));m.position.set(x+12,GY+40,z-12);scene.add(m);bombs.push({mesh:m,x,z,vy:-30,vx:-9,vz:9,meteor:true})}
function endWave(){const ev=state.ev;state.wave++;realmWaveIncome();startSelfRepair();
  if(ev==='siege'&&state.siege>1){state.siege--;state.phase='rest';toast(`Cerco: horda ${4-state.siege} de 3. Sem descanso!`,'r2');startWave();return}
  if(ev==='siege'){state.siege=0;spawnLoot(CHEST.x+3,GY+3,CHEST.z+4,'treasure',3,{})}
  state.phase='rest';state.restT=25;$('event').style.display='none';
  if(ev==='mist'){const got=Math.floor(12+state.wave*1.5);state.material+=got;toast(`Noite de bruma: +${got} material`,'r1')}
  if(ev==='ambush')spawnLoot(CHEST.x-2,GY+3,CHEST.z+3,'treasure',2,{});
  if(ev==='elite')spawnLoot(CHEST.x-2,GY+3,CHEST.z+3,'recruit',Math.max(1,rollRarity(.1)),{role:pick(['sol','gun','med'])});
  $('report').style.display='block';$('report').innerHTML=`Horda ${state.wave-1} vencida · melhor combo <b>×${state.comboBest}</b> · <b>${state.wk}</b> estilhaçados · <b>${state.wwound}</b> ferido${state.wwound===1?'':'s'} · <b>${loot.filter(L=>!L.carried).length}</b> itens no chão`;
  offerRewards();updateHud()}
function gameOver(){state.running=false;saveRecord();if(window.__chestLog)window.__chestLog.push('GAMEOVER '+new Error().stack.split('\n').slice(1,6).join(' < '));$('over').style.display='flex';$('overStat').textContent=`A Fortaleza caiu na horda ${state.wave} · ${state.kills} Devoradores estilhaçados`;
  $('overTitle').textContent='A bruma venceu';$('overText').textContent='O baú foi devorado. Uma Fortaleza nunca morre de verdade: acorde de novo, com o que aprendeu.';$('start').textContent='Acordar de novo';showRecord()}

// ───────── bombardment + meteors
const bombs=[];
function dropBomb(x,z){state.material-=25;state.bombCd=15;state.bombMode=false;const m=new THREE.Mesh(new THREE.SphereGeometry(.6,10,10),lmat(0x2b2d4a,.5));m.position.set(x,GY+26,z);scene.add(m);bombs.push({mesh:m,x,z,vy:-14,vx:0,vz:0});SFX.pop();updateHud()}
function updateBombs(dt){for(let i=bombs.length-1;i>=0;i--){const b=bombs[i];b.vy-=30*dt;b.mesh.position.y+=b.vy*dt;b.mesh.position.x+=b.vx*dt;b.mesh.position.z+=b.vz*dt;b.mesh.rotation.x+=dt*4;
    if(b.meteor&&Math.random()<.7)spawnFlame(b.mesh.position.x,b.mesh.position.y,b.mesh.position.z,1.1);
    const p=b.mesh.position;if(p.y<=topY(p.x,p.z)+.3||p.y<GY-2){scene.remove(b.mesh);bombs.splice(i,1);const gy=Math.min(topY(p.x,p.z),GY);
      if(b.meteor){explode(p.x,gy+.2,p.z,3.4,85,{fire:true,src:'env'});spawnLoot(p.x,gy+1.5,p.z,'material',0,{amount:4});if(Math.random()<.35){const rr=Math.max(1,rollRarity(.1+state.luck));const [k,d]=lootPick('any',rr);spawnLoot(p.x,gy+1.5,p.z,k,rr,d)}}
      else explode(p.x,gy+.2,p.z,state.bombR,170,{fire:true,src:'player'})}}}

// ───────── new game
function newGame(){for(const e of enemies)scene.remove(e.group);enemies.length=0;for(const m of minions)scene.remove(m.group);minions.length=0;for(const L of loot)scene.remove(L.g);loot.length=0;
  for(const t of turrets)scene.remove(t.group);turrets.length=0;for(const p of projectiles)scene.remove(p.mesh);projectiles.length=0;for(const b of bombs)scene.remove(b.mesh);bombs.length=0;for(const s of shots)scene.remove(s.mesh);shots.length=0;for(const r of rings)scene.remove(r.m);rings.length=0;claimed.clear();fuses.length=0;
  Object.assign(state,freshState());state.running=true;setCenter(80,80);rivals.length=0;initRealm();closeRealm();cam.target.set(CX,GY+1.5,CZ);hideBoss();closeCard();for(const id of ['reward','report'])$(id).style.display='none';$('event').style.display='none';for(const id of ['buildPanel','arsenal','shop'])$(id).style.display='none';
  genWorld();snapshotNature();makeTurret('cannon',TOWER_ANCHORS[0],0);makeTurret('cannon',TOWER_ANCHORS[3],0);makeTurret('ballista',KEEP_ANCHORS[2],0);spawnRivalForces();updateModeUi();
  for(const [r,dx,dz] of [['rep',-3,4],['rep',3,4],['rep',0,-4],['col',-4,5],['col',4,5],['col',-5,3],['col',5,3],['gun',-5,-5],['gun',5,5],['sol',-2,6],['sol',2,6],['sol',0,7]])makeMinion(r,0,CX+dx,CZ+dz);
  state.inv.blocks={16:12,17:6,18:8,15:4,10:6,9:2,19:2};state.inv.turrets=[{type:'ballista',r:1},{type:'flamer',r:0},{type:'tesla',r:0}];
  state.inv.armory=[makeEquip(1,'espada'),makeEquip(0,'couro'),makeEquip(1,'luvas'),makeEquip(0,'botas')];for(const it of state.inv.armory.slice())autoEquip(it);
  toast('Fortaleza acordada. Abra Construir para editar a base.','r1');updateHud()}

// ───────── input
let dragging=false,moved=0,lx=0,ly=0,pinch=0,downBtn=0,lastHover=0;
canvas.addEventListener('pointerdown',e=>{dragging=true;moved=0;downBtn=e.button;lx=e.clientX;ly=e.clientY;canvas.setPointerCapture(e.pointerId)});
canvas.addEventListener('pointermove',e=>{const now=performance.now();if(now-lastHover>45&&state.running){lastHover=now;hoverAt(e.clientX,e.clientY)}
  if(!dragging)return;const dx=e.clientX-lx,dy=e.clientY-ly;lx=e.clientX;ly=e.clientY;moved+=Math.abs(dx)+Math.abs(dy);if(moved<6)return;
  if(e.buttons===2||e.buttons===4||e.shiftKey){const s=cam.dist*.0016,sy=Math.sin(cam.yaw),cy=Math.cos(cam.yaw);cam.target.x=clamp(cam.target.x-(dx*cy-dy*sy)*s,0,W);cam.target.z=clamp(cam.target.z-(-dx*sy-dy*cy)*s,0,D)}
  else{cam.yaw-=dx*.006;cam.pitch=clamp(cam.pitch+dy*.005,.35,1.4)}});
canvas.addEventListener('pointerup',e=>{dragging=false;if(moved<6)clickAt(e.clientX,e.clientY,downBtn===2)});
canvas.addEventListener('pointerleave',()=>{$('tip').style.display='none'});
canvas.addEventListener('contextmenu',e=>e.preventDefault());
canvas.addEventListener('wheel',e=>{e.preventDefault();cam.dist=clamp(cam.dist*(1+Math.sign(e.deltaY)*.08),14,160)},{passive:false});
canvas.addEventListener('touchstart',e=>{if(e.touches.length===2)pinch=Math.hypot(e.touches[0].clientX-e.touches[1].clientX,e.touches[0].clientY-e.touches[1].clientY)},{passive:true});
canvas.addEventListener('touchmove',e=>{if(e.touches.length===2){const p=Math.hypot(e.touches[0].clientX-e.touches[1].clientX,e.touches[0].clientY-e.touches[1].clientY);cam.dist=clamp(cam.dist*(pinch/p),14,130);pinch=p;moved=99}},{passive:true});
function clickAt(cx,cy,right){if(!state.running)return;
  if(state.bombMode){const ray=rayFrom(cx,cy);const h=voxRay(ray.origin,ray.direction,true);let px,pz;if(h){px=ix(h.i)+.5;pz=iz(h.i)+.5}else if(ray.direction.y<-1e-4){const t=(GY-ray.origin.y)/ray.direction.y;px=ray.origin.x+ray.direction.x*t;pz=ray.origin.z+ray.direction.z*t}
    if(px!==undefined&&px>0&&pz>0&&px<W&&pz<D)dropBomb(px,pz);else toast('Mire na ilha','r0');return}
  if(state.build.on){doBuild(cx,cy,right);return}
  const u=pickObj(cx,cy,[...enemies.filter(e=>!e.dead).map(e=>e.group),...loot.filter(L=>!L.carried).map(L=>L.g),...minions.map(m=>m.group),...turrets.filter(t=>t.alive).map(t=>t.group)]);
  if(!u){closeCard();return}
  if(u.enemy){const e=u.enemy;if(state.focusCd<=0){state.focus=e;state.focusT=state.focusLong?8:5;state.focusCd=state.focusLong?10:14;toast(`Fogo Concentrado no ${e.T.n}!`,'r2');label({x:e.pos.x,y:e.gy,z:e.pos.z},'🔥 ALVO','#ec5f6b');updateHud()}else toast('Fogo Concentrado recarregando','r0');return}
  if(u.loot){const L=u.loot;if(L.kind==='treasure')openTreasure(L);else{L.prio=!L.prio;if(L.prio){label({x:L.x,y:L.y-1,z:L.z},'📌','#ff8a5c');if(L.claimed){L.claimed.task=null;L.claimed.state=L.claimed.bag.length?'haul':'idle';L.claimed=null}}}SFX.pop();return}
  if(u.minion){cardSlot=null;openCard({m:u.minion});return}
  if(u.turret){openCard({t:u.turret})}}
window.addEventListener('keydown',e=>{if(e.key==='m'||e.key==='M'){REALM.open?closeRealm():openRealm();return}if(e.key==='Escape'&&REALM.open){closeRealm();return}if(e.target.tagName==='INPUT')return;const k=e.key.toLowerCase();
  if(k===' '&&state.running&&state.phase==='rest'&&!state.choosing){e.preventDefault();startWave()}
  else if(k==='b'&&state.running)openSide('buildPanel');else if(k==='i'&&state.running)openSide('arsenal');else if(k==='u'&&state.running)openSide('shop');
  else if(k==='escape'){state.bombMode=false;closeCard();$('hire').style.display='none';if(state.build.on)closeSide('buildPanel');updateHud()}
  else if(k==='f'&&state.running)cycleSpeed();
  else if(k==='r'&&state.build.on){state.build.tool=state.build.tool==='remove'?'place':'remove';renderBuild()}
  keys[k]=true});
const keys={};window.addEventListener('keyup',e=>{keys[e.key.toLowerCase()]=false});
$('bBuild').onclick=()=>openSide('buildPanel');$('buildClose').onclick=()=>closeSide('buildPanel');
$('bArs').onclick=()=>openSide('arsenal');$('arsClose').onclick=()=>closeSide('arsenal');
$('bShop').onclick=()=>openSide('shop');$('shopClose').onclick=()=>closeSide('shop');
$('bHire').onclick=()=>{const h=$('hire');const open=h.style.display!=='flex';h.style.display=open?'flex':'none';if(open)renderHire()};
$('autoEq').onchange=e=>{state.autoEquip=e.target.checked;if(state.autoEquip)for(const it of state.inv.armory.slice())autoEquip(it);renderArsenal()};
$('abBtn').onclick=()=>{state.autoBuild=!state.autoBuild;toast(state.autoBuild?'Construção automática ligada: os minions decidem onde construir':'Construção automática desligada','r1');updateHud()};
$('auBtn').onclick=()=>{state.autoUp=!state.autoUp;state.autoEquip=state.autoUp||state.autoEquip;toast(state.autoUp?'Upgrade automático ligado: o pior vira o melhor':'Upgrade automático desligado','r2');updateHud()};
function cycleSpeed(){gameSpeed=SPEEDS[(SPEEDS.indexOf(gameSpeed)+1)%SPEEDS.length];$('speed').textContent=`⏩ ${gameSpeed}×`;$('speed').classList.toggle('on',gameSpeed>1);toast(`Velocidade ${gameSpeed}×`,'r0')}
$('speed').onclick=cycleSpeed;
$('next').onclick=()=>{if(state.phase==='rest'&&!state.choosing)startWave()};
$('raidBtn').onclick=sendRaid;$('recallBtn').onclick=recallRaid;
$('camHome').onclick=()=>{cam.target.set(CX,GY+1.5,CZ)};$('camRival').onclick=()=>{const R=battle();if(R)cam.target.set(R.cx,GY+1.5,R.cz)};
function updateModeUi(){const r=!!battle();for(const id of ['raidBtn','recallBtn','camRival'])$(id).hidden=!r}
$('bRealm').onclick=()=>REALM.open?closeRealm():openRealm();$('rivalChip').onclick=openRealm;$('realmClose').onclick=closeRealm;$('realmCanvas').addEventListener('click',realmClick);
setInterval(()=>{if(REALM.open){drawRealm();if(Math.random()<.2)renderRealmInfo()}},120);
$('auto').onclick=()=>{state.auto=!state.auto;updateHud()};
$('snd').onclick=()=>{soundOn=!soundOn;if(soundOn)ac();$('snd').textContent=soundOn?'🔊':'🔇'};
$('focus').onclick=()=>toast('Clique num Devorador para concentrar o fogo de todas as armas','r0');
$('bomb').onclick=()=>{if(state.bombCd>0){toast('Bombardeio recarregando','r0');return}if(state.material<25){toast('Precisa de 25 material','r0');return}state.bombMode=!state.bombMode;if(state.bombMode){if(state.build.on)closeSide('buildPanel');toast('Clique onde a bomba deve cair','r2')}updateHud()};
$('start').onclick=()=>{$('over').style.display='none';newGame();if(!soundOn){soundOn=true;ac();$('snd').textContent='🔊'}};

// ───────── loop
let last=performance.now(),hudAcc=0;
function resize(){renderer.setSize(innerWidth,innerHeight,false);camera.aspect=innerWidth/innerHeight;camera.updateProjectionMatrix()}
window.addEventListener('resize',resize);resize();
function simulate(dt){simTime+=dt;
  if(state.running&&dt>0){
    if(state.phase==='wave'){spawnFromQueue(dt);if(state.ev==='meteor')meteorTick(dt);if(state.ev==='storm')stormTick(dt);if(!state.queue.length&&enemies.every(e=>e.dead||e.rival))endWave()}
    else if(state.auto&&!state.choosing){state.restT-=dt;if(state.restT<=0)startWave()}
    for(const e of enemies)updateEnemy(e,dt);for(let i=enemies.length-1;i>=0;i--)if(enemies[i].dead)enemies.splice(i,1);
    for(const m of minions)updateMinion(m,dt);for(const t of turrets)updateTurret(t,dt);for(let i=turrets.length-1;i>=0;i--)if(!turrets[i].alive)turrets.splice(i,1);
    rivalTick(dt);heatTick(dt);lifeTick(dt);musicTick(dt);if(state.phase!=='wave')selfRepairTick(dt);updateProjectiles(dt);updateShots(dt);updateRings(dt);updateBombs(dt);processBooms(dt);tickFire(dt);tickFluids(dt);tickSpecials(dt);if(settleDirty)settle();
    if(state.focusT>0)state.focusT-=dt;if(state.focusCd>0)state.focusCd-=dt;if(state.bombCd>0)state.bombCd-=dt;
    if(state.boss&&!state.boss.dead){const b=state.boss;$('bossFill').style.width=(Math.max(0,b.hp)/b.maxhp*100)+'%';if(b.type==='colossus'){const n=b.legs.filter(L=>L.alive).length;$('bossName').textContent=`Colosso ${RARITY[b.rarity].n} · ${n} pernas`}}
    if(state.combo>=5&&simTime-state.comboT>1.6){const g=Math.floor(state.combo*.6);state.material+=g;toast(`Combo ×${state.combo} · +${g} material`,state.combo>=25?'r4':state.combo>=15?'r3':'r2');state.combo=0}
    $('combo').hidden=!(state.combo>=3&&simTime-state.comboT<1.6);if(!$('combo').hidden)$('combo').textContent=`×${state.combo}`;
    if(state.autoBuild||state.autoUp){state.mgAcc+=dt;if(state.mgAcc>2.5){state.mgAcc=0;if(state.autoBuild)autoBuildTick();if(state.autoUp)autoUpgradeTick()}}
    hudAcc+=dt;if(hudAcc>.25){hudAcc=0;updateHud()}}
  for(const k of fuses)k.material.emissiveIntensity=.4+Math.sin(simTime*20)*.4;
  updateDebris(dt);updateLoot(dt);updateFlames(dt);updateBeams(dt);updatePlan(dt)}
function frame(now){requestAnimationFrame(frame);let dt=Math.min(.05,(now-last)/1000);last=now;const rdt=dt;if(hitstop>0){hitstop-=dt;dt*=.08}if(slowmo>0){slowmo-=rdt;dt*=.3}
  const pan=24*rdt*(cam.dist/70);const sy=Math.sin(cam.yaw),cy=Math.cos(cam.yaw);
  if(keys.w||keys.arrowup){cam.target.x-=sy*pan;cam.target.z-=cy*pan}if(keys.s||keys.arrowdown){cam.target.x+=sy*pan;cam.target.z+=cy*pan}
  if(keys.a||keys.arrowleft){cam.target.x-=cy*pan;cam.target.z+=sy*pan}if(keys.d||keys.arrowright){cam.target.x+=cy*pan;cam.target.z-=sy*pan}
  cam.target.x=clamp(cam.target.x,0,W);cam.target.z=clamp(cam.target.z,0,D);
  {const fm=state.ev==='mist'&&state.phase==='wave';const tn=fm?cam.dist*.95:cam.dist+30,tf=fm?cam.dist*2.1:cam.dist+150;scene.fog.near+=(tn-scene.fog.near)*Math.min(1,rdt*2);scene.fog.far+=(tf-scene.fog.far)*Math.min(1,rdt*2)}
  {const n=gameSpeed;for(let k=0;k<n;k++)simulate(dt)}updateLabels(rdt);placeCamera();if(shake>0){shake-=rdt*2;camera.position.x+=rnd(-1,1)*shake*.25;camera.position.y+=rnd(-1,1)*shake*.25}
  flushVox();if(!window.__headless)renderer.render(scene,camera)}
// test hooks
window.__step=s=>{const n=Math.round(s*60);for(let i=0;i<n;i++){hitstop=0;simulate(1/60);if(state.choosing){const c=$('rewardCards').children;if(c.length)c[Math.floor(Math.random()*c.length)].click()}}updateHud()};
window.__bomb=(x,z)=>{state.material+=25;dropBomb(x,z)};
window.__pdbg=()=>({proj:projectiles.length,kinds:projectiles.slice(0,5).map(p=>p.kind+'@'+p.mesh.position.x.toFixed(1)+','+p.mesh.position.y.toFixed(1)+','+p.mesh.position.z.toFixed(1)),guns:minions.filter(m=>m.role==='gun').slice(0,4).map(m=>`bow${(m.bowT||0).toFixed(1)} @${m.pos.x.toFixed(1)},${m.group.position.y.toFixed(1)},${m.pos.z.toFixed(1)}`),fl:enemies.filter(e=>e.fly&&!e.dead).map(e=>`${e.pos.x.toFixed(1)},${e.group.position.y.toFixed(1)},${e.pos.z.toFixed(1)} hp${Math.round(e.hp)} dive${e.diveY}`)});
window.__edbg=()=>enemies.filter(e=>!e.dead).map(e=>`${e.type} ${e.state} @${e.pos.x.toFixed(1)},${e.pos.z.toFixed(1)} gy${e.gy.toFixed(1)} surfE${surfE(e.pos.x,e.pos.z)} tgt${e.target>=0?ix(e.target)+','+iy(e.target)+','+iz(e.target)+' v'+vox[e.target]:'-'} hp${Math.round(e.hp)} stun${e.stun.toFixed(1)} fuse${e.fuse.toFixed(1)}`);
window.__vdbg=()=>({vcount,cnt:voxMesh.count,top:vslot[idx(5,GY-1,5)],exp:exposed(idx(5,GY-1,5)),m:vox[idx(5,GY-1,5)],sample:Array.from(voxMesh.instanceMatrix.array.slice(vslot[idx(5,GY-1,5)]*16,vslot[idx(5,GY-1,5)]*16+16)).map(v=>+v.toFixed(2)).join(','),cam:[camera.position.x,camera.position.y,camera.position.z].map(v=>v.toFixed(1)).join(','),fog:[scene.fog.near,scene.fog.far].map(v=>v.toFixed(0)).join(',')});
window.__dbg=()=>({wave:state.wave,mat:Math.floor(state.material),chest:chestAlive(),minions:minions.map(m=>`${m.role}:${m.state}${m.wounded>0?'W':''}`),enemies:enemies.length,queue:state.queue.length,loot:loot.length,lootFree:loot.filter(L=>!L.carried&&!L.claimed).length,
  turrets:turrets.map(t=>`${t.type}${t.gunner&&t.gunner.state==='man'?'*':''}:${Math.round(t.hp)}`),fluids:fluids.size,burning:burning.size,armory:state.inv.armory.length,inv:JSON.stringify(state.inv.blocks),ev:state.ev,plan:blueList.filter(i=>vox[i]!==blue[i]).length,planS:blueList.filter(i=>vox[i]!==blue[i]).slice(0,8).map(i=>`${ix(i)},${iy(i)},${iz(i)} v${vox[i]} b${blue[i]} s${+supported(i)} busy${+cellBusy(i)}`).join(' | '),kills:state.kills,cols:minions.filter(m=>m.role==='col').map(m=>`${m.state} t${m.timer.toFixed(1)} @${m.pos.x.toFixed(0)},${m.pos.z.toFixed(0)} y${m.group.position.y.toFixed(1)} wc${walkCell(Math.floor(m.pos.x),Math.floor(m.pos.z))} task${m.task&&m.task.L?Math.round(m.task.L.x)+','+Math.round(m.task.L.z):'-'} bag${m.bag.length}`),lootS:loot.filter(L=>!L.carried&&!L.claimed).slice(0,6).map(L=>`${L.kind}@${L.x.toFixed(0)},${L.y.toFixed(1)},${L.z.toFixed(0)} ok${+lootOK(L)} un${+(L.unreach>simTime)} rest${+L.rest}`)});
genWorld();placeCamera();requestAnimationFrame(frame);
// bot used by the headless test to exercise build/arsenal paths like a player would
window.__bot=()=>{const out=[];state.autoBuild=true;state.autoUp=true;
  if(state.phase==='wave'&&state.bombCd<=0&&state.material>60){const e=enemies.find(e=>!e.dead&&!e.fly&&!inside(e.pos.x,e.pos.z));if(e){dropBomb(e.pos.x,e.pos.z);out.push('bomb')}}
  for(const L of loot)if(L.kind==='treasure'&&!L.carried){openTreasure(L);out.push('open');break}
  return out.join(' ')};
// ───────── auto-management: the fortress spends its own material sensibly (player can switch it off)
const wallTop=()=>GY+state.wallH-1;
const TURRET_SPOTS=()=>{const y=wallTop(),o=[...TOWER_ANCHORS,...KEEP_ANCHORS,...MID_ANCHORS(),...OUTPOST_ANCHORS];for(const k of [CX-6,CX+6]){o.push(idx(k,y,WA+1),idx(WA+1,y,k),idx(WB-1,y,k))}for(const k of [CX-7,CX+7])o.push(idx(k,y,WB-1));for(const k of [CX-11,CX+11])o.push(idx(k,y,WA+1),idx(k,y,WB-1));return o};
const TRAP_SPOTS=()=>{const o=[];for(let k=WA;k<=WB;k+=1){o.push(idx(k,GY,WA-2),idx(k,GY,WB+2),idx(WA-2,GY,k),idx(WB+2,GY,k))}for(let k=CX-4;k<=CX+3;k++)o.unshift(idx(k,GY,WB+3),idx(k,GY,WB+4));return o.filter(i=>surf(ix(i),iz(i))===GY)};
const MID_TOWERS=()=>[[CX-2,CZ-WR],[WA,CZ-2],[WB-3,CZ-2]];
const MID_ANCHORS=()=>MID_TOWERS().map(([x,z])=>idx(x+1,GY+TOWER_H-1,z+1));
const reserveMat=()=>40+state.wave*4;
// construction: decide where turrets, traps and new towers go, hire who is missing
function autoBuildTick(){const reserve=reserveMat();let acted=false;
  if(state.inv.turrets.length){state.inv.turrets.sort((a,b)=>TURRETS[b.type].v+b.r-(TURRETS[a.type].v+a.r));const spot=[...TURRET_SPOTS(),...MID_ANCHORS()].find(a=>vox[a]&&blue[a]&&!turretAt(a)&&!vox[a+W*D]);if(spot!==undefined){const t=state.inv.turrets.shift();makeTurret(t.type,spot,t.r);sparkle(ix(spot)+.5,iy(spot)+1.5,iz(spot)+.5,RARITY[t.r].c,8);toast(`Construção auto: ${TURRETS[t.type].n} instalada`,'r1');acted=true}}
  for(const m of [17,16,18,10]){if(!(state.inv.blocks[m]>0))continue;let sp=smartTrapSpot(m);if(sp<0&&m!==10)sp=TRAP_SPOTS().find(i=>!vox[i]&&!blue[i]&&!cellBusy(i));if(sp===undefined||sp<0)continue;placeBlue(sp,m);state.inv.blocks[m]--;state.prepaid.add(sp);acted=true;if(Math.random()<.15)toast(`Construção auto: ${MAT[m].n} no caminho dos Devoradores`,'r1');break}
  if(state.inv.blocks[19]>0){const sp=[idx(WA+5,GY,WA+5),idx(WB-5,GY,WA+5),idx(WA+5,GY,WB-5),idx(WB-5,GY,WB-5),idx(WA+6,GY,WA+5),idx(WB-6,GY,WB-5)].find(i=>!vox[i]&&!blue[i]&&!cellBusy(i));if(sp!==undefined){placeBlue(sp,19);state.inv.blocks[19]--;state.prepaid.add(sp);acted=true}}
  for(const m of [9]){if(!(state.inv.blocks[m]>0))continue;const sp=[idx(CX-6,GY-1,CZ+5),idx(CX+6,GY-1,CZ+5),idx(CX-6,GY-1,CZ-5),idx(CX+6,GY-1,CZ-5)].find(i=>vox[i]===13);if(sp!==undefined){setVox(sp,0);setFluid(sp,9,4,true);state.inv.blocks[m]--;acted=true}}
  // new towers on the walls once the economy allows (more places for weapons)
  if(state.material>reserve+70&&state.wave>=3){for(const [x,z] of MID_TOWERS()){const top=idx(x+1,GY+TOWER_H-1,z+1);if(blue[top])continue;for(let dx=0;dx<4;dx++)for(let dz=0;dz<4;dz++)for(let y=0;y<TOWER_H;y++){const i=idx(x+dx,GY+y,z+dz);if(!blue[i]||blue[i]===3)placeBlue(i,6)}toast('Construção auto: nova torre na muralha','r1');acted=true;break}}
  const want=Math.min(60,10+Math.floor(state.wave*1.3));if(minions.length<want){const n={};for(const m of minions)n[m.role]=(n[m.role]||0)+1;const guns=turrets.filter(t=>t.alive).length;
    const need=[['gun',guns-(n.gun||0)],['sol',Math.ceil(minions.length*.3)-(n.sol||0)],['rep',Math.ceil(minions.length*.2)-(n.rep||0)],['col',Math.max(4,Math.ceil(minions.length*.25))+Math.floor(loot.filter(L=>!L.carried&&!L.claimed).length/25)-(n.col||0)],['med',Math.floor(minions.length/8)-(n.med||0)]].sort((a,b)=>b[1]-a[1]);
    const role=need[0][1]>0?need[0][0]:'sol';if(state.material>=ROLES[role].cost+reserve){hire(role);acted=true}}
  if(acted)refreshPanels()}
// upgrades: always replace the worst piece with a better one
const TIER=[3,4,14,20];
function autoUpgradeTick(){const reserve=reserveMat();let acted=false;
  // walls: worst material first, closest to the gate first
  const walls=blueList.filter(i=>TIER.includes(blue[i])&&(baseBlue[i]===3||baseBlue[i]===4||state.custom.has(i))&&iy(i)>=GY).sort((a,b)=>TIER.indexOf(blue[a])-TIER.indexOf(blue[b])||hd({x:ix(a),z:iz(a)},GATE)-hd({x:ix(b),z:iz(b)},GATE));
  let n=0;for(const i of walls){if(n>=6)break;const t=TIER.indexOf(blue[i]);const next=TIER[t+1];if(!next)continue;
    if(next===4){if(state.material<reserve+30)break;state.material-=2;placeBlue(i,4);n++}
    else if((state.inv.blocks[next]||0)>0){state.inv.blocks[next]--;placeBlue(i,next);state.prepaid.add(i);n++}}
  if(n){acted=true;if(Math.random()<.3)toast(`Upgrade auto: ${n} bloco${n>1?'s':''} melhorado${n>1?'s':''}`,'r2')}
  // installed weapons: swap the weakest for a better one from the arsenal
  if(state.inv.turrets.length){const best=state.inv.turrets.slice().sort((a,b)=>TURRETS[b.type].v+b.r-(TURRETS[a.type].v+a.r))[0];const worst=turrets.filter(t=>t.alive).sort((a,b)=>TV(a)-TV(b))[0];
    if(worst&&TURRETS[best.type].v+best.r>TV(worst)+.4&&!TURRET_SPOTS().concat(MID_ANCHORS()).some(a=>vox[a]&&blue[a]&&!turretAt(a)&&!vox[a+W*D])){const anchor=worst.anchor;killTurret(worst,false);state.inv.turrets.push({type:worst.type,r:worst.r});state.inv.turrets.splice(state.inv.turrets.indexOf(best),1);makeTurret(best.type,anchor,best.r);toast(`Upgrade auto: ${TURRETS[worst.type].n} → ${TURRETS[best.type].n} ${RARITY[best.r].n}`,RARITY[best.r].css);acted=true}}
  // equipment: everything goes to whoever gains most; forge triples
  for(const it of state.inv.armory.slice())if(autoEquip(it))acted=true;
  const g={};for(const it of state.inv.armory){const k=it.k+'|'+it.r;(g[k]=g[k]||[]).push(it)}for(const k in g)if(g[k].length>=3&&g[k][0].r<4){for(const o of g[k].slice(0,3))state.inv.armory.splice(state.inv.armory.indexOf(o),1);const nw=makeEquip(g[k][0].r+1,g[k][0].k);state.inv.armory.push(nw);toast(`Upgrade auto forjou ${nw.n} ${RARITY[nw.r].n}`,RARITY[nw.r].css);autoEquip(nw);acted=true;break}
  // fortress upgrades with spare material
  if(state.material>reserve+180){const U=[...(loot.length>60?['portal','magnet']:[]),'powder','gears','plating','tools','blades','infirm','explosive','magnet','portal','door','crit','greek','luck','bomb','general'].map(id=>UPGRADES.find(u=>u.id===id)).find(U=>(state.ups[U.id]||0)<U.max&&state.material>U.cost(state.ups[U.id]||0)+reserve+60);
    if(U){const lv=state.ups[U.id]||0;state.material-=U.cost(lv);state.ups[U.id]=lv+1;U.go();toast(`Upgrade auto: ${U.nm} ${lv+1}`,'r2');acted=true}}
  if(acted)refreshPanels()}

// ───────── storm: lightning strikes, wind feeds fires
let stormT=0;
function stormTick(dt){stormT-=dt;if(stormT>0)return;stormT=rnd(1.2,2.6);let x,z;const live=enemies.filter(e=>!e.dead);
  if(live.length&&Math.random()<.45){const e=pick(live);x=e.pos.x;z=e.pos.z}else{x=rnd(2,W-2);z=rnd(2,D-2)}
  const gy=topY(x,z);beam({x,y:gy+40,z},{x,y:gy,z});beam({x:x+rnd(-1,1),y:gy+25,z:z+rnd(-1,1)},{x,y:gy,z});
  explode(x,gy+.2,z,1.8,60,{fire:true,src:'env'});for(const e of live)if(e.inWater&&!e.dead&&Math.hypot(e.pos.x-x,e.pos.z-z)<14)hurtEnemy(e,35,null);
  SFX.zap();SFX.boom(true);shake=Math.max(shake,.5);if(Math.random()<.12)spawnLoot(x,gy+1.5,z,'block',1,{m:15,n:2})}

// ───────── record (per viewer, browser storage)
function loadRec(){try{return JSON.parse(localStorage.getItem('fortrex-rec')||'{}')}catch(e){return{}}}
function saveRecord(){const r=loadRec();const n={wave:Math.max(r.wave||0,state.wave),kills:Math.max(r.kills||0,state.kills),combo:Math.max(r.combo||0,state.comboBest)};try{localStorage.setItem('fortrex-rec',JSON.stringify(n))}catch(e){}}
function showRecord(){const r=loadRec();$('overRec').textContent=r.wave?`Recorde: horda ${r.wave} · ${r.kills} estilhaçados · combo ×${r.combo}`:''}
setInterval(()=>{if(state.running)saveRecord()},15000);showRecord();
window.__rdbg=(t)=>{if(t===60)sendRaid();if(t==='next'){const c=REALM.cities.find(o=>!o.fac.isMe);startBattle(c,'attack');return rivals.map(R=>R.cx+','+R.cz+':'+R.core.length+'/'+R.core.filter(i=>vox[i]===21).length+(R.alive?'A':'x')).join(' ')}return ' R:'+rivals.map(r=>(r.alive?'A':'x')+r.core.filter(i=>vox[i]===21).length).join('|')+' raid:'+minions.filter(m=>m.raid).length+' rv:'+enemies.filter(e=>e.rival&&!e.dead).map(e=>e.rmode[0]).join('')+' rt:'+turrets.filter(t=>t.team==='r'&&t.alive).length+' clk:'+$('clock').textContent+' nl:'+natLost.length/2+' rest:'+minions.filter(m=>m.resting).length+'/'+minions.length+' ph:'+state.phase};
window.__rpos=()=>({raiders:enemies.filter(e=>e.rival&&!e.dead&&e.rmode!=='guard').map(e=>e.type+'@'+e.pos.x.toFixed(0)+','+e.pos.z.toFixed(0)+' st'+e.state+(e.path?' p'+e.path.length:'')),sols:minions.filter(m=>m.role==='sol').map(m=>m.state+'@'+m.pos.x.toFixed(0)+','+m.pos.z.toFixed(0)+' w'+(m.wounded|0)+(m.raid?' R':'')),center:[CX,CZ]});
window.__realm=()=>({cities:REALM.cities.map(c=>c.name.slice(0,6)+':'+c.lvl+(c.fac.isMe?'*':'')+':'+Math.round(c.garrison)).join(' '),armies:REALM.armies.length,facs:new Set(REALM.cities.map(c=>c.fac.id)).size,log:REALM.log.slice(0,3).map(l=>l.txt),battle:battle()?battle().name:null,chunks:enemies.filter(e=>!e.dead&&e.chunks).slice(0,3).map(e=>e.type+':'+e.lost+'/'+e.chunks.length+' hp'+Math.round(e.hp/e.maxhp*100))});
window.__boss=(t,f)=>{const e=makeEnemy(t||'boss',2,CX+14,CZ+30);dmgEnemy(e,e.maxhp*(f||.55),true);cam.target.set(e.pos.x,GY+2,e.pos.z);cam.dist=26;return e.lost+'/'+e.chunks.length};
window.__matTrace=()=>{let v=state.material;const big={};Object.defineProperty(state,'material',{configurable:true,get(){return v},set(n){const d=n-v;if(d>0){const k=(new Error().stack.split('\n')[2]||'').trim().slice(0,90);big[k]=(big[k]||0)+d}v=n}});window.__matBig=()=>Object.entries(big).sort((a,b)=>b[1]-a[1]).slice(0,6)};
window.__lootTrace=()=>{const big={};const orig=spawnLoot;window.__lt=big;spawnLootHook=(x,y,z,kind,r,data)=>{if(kind==='material'){const k=(new Error().stack.split('\n')[3]||'').trim().split(' (')[0];big[k]=(big[k]||0)+data.amount}}};
