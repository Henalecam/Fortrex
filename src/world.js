// ───────── world: renderer, voxel grid, terrain, blueprint, fluids, fire, explosions
const canvas=$('c');
const renderer=new THREE.WebGLRenderer({canvas,antialias:true});
renderer.setPixelRatio(Math.min(window.devicePixelRatio,2));
renderer.shadowMap.enabled=true;renderer.shadowMap.type=THREE.PCFSoftShadowMap;
renderer.outputEncoding=THREE.sRGBEncoding;
const scene=new THREE.Scene();
scene.background=new THREE.Color(0xdff1f7);scene.fog=new THREE.Fog(0xdff1f7,95,200);
const camera=new THREE.PerspectiveCamera(42,1,.1,500);
const cam={yaw:-Math.PI/4,pitch:1.0,dist:70,target:new THREE.Vector3(CX,GY+1.5,CZ)};
function placeCamera(){const cp=Math.cos(cam.pitch),sp=Math.sin(cam.pitch);camera.position.set(cam.target.x+cam.dist*cp*Math.sin(cam.yaw),cam.target.y+cam.dist*sp,cam.target.z+cam.dist*cp*Math.cos(cam.yaw));camera.lookAt(cam.target)}
const hemi=new THREE.HemisphereLight(0xfff6e8,0x9fc5a8,.85);scene.add(hemi);
const sun=new THREE.DirectionalLight(0xfff2dc,1.1);sun.position.set(CX+18,70,CZ-16);sun.castShadow=true;sun.shadow.mapSize.set(3072,3072);
Object.assign(sun.shadow.camera,{left:-58,right:58,top:58,bottom:-58,near:1,far:200});sun.shadow.bias=-.0008;sun.target.position.set(CX,0,CZ);scene.add(sun,sun.target);
{const rim=new THREE.Mesh(new THREE.BoxGeometry(W,8,D),new THREE.MeshLambertMaterial({color:0x7aa98a}));rim.position.set(W/2,-4,D/2);scene.add(rim);
 const mist=new THREE.Mesh(new THREE.PlaneGeometry(700,700),new THREE.MeshBasicMaterial({color:0xcfe7ee,transparent:true,opacity:.9}));mist.rotation.x=-Math.PI/2;mist.position.set(W/2,-7.5,D/2);scene.add(mist)}

const NB6=[[1,0,0],[-1,0,0],[0,1,0],[0,-1,0],[0,0,1],[0,0,-1]],NB4=[[1,0],[-1,0],[0,1],[0,-1]];
const _m=new THREE.Matrix4(),_c=new THREE.Color(),_zero=new THREE.Matrix4().makeScale(0,0,0),BURN=new THREE.Color(0xff7a2a);
const vox=new Uint8Array(N),hp=new Float32Array(N),blue=new Uint8Array(N),baseBlue=new Uint8Array(N),rown=new Uint8Array(N);
const voxGeo=new THREE.BoxGeometry(1,1,1);
const VCAP=240000;const voxMesh=new THREE.InstancedMesh(voxGeo,new THREE.MeshLambertMaterial(),VCAP);
voxMesh.castShadow=true;voxMesh.receiveShadow=true;voxMesh.frustumCulled=false;voxMesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
voxMesh.instanceColor=new THREE.InstancedBufferAttribute(new Float32Array(VCAP*3),3);scene.add(voxMesh);
const vslot=new Int32Array(N).fill(-1),slotVox=new Int32Array(VCAP).fill(-1);let vcount=0;
function freeSlot(i){const s=vslot[i];if(s<0)return;const last=vcount-1;if(s!==last){const j=slotVox[last];voxMesh.instanceMatrix.copyArray?0:0;const a=voxMesh.instanceMatrix.array,c=voxMesh.instanceColor.array;for(let k=0;k<16;k++)a[s*16+k]=a[last*16+k];for(let k=0;k<3;k++)c[s*3+k]=c[last*3+k];slotVox[s]=j;vslot[j]=s}slotVox[last]=-1;vslot[i]=-1;vcount--;voxMesh.count=vcount}
function exposed(i){const x=ix(i),y=iy(i),z=iz(i);if(x===0||z===0||x===W-1||z===D-1||y===H-1)return true;for(const [dx,dy,dz] of NB6){const ny=y+dy;if(ny<0)continue;if(!SOLIDM(vox[idx(x+dx,ny,z+dz)]))return true}return false}
function resetVoxSlots(){vslot.fill(-1);slotVox.fill(-1);vcount=0;voxMesh.count=0}
const FLN=9000;const fluidMesh=new THREE.InstancedMesh(voxGeo,new THREE.MeshBasicMaterial({transparent:true,opacity:.86}),FLN);
fluidMesh.frustumCulled=false;fluidMesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);fluidMesh.instanceColor=new THREE.InstancedBufferAttribute(new Float32Array(FLN*3),3);scene.add(fluidMesh);
const fluidSlot=new Map(),fluidFree=[];
let voxDirty=true,fluidDirty=true,settleDirty=false;
const fluids=new Set(),fluidSrc=new Set(),burning=new Map(),specials=new Set(),damaged=new Set();
function resetFluidSlots(){fluidSlot.clear();fluidFree.length=0;for(let i=FLN-1;i>=0;i--){fluidFree.push(i);fluidMesh.setMatrixAt(i,_zero)}fluidDirty=true}
resetFluidSlots();

