// ───────── entities: particles, beams, loot, equipment, turrets, projectiles
const _e=new THREE.Euler(),_q=new THREE.Quaternion(),_p=new THREE.Vector3(),_s=new THREE.Vector3();
const _boxGeo=new Map();function boxGeo(w,h,d){const k=(w*100|0)+'_'+(h*100|0)+'_'+(d*100|0);let g=_boxGeo.get(k);if(!g){g=new THREE.BoxGeometry(w,h,d);_boxGeo.set(k,g)}return g}
function box(w,h,d,color,x,y,z,parent){const m=new THREE.Mesh(boxGeo(w,h,d),new THREE.MeshLambertMaterial({color}));m.position.set(x,y,z);m.castShadow=true;parent.add(m);return m}
function eyes(parent,y,z,w){box(.09,.12,.05,0x2b2d4a,-w,y,z,parent);box(.09,.12,.05,0x2b2d4a,w,y,z,parent)}
function clearGroup(g){while(g.children.length)g.remove(g.children[0])}
const cellSolid=(x,y,z)=>{const fx=Math.floor(x),fy=Math.floor(y),fz=Math.floor(z);return fy<0||(inb(fx,fy,fz)&&SOLIDM(vox[idx(fx,fy,fz)]))};

// ── debris
const DEB=2600;const debMesh=new THREE.InstancedMesh(new THREE.BoxGeometry(1,1,1),new THREE.MeshLambertMaterial(),DEB);debMesh.frustumCulled=false;debMesh.castShadow=true;
debMesh.instanceColor=new THREE.InstancedBufferAttribute(new Float32Array(DEB*3),3);for(let i=0;i<DEB;i++)debMesh.setMatrixAt(i,_zero);scene.add(debMesh);
const debris=new Array(DEB).fill(null);let debHead=0;
function spawnDebris(x,y,z,color,n,size){for(let k=0;k<n;k++){const s=debHead;debHead=(debHead+1)%DEB;debris[s]={x:x+rnd(-.3,.3),y:y+rnd(-.2,.3),z:z+rnd(-.3,.3),vx:rnd(-4,4),vy:rnd(2,8),vz:rnd(-4,4),s:size*rnd(.5,1.1),rx:rnd(0,6),ry:rnd(0,6),life:rnd(1.3,2.3)};_c.setHex(color);debMesh.setColorAt(s,_c)}debMesh.instanceColor.needsUpdate=true}
function updateDebris(dt){let any=false;for(let s=0;s<DEB;s++){const d=debris[s];if(!d)continue;any=true;d.life-=dt;if(d.life<=0){debris[s]=null;debMesh.setMatrixAt(s,_zero);continue}
  d.vy-=22*dt;d.x+=d.vx*dt;d.y+=d.vy*dt;d.z+=d.vz*dt;d.rx+=d.vx*dt;d.ry+=d.vz*dt;
  if(d.vy<0&&cellSolid(d.x,d.y-d.s/2,d.z)){d.y=Math.floor(d.y-d.s/2)+1+d.s/2;d.vy=-d.vy*.35;d.vx*=.7;d.vz*=.7}
  const sc=d.life<.5?d.s*d.life/.5:d.s;const c=Math.cos(d.rx)*sc,sn=Math.sin(d.rx)*sc,e=_m.elements;e[0]=c;e[1]=0;e[2]=-sn;e[3]=0;e[4]=0;e[5]=sc;e[6]=0;e[7]=0;e[8]=sn;e[9]=0;e[10]=c;e[11]=0;e[12]=d.x;e[13]=d.y;e[14]=d.z;e[15]=1;debMesh.setMatrixAt(s,_m)}
  if(any)debMesh.instanceMatrix.needsUpdate=true}

// ── flames
const FL=1600;const flameMesh=new THREE.InstancedMesh(new THREE.BoxGeometry(.32,.32,.32),new THREE.MeshBasicMaterial({transparent:true,opacity:.9}),FL);flameMesh.frustumCulled=false;
flameMesh.instanceColor=new THREE.InstancedBufferAttribute(new Float32Array(FL*3),3);for(let i=0;i<FL;i++)flameMesh.setMatrixAt(i,_zero);scene.add(flameMesh);
const flames=new Array(FL).fill(null);let flHead=0;
function spawnFlame(x,y,z,s,blueish){const k=flHead;flHead=(flHead+1)%FL;flames[k]={x,y,z,vy:rnd(1.5,3.2),vx:rnd(-.4,.4),vz:rnd(-.4,.4),life:rnd(.35,.7),s:s*rnd(.7,1.2),b:!!blueish}}
function updateFlames(dt){let any=false;for(let k=0;k<FL;k++){const f=flames[k];if(!f)continue;any=true;f.life-=dt;if(f.life<=0){flames[k]=null;flameMesh.setMatrixAt(k,_zero);continue}
  f.y+=f.vy*dt;f.x+=f.vx*dt;f.z+=f.vz*dt;const t=f.life/.7,sc=f.s*(.4+t*.8);_m.makeScale(sc,sc,sc);_m.setPosition(f.x,f.y,f.z);flameMesh.setMatrixAt(k,_m);
  if(f.b)_c.setHSL(.55,1,.6+t*.2);else _c.setHSL(.02+t*.09,1,.45+t*.2);flameMesh.setColorAt(k,_c)}
  if(any){flameMesh.instanceMatrix.needsUpdate=true;flameMesh.instanceColor.needsUpdate=true}}
function sparkle(x,y,z,color,n){for(let k=0;k<n;k++)spawnDebris(x,y,z,color,1,.18)}

