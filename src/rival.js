// ───────── rival cities, raids, expeditions, game modes, smart traps, day/night and world regrowth
const rivals=[];
const RIVAL_NAMES=['Cinzaforte','Garra Rubra','Pico do Corvo','Muralha Negra','Ponte de Ossos','Vale Sombrio','Trono de Ferro','Forja Rubra'];
const MODES={hordas:{n:'Hordas',d:'A bruma ataca em ondas infinitas. Sua cidadela fica no centro do mapa.'},
  conquista:{n:'Conquista',d:'Hordas da bruma e duas cidades rivais que mandam raids. Você pode atacá-las.'},
  duelo:{n:'Duelo de fortalezas',d:'Sem bruma: só você contra as cidades rivais. Destrua os núcleos delas.'}};
function planRivals(){rivals.length=0;return;const lvl=state.rivalLvl||1;const spots=state.mode==='duelo'?[[96,96]]:[[98,34],[94,98],[34,98]];
  spots.forEach(([cx,cz],k)=>rivals.push({k,cx,cz,wr:11,name:RIVAL_NAMES[(k+lvl*2)%RIVAL_NAMES.length],lvl,alive:true,core:[],raidT:state.mode==='duelo'?40+k*25:110+k*40,guards:[],rblue:new Map(),regenT:0}))}
function buildRivals(put){for(const R of rivals){const tag=R.k+1;const mark=(x,y,z,m)=>{if(!inb(x,y,z))return;put(x,y,z,m);const i=idx(x,y,z);rown[i]=tag;R.rblue.set(i,m)};
    // clear the ground the city stands on
    for(let x=R.cx-R.wr-2;x<=R.cx+R.wr+2;x++)for(let z=R.cz-R.wr-2;z<=R.cz+R.wr+2;z++){for(let y=GY;y<H;y++){if(inb(x,y,z)){const i=idx(x,y,z);vox[i]=0}}if(inb(x,GY-1,z))put(x,GY-1,z,13)}
    let hsh=0;for(const ch of String(R.name||'x'))hsh=(hsh*31+ch.charCodeAt(0))>>>0;const V=hsh%4;const ST=[[24,24,24],[3,4,3],[4,14,4],[14,24,14]][V];const th=[10,12,9,11][V],kh=[12,14,11,13][V],wh=[6,7,5,8][V];R.style=V;
    const tw=buildCity(mark,R.cx,R.cz,{wr:R.wr,wh,ts:4,th,kr:4,kh,stone:ST[0],stone2:ST[1],tower:ST[2],roof:25,floor:ST[0],gate:ST[0],banner:26});R._th=th;R._kh=kh;
    R.core=[];for(let x=R.cx-1;x<=R.cx;x++)for(let z=R.cz-1;z<=R.cz;z++)for(let y=0;y<2;y++){mark(x,GY+y,z,21);R.core.push(idx(x,GY+y,z))}
    R.coreMax=R.core.length;R.towerTops=tw.map(([x,z])=>idx(x+1,GY+(R._th||10)-1,z+1));R.keepTops=[[-2,-2],[2,-2],[-2,2],[2,2]].map(([dx,dz])=>idx(R.cx+dx,GY+(R._kh||12)-1,R.cz+dz));
    for(let x=R.cx-1;x<=R.cx+1;x++)for(let z=R.cz+R.wr-WT+1;z<=R.cz+R.wr;z++)for(let y=0;y<4;y++){const i=idx(x,GY+y,z);vox[i]=0;rown[i]=0;R.rblue.delete(i)}}}
function spawnRivalForces(){for(const R of rivals){const types=['cannon','ballista','mortar','tesla','flamer','frost'];const n=Math.min(8,3+R.lvl);
    [...R.towerTops,...R.keepTops].slice(0,n).forEach((a,k)=>{if(vox[a]){const t=makeTurret(types[(k+R.lvl)%types.length],a,Math.min(4,R.lvl-1+(k===0?1:0)));t.team='r';t.R=R;t.group.traverse(o=>{if(o.isMesh&&o.material.color)o.material=o.material.clone(),o.material.color.offsetHSL(0,0,-.15)})}});
    for(let k=0;k<4+R.lvl*2;k++)spawnRivalUnit(R,'guard');
    if(R.city){const g=makeEnemy('general',Math.min(4,Math.floor(R.lvl/2)),R.cx+2.5,R.cz+2.5);g.maxhp*=1+R.lvl*.35;g.hp=g.maxhp;g.T={...g.T,dmg:g.T.dmg*(1+R.lvl*.15),n:`General de ${R.name}`};g.rival=R;g.rmode='guard';g.home={x:R.cx+2.5,z:R.cz+2.5};R.guards.push(g);R.general=g;showBoss(g)}}}