function paint(i){const m=vox[i],x=ix(i),z=iz(i),y=iy(i);
  if(FLUID(m)){freeSlot(i);voxDirty=true;let sl=fluidSlot.get(i);if(sl===undefined){if(!fluidFree.length)return;sl=fluidFree.pop();fluidSlot.set(i,sl)}
    const lv=clamp(hp[i],1,4)/4;_m.makeScale(1,lv,1);_m.setPosition(x+.5,y+lv/2,z+.5);fluidMesh.setMatrixAt(sl,_m);_c.setHex(MAT[m].c);if(m===8)_c.offsetHSL(rnd(-.02,.03),0,rnd(-.07,.07));fluidMesh.setColorAt(sl,_c);fluidDirty=true;return}
  const fsl=fluidSlot.get(i);if(fsl!==undefined){fluidMesh.setMatrixAt(fsl,_zero);fluidSlot.delete(i);fluidFree.push(fsl);fluidDirty=true}
  voxDirty=true;if(!m||!exposed(i)){freeSlot(i);return}
  let sl=vslot[i];if(sl<0){if(vcount>=VCAP)return;sl=vcount++;vslot[i]=sl;slotVox[sl]=i;voxMesh.count=vcount}
  _m.makeScale(.97,.97,.97);_m.setPosition(x+.5,y+.5,z+.5);voxMesh.setMatrixAt(sl,_m);
  _c.setHex(m===7&&state.metalDoor?0x7f8ea6:MAT[m].c);const j=(((x*7+z*13+y*3)%7)/7*.12-.06)*(m===12||m===13?.45:1);_c.offsetHSL(0,0,j);
  const dmg=1-hp[i]/maxHpOf(m);if(dmg>0)_c.offsetHSL(0,-dmg*.3,-dmg*.2);
  if(burning.has(i))_c.lerp(BURN,.55);
  voxMesh.setColorAt(sl,_c)}
function touch(i){paint(i);const x=ix(i),y=iy(i),z=iz(i);for(const [dx,dy,dz] of NB6){const nx=x+dx,ny=y+dy,nz=z+dz;if(inb(nx,ny,nz)){const j=idx(nx,ny,nz);if(SOLIDM(vox[j]))paint(j)}}}
function flushVox(){if(voxDirty){voxMesh.instanceMatrix.needsUpdate=true;voxMesh.instanceColor.needsUpdate=true;voxDirty=false}if(fluidDirty){fluidMesh.instanceMatrix.needsUpdate=true;fluidMesh.instanceColor.needsUpdate=true;fluidDirty=false}}

// grass tufts (decor)
const TUFT=6000,tuftMesh=new THREE.InstancedMesh(new THREE.BoxGeometry(.35,.18,.35),new THREE.MeshLambertMaterial({color:0x7fc98f}),TUFT);tuftMesh.receiveShadow=true;tuftMesh.frustumCulled=false;scene.add(tuftMesh);
const tuftCol=new Int16Array(TUFT);
function initTufts(){for(let k=0;k<TUFT;k++){const x=rnd(0,W),z=rnd(0,D),fx=Math.floor(x),fz=Math.floor(z);if(vox[idx(fx,GY,fz)]||vox[idx(fx,GY-1,fz)]!==13){tuftMesh.setMatrixAt(k,_zero);tuftCol[k]=-1;continue}tuftCol[k]=fx+fz*W;_m.makeTranslation(x,GY+.09,z);tuftMesh.setMatrixAt(k,_m)}tuftMesh.instanceMatrix.needsUpdate=true}
function hideTufts(x,z){const c=x+z*W;let any=false;for(let k=0;k<TUFT;k++)if(tuftCol[k]===c){tuftMesh.setMatrixAt(k,_zero);tuftCol[k]=-1;any=true}if(any)tuftMesh.instanceMatrix.needsUpdate=true}

// column caches: standing height for minions (door passable), for enemies (door solid), top of solids
const colS=new Int16Array(W*D).fill(-1),colE=new Int16Array(W*D).fill(-1),colT=new Int16Array(W*D).fill(-1);
function markCol(x,z){const c=x+z*W;colS[c]=-1;colE[c]=-1;colT[c]=-1}
function surf(x,z){x=Math.floor(x);z=Math.floor(z);if(x<0||z<0||x>=W||z>=D)return GY;const c=x+z*W;let s=colS[c];if(s<0){s=0;while(s<H){const m=vox[idx(x,s,z)];if(!m||m===7||FLUID(m))break;s++}colS[c]=s}return s}
function surfE(x,z){x=Math.floor(x);z=Math.floor(z);if(x<0||z<0||x>=W||z>=D)return GY;const c=x+z*W;let s=colE[c];if(s<0){s=0;while(s<H){const m=vox[idx(x,s,z)];if(!m||FLUID(m))break;s++}colE[c]=s}return s}
function topY(x,z){x=Math.floor(x);z=Math.floor(z);if(x<0||z<0||x>=W||z>=D)return -20;const c=x+z*W;let s=colT[c];if(s<0){s=0;for(let y=H-1;y>=0;y--)if(SOLIDM(vox[idx(x,y,z)])){s=y+1;break}colT[c]=s}return s}