// ── lightning beams
const beams=[];const beamMat=new THREE.LineBasicMaterial({color:0x9fe8ff,transparent:true,opacity:.95});
function beam(a,b){const pts=[];const n=7;for(let k=0;k<=n;k++){const t=k/n,j=k&&k<n?1:0;pts.push(new THREE.Vector3(a.x+(b.x-a.x)*t+j*rnd(-.3,.3),a.y+(b.y-a.y)*t+j*rnd(-.3,.3),a.z+(b.z-a.z)*t+j*rnd(-.3,.3)))}
  const l=new THREE.Line(new THREE.BufferGeometry().setFromPoints(pts),beamMat);scene.add(l);beams.push({l,life:.16})}
function updateBeams(dt){for(let i=beams.length-1;i>=0;i--){const b=beams[i];b.life-=dt;if(b.life<=0){scene.remove(b.l);b.l.geometry.dispose();beams.splice(i,1)}}}

// ───────── equipment
let itemSeq=0;
const EQUIP=[
  {k:'espada',slot:'arma',n:'Espada',atk:1.25},{k:'machado',slot:'arma',n:'Machado',atk:1.5,spd:.92},
  {k:'lanca',slot:'arma',n:'Lança',atk:1.2,reach:.7},{k:'martelo',slot:'arma',n:'Martelo de guerra',atk:1.7,spd:.85,stun:.25},
  {k:'adaga',slot:'arma',n:'Adagas gêmeas',atk:1.1,rate:1.5},
  {k:'couro',slot:'armadura',n:'Armadura de couro',def:.15},{k:'malha',slot:'armadura',n:'Cota de malha',def:.28,spd:.96},
  {k:'placas',slot:'armadura',n:'Armadura de placas',def:.42,spd:.86},{k:'escudo',slot:'armadura',n:'Escudo de torre',def:.3,thorns:.25},
  {k:'botas',slot:'acessorio',n:'Botas ligeiras',spd:1.3},{k:'amuleto',slot:'acessorio',n:'Amuleto de vida',hp:1.6},
  {k:'luneta',slot:'acessorio',n:'Luneta',gun:1.35},{k:'luvas',slot:'acessorio',n:'Luvas de pedreiro',work:1.4},
  {k:'mochila',slot:'acessorio',n:'Mochila sem fundo',cap:3},{k:'anel',slot:'acessorio',n:'Anel de brasa',burn:1},
];
const SLOT_N={arma:'Arma',armadura:'Armadura',acessorio:'Acessório'};
const ICO={espada:'🗡️',machado:'🪓',lanca:'🔱',martelo:'🔨',adaga:'🔪',couro:'🦺',malha:'⛓️',placas:'🛡️',escudo:'🛡️',botas:'👢',amuleto:'📿',luneta:'🔭',luvas:'🧤',mochila:'🎒',anel:'💍'};
function makeEquip(r,k){const b=k?EQUIP.find(e=>e.k===k):pick(EQUIP);const f=1+r*.45;const st={};
  for(const s of ['atk','spd','hp','gun','work','rate'])if(b[s])st[s]=b[s]>=1?1+(b[s]-1)*f:1-(1-b[s])/f;
  if(b.def)st.def=Math.min(.7,b.def*(1+r*.35));if(b.cap)st.cap=b.cap+r;if(b.reach)st.reach=b.reach;if(b.stun)st.stun=b.stun*(1+r*.3);if(b.thorns)st.thorns=b.thorns*(1+r*.5);if(b.burn)st.burn=1;
  return{id:++itemSeq,k:b.k,slot:b.slot,n:b.n,r,st}}
const pct=v=>Math.round(v*100)+'%';
function itemLines(it){const s=it.st,o=[];if(s.atk)o.push(`Dano +${pct(s.atk-1)}`);if(s.rate)o.push(`Ataque ${pct(s.rate-1)} mais rápido`);if(s.def)o.push(`Defesa ${pct(s.def)}`);
  if(s.spd)o.push(`Velocidade ${s.spd>=1?'+':''}${pct(s.spd-1)}`);if(s.hp)o.push(`Vida +${pct(s.hp-1)}`);if(s.gun)o.push(`Armas operadas +${pct(s.gun-1)}`);if(s.work)o.push(`Trabalho +${pct(s.work-1)}`);
  if(s.cap)o.push(`Carrega +${s.cap}`);if(s.reach)o.push('Alcance maior');if(s.stun)o.push(`${pct(s.stun)} de atordoar`);if(s.thorns)o.push(`Devolve ${pct(s.thorns)} do dano`);if(s.burn)o.push('Golpes incendeiam');return o}
const itemIco=it=>ICO[it.k]||'❔';
const ROLE_W={sol:{atk:3,def:3,spd:1,hp:2,rate:2,stun:2,thorns:2,burn:1,reach:1},gun:{gun:4,def:1.5,hp:1,spd:.3},rep:{work:4,spd:1.5,def:1,hp:.5},col:{cap:1.3,spd:2.5,def:1,hp:.5},med:{spd:2,hp:1.5,def:1.5,work:1}};
function itemScore(it,role){if(!it)return 0;const w=ROLE_W[role];let s=0;for(const k in it.st){const v=it.st[k],wt=w[k]||0;const g=(k==='def'||k==='stun'||k==='thorns'||k==='reach')?v*2:k==='cap'?v*.5:k==='burn'?.6:v-1;s+=g*wt}return s+it.r*.01}
function autoEquip(it){let best=null,gain=.02;for(const m of minions){const g=itemScore(it,m.role)-itemScore(m.eq[it.slot],m.role);if(g>gain){gain=g;best=m}}if(best){equipItem(best,it);toast(`${best.name} equipou ${it.n}`,RARITY[it.r].css);return true}return false}
function equipItem(m,it){const a=state.inv.armory,k=a.indexOf(it);if(k>=0)a.splice(k,1);const old=m.eq[it.slot];if(old)a.push(old);m.eq[it.slot]=it;recompute(m);sparkle(m.pos.x,m.group.position.y+1.2,m.pos.z,RARITY[it.r].c,6);SFX.pop()}
function unequip(m,slot){const it=m.eq[slot];if(!it)return;m.eq[slot]=null;state.inv.armory.push(it);recompute(m)}
function sellValue(it){return 3+it.r*it.r*4+it.r*3}