function spawnRivalUnit(R,mode){const type=pick(mode==='raid'?['knight','knight','archer','rammer']:['knight','archer']);const a=rnd(0,Math.PI*2),r=mode==='raid'?rnd(1,3):rnd(5,9);
  const hx=CX-R.cx,hz=CZ-R.cz,hl=hyp(hx,hz)||1;const x=mode==='raid'?R.cx+hx/hl*(R.wr+3+rnd(0,2))+rnd(-2,2):R.cx+Math.cos(a)*r,z=mode==='raid'?R.cz+hz/hl*(R.wr+3+rnd(0,2))+rnd(-2,2):R.cz+Math.sin(a)*r;const e=makeEnemy(type,Math.min(4,Math.max(0,rollRarity(R.lvl*.05))),x,z);e.rival=R;e.rmode=mode;e.home={x,z};if(mode==='guard')R.guards.push(e);return e}
function rivalTick(dt){realmTick(dt);if(!rivals.length)return;
  for(const R of rivals){if(!R.alive)continue;
    R.raidT-=dt;if(R.raidT<=0){R.raidT=(R.kind==='defend'?65:85)*rnd(.8,1.2)/Math.min(2,1+R.lvl*.08);const n=Math.min(16,2+R.lvl+Math.floor(simTime/300));const foes=rivals.filter(o=>o!==R&&o.alive);
      if(foes.length&&Math.random()<.4){const F=pick(foes);for(let k=0;k<n;k++){const e=spawnRivalUnit(R,'war');e.foe=F}toast(`Guerra! ${R.name} marcha contra ${F.name}`,'r2')}
      else{for(let k=0;k<n;k++)spawnRivalUnit(R,'raid');toast(`Raid de ${R.name}: ${n} guerreiros a caminho!`,'r3')}SFX.boom(true)}
    R.guards=R.guards.filter(e=>!e.dead);if(R.guards.length<2+R.lvl&&Math.random()<dt*.05)spawnRivalUnit(R,'guard');
    // rival builders slowly restore their city
    R.regenT+=dt;if(R.regenT>.5){R.regenT=0;let n=0;for(const [i,m] of R.rblue){if(n>=3)break;if(vox[i]||m===21)continue;if(Math.random()<.02&&supported(i)&&!cellBusy(i)){setVox(i,m);rown[i]=R.k+1;n++}}}}
  {const rs=minions.filter(m=>m.raid&&m.role==='sol');if(rs.length&&rs.every(m=>m.wounded>0||m.state==='wounded')){for(const m of minions)if(m.raid){m.raid=null;m.path=null}toast('Expedição derrotada! Os feridos voltam para casa ao se recuperar. Leve mais soldados.','r0')}}
  ruinTick(dt)}
function raidPower(){const R=minions.find(m=>m.raid)?.raid;if(!R)return null;const us=minions.filter(m=>m.raid&&m.wounded<=0).reduce((a,m)=>a+(m.role==='sol'?1+m.lvl*.08+m.rarity*.3:.4),0);const them=R.guards.filter(e=>!e.dead).reduce((a,e)=>a+1+e.rarity*.3,0)+turrets.filter(t=>t.alive&&t.R===R).length*1.5;const core=R.core.filter(i=>vox[i]===21).length;return{R,us,them,core}}
function rivalHit(i){const R=rivals[rown[i]-1]||rivals[0];if(!R||!R.alive)return;if(MAT[vox[i]]&&vox[i]===21)return;const left=R.core.filter(c=>vox[c]===21).length;if(left===0)conquer(R)}
function conquer(R){if(!R.alive)return;R.alive=false;slowmo=1.5;shake=1.4;toast(`${R.name} foi conquistada!`,'r4');SFX.open();
  for(let k=0;k<2;k++)spawnLoot(R.cx+rnd(-2,2),GY+3,R.cz+rnd(-2,2),'treasure',Math.min(4,1+Math.floor(R.lvl/3)+(k===0?1:0)),{});
  for(const t of turrets)if(t.alive&&t.R===R){killTurret(t,true)}for(const e of enemies)if(e.rival===R&&e.rmode==='guard'&&!e.dead){killEnemy(e)}
  pendingBooms.push({x:R.cx+.5,y:GY+1,z:R.cz+.5,r:5,dmg:200,o:{src:'env',fire:true},t:.2});state.conquests=(state.conquests||0)+1;
  for(const m of minions)if(m.raid===R)m.raid=null;state.material+=10*R.lvl;battleWon(R);updateModeUi();label({x:R.cx,y:GY+4,z:R.cz},`+${10*R.lvl}`,'#c99a1a')}