function setVox(i,m){const old=vox[i];if(SOLIDM(old)&&!SOLIDM(m)){removedQ.push(i);if(natBlue&&natBlue[i])natLost.push(i,simTime)}if(FLUID(old)){fluids.delete(i);fluidSrc.delete(i)}burning.delete(i);specials.delete(i);damaged.delete(i);
  vox[i]=m;hp[i]=m?(FLUID(m)?4:maxHpOf(m)):0;if(FLUID(m))fluids.add(i);if(m===15||m===19)specials.add(i);
  const x=ix(i),z=iz(i),y=iy(i);markCol(x,z);if((y===GY&&SOLIDM(m))||(y===GY-1&&m!==13))hideTufts(x,z);touch(i)}
function setFluid(i,m,lv,src){if(SOLIDM(vox[i]))return;vox[i]=m;hp[i]=lv;fluids.add(i);if(src)fluidSrc.add(i);burning.delete(i);markCol(ix(i),iz(i));touch(i)}

// src: 'enemy' | 'player' | 'env'. Player damage never touches the fortress (blue) — no friendly fire.
function damageVox(i,d,src='env',who=null){const m=vox[i];if(!m||m===1||FLUID(m))return false;if(m===5&&window.__chestLog)window.__chestLog.push((who?who.type:src)+':'+Math.round(d));
  if(blue[i]){if(src==='player')return false;if(src==='env')d*=.4}
  if(m===20)d*=.45;if(m===14)d*=.7;
  if(m===5&&src==='enemy')d*=.45;
  if(src==='enemy'&&who&&m===16&&blue[i])dmgEnemy(who,d*.7+6,true);
  hp[i]-=d;if(hp[i]<=0){removeVox(i,src);return true}
  if(m!==12&&m!==13)damaged.add(i);paint(i);if(Math.random()<.5)SFX.crunch(m===4||m===20);return false}
function removeVox(i,src){const m=vox[i];if(!m)return;const x=ix(i),y=iy(i),z=iz(i);
  spawnDebris(x+.5,y+.5,z+.5,MAT[m].c,m>=11&&m<=13?3:5,.45);
  if(src==='dig'&&natBlue)natBlue[i]=0;
  if(m!==11&&src!=='dig'&&!blue[i]&&Math.random()<(rown[i]?.12:m===12||m===13?.08:.3))spawnLoot(x+.5,y+.6,z+.5,'material',0,{amount:1});
  setVox(i,0);SFX.crunch(m===4);settleDirty=true;checkTurretAnchor(i);if(m===5)checkChest();
  if(m===10)pendingBooms.push({x:x+.5,y:y+.5,z:z+.5,r:2.7,dmg:95,o:{fire:true,src:blue[i]?'player':'env'},t:.12});
  if(m===17)pendingBooms.push({x:x+.5,y:y+.5,z:z+.5,r:2.8,dmg:130,o:{fire:false,src:'player'},t:.05})}

// ───────── explosions (queued so chain reactions are visible)
const pendingBooms=[];
function explode(cx,cy,cz,r,dmg,o={}){const src0=o.src||'env',rv=src0==='rival',src=rv?'enemy':src0,fr=src==='player';const R=Math.ceil(r);
  for(let dy=-R;dy<=R;dy++)for(let dz=-R;dz<=R;dz++)for(let dx=-R;dx<=R;dx++){const x=Math.floor(cx)+dx,y=Math.floor(cy)+dy,z=Math.floor(cz)+dz;if(!inb(x,y,z))continue;const d=Math.hypot(dx,dy,dz);if(d>r)continue;const i=idx(x,y,z);const m=vox[i];if(!m)continue;
    if(FLUID(m)){if(d<r*.55&&!fluidSrc.has(i)){setVox(i,0)}continue}
    if(fr&&blue[i])continue;if(rv&&rown[i])continue;damageVox(i,dmg*(1-d/r*.55)*(m===5?.25:1),src,null);if(o.fire&&vox[i]&&isFlam(vox[i])&&Math.random()<.6)ignite(i,src)}
  if(o.fire){const R2=Math.ceil(r+1.5);for(let k=0;k<30;k++){const x=Math.floor(cx+rnd(-R2,R2)),y=Math.floor(cy+rnd(-R2,R2)),z=Math.floor(cz+rnd(-R2,R2));if(inb(x,y,z))ignite(idx(x,y,z),src)}}
  for(const e of enemies){if(e.dead||(rv&&e.rival))continue;const d=Math.hypot(e.pos.x-cx,e.pos.z-cz,e.group.position.y+.5-cy);if(d<r+1.2){hurtEnemy(e,dmg*1.5*(1-d/(r+1.2)),{x:e.pos.x,y:e.gy+.5,z:e.pos.z});if(o.fire)e.afire=3}}
  if(!fr){for(const m of minions){if(m.wounded)continue;const d=Math.hypot(m.pos.x-cx,m.pos.z-cz);if(d<r+.8)hurtMinion(m,dmg*(src==='enemy'?.6:.35)*(1-d/(r+.8)))}
    for(const t of turrets){if(!t.alive||(rv&&t.team==='r'))continue;const d=Math.hypot(t.pos.x-cx,t.pos.y-cy,t.pos.z-cz);if(d<r+.6)damageTurret(t,dmg*(src==='enemy'?.6:.3)*(1-d/(r+.6)))}}
  for(const L of loot){if(L.carried)continue;const dx=L.x-cx,dz=L.z-cz,d=Math.hypot(dx,dz);if(d<r+2){L.vx+=dx/(d||1)*5;L.vz+=dz/(d||1)*5;L.vy=6;L.rest=false}}
  spawnDebris(cx,cy,cz,0xff7a3c,Math.floor(12+r*7),.5);for(let k=0;k<8+r*5;k++)spawnFlame(cx+rnd(-r,r)*.6,cy+rnd(0,1),cz+rnd(-r,r)*.6,1.2);
  SFX.boom(r>3);shake=Math.max(shake,Math.min(1.5,.3+r*.18));hitstop=Math.max(hitstop,.04);settleDirty=true}