// ───────── loot: everything that drops is physical, glows by rarity and is carried home
const loot=[];
const LG={material:new THREE.OctahedronGeometry(.32,0),blade:new THREE.BoxGeometry(.12,.62,.06),guard:new THREE.BoxGeometry(.34,.08,.1),armor:new THREE.BoxGeometry(.46,.42,.24),
  trinket:new THREE.TorusGeometry(.18,.07,6,14),block:new THREE.BoxGeometry(.44,.44,.44),turret:new THREE.CylinderGeometry(.24,.32,.42,8),recruit:new THREE.ConeGeometry(.3,.6,5),
  chestBody:new THREE.BoxGeometry(.86,.46,.56),chestLid:new THREE.BoxGeometry(.9,.2,.6),ring:new THREE.RingGeometry(.36,.52,22),beam:new THREE.CylinderGeometry(.1,.18,7,6,1,true)};
const lmat=(c,e)=>new THREE.MeshLambertMaterial({color:c,emissive:c,emissiveIntensity:e});
function lootName(L){const d=L.data;switch(L.kind){case'material':return`${d.amount} material`;case'equip':return d.item.n;case'block':return`${d.n}× ${MAT[d.m].n}`;case'turret':return TURRETS[d.type].n;case'recruit':return`Recruta ${ROLES[d.role].n}`;case'treasure':return'Baú do tesouro'}return'?'}
let spawnLootHook=null;
function spawnLoot(x,y,z,kind,r,data={}){if(spawnLootHook)spawnLootHook(x,y,z,kind,r,data);
  if(kind==='material'){for(const o of loot)if(o.kind==='material'&&!o.claimed&&!o.carried&&Math.abs(o.x-x)<2.2&&Math.abs(o.z-z)<2.2){o.data.amount+=data.amount;const sc=1+Math.min(1.2,o.data.amount*.07);o.main.scale.set(sc,sc,sc);return o}if(loot.length>420)return null}
  const g=new THREE.Group();const rc=RARITY[r].c;let main;
  if(kind==='material'){main=new THREE.Mesh(LG.material,lmat(0xf0bd5a,.15));g.add(main)}
  else if(kind==='equip'){main=new THREE.Group();const sl=data.item.slot;if(sl==='arma'){const b=new THREE.Mesh(LG.blade,lmat(rc,.45));const gd=new THREE.Mesh(LG.guard,lmat(0x6b5a3e,.1));gd.position.y=-.2;main.add(b,gd);main.rotation.z=.6}else if(sl==='armadura')main.add(new THREE.Mesh(LG.armor,lmat(rc,.35)));else main.add(new THREE.Mesh(LG.trinket,lmat(rc,.55)));g.add(main)}
  else if(kind==='block'){main=new THREE.Mesh(LG.block,lmat(MAT[data.m].c,.3));g.add(main)}
  else if(kind==='turret'){main=new THREE.Mesh(LG.turret,lmat(0x4a4866,.1));const band=new THREE.Mesh(new THREE.TorusGeometry(.3,.05,6,16),lmat(rc,.6));band.rotation.x=Math.PI/2;main.add(band);g.add(main)}
  else if(kind==='recruit'){main=new THREE.Mesh(LG.recruit,lmat(rc,.5));g.add(main)}
  else if(kind==='treasure'){main=new THREE.Group();main.add(new THREE.Mesh(LG.chestBody,lmat(0x8a5a33,.1)));const lid=new THREE.Mesh(LG.chestLid,lmat(rc,.5));lid.position.y=.32;main.add(lid);g.add(main)}
  let ring=null;if(r>=2||kind==='treasure'){ring=new THREE.Mesh(LG.ring,new THREE.MeshBasicMaterial({color:rc,transparent:true,opacity:.75,side:THREE.DoubleSide,depthWrite:false}));ring.rotation.x=-Math.PI/2;ring.position.y=-.38;g.add(ring)}
  let bm=null;if(r>=3||kind==='treasure'){bm=new THREE.Mesh(LG.beam,new THREE.MeshBasicMaterial({color:rc,transparent:true,opacity:.22,depthWrite:false}));bm.position.y=3.2;g.add(bm)}
  g.position.set(x,y,z);g.traverse(o=>{if(o.isMesh)o.castShadow=true});scene.add(g);
  const L={g,main,ring,bm,kind,r,data,x,y,z,vx:rnd(-2,2),vy:rnd(3,6),vz:rnd(-2,2),claimed:null,carried:null,t:rnd(0,6),age:0,prio:false,unreach:0,rest:false};
  g.userData.loot=L;loot.push(L);
  if(r>=2){toast(`${lootName(L)} ${RARITY[r].n}!`,RARITY[r].css);SFX.loot(r)}
  return L}