function nextRivalRound(){state.rivalLvl=(state.rivalLvl||1)+1;state.duelWon=false;pendingBooms.length=0;for(const R of rivals){for(const [i] of R.rblue){if(rown[i]){vox[i]=0;rown[i]=0}}}
  const saved=rivals.slice();planRivals();const put=(x,y,z,m)=>{if(!inb(x,y,z))return;const i=idx(x,y,z);vox[i]=m;hp[i]=MAT[m].hp};buildRivals(put);
  for(let x=0;x<W;x++)for(let z=0;z<D;z++)for(let y=GY-1;y<H;y++){const i=idx(x,y,z);if(rown[i]||saved.some(R=>Math.abs(x-R.cx)<R.wr+3&&Math.abs(z-R.cz)<R.wr+3)){hp[i]=vox[i]?maxHpOf(vox[i]):0;markCol(x,z);touch(i)}}
  spawnRivalForces();toast(`Nível ${state.rivalLvl}: novas cidades rivais!`,'r3')}
// rival units: knights, archers, rammers
Object.assign(ETYPES,{general:{hp:520,speed:2.1,dmg:32,rate:1.1,color:0x4a2a3a,radius:1.1,n:'General rival'},knight:{hp:70,speed:2.4,dmg:14,rate:.8,color:0x9e2b3f,radius:.55,n:'Cavaleiro rival'},archer:{hp:40,speed:2.6,dmg:9,rate:1.4,color:0xc25a4a,radius:.5,n:'Arqueiro rival'},rammer:{hp:120,speed:2.6,dmg:60,rate:2.4,color:0x7a2232,radius:.8,n:'Aríete rival'}});
function rivalBrain(e,dt){// returns true when it handled the movement this frame
  if(e.type==='archer'){e.shotT=(e.shotT||0)-dt;if(e.shotT<=0){let tg=null,bd=17;for(const m of minions){if(m.wounded)continue;const d=hd(m.pos,e.pos);if(d<bd){bd=d;tg=m}}if(tg){e.shotT=1.5;const from=new THREE.Vector3(e.pos.x,e.gy+1.6,e.pos.z),to=new THREE.Vector3(tg.pos.x,tg.group.position.y+1,tg.pos.z);const vel=to.sub(from).normalize().multiplyScalar(36);shoot(from,vel,2,e.T.dmg*(1+e.rarity*.3),'bolt',{r:0,team:'r'});e.group.rotation.y=Math.atan2(tg.pos.x-e.pos.x,tg.pos.z-e.pos.z);if(bd<12){e.vel.set(0,0,0);return true}}}}
  if(e.rmode==='war')return warBrain(e,dt);
  if(e.rmode!=='guard')return false;
  let tg=null,bd=16;for(const m of minions){if(m.wounded)continue;const d=hd(m.pos,e.pos);if(d<bd){bd=d;tg=m}}
  if(!tg){let w=null,wd=14;for(const o of enemies){if(o.dead||o.rmode!=='war'||o.foe!==e.rival)continue;const d=hd(o.pos,e.pos);if(d<wd){wd=d;w=o}}if(w){if(wd<e.radius+w.radius+1){e.vel.set(0,0,0);if(e.timer<=0){e.timer=e.T.rate;hurtEnemy(w,e.T.dmg*(1+e.rarity*.3),{x:w.pos.x,y:w.gy+.6,z:w.pos.z})}return true}tg={pos:w.pos}}}
  const tx=tg?tg.pos.x:e.home.x,tz=tg?tg.pos.z:e.home.z;const dx=tx-e.pos.x,dz=tz-e.pos.z,d=hyp(dx,dz);
  if(tg&&d<e.radius+1.3){e.vel.set(0,0,0);if(e.timer<=0){e.timer=e.T.rate;hurtMinion(tg,e.T.dmg*(1+e.rarity*.3),e)}return true}
  if(d<.8){e.vel.set(0,0,0);return true}const nx=Math.floor(e.pos.x+dx/d*1.2),nz=Math.floor(e.pos.z+dz/d*1.2);if(surfE(nx,nz)>e.gy+1.2){e.vel.set(0,0,0);e.home={x:e.pos.x,z:e.pos.z};return true}
  e.vel.set(dx/d*e.speed*.8,0,dz/d*e.speed*.8);e.pos.addScaledVector(e.vel,dt);e.group.rotation.y=Math.atan2(dx,dz);e.group.position.y=e.gy+Math.abs(Math.sin(e.bob))*.12;return true}