function processBooms(dt){for(let i=pendingBooms.length-1;i>=0;i--){const b=pendingBooms[i];b.t-=dt;if(b.t<=0){pendingBooms.splice(i,1);explode(b.x,b.y,b.z,b.r,b.dmg,b.o)}}}

// ───────── fire (remembers who lit it: player fire never burns the fortress)
function ignite(i,src='env'){const m=vox[i];if(!isFlam(m)||burning.has(i))return;if(src==='player'&&blue[i])return;burning.set(i,{t:3.5+rnd(0,3),src});paint(i)}
let fireAcc=0;
function tickFire(dt){fireAcc+=dt;if(fireAcc<.12)return;fireAcc=0;
  for(const [i,b] of [...burning]){if(!isFlam(vox[i])){burning.delete(i);continue}const x=ix(i),z=iz(i),y=iy(i);
    let wet=false;for(const [dx,dy,dz] of NB6)if(inb(x+dx,y+dy,z+dz)&&vox[idx(x+dx,y+dy,z+dz)]===9)wet=true;
    if(wet){burning.delete(i);paint(i);spawnDebris(x+.5,y+1,z+.5,0xe8f4ff,3,.25);continue}
    b.t-=.12;if(Math.random()<.5)spawnFlame(x+rnd(.2,.8),y+1,z+rnd(.2,.8),.8);
    const wind=state.ev==='storm'?2.2:1;for(const [dx,dy,dz] of NB6)if(Math.random()<(dy>0?.09:.045)*wind&&inb(x+dx,y+dy,z+dz))ignite(idx(x+dx,y+dy,z+dz),b.src);
    for(const e of enemies){if(e.dead||e.fly)continue;if(Math.abs(e.pos.x-x-.5)<1.2&&Math.abs(e.pos.z-z-.5)<1.2&&Math.abs(e.gy-y)<2){dmgEnemy(e,3,false);e.afire=Math.max(e.afire,1)}}
    if(b.src!=='player')for(const m of minions){if(m.wounded)continue;if(Math.abs(m.pos.x-x-.5)<1.1&&Math.abs(m.pos.z-z-.5)<1.1&&Math.abs(m.group.position.y-y)<2){m.burn=(m.burn||0)+1.2;if(m.burn>6){m.burn=0;hurtMinion(m,5)}}}
    if(b.t<=0){if(vox[i]===10)removeVox(i,'env');else{burning.delete(i);spawnDebris(x+.5,y+.5,z+.5,0x3a3030,3,.3);setVox(i,0);settleDirty=true;checkTurretAnchor(i)}}}}

// ───────── fluids: lava and water flow, lava + water = obsidian
let fluidAcc=0;
function tickFluids(dt){fluidAcc+=dt;if(fluidAcc<.22)return;fluidAcc=0;const list=shuffle([...fluids]);
  for(const i of list){const m=vox[i];if(!FLUID(m)){fluids.delete(i);continue}const x=ix(i),z=iz(i),y=iy(i);const L=hp[i],src=fluidSrc.has(i);
    if(y>0){const j=idx(x,y-1,z);if(vox[j]===0){setFluid(j,m,src?4:L,false);if(!src){vox[i]=0;hp[i]=0;fluids.delete(i);markCol(x,z);touch(i)}continue}if(FLUID(vox[j])&&vox[j]!==m){react(i,j);continue}}
    if(L>1)for(const [dx,dz] of NB4){const nx=x+dx,nz=z+dz;if(!inb(nx,y,nz))continue;const k=idx(nx,y,nz),km=vox[k];
      if(km===0){if(Math.random()<.55)setFluid(k,m,L-1,false)}else if(FLUID(km)&&km!==m)react(i,k);else if(km===m&&hp[k]<L-1){hp[k]=L-1;paint(k)}else if(m===8&&isFlam(km)&&Math.random()<.35)ignite(k,'env')}
    if(m===8){const up=y+1<H?idx(x,y+1,z):-1;if(up>=0&&isFlam(vox[up])&&Math.random()<.4)ignite(up,'env');if(Math.random()<.1)spawnFlame(x+rnd(0,1),y+1,z+rnd(0,1),.6);if(Math.random()<.25)paint(i)}
    if(!src&&FLUID(vox[i])){let fed=false;for(const [dx,dz] of NB4){const nx=x+dx,nz=z+dz;if(inb(nx,y,nz)){const k=idx(nx,y,nz);if(vox[k]===m&&hp[k]>L)fed=true}}if(y+1<H&&vox[idx(x,y+1,z)]===m)fed=true;
      if(!fed&&Math.random()<.2){if(L<=1){vox[i]=0;hp[i]=0;fluids.delete(i);markCol(x,z);touch(i)}else{hp[i]=L-1;paint(i)}}}}}