function removeLoot(L){scene.remove(L.g);const i=loot.indexOf(L);if(i>=0)loot.splice(i,1)}
function updateLoot(dt){for(let k=loot.length-1;k>=0;k--){const L=loot[k];if(!L)continue;if(L.home){L.home.t+=dt;const f=Math.min(1,L.home.t/1.3),h=L.home;L.x=h.x+(CHEST.x-h.x)*f;L.z=h.z+(CHEST.z-h.z)*f;L.y=h.y+(GY+2-h.y)*f+Math.sin(f*Math.PI)*8;L.g.position.set(L.x,L.y,L.z);L.main.rotation.y+=dt*8;if(Math.random()<.5)spawnFlame(L.x,L.y,L.z,.35,true);if(f>=1)deposit(L,null);continue}
    if(L.kind!=='treasure'&&!L.carried&&!L.claimed&&L.age>(state.portal?30-state.portal*8:75)&&L.rest){L.home={t:0,x:L.x,y:L.y,z:L.z};continue}}
  for(const L of loot){if(L.home)continue;L.t+=dt;L.age+=dt;
    if(L.carried){const m=L.carried;const k=L.slot||0;L.g.position.set(m.pos.x,m.group.position.y+1.55+k*.42+Math.sin(L.t*6)*.05,m.pos.z);L.main.rotation.y+=dt*2;continue}
    if(!L.rest){L.vy-=20*dt;L.x+=L.vx*dt;L.z+=L.vz*dt;L.y+=L.vy*dt;L.x=clamp(L.x,.3,W-.3);L.z=clamp(L.z,.3,D-.3);
      if(L.vy<0&&cellSolid(L.x,L.y-.45,L.z)){L.y=Math.floor(L.y-.45)+1.45;L.vy*=-.3;L.vx*=.55;L.vz*=.55;
        if(L.y>GY+1.6&&!inside(L.x,L.z)===false){const dx=CX-L.x,dz=CZ-L.z,dl=Math.hypot(dx,dz)||1;L.vx+=dx/dl*2.5;L.vz+=dz/dl*2.5;L.vy=2.5}
        else if(L.y>GY+1.6){L.vx+=rnd(-2,2);L.vz+=rnd(-2,2);L.vy=2.5}
        else if(Math.abs(L.vy)<.6&&Math.hypot(L.vx,L.vz)<.3)L.rest=true}
      if(L.y<-6)L.y=GY+3}
    else if(!cellSolid(L.x,L.y-.6,L.z))L.rest=false;
    const fl=inb(Math.floor(L.x),Math.floor(L.y-.5),Math.floor(L.z))?vox[idx(Math.floor(L.x),Math.floor(L.y-.5),Math.floor(L.z))]:0;
    const bob=fl===8||fl===9?Math.sin(L.t*2)*.15:Math.sin(L.t*3)*.08;
    L.g.position.set(L.x,L.y+bob,L.z);L.main.rotation.y+=dt*1.5;
    if(L.ring){const p=L.prio?1.3+Math.sin(L.t*8)*.25:1;L.ring.scale.set(p,p,p)}if(L.bm)L.bm.material.opacity=.14+Math.sin(L.t*3)*.08;
    if(L.kind==='treasure')L.main.rotation.y=Math.sin(L.t*1.5)*.3}}
function lootPick(kind,r,big){const k=Math.random();
  if(kind==='any'){if(k<.42)return['equip',{item:makeEquip(r)}];if(k<.72)return['block',randBlockPack(r)];if(k<.9)return['turret',{type:randTurretType()}];return['material',{amount:2+r*2}]}}
function randBlockPack(r){let pool=(r>=3?[16,17,18,15,10,14,19,20,9,8]:r>=2?[16,17,18,15,10,14,19,9]:r>=1?[16,17,18,15,10,14]:[16,17,18,10]).filter(m=>isUnlocked('block',m));if(!pool.length)pool=[16,17,10];const m=pick(pool);return{m,n:FLUID(m)?1+Math.floor(r/2):4+r*3+rint(0,3)}}
function randTurretType(){const p=['ballista','flamer','mortar','tesla','frost','cannon','ballista','cannon','catapult'].filter(t=>isUnlocked('turret',t));return pick(p.length?p:['cannon'])}
function openTreasure(L){removeLoot(L);const r=L.r;const n=2+Math.ceil(r*.7)+rint(0,1);
  for(let k=0;k<n;k++){const rr=k===0?r:Math.max(0,Math.min(r,rollRarity(r*.06+state.luck)));const [kind,data]=lootPick('any',rr);
    const it=spawnLoot(L.x,L.y+.6,L.z,kind,rr,data);if(it){const a=k/n*Math.PI*2;it.vx=Math.cos(a)*rnd(3,5);it.vz=Math.sin(a)*rnd(3,5);it.vy=rnd(6,9)}}
  if(Math.random()<.25+r*.1)spawnLoot(L.x,L.y+.6,L.z,'recruit',Math.max(1,r-1),{role:pick(['rep','col','gun','sol','med'])});
  for(let k=0;k<4;k++)spawnDebris(L.x,L.y+.5,L.z,pick([0xffcf3d,RARITY[r].c,0xff8a5c,0x5cc08c]),6,.22);
  SFX.open();SFX.loot(r);hitstop=Math.max(hitstop,.07);shake=Math.max(shake,.3);toast(`Baú ${RARITY[r].n} aberto!`,RARITY[r].css)}