// our expedition: soldiers march on a rival city, breach walls, smash turrets and the core
function sendRaid(){const R=(state.raidTarget&&state.raidTarget.alive)?state.raidTarget:rivals.filter(r=>r.alive).sort((a,b)=>hyp(a.cx-CX,a.cz-CZ)-hyp(b.cx-CX,b.cz-CZ))[0];if(!R){toast('Nenhuma cidade rival de pé','r0');return}
  const sq=minions.filter(m=>(m.role==='sol'||(m.role==='med'&&Math.random()<.5))&&m.wounded<=0);if(!sq.length){toast('Contrate soldados para atacar','r0');return}
  for(const m of sq){m.raid=R;m.path=null}toast(`${sq.length} minions marcham contra ${R.name}!`,'r2');SFX.boom(true)}
function recallRaid(){let n=0;for(const m of minions)if(m.raid){m.raid=null;m.path=null;n++}if(n)toast(`${n} minions voltando para casa`,'r1')}
function raidSoldier(m,dt){const R=m.raid;if(!R||!R.alive){m.raid=null;return false}
  if(m.role==='med')return false;
  let tg=null,bd=12;for(const e of enemies){if(e.dead||e.fly)continue;const d=hd(e.pos,m.pos);if(d<bd){bd=d;tg=e}}
  if(tg){const reach=tg.radius+1.3+m.st.reach;if(walkTo(m,tg.pos.x,tg.pos.z,dt,reach)||hd(tg.pos,m.pos)<reach+.1)soldierHit(m,tg);return true}
  let tt=null;bd=1e9;for(const t of turrets){if(!t.alive||t.R!==R)continue;const d=hd(t.pos,m.pos);if(d<bd){bd=d;tt=t}}
  let goal;if(tt&&bd<9){goal={x:tt.pos.x,z:tt.pos.z}}else{const c=R.core.find(c=>vox[c]===21);if(c===undefined){conquer(R);return false}goal={x:ix(c)+.5,z:iz(c)+.5,i:c}}
  // long marches: leave our walls through the gate, then head for the rival's south side before breaching
  if(inside(m.pos.x,m.pos.z)){walkTo(m,GATE.x+.5,GATE.z+.5,dt,1.2);return true}
  const dc=hyp(R.cx-m.pos.x,R.cz-m.pos.z);if(dc>R.wr+5&&!(tt&&bd<9)){const ax=R.cx+(m.pos.x<R.cx-R.wr?-R.wr-3:m.pos.x>R.cx+R.wr?R.wr+3:0),az=R.cz+(m.pos.z<R.cz?-R.wr-3:R.wr+3);walkTo(m,ax,az,dt,2.5);if(hyp(ax-m.pos.x,az-m.pos.z)>3)return true}
  const d=hyp(goal.x-m.pos.x,goal.z-m.pos.z);
  if(d<2.6){m.group.rotation.y=Math.atan2(goal.x-m.pos.x,goal.z-m.pos.z);if(m.timer<=0){m.timer=.7/(m.work*m.st.rate);const dmg=14*(1+m.rarity*.3)*state.bladeMul*m.st.atk*(m.rage>0?3:1);if(tt&&bd<9)damageTurret(tt,dmg);else{damageVox(goal.i,dmg,'player');rivalHit(goal.i)}m.wpn.rotation.x=-1.2;SFX.crunch(true)}m.wpn.rotation.x*=.85;return true}
  // breach: a rival wall right ahead gets smashed
  const dx=(goal.x-m.pos.x)/d,dz=(goal.z-m.pos.z)/d;const fx=Math.floor(m.pos.x+dx*1.3),fz=Math.floor(m.pos.z+dz*1.3);const sy=Math.floor(m.group.position.y);
  for(let y=sy;y<sy+3;y++){if(inb(fx,y,fz)){const i=idx(fx,y,fz);if(SOLIDM(vox[i])&&rown[i]&&walkCell(fx,fz)<=-99){m.group.rotation.y=Math.atan2(dx,dz);if(m.timer<=0){m.timer=.6/(m.work*m.st.rate);damageVox(i,18*m.st.atk*state.bladeMul,'player');m.wpn.rotation.x=-1.2;SFX.crunch(true)}m.wpn.rotation.x*=.85;return true}}}
  walkTo(m,goal.x,goal.z,dt,1.5);return true}