function react(i,j){const li=vox[i]===8?i:j,wi=li===i?j:i;setVox(li,14);setVox(wi,0);const x=ix(wi)+.5,y=iy(wi)+1,z=iz(wi)+.5;steam(x,y,z);SFX.crunch(true)}
function steam(x,y,z){for(let k=0;k<6;k++)spawnFlame(x+rnd(-.6,.6),y+rnd(0,.6),z+rnd(-.6,.6),1.1,true);for(const e of enemies)if(!e.dead&&Math.abs(e.pos.x-x)<1.8&&Math.abs(e.pos.z-z)<1.8)dmgEnemy(e,18,true);for(const m of minions)if(!m.wounded&&Math.abs(m.pos.x-x)<1.4&&Math.abs(m.pos.z-z)<1.4)hurtMinion(m,6)}
function freezeAround(cx,cy,cz,r){let n=0;const R=Math.ceil(r);for(let dy=-R;dy<=R;dy++)for(let dz=-R;dz<=R;dz++)for(let dx=-R;dx<=R;dx++){const x=Math.floor(cx)+dx,y=Math.floor(cy)+dy,z=Math.floor(cz)+dz;if(!inb(x,y,z)||Math.hypot(dx,dy,dz)>r)continue;const i=idx(x,y,z);if(vox[i]===8){setVox(i,14);n++}else if(vox[i]===9&&!state.noIceWater){setVox(i,18);n++}if(burning.has(i)){burning.delete(i);paint(i)}}if(n){spawnDebris(cx,cy+.5,cz,0xe8f4ff,8,.3);SFX.freeze()}return n}

// ───────── special blocks: crystal regenerates, gold pays out
let specAcc=0;
function tickSpecials(dt){specAcc+=dt;if(specAcc<1)return;specAcc=0;let gold=0;
  for(const i of specials){const m=vox[i];if(m===15&&hp[i]<MAT[15].hp){hp[i]=Math.min(MAT[15].hp,hp[i]+MAT[15].hp*.08);paint(i);if(Math.random()<.3)spawnDebris(ix(i)+.5,iy(i)+1,iz(i)+.5,0x8fe3ff,1,.15)}if(m===19&&blue[i])gold++}
  if(gold){state.goldAcc+=gold*.2;if(state.goldAcc>=1){const n=Math.floor(state.goldAcc);state.goldAcc-=n;state.material+=n;if(Math.random()<.35){const g=[...specials].find(i=>vox[i]===19);if(g!==undefined)label({x:ix(g)+.5,y:iy(g),z:iz(g)+.5},`+${n}`,'#c99a1a')}}}}

// ───────── structural settle: anything not connected to bedrock falls
const removedQ=[];const _seenS=new Int32Array(N);let settlePass=0;
// local settle: only components touching removed voxels are checked (greedy downward DFS)
function settle(){settleDirty=false;if(!removedQ.length)return;settlePass++;const starts=[];
  for(const i of removedQ){const x=ix(i),y=iy(i),z=iz(i);for(const [dx,dy,dz] of NB6){const nx=x+dx,ny=y+dy,nz=z+dz;if(inb(nx,ny,nz)){const j=idx(nx,ny,nz);if(SOLIDM(vox[j]))starts.push(j)}}}
  removedQ.length=0;let fell=0;const chestSet=new Set(_chestVox);
  for(const s of starts){if(_seenS[s]===settlePass||!SOLIDM(vox[s]))continue;const comp=[s],st=[s];_seenS[s]=settlePass;let grounded=false;
    while(st.length){const c=st.pop();const x=ix(c),y=iy(c),z=iz(c);if(y===0||chestSet.has(c)){grounded=true;break}if(comp.length>14000){grounded=true;break}
      for(let k=NB6.length-1;k>=0;k--){const [dx,dy,dz]=NB6[(k+3)%6];const nx=x+dx,ny=y+dy,nz=z+dz;if(!inb(nx,ny,nz))continue;const j=idx(nx,ny,nz);if(_seenS[j]===settlePass||!SOLIDM(vox[j]))continue;_seenS[j]=settlePass;comp.push(j);st.push(j)}}
    if(grounded)continue;
    for(const i of comp){const m=vox[i];if(!m)continue;spawnDebris(ix(i)+.5,iy(i)+.5,iz(i)+.5,MAT[m].c,1,.95);if(!blue[i]&&Math.random()<(rown[i]?.1:m>=12&&m<=13?.1:.45))spawnLoot(ix(i)+.5,iy(i)+.6,iz(i)+.5,'material',0,{amount:1});
      const wasBarrel=m===10;vox[i]=0;hp[i]=0;burning.delete(i);damaged.delete(i);specials.delete(i);markCol(ix(i),iz(i));fell++;checkTurretAnchor(i);if(rown[i])rivalHit(i);if(wasBarrel)pendingBooms.push({x:ix(i)+.5,y:iy(i)+.5,z:iz(i)+.5,r:2.5,dmg:90,o:{fire:true,src:'env'},t:.3})}
    for(const i of comp)touch(i)}
  if(fell>0){SFX.boom(fell>20);shake=Math.min(1.2,shake+.3+fell*.02);checkChest()}}