function addBlocks(m,n){state.inv.blocks[m]=(state.inv.blocks[m]||0)+n}
function deposit(L,m){const d=L.data;if(m)gainXP(m,.6+L.r*.6);if(L.kind==='treasure'){L.y=GY+1.5;L.x=CHEST.x;L.z=CHEST.z+2.5;openTreasure(L);return}removeLoot(L);
  switch(L.kind){
    case'material':{let a=d.amount;if(m&&m.trait==='Sortudo'&&Math.random()<.2){a*=2;label(m.pos,'Sorte! ×2','#5cc08c')}state.material+=a;label(m?m.pos:CHEST,`+${a}`,'#b8862f');SFX.coin();break}
    case'equip':{state.inv.armory.push(d.item);state.newItems++;if(!(state.autoEquip&&autoEquip(d.item)))toast(`${d.item.n} ${RARITY[L.r].n} no arsenal`,RARITY[L.r].css);break}
    case'block':{addBlocks(d.m,d.n);state.newItems++;toast(`+${d.n} ${MAT[d.m].n} para construir`,RARITY[L.r].css);break}
    case'turret':{state.inv.turrets.push({type:d.type,r:L.r});state.newItems++;toast(`${TURRETS[d.type].n} ${RARITY[L.r].n} pronta para instalar`,RARITY[L.r].css);break}
    case'recruit':{if(!roleFree(d.role)){const alt=Object.keys(ROLES).filter(roleFree);if(alt.length)d.role=pick(alt)}if(minions.length>=MAX_MINIONS+MAX_MINIONS_BONUS||!roleFree(d.role)){const g=2*(L.r+1);state.material+=g;toast(`Cidadela lotada: o recruta virou ${g} material`,'r0');break}const nm=makeMinion(d.role,L.r,CHEST.x,CHEST.z+2.5);toast(`${nm.name}, ${ROLES[d.role].n} ${RARITY[L.r].n}, chegou!`,RARITY[L.r].css);break}}
  if(L.r>=1)SFX.loot(L.r);refreshPanels()}

// ───────── turrets: defensive weapons placed on any block
const TURRETS={
  cannon:{n:'Canhão',ico:'💥',range:36,reload:1.25,dmg:26,hp:150,v:3,d:'Bala pesada com estilhaços.'},
  ballista:{n:'Balista',ico:'🏹',range:42,reload:.7,dmg:17,hp:110,v:2,d:'Rápida, atravessa 3 Devoradores, caça Voadores.'},
  flamer:{n:'Lança-chamas',ico:'🔥',range:11,reload:.1,dmg:3.4,hp:130,v:2,d:'Curto alcance, incendeia tudo à frente.'},
  mortar:{n:'Morteiro',ico:'🎇',range:48,minRange:7,reload:3.1,dmg:50,hp:120,v:3,d:'Tiro em arco que abre crateras. Não acerta Voadores.'},
  tesla:{n:'Torre Tesla',ico:'⚡',range:20,reload:1.5,dmg:22,hp:110,v:2,d:'Raio que salta entre 4 alvos; dobra na água.'},
  catapult:{n:'Catapulta',ico:'🛢️',range:58,minRange:10,reload:5.2,dmg:95,hp:140,v:4,d:'Arremessa barris explosivos em arco: área enorme e fogo. Não acerta Voadores.'},
  frost:{n:'Canhão de gelo',ico:'❄️',range:28,reload:1.1,dmg:9,hp:120,v:2,d:'Congela Devoradores e transforma lava em obsidiana.'},
};
const turrets=[];const LOB=t=>t==='mortar'||t==='catapult';const BARREL_MAT=new THREE.MeshLambertMaterial({color:0xc9413b,emissive:0x5a1a10});
function turretAt(anchor){return turrets.find(t=>t.alive&&t.anchor===anchor)}
function buildTurretModel(type,r,g,pivot){const dark=0x4a4866,mid=0x6d6a8a;
  if(type==='cannon'){box(.9,.35,.9,mid,0,.17,0,g);box(.38,.38,1.25,dark,0,.1,.45,pivot);box(.5,.5,.3,0x7d7a9e,0,.1,-.1,pivot)}
  else if(type==='ballista'){box(.8,.3,.8,0x8a6a45,0,.15,0,g);box(1.3,.1,.12,0xb5895a,0,.15,.25,pivot);box(.12,.12,1.1,0x6b5235,0,.12,.1,pivot);box(.06,.06,.9,0xdfe6f0,0,.22,.2,pivot)}
  else if(type==='flamer'){box(.8,.3,.8,mid,0,.15,0,g);const t=new THREE.Mesh(new THREE.CylinderGeometry(.3,.3,.6,10),new THREE.MeshLambertMaterial({color:0xc9413b}));t.position.set(0,.25,-.1);t.castShadow=true;pivot.add(t);box(.18,.18,.8,0x3a3a4a,0,.2,.45,pivot)}
  else if(type==='catapult'){box(1.1,.3,1.1,0x8a6a45,0,.15,0,g);for(const s of[-1,1])box(.12,.7,.12,0x6b5235,s*.4,.5,0,g);const arm=box(.12,.12,1.4,0xb5895a,0,.55,.1,pivot);arm.rotation.x=-.5;box(.4,.35,.4,0xc9413b,0,.95,-.45,pivot)}
  else if(type==='mortar'){box(1,.3,1,mid,0,.15,0,g);const b=box(.6,.6,.8,dark,0,.25,.1,pivot);b.rotation.x=-.8}
  else if(type==='tesla'){box(.7,.3,.7,0x5b6fae,0,.15,0,g);box(.3,1.1,.3,0x8ea9c6,0,.85,0,g);const s=new THREE.Mesh(new THREE.SphereGeometry(.3,10,10),lmat(0x9fe8ff,.8));s.position.y=1.55;g.add(s)}
  else if(type==='frost'){box(.8,.3,.8,0xbcd6e8,0,.15,0,g);box(.4,.4,1.1,0x9fd6f2,0,.12,.4,pivot);const c=new THREE.Mesh(new THREE.OctahedronGeometry(.22,0),lmat(0xd8f3ff,.6));c.position.set(0,.45,0);pivot.add(c)}
  if(r>=1){const ring=new THREE.Mesh(new THREE.TorusGeometry(.55,.05,6,20),new THREE.MeshBasicMaterial({color:RARITY[r].c}));ring.rotation.x=Math.PI/2;ring.position.y=.03;g.add(ring)}}