function soldierHit(m,tgt){m.group.rotation.y=Math.atan2(tgt.pos.x-m.pos.x,tgt.pos.z-m.pos.z);if(m.timer>0)return;m.timer=.7/(m.work*m.st.rate);const dmg=14*(1+m.rarity*.3)*(m.trait==='Forte'?1.4:1)*state.bladeMul*m.st.atk*(m.rage>0?3:1);
  hurtEnemy(tgt,dmg,{x:tgt.pos.x,y:tgt.gy+.6,z:tgt.pos.z});if(tgt.dead)gainXP(m,6+tgt.maxhp/12);if(m.st.stun&&Math.random()<m.st.stun)tgt.stun=Math.max(tgt.stun,.6);if(m.st.burn)tgt.afire=Math.max(tgt.afire,2);m.wpn.rotation.x=-1.2;spawnDebris(tgt.pos.x,tgt.gy+.8,tgt.pos.z,tgt.T.color,2,.2)}

// ───────── smart traps: a heat map of where enemies walk decides where mines, barrels, spikes and ice go
const heat=new Float32Array(W*D);let heatT=0;
function heatTick(dt){heatT+=dt;if(heatT<.5)return;heatT=0;for(let k=0;k<heat.length;k++)heat[k]*=.997;for(const e of enemies){if(e.dead||e.fly||e.rmode==='guard')continue;const x=Math.floor(e.pos.x),z=Math.floor(e.pos.z);if(x>=0&&z>=0&&x<W&&z<D)heat[x+z*W]+=e.state==='attack'?3:1}}
function smartTrapSpot(kind){let best=-1,bs=.5;const minWall=kind===10?5:1,maxWall=kind===10?12:8;
  for(let z=Math.max(1,WA-maxWall-1);z<Math.min(D-1,WB+maxWall+2);z++)for(let x=Math.max(1,WA-maxWall-1);x<Math.min(W-1,WB+maxWall+2);x++){if(inside(x,z))continue;const dw=Math.max(WA-x,x-WB-1,WA-z,z-WB-1,0);if(dw<minWall||dw>maxWall)continue;
    if(surf(x,z)!==GY)continue;const i=idx(x,GY,z);if(vox[i]||blue[i]||cellBusy(i))continue;let h=0;for(let dz=-1;dz<=1;dz++)for(let dx=-1;dx<=1;dx++)h+=heat[(x+dx)+(z+dz)*W]||0;
    if(kind===10){let nb=false;for(let dz=-4;dz<=4&&!nb;dz++)for(let dx=-4;dx<=4;dx++){const j=idx(x+dx,GY,z+dz);if(inb(x+dx,GY,z+dz)&&blue[j]){nb=true;break}}if(nb)continue}
    if(h>bs){bs=h;best=i}}
  return best}