// ───────── voxel ray (Amanatides–Woo DDA)
function voxRay(o,d,withFluid=false){let t0=0,t1=500;const lo=[0,0,0],hi=[W,H,D],O=[o.x,o.y,o.z],Dd=[d.x,d.y,d.z];
  for(let a=0;a<3;a++){if(Math.abs(Dd[a])<1e-9){if(O[a]<lo[a]||O[a]>hi[a])return null}else{let ta=(lo[a]-O[a])/Dd[a],tb=(hi[a]-O[a])/Dd[a];if(ta>tb){const t=ta;ta=tb;tb=t}t0=Math.max(t0,ta);t1=Math.min(t1,tb);if(t0>t1)return null}}
  const ts=t0+1e-5,cell=[0,0,0],step=[0,0,0],tMax=[0,0,0],tDelta=[0,0,0];
  for(let a=0;a<3;a++){const P=O[a]+Dd[a]*ts;cell[a]=clamp(Math.floor(P),0,hi[a]-1);step[a]=Dd[a]>0?1:-1;if(Math.abs(Dd[a])<1e-9){tMax[a]=Infinity;tDelta[a]=Infinity}else{const nb=cell[a]+(Dd[a]>0?1:0);tMax[a]=ts+(nb-P)/Dd[a];tDelta[a]=Math.abs(1/Dd[a])}}
  let prev=-1,t=ts;
  for(let k=0;k<220;k++){const i=idx(cell[0],cell[1],cell[2]);const m=vox[i];if(m&&(SOLIDM(m)||(withFluid&&FLUID(m))))return{i,prev,t};
    prev=i;const a=tMax[0]<tMax[1]?(tMax[0]<tMax[2]?0:2):(tMax[1]<tMax[2]?1:2);t=tMax[a];if(t>t1)return null;cell[a]+=step[a];if(cell[a]<0||cell[a]>=hi[a])return null;tMax[a]+=tDelta[a]}
  return null}

// ───────── fortress layout + blueprint (what the repairers keep built)
const CHEST=new THREE.Vector3(),GATE=new THREE.Vector3();
const inside=(x,z)=>x>=WA&&x<=WB+1&&z>=WA&&z<=WB+1;
let TOWERS=[],OUTPOSTS=[],TOWER_ANCHORS=[],OUTPOST_ANCHORS=[],KEEP_ANCHORS=[],_chestVox=[],HOUSES=[];
function computeLayout(){CHEST.set(CX+.5,GY,CZ+.5);GATE.set(CX,GY,WB+4);
  TOWERS=[[WA,WA],[WB-TS+1,WA],[WA,WB-TS+1],[WB-TS+1,WB-TS+1]];
  OUTPOSTS=[[CX-28,CZ],[CX+28,CZ],[CX,CZ-28],[CX,CZ+30]];
  TOWER_ANCHORS=TOWERS.map(([x,z])=>idx(x+2,GY+TOWER_H-1,z+2));OUTPOST_ANCHORS=OUTPOSTS.map(([x,z])=>idx(x,GY+4,z));
  KEEP_ANCHORS=[[-3,-3],[3,-3],[-3,3],[3,3]].map(([dx,dz])=>idx(CX+dx,GY+KH-1,CZ+dz));
  HOUSES=[[CX-12,CZ-2,'w'],[CX+9,CZ-2,'e'],[CX-2,CZ-12,'n']];
  _chestVox=[];for(let y=GY+1;y>=GY;y--)for(let x=CX-1;x<=CX+1;x++)for(let z=CZ-1;z<=CZ+1;z++)_chestVox.push(idx(x,y,z))}
const CHEST_VOX=()=>_chestVox;
let blueList=[];
// city builder used for the player (arr=blueprint) and for rival cities (style differs)
function buildCity(put,cx,cz,o){const wr=o.wr,wa=cx-wr,wb=cx+wr,WH=o.wh,ts=o.ts,th=o.th,kr=o.kr,kh=o.kh,stone=o.stone,roof=o.roof,tower=o.tower;
  for(let x=wa;x<=wb;x++)for(let z=wa-cx+cz;z<=wb-cx+cz;z++){const edge=x<wa+WT||x>wb-WT||z<cz-wr+WT||z>cz+wr-WT;if(!edge)continue;for(let y=0;y<WH;y++)put(x,GY+y,z,y<7?stone:o.stone2);if((x+z)&1)put(x,GY+WH,z,stone)}
  const tw=[[wa,cz-wr],[wb-ts+1,cz-wr],[wa,cz+wr-ts+1],[wb-ts+1,cz+wr-ts+1]];
  for(const [tx,tz] of tw)for(let x=tx;x<tx+ts;x++)for(let z=tz;z<tz+ts;z++){for(let y=0;y<th;y++)put(x,GY+y,z,tower);if((x===tx||x===tx+ts-1||z===tz||z===tz+ts-1)&&((x+z)&1))put(x,GY+th,z,tower)}
  // keep: hollow tall hall with a gate, two floors, windows, corner spires with roofs and banners
  for(let x=cx-kr;x<=cx+kr;x++)for(let z=cz-kr;z<=cz+kr;z++){const shell=x<=cx-kr+1||x>=cx+kr-1||z<=cz-kr+1||z>=cz+kr-1;
    for(let y=0;y<kh;y++){const win=shell&&(y===7||y===11)&&((x+z)%3===0)&&!(x<=cx-kr+1&&z<=cz-kr+1);if(shell&&!win)put(x,GY+y,z,stone);else if(!shell&&(y===6||y===11)&&!(Math.abs(x-cx)<=1&&Math.abs(z-cz)<=1))put(x,GY+y,z,o.floor)}
    if(x===cx-kr||x===cx+kr||z===cz-kr||z===cz+kr){if((x+z)&1)put(x,GY+kh,z,stone)}else put(x,GY+kh-1,z,stone)}
  for(let x=cx-1;x<=cx+1;x++)for(let z=cz+kr-1;z<=cz+kr;z++)for(let y=0;y<5;y++)put(x,GY+y,z,o.gate);
  for(const [dx,dz] of [[-kr,-kr],[kr-2,-kr],[-kr,kr-2],[kr-2,kr-2]]){const sx=cx+dx,sz=cz+dz;for(let x=sx;x<sx+3;x++)for(let z=sz;z<sz+3;z++)for(let y=kh;y<kh+5;y++)put(x,GY+y,z,tower);
    for(let k=0;k<3;k++)for(let x=sx-1+k;x<=sx+3-k;x++)for(let z=sz-1+k;z<=sz+3-k;z++){if(k<2&&Math.abs(x-sx-1)<=0&&Math.abs(z-sz-1)<=0)continue;put(x,GY+kh+5+k,z,roof)}
    put(sx+1,GY+kh+5,sz+1,tower);put(sx+1,GY+kh+8,sz+1,o.banner);put(sx+1,GY+kh+9,sz+1,o.banner)}
  return tw}