function findStation(x,z){const cx=Math.floor(x),cz=Math.floor(z);const wantIn=inside(x,z);let best=null,bd=1e9;
  for(let dz=-7;dz<=7;dz++)for(let dx=-7;dx<=7;dx++){const nx=cx+dx,nz=cz+dz;if(walkCell(nx,nz)<=-99)continue;const d=Math.hypot(dx,dz)+(wantIn&&!inside(nx+.5,nz+.5)?12:0);if(d<bd){bd=d;best={x:nx+.5,z:nz+.5}}}return best}
function makeTurret(type,anchor,r=0){const T=TURRETS[type];const g=new THREE.Group(),pivot=new THREE.Group();pivot.position.y=.45;g.add(pivot);buildTurretModel(type,r,g,pivot);
  const pos=new THREE.Vector3(ix(anchor)+.5,iy(anchor)+1,iz(anchor)+.5);g.position.copy(pos);g.scale.setScalar(US);scene.add(g);
  const mh=T.hp*(1+r*.25)*state.turretHp;const t={type,T,r,anchor,group:g,pivot,pos,gunner:null,reload:rnd(0,1),alive:true,hp:mh,maxhp:mh,yaw:0,station:findStation(pos.x,pos.z),hit:0,beamT:0};
  g.userData.turret=t;turrets.push(t);return t}
function killTurret(t,drop){if(!t.alive)return;t.alive=false;scene.remove(t.group);spawnDebris(t.pos.x,t.pos.y+.3,t.pos.z,0x6d6a8a,8,.45);
  if(t.gunner){const g=t.gunner;t.gunner=null;g.turret=null;if(g.state==='man'){g.state='idle';if(t.station){g.pos.x=t.station.x;g.pos.z=t.station.z}g.group.position.y=standY(g.pos.x,g.pos.z)}}
  if(drop){const L=spawnLoot(t.pos.x,t.pos.y+.4,t.pos.z,'turret',t.r,{type:t.type});if(L)L.prio=true;toast(`${t.T.n} caiu! Um coletor vai buscá-la.`,'r0')}}