// ───────── day / night and the world healing itself
const NIGHT_SKY=new THREE.Color(0x1d2244),DAY_SKY=new THREE.Color(0xdff1f7),DUSK_SKY=new THREE.Color(0xf2b48a);const _sky=new THREE.Color();
const DAY_LEN=240;let natBlue=null,natLost=[];
function snapshotNature(){natLost=[];natBlue=new Uint8Array(N);for(let i=0;i<N;i++){const m=vox[i];if(m&&!blue[i]&&!rown[i]&&m!==10&&!(FLUID(m)&&!fluidSrc.has(i)&&iy(i)>=GY))natBlue[i]=m}}
function dayPhase(){return ((simTime/DAY_LEN)+.3)%1}// 0 = midnight, .5 = noon
function isNight(){const p=dayPhase();return p<.2||p>.82}
let regrowT=0;
let lifeAcc=0;function lifeTick(dt0){lifeAcc+=dt0;if(lifeAcc<.1)return;const dt=lifeAcc;lifeAcc=0;const p=dayPhase();const sunUp=Math.sin((p-.25)*Math.PI*2);const k=clamp(sunUp*1.4+.35,0,1);
  _sky.copy(NIGHT_SKY).lerp(k<.6?DUSK_SKY:DAY_SKY,k<.6?k/.6:1);if(k>=.6)_sky.copy(DUSK_SKY).lerp(DAY_SKY,clamp((k-.6)/.4,0,1));scene.background.copy(_sky);scene.fog.color.copy(_sky);
  sun.intensity=.14+k*1.01;sun.color.setHSL(.09,.6,.55+k*.35);hemi.intensity=.24+k*.66;
  const ang=(p-.25)*Math.PI*2;sun.position.set(cam.target.x+Math.cos(ang)*60,15+Math.max(.2,Math.sin(ang))*60,cam.target.z-25);sun.target.position.set(cam.target.x,0,cam.target.z);
  if(natBlue){regrowT+=dt;const rate=isNight()?.12:.35;if(regrowT>rate){regrowT=0;const tries=isNight()?60:25;let n=0;
    // only environment cells regrow; base/player cells are the player's own management (repairers + blueprint)
    const keep=[],later=[];const lim=(isNight()?10:5)+Math.floor(natLost.length/600);
    const L=natLost.length;let scanned=0;for(let k=0;k<L;k+=2){const i=natLost[k],t0=natLost[k+1];if(scanned>=600||n>=lim||simTime-t0<40){keep.push(i,t0);continue}scanned++;const m=natBlue[i];if(!m||vox[i]===m)continue;if(blue[i]||state.custom.has(i)||(vox[i]&&SOLIDM(vox[i]))){later.push(i,t0);continue}
      if(Math.random()<.5){keep.push(i,t0);continue}if(vox[i]||!supported(i)||cellBusy(i)){later.push(i,t0);continue}if(FLUID(m))setFluid(i,m,4,true);else setVox(i,m);n++;if(Math.random()<.2)spawnDebris(ix(i)+.5,iy(i)+1,iz(i)+.5,m===11?0x6fbf6a:0x9fe39a,1,.15)}
    natLost=later.length?keep.concat(later):keep;
    for(let t=0;t<0;t++){const i=0;const m=natBlue[i];if(!m||vox[i])continue;if(!supported(i)||cellBusy(i))continue;if(iy(i)<GY-1&&!SOLIDM(vox[i-W*D]))continue;setVox(i,m);n++;if(Math.random()<.25)spawnDebris(ix(i)+.5,iy(i)+1,iz(i)+.5,0x9fe39a,1,.15)}
    for(let t=0;t<12;t++){const x=rint(0,W-1),z=rint(0,D-1);const s=surf(x,z);if(s>0&&s<=GY&&vox[idx(x,s-1,z)]===12&&!blue[idx(x,s-1,z)]){setVox(idx(x,s-1,z),13)}}}}
  const el=$('clock');if(el){const hrs=Math.floor(p*24),mins=Math.floor((p*24-hrs)*60/10)*10;const dn=Math.floor((simTime/DAY_LEN)+.3)+1,hm=`${String(hrs).padStart(2,'0')}:${String(mins).padStart(2,'0')}`;el.textContent=innerWidth<480?`${isNight()?'🌙':'☀️'}${hm}`:`${isNight()?'🌙':'☀️'} Dia ${dn} · ${hm}`;el.title=`Dia ${dn} · ${hm}`;const cs=$('chestSt');el.hidden=innerWidth<420&&cs&&!cs.hidden}}