function defaultBlue(arr){arr.fill(0);const put=(x,y,z,m)=>{if(inb(x,y,z))arr[idx(x,y,z)]=m};
  buildCity(put,CX,CZ,{wr:WR,wh:state.wallH,ts:TS,th:TOWER_H,kr:KR,kh:KH,stone:3,stone2:4,tower:6,roof:22,floor:3,gate:7,banner:23});
  for(let x=CX-1;x<=CX+1;x++)for(let z=CZ-1;z<=CZ+1;z++){for(let y=0;y<2;y++)arr[idx(x,GY+y,z)]=5;arr[idx(x,GY+2,z)]=0}
  // outer gate (4 wide) in the south wall
  for(let x=CX-2;x<=CX+1;x++)for(let z=WB-WT+1;z<=WB;z++){for(let y=0;y<4;y++)arr[idx(x,GY+y,z)]=7;arr[idx(x,GY+state.wallH,z)]=0}
  for(let x=CX-3;x<=CX+2;x++)for(let z=WB-WT+1;z<=WB;z++)if(arr[idx(x,GY+4,z)])arr[idx(x,GY+4,z)]=2;
  // houses: hollow, open doorway, pitched roof
  for(const [hx,hz,f] of HOUSES){for(let x=hx;x<hx+4;x++)for(let z=hz;z<hz+4;z++){const sh=x===hx||x===hx+3||z===hz||z===hz+3;for(let y=0;y<3;y++)if(sh)arr[idx(x,GY+y,z)]=y===0?3:2}
    const door=f==='w'?[hx+3,hz+1]:f==='e'?[hx,hz+1]:[hx+1,hz+3];for(let y=0;y<2;y++)for(let k=0;k<2;k++){const dx=f==='n'?k:0,dz=f==='n'?0:k;arr[idx(door[0]+dx,GY+y,door[1]+dz)]=0}
    for(let k=0;k<2;k++)for(let x=hx-1+k;x<=hx+4-k;x++)for(let z=hz-1+k;z<=hz+4-k;z++)arr[idx(x,GY+3+k,z)]=22}
  for(const [ox,oz] of OUTPOSTS)for(let dx=-2;dx<=2;dx++)for(let dz=-2;dz<=2;dz++){for(let y=0;y<4;y++)arr[idx(ox+dx,GY+y,oz+dz)]=3;arr[idx(ox+dx,GY+4,oz+dz)]=2;if((Math.abs(dx)===2||Math.abs(dz)===2)&&((dx+dz)&1))arr[idx(ox+dx,GY+5,oz+dz)]=2}}
function rebuildBlueList(){blueList=[];for(let i=0;i<N;i++)if(blue[i])blueList.push(i)}
function buildBlueprint(){defaultBlue(baseBlue);blue.set(baseBlue);for(const i of state.erased)blue[i]=0;for(const [i,m] of state.custom)blue[i]=m;rebuildBlueList()}
function placeBlue(i,m){state.erased.delete(i);state.custom.set(i,m);if(!blue[i])blueList.push(i);blue[i]=m}
function eraseBlue(i){if(baseBlue[i])state.erased.add(i);state.custom.delete(i);state.prepaid.delete(i);if(blue[i]){blue[i]=0;const k=blueList.indexOf(i);if(k>=0)blueList.splice(k,1)}}
function chestAlive(){let n=0;for(const i of _chestVox)if(vox[i]===5)n++;return n}
function checkChest(){if(state.running&&chestAlive()===0)gameOver()}