function damageTurret(t,d){if(!t.alive)return;t.hp-=d;t.hit=.1;if(t.hp<=0)killTurret(t,true)}
function checkTurretAnchor(i){const t=turretAt(i);if(t)killTurret(t,true)}
const turretRange=t=>t.T.range*(1+t.r*.08)*(t.gunner&&t.gunner.state==='man'?1.1:1)*(state.ev==='mist'?.72:1);
function enemyAim(e){return new THREE.Vector3(e.pos.x,e.fly?e.group.position.y+.5:e.gy+(e.type==='colossus'?2.2:.9),e.pos.z)}
function updateTurret(t,dt){if(!t.alive)return;if(t.team==='r')return updateRivalTurret(t,dt);const man=t.gunner&&t.gunner.state==='man';const g=t.gunner;
  if(t.hit>0)t.hit-=dt;if(t.station&&walkCell(Math.floor(t.station.x),Math.floor(t.station.z))<=-99)t.station=findStation(t.pos.x,t.pos.z);
  const rate=(man?1:.45)*(man?g.st.gun*(g.trait==='Olho de Águia'?1.25:1):1)/state.reloadMul;
  const range=turretRange(t),dmg=t.T.dmg*(1+t.r*.25)*state.dmgMul*(man?1+g.rarity*.1:1);
  t.reload-=dt*rate;
  let tgt=null,bd=1e9;
  if(state.focus&&!state.focus.dead&&state.focusT>0){const d=hd(state.focus.pos,t.pos);if(d<range*1.3&&!(LOB(t.type)&&state.focus.fly))tgt=state.focus}
  if(!tgt)for(const e of enemies){if(e.dead||(e.rival&&e.rmode==='guard'&&hd(e.pos,t.pos)>range*.8))continue;if(LOB(t.type)&&(e.fly||hd(e.pos,t.pos)<t.T.minRange))continue;let d=hd(e.pos,t.pos);if(d>range)continue;
    if(t.type==='ballista'&&e.fly)d-=10;if(e.type==='shaman')d-=4;if(e.type==='sapper')d-=3;if(d<bd){bd=d;tgt=e}}
  if(!tgt)return;const aim=enemyAim(tgt);const dx=aim.x-t.pos.x,dz=aim.z-t.pos.z;t.yaw=Math.atan2(dx,dz);
  let dy=t.yaw-t.group.rotation.y;while(dy>Math.PI)dy-=Math.PI*2;while(dy<-Math.PI)dy+=Math.PI*2;t.group.rotation.y+=dy*Math.min(1,dt*7);
  t.pivot.rotation.x+=(0-t.pivot.rotation.x)*Math.min(1,dt*5);
  if(t.reload>0)return;t.reload=t.T.reload;const from=new THREE.Vector3(t.pos.x,t.pos.y+.9,t.pos.z);
  if(t.type==='flamer'){const fx=Math.sin(t.yaw),fz=Math.cos(t.yaw);for(let k=0;k<5;k++){const s=rnd(.5,range);spawnFlame(t.pos.x+fx*s+rnd(-.4,.4)*s*.2,from.y+rnd(-.2,.2),t.pos.z+fz*s+rnd(-.4,.4)*s*.2,.9)}
    for(const e of enemies){if(e.dead)continue;const ex=e.pos.x-t.pos.x,ez=e.pos.z-t.pos.z,d=Math.hypot(ex,ez);if(d>range||d<.1)continue;if((ex*fx+ez*fz)/d<.82)continue;dmgEnemy(e,dmg,false);e.afire=Math.max(e.afire,2.5)}
    if(Math.random()<.15){const s=rnd(2,range);const x=Math.floor(t.pos.x+fx*s),z=Math.floor(t.pos.z+fz*s);for(let y=GY-1;y<GY+5;y++)if(inb(x,y,z))ignite(idx(x,y,z),'player')}SFX.whoosh();return}
  if(t.type==='tesla'){const hit=[tgt];let cur=tgt;const n=4+Math.floor(t.r/2);for(let k=1;k<n;k++){let nx=null,nd=8;for(const e of enemies){if(e.dead||hit.includes(e))continue;const d=hd(e.pos,cur.pos);if(d<nd||(cur.inWater&&e.inWater&&d<13)){nd=d;nx=e}}if(!nx)break;hit.push(nx);cur=nx}
    let a=new THREE.Vector3(t.pos.x,t.pos.y+1.55*US,t.pos.z),m=1;for(const e of hit){const b=enemyAim(e);beam(a,b);hurtEnemy(e,dmg*m*(e.inWater?2:1),b);if(e.dead&&g)gainXP(g,3);e.stun=Math.max(e.stun,.35);a=b;m*=.85}SFX.zap();return}
  if(LOB(t.type)){const cat=t.type==='catapult';const T=clamp(Math.hypot(dx,dz)/(cat?17:15),1.1,cat?3.4:2.8);const gr=20;const vel=new THREE.Vector3(dx/T,(aim.y-from.y+.5*gr*T*T)/T,dz/T);shoot(from,vel,gr,dmg,'shell',t);if(cat){const P=projectiles[projectiles.length-1];P.cat=true;P.mesh.material=BARREL_MAT;P.mesh.scale.setScalar(1.9)}SFX.thud();return}
  const sp=t.type==='ballista'?52:t.type==='frost'?32:34,gr=t.type==='ballista'?2:t.type==='frost'?5:6;const dist=from.distanceTo(aim);const lead=aim.clone().addScaledVector(tgt.vel,dist/sp);lead.y+=gr*(dist/sp)*(dist/sp)*.5;
  const vel=lead.sub(from).normalize().multiplyScalar(sp);shoot(from,vel,gr,dmg,t.type==='ballista'?'bolt':t.type==='frost'?'ice':'ball',t);
  if(t.type==='cannon'){t.pivot.rotation.x=-.5;SFX.boom(false);shake=Math.max(shake,.12)}else if(t.type==='ballista')SFX.twang();else SFX.freeze()}

// ───────── projectiles: pass through the fortress (no friendly fire), hit enemies and terrain
const projectiles=[];
const PGEO={ball:new THREE.SphereGeometry(.22,8,8),shell:new THREE.SphereGeometry(.3,8,8),bolt:new THREE.BoxGeometry(.08,.08,.9),ice:new THREE.OctahedronGeometry(.25,0)};
const PMAT={ball:lmat(0x2b2d4a,.3),shell:lmat(0x3a2f2a,.4),bolt:lmat(0xdfe6f0,.2),ice:lmat(0xbfeaff,.7)};
function shoot(from,vel,grav,dmg,kind,t){const mesh=new THREE.Mesh(PGEO[kind],t.team==='r'?RMAT[kind]:PMAT[kind]);mesh.position.copy(from);scene.add(mesh);projectiles.push({mesh,vel,grav,dmg,kind,life:3.6,pierce:t.team==='r'?0:kind==='bolt'?2+Math.floor(t.r/2):0,hits:new Set(),r:t.r,t,team:t.team})}
const RMAT={ball:lmat(0x7a1a2a,.5),shell:lmat(0x7a1a2a,.6),bolt:lmat(0xff5a6a,.4),ice:lmat(0xff9aa8,.6)};
function updateRivalTurret(t,dt){const range=Math.min(30,t.T.range*.8);t.reload-=dt;let tg=null,bd=range;for(const m of minions){if(m.wounded)continue;const d=hd(m.pos,t.pos);if(d<bd){bd=d;tg=m}}if(!tg)return;
  const aim=new THREE.Vector3(tg.pos.x,tg.group.position.y+1,tg.pos.z);const dx=aim.x-t.pos.x,dz=aim.z-t.pos.z;t.yaw=Math.atan2(dx,dz);t.group.rotation.y+=(t.yaw-t.group.rotation.y)*Math.min(1,dt*6);if(t.reload>0)return;t.reload=t.T.reload*(t.type==='flamer'?6:1.4);
  const from=new THREE.Vector3(t.pos.x,t.pos.y+.9,t.pos.z);const dmg=t.T.dmg*(1+t.R.lvl*.2)*(t.type==='flamer'?4:1);if(t.type==='mortar'){const T=clamp(Math.hypot(dx,dz)/15,1.1,2.8),gr=20;shoot(from,new THREE.Vector3(dx/T,(aim.y-from.y+.5*gr*T*T)/T,dz/T),gr,dmg,'shell',t);SFX.thud();return}
  if(t.type==='tesla'){beam(new THREE.Vector3(t.pos.x,t.pos.y+2.4,t.pos.z),aim);hurtMinion(tg,dmg*.8);SFX.zap();return}
  const vel=aim.clone().sub(from).normalize().multiplyScalar(30);shoot(from,vel,3,dmg,t.type==='ballista'?'bolt':t.type==='frost'?'ice':'ball',t);SFX.boom(false)}