// rival vs rival: war bands march on another city, fight its guards and smash its walls and core
function warBrain(e,dt){const F=e.foe;if(!F||!F.alive){e.rmode='raid';e.foe=null;return false}
  let g=null,gd=8;for(const o of F.guards){if(o.dead)continue;const d=hd(o.pos,e.pos);if(d<gd){gd=d;g=o}}
  let tx,tz,core=-1;if(g){tx=g.pos.x;tz=g.pos.z}else{core=F.core.find(c=>vox[c]===21);if(core===undefined){conquerBy(F,e.rival);return true}tx=ix(core)+.5;tz=iz(core)+.5}
  const dx=tx-e.pos.x,dz=tz-e.pos.z,d=hyp(dx,dz)||1;e.group.rotation.y=Math.atan2(dx,dz);
  if(g&&d<e.radius+g.radius+1){e.vel.set(0,0,0);if(e.timer<=0){e.timer=e.T.rate;hurtEnemy(g,e.T.dmg*(1+e.rarity*.3),{x:g.pos.x,y:g.gy+.6,z:g.pos.z})}return true}
  if(!g&&d<2.4){e.vel.set(0,0,0);if(e.timer<=0){e.timer=e.T.rate;damageVox(core,e.T.dmg*(e.type==='rammer'?2:1),'env');spawnDebris(tx,GY+1,tz,0xff3d5a,3,.25);if(F.core.every(c=>vox[c]!==21))conquerBy(F,e.rival)}return true}
  const nx=Math.floor(e.pos.x+dx/d*1.1),nz=Math.floor(e.pos.z+dz/d*1.1);
  if(surfE(nx,nz)>e.gy+1.2){e.vel.set(0,0,0);if(e.timer<=0){e.timer=e.T.rate*.7;let hit=false;for(let y=Math.floor(e.gy)+1;y<Math.floor(e.gy)+4&&!hit;y++){if(!inb(nx,y,nz))continue;const i=idx(nx,y,nz);if(SOLIDM(vox[i])&&rown[i]!==e.rival.k+1&&!blue[i]){damageVox(i,e.T.dmg*(e.type==='rammer'?3:1.2),'env');hit=true}}
      if(!hit){e.pos.x+=dz/d*.4;e.pos.z-=dx/d*.4}}return true}
  e.vel.set(dx/d*e.speed*.85,0,dz/d*e.speed*.85);e.pos.addScaledVector(e.vel,dt);const sy=surfE(Math.floor(e.pos.x),Math.floor(e.pos.z));e.gy+=(sy-e.gy)*Math.min(1,dt*8);e.group.position.y=e.gy+Math.abs(Math.sin(e.bob+=dt*10))*.12;return true}
function conquerBy(F,R){if(!F.alive)return;F.alive=false;shake=1;toast(`${R.name} conquistou ${F.name}! O tesouro ficou largado no chão…`,'r3');SFX.boom(true);
  for(let k=0;k<2;k++)spawnLoot(F.cx+rnd(-2,2),GY+3,F.cz+rnd(-2,2),'treasure',Math.min(4,1+F.lvl),{});
  for(const t of turrets)if(t.alive&&t.R===F)killTurret(t,true);for(const e of enemies)if(e.rival===F&&!e.dead)killEnemy(e);
  R.lvl+=1;for(const e of enemies)if(!e.dead&&e.foe===F){e.rmode='raid';e.foe=null}}

// ───────── procedural music: soft pentatonic arpeggios + bass; faster and tenser during waves, minor at night
let musT=0,musStep=0;const MUS_DAY=[0,2,4,7,9],MUS_NIGHT=[0,3,5,7,10];
function musicTick(dt){if(!soundOn||!AC||window.__headless)return;musT-=dt;if(musT>0)return;const fight=state.phase==='wave';const boss=!!state.boss;musT=fight?(boss?.17:.22):.38;
  const sc=(isNight()||boss)?MUS_NIGHT:MUS_DAY;const root=boss?110:fight?131:147;const st=musStep++;const bar=(st>>3)%4,prog=[0,3,4,2][bar];const f=n=>root*Math.pow(2,n/12);
  if(st%8===0)tone('triangle',f(sc[prog%5])/2,0,fight?.5:.9,fight?.05:.035);
  if(!fight&&st%16===0){for(const k of[0,2,4])tone('sine',f(sc[(prog+k)%5]),0,2.6,.012,k*.04)}
  const MOT=[0,2,4,2,3,1,4,0],phr=(st>>3)%8;const useMot=phr%4<2;
  if(useMot?st%2===0:Math.random()<(fight?.8:.55)){const i=useMot?MOT[(st>>1)%8]:(st*3+prog+((Math.random()*3)|0));const n=sc[(i+prog)%5]+12*((st>>2)%2);tone(fight?'square':'sine',f(n),0,fight?.12:.35,fight?.012:.025)}
  if(fight){if(st%4===0)tone('sine',boss?80:95,40,.16,boss?.09:.06);if(st%8===4)nz(.08,'bandpass',1800,.7,boss?.035:.025);if(st%4===2)nz(.05,'highpass',6000,0,.02);if(boss&&st%8===0)tone('sawtooth',f(sc[prog%5])/4,0,1.2,.02)}}