// zones kept free of terrain decoration: player city, rival cities, outposts
function cityZones(){const z=[[CX,CZ,WR+5]];for(const [ox,oz] of OUTPOSTS)z.push([ox,oz,5]);for(const R of (typeof rivals!=='undefined'?rivals:[]))z.push([R.cx,R.cz,R.wr+5]);return z}
function genWorld(){vox.fill(0);hp.fill(0);rown.fill(0);fluids.clear();fluidSrc.clear();burning.clear();specials.clear();damaged.clear();pendingBooms.length=0;resetFluidSlots();resetVoxSlots();
  computeLayout();planRivals();buildBlueprint();
  const put=(x,y,z,m)=>{if(!inb(x,y,z))return;const i=idx(x,y,z);vox[i]=m;hp[i]=FLUID(m)?4:MAT[m].hp;if(FLUID(m)){fluids.add(i);fluidSrc.add(i)}};
  const zones=cityZones();const inZone=(x,z,r)=>zones.some(([zx,zz,zr])=>Math.abs(x-zx)<zr+r&&Math.abs(z-zz)<zr+r);
  const LAVA=[],PONDS=[];for(let k=0;k<10;k++){const x=rint(8,W-9),z=rint(8,D-9),r=rnd(2.8,6);if(!inZone(x,z,r+2))LAVA.push([x,z,r])}for(let k=0;k<12;k++){const x=rint(8,W-9),z=rint(8,D-9),r=rnd(3,7);if(!inZone(x,z,r+2)&&!LAVA.some(([a,b,c])=>Math.hypot(a-x,b-z)<c+r+3))PONDS.push([x,z,r])}
  const nearPool=(x,z,r)=>LAVA.some(([px,pz,pr])=>Math.hypot(x-px,z-pz)<pr+r)||PONDS.some(([px,pz,pr])=>Math.hypot(x-px,z-pz)<pr+r);
  const HILLS=[];for(let k=0;k<26;k++){const x=rint(6,W-7),z=rint(6,D-7),hr=rnd(4,9);if(inZone(x,z,hr+2)||nearPool(x,z,hr))continue;HILLS.push([x,z,hr,rint(2,5)])}
  for(let z=0;z<D;z++)for(let x=0;x<W;x++){put(x,0,z,1);for(let y=1;y<GY-1;y++)put(x,y,z,12);put(x,GY-1,z,13);
    for(const [hx,hz,hr,hh] of HILLS){const d=Math.hypot(x-hx,z-hz);if(d<hr){const h=Math.round(hh*(1-d/hr)+.4);for(let y=0;y<h;y++){put(x,GY-1+y,z,12);put(x,GY+y,z,y===h-1&&hh>=4&&d<hr*.35?3:13)}}}
    for(const [px,pz,pr] of LAVA){const d=Math.hypot(x-px,z-pz);if(d<pr){put(x,GY-1,z,8);put(x,GY-2,z,14);if(d<pr*.5){put(x,GY-2,z,8);put(x,GY-3,z,14)}}}
    for(const [px,pz,pr] of PONDS){const d=Math.hypot(x-px,z-pz);if(d<pr){put(x,GY-1,z,9);if(d<pr*.6)put(x,GY-2,z,9)}}}
  const free=(x,z,r)=>x>=2&&z>=2&&x<=W-3&&z<=D-3&&!inZone(x,z,r)&&!nearPool(x,z,1.5+r);
  const ground=(x,z)=>{let y=H-1;while(y>0&&!vox[idx(x,y,z)])y--;return y+1};
  let placed=0,tries=0;
  while(placed<230&&tries++<6000){const x=rint(2,W-3),z=rint(2,D-3);if(!free(x,z,2))continue;const g=ground(x,z);if(vox[idx(x,g-1,z)]!==13)continue;const h=rint(3,6),big=Math.random()<.35;
    for(let y=0;y<h;y++)put(x,g+y,z,2);const R=big?2:1;for(let dx=-R;dx<=R;dx++)for(let dz=-R;dz<=R;dz++)for(let dy=-1;dy<=R;dy++){const yy=g+h-1+dy;if(Math.abs(dx)+Math.abs(dz)+Math.max(0,dy)>R+1)continue;if(inb(x+dx,yy,z+dz)&&!vox[idx(x+dx,yy,z+dz)])put(x+dx,yy,z+dz,11)}put(x,g+h+R,z,11);placed++}
  placed=0;tries=0;while(placed<52&&tries++<2200){const x=rint(3,W-10),z=rint(3,D-10);if(!free(x,z,2)||!free(x+7,z+7,2))continue;const len=rint(4,10),dir=Math.random()<.5;for(let k=0;k<len;k++){const xx=dir?x+k:x,zz=dir?z:z+k;const g=ground(xx,zz);const h=rint(1,4);for(let y=0;y<h;y++)if(Math.random()<.85)put(xx,g+y,zz,3)}placed++}
  placed=0;tries=0;while(placed<50&&tries++<2200){const x=rint(3,W-4),z=rint(3,D-4);if(!free(x,z,1))continue;const n=rint(3,7);for(let k=0;k<n;k++){const xx=x+rint(-1,1),zz=z+rint(-1,1);if(free(xx,zz,0))put(xx,ground(xx,zz),zz,10)}placed++}
  placed=0;tries=0;while(placed<18&&tries++<1400){const x=rint(4,W-5),z=rint(4,D-5);if(!free(x,z,2))continue;const g=ground(x,z);for(let k=0;k<rint(3,7);k++)put(x+rint(-1,1),g+rint(0,2),z+rint(-1,1),15);placed++}
  for(const i of _chestVox){const x=ix(i),z=iz(i);for(let y=1;y<GY;y++)put(x,y,z,1)}
  for(let i=0;i<N;i++)if(blue[i]){vox[i]=blue[i];hp[i]=maxHpOf(blue[i])}
  buildRivals(put);
  for(let i=0;i<N;i++){if(vox[i]===15||vox[i]===19)specials.add(i)}
  colS.fill(-1);colE.fill(-1);colT.fill(-1);for(let i=0;i<N;i++)if(vox[i])paint(i);initTufts()}