function updateProjectiles(dt){for(let i=projectiles.length-1;i>=0;i--){const p=projectiles[i];p.life-=dt;p.vel.y-=p.grav*dt;p.mesh.position.addScaledVector(p.vel,dt);const pos=p.mesh.position;
    if(p.kind==='bolt')p.mesh.lookAt(pos.x+p.vel.x,pos.y+p.vel.y,pos.z+p.vel.z);if(p.kind==='ice'){p.mesh.rotation.x+=dt*8;if(Math.random()<.3)spawnFlame(pos.x,pos.y,pos.z,.35,true)}
    let done=false;
    if(p.team==='r'){for(const m of minions){if(m.wounded)continue;if(Math.abs(m.pos.x-pos.x)<.9&&Math.abs(m.pos.z-pos.z)<.9&&pos.y>m.group.position.y-.2&&pos.y<m.group.position.y+2.6){hurtMinion(m,p.dmg);if(p.kind==='shell')explode(pos.x,pos.y,pos.z,2.6,p.dmg,{src:'rival'});done=true;break}}
      if(!done){const x=Math.floor(pos.x),y=Math.floor(pos.y),z=Math.floor(pos.z);if(inb(x,y,z)){const i=idx(x,y,z);if(SOLIDM(vox[i])&&!rown[i]){if(p.kind==='shell')explode(pos.x,pos.y,pos.z,2.6,p.dmg,{src:'rival'});else damageVox(i,p.dmg*.4,'enemy');done=true}}}
      if(pos.y<-2||p.life<=0||pos.x<-4||pos.z<-4||pos.x>W+4||pos.z>D+4)done=true;if(done){scene.remove(p.mesh);projectiles.splice(i,1)}continue}
    if(p.kind!=='shell')for(const e of enemies){if(e.dead||p.hits.has(e))continue;const a=enemyAim(e);if(a.distanceTo(pos)<e.radius+.5+(e.type==='colossus'?1.8:0)){p.hits.add(e);impact(p,pos,e);if(p.pierce>0){p.pierce--;continue}done=true;break}}
    if(!done){const x=Math.floor(pos.x),y=Math.floor(pos.y),z=Math.floor(pos.z);
      if(inb(x,y,z)){const m=vox[idx(x,y,z)];if(m&&!blue[idx(x,y,z)]&&(SOLIDM(m)||(FLUID(m)&&p.kind==='ice'))){impact(p,pos,null,idx(x,y,z));done=true}}
      if(p.kind==='shell'&&p.vel.y<0){for(const e of enemies){if(e.dead||e.fly)continue;if(hd(e.pos,pos)<e.radius+.6&&Math.abs(pos.y-e.gy-.5)<1.1){impact(p,pos,e);done=true;break}}}
      if(pos.y<-2||p.life<=0||pos.x<-4||pos.z<-4||pos.x>W+4||pos.z>D+4)done=true}
    if(done){scene.remove(p.mesh);projectiles.splice(i,1)}}}
function impact(p,pos,e,cell){const fire=state.greek>0;if(e)setTimeout(()=>{},0);const credit=()=>{if(e&&e.dead&&p.t&&p.t.gunner)gainXP(p.t.gunner,4+e.maxhp/15)};
  if(p.kind==='shell'){explode(pos.x,pos.y,pos.z,3+state.explosive*.35+p.r*.2+(p.cat?1.9:0),p.dmg,{src:'player',fire:fire||p.cat});if(p.cat)shake=Math.max(shake,.4);return}
  if(p.kind==='ice'){if(e){hurtEnemy(e,p.dmg*(e.type==='titan'?2.5:1),pos);e.slowT=Math.max(e.slowT,3+p.r*.5)}freezeAround(pos.x,pos.y,pos.z,2.2+p.r*.25);for(const o of enemies){if(o.dead||o===e)continue;if(o.pos.distanceTo(pos)<2.6)o.slowT=Math.max(o.slowT,1.5)}spawnDebris(pos.x,pos.y,pos.z,0xd8f3ff,4,.2);return}
  if(e){hurtEnemy(e,p.dmg,pos);credit();if(fire&&!e.fly&&Math.random()<.35*state.greek)e.afire=Math.max(e.afire,3);
    if(p.kind==='ball'){for(const o of enemies){if(o.dead||o===e)continue;if(o.pos.distanceTo(pos)<2.4)hurtEnemy(o,p.dmg*.45,pos)}spawnDebris(pos.x,pos.y,pos.z,0xff8a5c,4,.25)}}
  else if(cell!==undefined){damageVox(cell,p.dmg*.5,'player');spawnDebris(pos.x,pos.y,pos.z,0x8bbf9d,3,.3)}
  if(p.kind==='ball'&&state.explosive>0)explode(pos.x,pos.y,pos.z,1.2+state.explosive*.55,p.dmg*.5,{src:'player',fire})}
