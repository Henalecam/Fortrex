// ───────── units: pathing, enemies, minions
// minions walk on the ground: a cell is walkable if its surface is low, not lava and has headroom; climbing at most 1 step
function walkCell(x,z){if(x<0||z<0||x>=W||z>=D)return -99;const s=surf(x,z);if(s>GY+3)return -99;const a=vox[idx(x,s,z)];if(state.gateClosed&&a===7)return -99;if(a===8)return -99;if(s>0&&vox[idx(x,s-1,z)]===8)return -99;for(let k=1;k<=2;k++){if(s+k<H){const b=vox[idx(x,s+k,z)];if(SOLIDM(b)&&b!==7)return -99}}return s}
function standY(x,z){const s=surf(x,z);const fx=Math.floor(x),fz=Math.floor(z);if(inb(fx,s,fz)&&vox[idx(fx,s,fz)]===9)return s+.45;return s}
const _f=new Float32Array(W*D);let h2c=()=>0;
function heapPush(a,v){a.push(v);let i=a.length-1;while(i>0){const p=(i-1)>>1;if(_f[a[p]]<=_f[a[i]])break;const t=a[p];a[p]=a[i];a[i]=t;i=p}}
function heapPop(a){const top=a[0],last=a.pop();if(a.length){a[0]=last;let i=0;for(;;){const l=i*2+1,r=l+1;let m=i;if(l<a.length&&_f[a[l]]<_f[a[m]])m=l;if(r<a.length&&_f[a[r]]<_f[a[m]])m=r;if(m===i)break;const t=a[m];a[m]=a[i];a[i]=t;i=m}}return top}
const _g=new Float32Array(W*D),_came=new Int32Array(W*D),_closed=new Uint8Array(W*D),_hc=new Int16Array(W*D),_st=new Int32Array(W*D);let _gen=0;
function _tc(c){if(_st[c]!==_gen){_st[c]=_gen;_g[c]=1e9;_f[c]=1e9;_closed[c]=0;_came[c]=-1;_hc[c]=-100}}
// straight walkable line? (most open-field trips skip A* entirely)
function lineClear(sx,sz,gx,gz){const dx=gx-sx,dz=gz-sz,n=Math.ceil(Math.max(Math.abs(dx),Math.abs(dz)));if(n>70)return false;let ph=walkCell(sx,sz);if(ph<=-99)return false;
  for(let k=1;k<=n;k++){const x=Math.floor(sx+.5+dx*k/n),z=Math.floor(sz+.5+dz*k/n);const h=walkCell(x,z);if(h<=-99||Math.abs(h-ph)>1)return false;ph=h}return true}
function findPath(sx,sz,gx,gz){sx=clamp(Math.floor(sx),0,W-1);sz=clamp(Math.floor(sz),0,D-1);gx=clamp(Math.floor(gx),0,W-1);gz=clamp(Math.floor(gz),0,D-1);
  const S=sx+sz*W,G=gx+gz*W;if(S===G)return[];if(lineClear(sx,sz,gx,gz))return[G];_gen++;_tc(S);_tc(G);
  const wc=c=>{_tc(c);if(_hc[c]===-100)_hc[c]=walkCell(c%W,(c/W)|0);return _hc[c]};h2c=wc;const hs=wc(S)>-99?wc(S):surf(sx,sz);
  _g[S]=0;const h=c=>Math.hypot(c%W-gx,((c/W)|0)-gz);_f[S]=h(S);const open=[S];let it=0;
  while(open.length&&it++<12000){const cur=heapPop(open);if(cur===G)break;if(_closed[cur])continue;_closed[cur]=1;
    const cx=cur%W,cz=(cur/W)|0,h1=cur===S?hs:wc(cur);
    for(let dz=-1;dz<=1;dz++)for(let dx=-1;dx<=1;dx++){if(!dx&&!dz)continue;const nx=cx+dx,nz=cz+dz;if(nx<0||nz<0||nx>=W||nz>=D)continue;const ni=nx+nz*W;_tc(ni);if(_closed[ni])continue;
      if(ni!==G){const h2=wc(ni);if(h2<=-99||h2-h1>1)continue;if(dx&&dz&&(wc(cx+dx+cz*W)<=-99||wc(cx+(cz+dz)*W)<=-99))continue}
      const ng=_g[cur]+(dx&&dz?1.414:1)+(h2c(ni)>h1?.4:0);if(ng<_g[ni]){_g[ni]=ng;_came[ni]=cur;_f[ni]=ng+h(ni);heapPush(open,ni)}}}
  if(_came[G]<0)return null;const path=[];let c=G;while(c!==S&&c>=0){path.push(c);c=_came[c]}path.reverse();return path}
function walkTo(m,tx,tz,dt,stop){const gx=Math.floor(tx),gz=Math.floor(tz);m.pathT-=dt;
  if(!m.path||m.pathT<=0||Math.abs(m.pathGx-gx)+Math.abs(m.pathGz-gz)>(m.path.length>6?3:1)){const p=findPath(m.pos.x,m.pos.z,tx,tz);m.path=p||[];m.pathGx=gx;m.pathGz=gz;m.pf=p?0:Math.min(4,(m.pf||0)+1);m.pathT=p?(p.length>40?4:p.length>16?2.5:1.5):2.5*m.pf}
  while(m.path.length>1){const c=m.path[0];if(Math.hypot((c%W)+.5-m.pos.x,((c/W)|0)+.5-m.pos.z)<.45)m.path.shift();else break}
  if(m.path.length>1){const c=m.path[0];walkRaw(m,(c%W)+.5,((c/W)|0)+.5,dt,.2);return false}
  return walkRaw(m,tx,tz,dt,stop)}
function walkRaw(m,tx,tz,dt,stop){const dx=tx-m.pos.x,dz=tz-m.pos.z;const d=Math.hypot(dx,dz);if(d<=stop)return true;
  const wet=walkCell(Math.floor(m.pos.x),Math.floor(m.pos.z))>-99&&standY(m.pos.x,m.pos.z)%1!==0;const step=Math.min(d,m.speed*(wet?.6:1)*(cheerOn(m)?1.2:1)*dt);
  m.pos.x+=dx/d*step;m.pos.z+=dz/d*step;m.group.rotation.y=Math.atan2(dx,dz);m.bob+=dt*12;
  const ty=standY(m.pos.x,m.pos.z);m.group.position.y+=(ty-m.group.position.y)*Math.min(1,dt*10);m.legs[0].rotation.x=Math.sin(m.bob)*.6;m.legs[1].rotation.x=-Math.sin(m.bob)*.6;return false}

// ───────── enemies
const ETYPES={
  crawler:{hp:34,speed:2.3,dmg:9,rate:.55,color:0x7a5fb0,radius:.55,n:'Rasteiro'},
  ram:{hp:85,speed:3.4,dmg:70,rate:2.6,color:0x5b7fb5,radius:.8,n:'Aríete'},
  climber:{hp:26,speed:2.6,dmg:7,rate:.6,color:0x6fa86b,radius:.5,n:'Escalador'},
  sapper:{hp:30,speed:3.1,dmg:0,rate:1,color:0xe0744a,radius:.5,n:'Sapador'},
  flyer:{hp:24,speed:3.4,dmg:12,rate:.8,color:0x8fc7e8,radius:.5,n:'Voador'},
  shaman:{hp:46,speed:2,dmg:6,rate:.8,color:0xb05fa8,radius:.55,n:'Xamã'},
  boss:{hp:420,speed:1.4,dmg:40,rate:1.1,color:0x4b3a6e,radius:1.6,n:'Devorador'},
  colossus:{hp:1500,speed:.9,dmg:60,rate:1.4,color:0x3b2f5c,radius:2.4,n:'Colosso'},
  queen:{hp:950,speed:1.1,dmg:30,rate:1,color:0xa86fd9,radius:1.6,n:'Rainha da Bruma'},
  titan:{hp:2400,speed:.8,dmg:75,rate:1.5,color:0xc2410c,radius:2.2,n:'Titã de lava'},
  ship:{hp:900,speed:0,dmg:0,rate:9,color:0x7a5230,radius:3,n:'Navio Pirata'},
  pirate:{hp:48,speed:2.9,dmg:13,rate:.75,color:0xc9a27a,radius:.55,n:'Pirata'},
  wolf:{hp:40,speed:4.0,dmg:11,rate:.6,color:0x7d7f8f,radius:.55,n:'Lobo da Bruma'},
  spider:{hp:30,speed:3.1,dmg:8,rate:.5,color:0x3d3a52,radius:.6,n:'Aranha da Bruma'},
  slime:{hp:55,speed:1.8,dmg:10,rate:.8,color:0x6fd38c,radius:.7,n:'Gosma'},
  goblin:{hp:24,speed:4.4,dmg:4,rate:.6,color:0x7fae3a,radius:.38,n:'Sabotador'},
  imp:{hp:18,speed:4.2,dmg:6,rate:.5,color:0xe0443a,radius:.4,n:'Diabrete'},
  brute:{hp:140,speed:1.7,dmg:30,rate:1.3,color:0x8a5a44,radius:.85,n:'Bruto'},
  beetle:{hp:90,speed:2.0,dmg:14,rate:.9,color:0x2f6b6b,radius:.75,n:'Besouro Blindado'},
  mistking:{hp:4200,speed:1.1,dmg:90,rate:1.3,color:0x2a1f45,radius:2.0,n:'Rei da Bruma'},
  golem:{hp:1700,speed:.9,dmg:65,rate:1.8,color:0x8d8578,radius:1.9,n:'Golem de Pedra'},
  wyrm:{hp:1100,speed:2.6,dmg:40,rate:1.2,color:0xe0662c,radius:1.5,n:'Serpe de Fogo'},
  necro:{hp:950,speed:1.4,dmg:35,rate:1.4,color:0x4b2e6b,radius:1.2,n:'Necromante da Bruma'},
};
const CLIMBS=t=>t==='climber'||t==='spider';
const BIG=t=>t==='runico'||t==='arauto'||t==='boss'||t==='colossus'||t==='queen'||t==='titan'||t==='general'||t==='golem'||t==='wyrm'||t==='necro'||t==='mistking';
let DMG_ACC=0;const enemies=[];const fuses=[];
function makeEnemy(type,rarity,x,z){const T=ETYPES[type];const g=new THREE.Group();const col=new THREE.Color(T.color).lerp(new THREE.Color(RARITY[rarity].c),rarity?.35:0).getHex();
  const sc=US*(type==='colossus'?4:type==='titan'?3.2:type==='queen'?2.4:type==='boss'?2.6:type==='general'?2.1:type==='ship'?2.6:type==='pirate'?1.05:type==='mistking'?3.4:type==='golem'?3.7:type==='wyrm'?2.9:type==='necro'?2.7:type==='ram'?1.35:type==='flyer'?.8:type==='brute'?1.5:type==='imp'?.7:type==='slime'?1.15:type==='beetle'?1.2:(SCX[type]||1))*(BIG(type)?1.12:1.32*rnd(.92,1.1));
  let body,head,legs=[];if(CREATURES[type]){({body,head,legs}=CREATURES[type](sc,col,g))}else{
  body=box(.9*sc,.7*sc,1.1*sc,col,0,.5*sc,0,g);head=box(.7*sc,.6*sc,.6*sc,col,0,.6*sc,.75*sc,g);eyes(head,.08*sc,.32*sc,.17*sc);
  for(const sx of [-1,1])for(const sz of [-1,1]){const lg=box(.22*sc,.4*sc,.22*sc,type==='colossus'?0xcfd6e3:0x2b2d4a,sx*.35*sc,.2*sc,sz*.35*sc,g);legs.push({mesh:lg,hp:150,alive:true,ox:sx*.35*sc,oz:sz*.35*sc})}}
  if(!BIG(type)&&!CREATURES[type])decorate(type,sc,col,g,body,head);
  if((type==='ram'&&!NEWLOOK.ram||type==='rammer'&&!NEWLOOK.rammer))box(.35*US,.35*US,.9*US,0xcfd6e3,0,.75*sc,1.2*sc/1.35,g);
  if(type==='boss'&&!NEWLOOK.boss){box(.4*US,1.2*US,.4*US,0xcfd6e3,-.6*US,1.9*US,.6*US,g);box(.4*US,1.2*US,.4*US,0xcfd6e3,.6*US,1.9*US,.6*US,g)}
  if(type==='colossus'&&!NEWLOOK.colossus){body.position.y=.9*sc;head.position.y=1.05*sc;for(const L of legs){L.mesh.scale.y=2.6;L.mesh.position.y=.5*sc}box(.5*US,1.6*US,.5*US,0xcfd6e3,-.9*US,2.4*sc,.9*US,g);box(.5*US,1.6*US,.5*US,0xcfd6e3,.9*US,2.4*sc,.9*US,g);box(1.4*sc,.3*US,.3*US,0xec5f6b,0,1.3*sc,.9*sc,g)}
  if(type==='queen'&&!NEWLOOK.queen){for(let k=-2;k<=2;k++){const c=box(.22*US,.5*US*(k%2?1:1.5),.22*US,0xffcf3d,k*.28*sc,1.05*sc,.75*sc,g);c.material.emissive.setHex(0xffcf3d);c.material.emissiveIntensity=.6}box(1.1*sc,.9*sc,.12*sc,0x5b2e8a,0,.6*sc,-.6*sc,g)}
  if(type==='titan'&&!NEWLOOK.titan){for(const p of [body,head]){p.material.emissive.setHex(0xff5a1a);p.material.emissiveIntensity=.55;p.userData.em=0xff5a1a}for(let k=0;k<6;k++)box(.3*sc,.3*sc,.3*sc,0x2e2740,rnd(-.4,.4)*sc,rnd(.4,1)*sc,rnd(-.5,.5)*sc,g)}
  if(type==='climber'&&!NEWLOOK.climber){box(.5*US,.15*US,.9*US,0x3f6b3c,0,.95*US,0,g);for(const s of[-1,1])box(.15*US,.5*US,.15*US,0x3f6b3c,s*.5*US,.9*US,.3*US,g)}
  if(type==='sapper'&&!NEWLOOK.sapper){const k=box(.5*US,.5*US,.5*US,0x2b2d4a,0,1.0*US,-.1*US,g);k.material.emissive.setHex(0xff5a3c);k.material.emissiveIntensity=.6;fuses.push(k)}
  if(type==='flyer'&&!NEWLOOK.flyer){const w1=box(1.1*US,.08*US,.4*US,0xd9ecf7,-.7*US,.75*US,0,g),w2=box(1.1*US,.08*US,.4*US,0xd9ecf7,.7*US,.75*US,0,g);g.userData.wings=[w1,w2]}
  if(type==='mistking'&&!NEWLOOK.mistking){box(1.3*sc,.9*sc,.25*sc,0x1a1430,0,.65*sc,-.6*sc,g);for(let k=-2;k<=2;k++){const c=box(.14*sc,.35*sc*(k%2?1:1.6),.14*sc,0xb56cf2,k*.16*sc,1.05*sc,.75*sc,g);c.material.emissive.setHex(0xb56cf2);c.material.emissiveIntensity=.8}for(const s of[-1,1]){const e2=box(.12*sc,.08*sc,.05*sc,0xff4af0,s*.14*sc,.72*sc,1.06*sc,g);e2.material.emissive.setHex(0xff4af0)}box(.1*US,2.4*US,.1*US,0x3b2a50,.85*sc,1.0*sc,.4*sc,g);const o=new THREE.Mesh(new THREE.OctahedronGeometry(.35*US,0),lmat(0xb56cf2,.95));o.position.set(.85*sc,1.75*sc,.4*sc);g.add(o)}
  if(type==='golem'&&!NEWLOOK.golem){for(const s of[-1,1]){box(.55*sc,.5*sc,.55*sc,0x6f8f55,s*.6*sc,.95*sc,.1*sc,g);box(.4*sc,.8*sc,.4*sc,0x75706a,s*.7*sc,.45*sc,.35*sc,g)}box(.3*sc,.15*sc,.1*sc,0xffb13d,0,.7*sc,1.06*sc,g).material.emissive.setHex(0xffb13d)}
  if(type==='wyrm'&&!NEWLOOK.wyrm){const w1=box(1.5*sc,.06*sc,.6*sc,0xb83a2e,-.95*sc,.65*sc,0,g),w2=box(1.5*sc,.06*sc,.6*sc,0xb83a2e,.95*sc,.65*sc,0,g);g.userData.wings=[w1,w2];box(.3*sc,.25*sc,.9*sc,0xe0662c,0,.45*sc,-.95*sc,g);box(.2*sc,.18*sc,.5*sc,0xffb13d,0,.4*sc,-1.55*sc,g);for(const s of[-1,1])box(.08*sc,.25*sc,.08*sc,0xfff2c0,s*.22*sc,1.0*sc,.8*sc,g)}
  if(type==='necro'&&!NEWLOOK.necro){box(1.0*sc,.6*sc,1.0*sc,0x2e1d45,0,.15*sc,0,g);box(.12*US,1.8*US,.12*US,0x3b2a20,.75*sc,.9*sc,.3*sc,g);const o=new THREE.Mesh(new THREE.OctahedronGeometry(.3*US,0),lmat(0x7dff9a,.9));o.position.set(.75*sc,1.45*sc,.3*sc);g.add(o);head.material.color.setHex(0xe8e2d0)}
  if(type==='general'&&!NEWLOOK.general){box(.12*US,1.5*US,.12*US,0xffcf3d,.85*US,1.3*US,.4*US,g);box(1.2*US,.9*US,.12*US,0x2b2d4a,0,1.0*US,-.75*US,g);for(const s of[-1,1])box(.5*US,.35*US,.6*US,0x8a8fa6,s*.75*US,1.45*US,0,g);const cr=box(.6*US,.25*US,.6*US,0xffcf3d,0,1.95*US,.75*US,g);cr.material.emissive.setHex(0xffcf3d);cr.material.emissiveIntensity=.5}
  if(type==='knight'&&!NEWLOOK.knight){box(.08*US,.9*US,.08*US,0xdfe6f0,.45*US,.9*US,.2*US,g);box(.5*US,.5*US,.1*US,0x5e5670,-.45*US,.6*US,.2*US,g);box(.75*US,.15*US,.65*US,0x5e5670,0,1.0*US,.75*US,g)}
  if(type==='archer'&&!NEWLOOK.archer){box(.1*US,.9*US,.1*US,0x8a6a45,.4*US,.8*US,.3*US,g)}
  if(type==='shaman'&&!NEWLOOK.shaman){box(.1*US,1.4*US,.1*US,0x6b5235,.45*US,.9*US,.2*US,g);const o=new THREE.Mesh(new THREE.OctahedronGeometry(.2*US,0),lmat(0x7dff9a,.8));o.position.set(.45*US,1.7*US,.2*US);g.add(o)}
  if(BIG(type)&&type!=='ship'&&type!=='general'&&!state.__rivalMake&&!NEWLOOK[type])bossLook(type,sc,col,g,body,head);
  if(rarity>=2){head.material.emissive.setHex(RARITY[rarity].c);head.material.emissiveIntensity=.5;head.userData.em=RARITY[rarity].c}
  g.position.set(x,0,z);scene.add(g);
  const w=state.wave;const scale=(1+.16*(w-1))*(w>10?1+.09*(w-10):1)*(w>15?1+.06*(w-15):1)*(w>14?Math.pow(1.05,w-14):1)*(w>20?1+.05*(w-20):1)*(w>18?1+.06*(w-18):1)*(w>11?1+.045*(w-11):1)*(1+(state.rank||0)*.08);const hpm=T.hp*scale*(1+rarity*.5)*(state.ev==='elite'?1.3:1)*(BIG(type)?(state.wave>=15?.96:.8):1)*DIFF().hp;
  const e={type,T,rarity,group:g,pos:g.position,vel:new THREE.Vector3(),hp:hpm,maxhp:hpm,radius:T.radius*US*(BIG(type)?1.08:1.18),state:'walk',timer:0,target:-1,dead:false,bob:rnd(0,6),
    speed:T.speed*1.5*rnd(.9,1.1)*DIFF().sp*(hasMod('veloz')?1.2:1)*(state.ev==='elite'?1.15:1)*Math.min(1.3,1+Math.max(0,state.wave-12)*.015),armor:(hasMod('blindados')?.15:0)+Math.min(.55,Math.max(0,state.wave-14)*.025+(state.wave>=6?(DIFF().arm||0):0)),parts:[body,head],sc,legs,fly:type==='flyer'||type==='wyrm'||type==='bombardeiro',blvl:BIG(type)?1+Math.floor(state.wave/5):0,alt:type==='wyrm'?GY+12:GY+9+rnd(0,2),stun:0,fuse:-1,gy:0,afire:0,slowT:0,iceT:0,hit:0,viaWall:Math.random()<.4,inLava:false,inWater:false};
  if(DIFF().dmg!==1)e.T={...T,dmg:T.dmg*DIFF().dmg};
  rollAffix(e);if(BIG(type)&&type!=='ship'&&type!=='general'&&state.wave>=15&&Math.random()<.6){e.bossAff=pick(['furioso','escudo']);if(e.bossAff==='escudo'){e.shieldMax=e.maxhp*.3;e.shield=e.shieldMax}}if(state.vein&&state.phase==='wave'&&!BIG(type)&&!CLIMBS(type)&&type!=='goblin'&&type!=='flyer'&&type!=='ship'&&Math.random()<.15)e.veinRaid=true;
  if(BIG(type)&&type!=='ship'&&type!=='general'){e.boss2=true;e.ph=1;e.mvT=rnd(3,5)}
  setupChunks(e,body,head);
  e.gy=CLIMBS(type)?topY(x,z):surfE(x,z);g.position.y=e.fly?e.alt:e.gy;g.userData.enemy=e;
  if(BIG(type)){showBoss(e);const ring=new THREE.Mesh(new THREE.RingGeometry(e.radius*1.15,e.radius*1.45,32),new THREE.MeshBasicMaterial({color:RARITY[Math.max(2,rarity)].c,transparent:true,opacity:.55,side:THREE.DoubleSide,depthWrite:false}));ring.rotation.x=-Math.PI/2;ring.position.y=.08;g.add(ring);e.aura=ring}enemies.push(e);return e}
function dmgEnemy(e,d,flash,crit){if(e.dead)return;e.lastHit=simTime;if(e.veil>simTime)d*=.55;if(e.shield>0){const a=Math.min(e.shield,d*.85);e.shield-=a;d-=a;if(e.shield<=0){label({x:e.pos.x,y:e.gy+e.sc*1.8,z:e.pos.z},'ESCUDO QUEBRADO!','#4f9cf2');if(e.shieldMesh)e.shieldMesh.visible=false}}if(e.inspired>simTime&&!e.bearer)d*=.8;if(e.armor)d*=1-e.armor;if(e.under)d*=.15;if(e.guardUntil>simTime&&e.type!=='escudeiro')d*=.55;if(e.type==='escudeiro')d*=.7;if(e.dormant>0){e.dormant=0;label({x:e.pos.x,y:e.gy+2,z:e.pos.z},'É UM MÍMICO!','#ffcf3d')}if(e.type==='cristal'&&d>=35&&Math.random()<.15)crystalShard(e);if(e.type==='beetle'&&e.chunks&&e.lost<e.chunks.length*.35){d*=.5;if(Math.random()<.05)label({x:e.pos.x,y:e.gy+1.6,z:e.pos.z},'carapaça','#5cc0c0')}if(e.type==='necro'&&e.summ&&e.summ.filter(s=>!s.dead).length>=3){d*=.3;if(Math.random()<.08)label({x:e.pos.x,y:e.gy+e.sc*1.5,z:e.pos.z},'escudo de ossos','#7dff9a')}DMG_ACC+=Math.max(0,Math.min(d,e.hp));e.hp-=d;if(e.chunks&&e.hp>0)chipEnemy(e,d);if(flash&&(d>=14||crit)&&Math.random()<(crit?1:.5))label({x:e.pos.x+rnd(-.3,.3),y:e.group.position.y-.6+e.sc*.6,z:e.pos.z},crit?`${Math.round(d)}!`:String(Math.round(d)),crit?'#e0a000':'#6b6e8f');if(flash){e.hit=.1;for(const p of e.parts)p.material.emissive.setHex(0xffffff)}if(e.hp<=0)killEnemy(e)}
// elite affixes: from wave 8 some common enemies come with a trait shown by a colored ring at their feet
const AFFIX={fast:{n:'Veloz',c:0xffd23d},armor:{n:'Blindado',c:0x8ea9c6},vamp:{n:'Vampiro',c:0xd9414f},boom:{n:'Explosivo',c:0xff7a2a},regen:{n:'Regenerante',c:0x5cc08c}};
const AFF_GEO=new THREE.RingGeometry(.62,.82,20);const AFF_MAT={};
function rollAffix(e){const w=state.wave;const bm=state.ev==='bloodmoon';if((w<8&&!bm)||BIG(e.type)||e.type==='slime'||Math.random()>(bm?.45:Math.min(.24,.04+(w-8)*.012)*(DIFF().cnt>1.3?1.3:1)))return;
  const ks=['fast','armor','vamp'];if(w>=11)ks.push('boom');if(w>=14)ks.push('regen');const k=pick(ks);e.aff=k;
  if(k==='fast'){e.speed*=1.4;e.hp*=.85;e.maxhp*=.85}if(k==='armor')e.armor=Math.min(.7,(e.armor||0)+.25);if(k==='regen'){e.hp*=1.1;e.maxhp*=1.1}
  const m=AFF_MAT[k]||(AFF_MAT[k]=new THREE.MeshBasicMaterial({color:AFFIX[k].c,transparent:true,opacity:.8,side:THREE.DoubleSide,depthWrite:false}));
  const r=new THREE.Mesh(AFF_GEO,m);r.rotation.x=-Math.PI/2;r.position.y=.1;r.scale.setScalar(Math.max(.8,e.radius/US*1.6)/e.group.scale.x||1);e.group.add(r);e.affRing=r}
function hurtEnemy(e,d,at){if(e.dead)return;
  if(e.type==='colossus'){let leg=null;if(at){const c=Math.cos(e.group.rotation.y),s=Math.sin(e.group.rotation.y);for(const L of e.legs){if(!L.alive)continue;const lx=e.pos.x+L.ox*c+L.oz*s,lz=e.pos.z-L.ox*s+L.oz*c;if(Math.hypot(at.x-lx,at.z-lz)<1.9&&at.y<e.gy+4.4){leg=L;break}}}
    if(leg){leg.hp-=d*1.6;e.hit=.1;leg.mesh.material.emissive.setHex(0xffffff);SFX.hurt();if(leg.hp<=0){leg.alive=false;e.group.remove(leg.mesh);spawnDebris(e.pos.x+leg.ox,e.gy+1,e.pos.z+leg.oz,0xcfd6e3,14,.5);e.stun=3;shake=Math.max(shake,.6);SFX.boom(true);
      const down=e.legs.filter(L=>!L.alive).length;toast(down>=2?'O Colosso perdeu as pernas — vai cair!':'Perna do Colosso destruída!','r3');if(down>=2)killEnemy(e)}return}
    d*=e.stun>0?1.4:.35}
  const crit=Math.random()<.1+state.critBonus;if(crit)d*=2;if(Math.random()<.35)SFX.hurt();dmgEnemy(e,d,true,crit)}
function killEnemy(e){if(e.dead)return;e.dead=true;scene.remove(e.group);const t=e.type,big=BIG(t);
  if(e.aff==='boom'){explode(Math.floor(e.pos.x),Math.floor(e.gy+.5),Math.floor(e.pos.z),2.4,26,{src:'enemy'});label({x:e.pos.x,y:e.gy+2,z:e.pos.z},'💥','#ff8a3c')}
  if(NEW_DEATH[t])NEW_DEATH[t](e);if(e.champ)champDeath(e);
  if(t==='slime'&&!e.small){for(let k=0;k<2;k++){const s=makeEnemy('slime',e.rarity,e.pos.x+rnd(-.8,.8),e.pos.z+rnd(-.8,.8));s.small=true;s.group.scale.setScalar(.6);s.maxhp*=.35;s.hp=s.maxhp;s.speed*=1.25;s.radius*=.6}}
  if(state.boss===e)hideBoss();
  if(e.bearer){for(const o of enemies)if(!o.dead&&o!==e&&!BIG(o.type)&&Math.hypot(o.pos.x-e.pos.x,o.pos.z-e.pos.z)<10){o.stun=Math.max(o.stun||0,1.8);o.slowT=Math.max(o.slowT||0,3)}state.trophies=(state.trophies||0)+1;if(state.trophies<=15)state.dmgMul*=1.02;toast(`🏳️ Estandarte capturado (${state.trophies}): a horda ao redor entra em pânico${state.trophies<=15?' e suas armas ganham +2% de dano':''}!`,'r3');label({x:e.pos.x,y:e.gy+2.4,z:e.pos.z},'PÂNICO!','#ffcf3d')}
  if(e.alpha){spawnLoot(e.pos.x,GY+2,e.pos.z,'treasure',Math.min(4,2+Math.floor(state.wave/12)),{});toast('🐺 O lobo alfa caiu! Deixou um tesouro raro.','r4');addFame&&addFame(20)}
  if(t==='ship'){for(let k=0;k<2;k++)spawnLoot(e.pos.x+rnd(-2,2),GY+2,e.pos.z+rnd(-2,2),'treasure',Math.min(4,2+Math.floor(state.wave/10)),{});pendingBooms.push({x:e.pos.x,y:GY+1,z:e.pos.z,r:4,dmg:60,o:{src:'env',fire:true},t:.1});toast('🏴‍☠️ Navio pirata afundado! Tesouro na praia.','r4')}
  if(t==='imp')pendingBooms.push({x:e.pos.x,y:e.gy+.5,z:e.pos.z,r:1.8,dmg:22,o:{src:'enemy',fire:true},t:.05});goalEvent('kills');if(big)goalEvent('boss');if(big&&t!=='general'){state.morale=Math.min(100,(state.morale??60)+15);grantRelic(t);if(!OPTS.noCine&&!window.__headless)state.cine={x:e.pos.x,z:e.pos.z,t:2.6,d0:(state.cine&&state.cine.d0)||cam.dist}}
  if(e.vmeshes&&e.vmeshes.length)voxBurst(e,big?220:48);spawnDebris(e.pos.x,e.group.position.y+.6,e.pos.z,e.T.color,t==='colossus'?60:big?30:4,big?.8:.4);SFX.shatter(t!=='crawler');
  hitstop=Math.max(hitstop,t==='colossus'?.22:t==='boss'?.14:.05);shake=Math.max(shake,t==='colossus'?1.4:t==='boss'?.9:.22);if(big){hideBoss();slowmo=1.3;toast(`${e.T.n} derrotado!`,'r4')}
  if(t==='colossus'){const fx=e.pos.x+Math.sin(e.group.rotation.y)*3,fz=e.pos.z+Math.cos(e.group.rotation.y)*3;pendingBooms.push({x:fx,y:GY+.5,z:fz,r:3.6,dmg:230,o:{src:'env'},t:.25});toast('O Colosso desabou!','r4')}
  dropTable(e);state.kills++;state.wk++;if(e.lastSol&&!e.rival)vetKill(e.lastSol);if(state.contract&&!e.rival){if(e.aff)state.contract.el=(state.contract.el||0)+1;if(e.lastSol)state.contract.sol=(state.contract.sol||0)+1}addCombo(e);codexKill(e);if(state.ev==='aurora'&&!e.rival&&Math.random()<.04){const r=Math.random()<.2?3:2;let L=lootPick('any',r);if(L[0]==='material')L=['equip',{item:makeEquip(r)}];spawnLoot(e.pos.x,e.gy+1.5,e.pos.z,L[0],r,L[1]);label({x:e.pos.x,y:e.gy+2.2,z:e.pos.z},'✦ fragmento de aurora','#7dffc8')}if(state.ev==='bloodmoon'&&!e.rival){state.material+=1;for(const m of minions)if(m.role==='sol'&&m.wounded<=0&&Math.abs(m.pos.x-e.pos.x)<4&&Math.abs(m.pos.z-e.pos.z)<4)m.hp=Math.min(m.maxhp,m.hp+m.maxhp*.12)}}
function addCombo(e){state.combo=(simTime-state.comboT<1.6)?state.combo+1:1;state.comboT=simTime;state.comboBest=Math.max(state.comboBest,state.combo);if(state.combo>=5&&state.combo%5===0){label({x:e.pos.x,y:e.gy+1,z:e.pos.z},`COMBO ×${state.combo}`,'#ff8a5c');SFX.loot(Math.min(4,Math.floor(state.combo/10)))}}
function dropTable(e){const t=e.type,r=e.rarity,big=BIG(t);const at=(kind,rr,data)=>spawnLoot(e.pos.x+rnd(-.6,.6),e.gy+1,e.pos.z+rnd(-.6,.6),kind,rr,data);
  if(big||Math.random()<.5)at('material',0,{amount:Math.max(1,Math.round((({crawler:2,ram:4,climber:2,sapper:2,flyer:2,shaman:5,boss:12,colossus:26,queen:30,titan:40,knight:4,archer:3,rammer:6,general:40,golem:30,wyrm:24,necro:22,mistking:60,ship:30,pirate:3,arauto:80})[t]??2)*.32+r*.4))});
  const luck=state.wave*.005+r*.03+state.luck+(state.ev==='golden'||state.ev==='eclipse'?.08:0);
  const P=({crawler:.11,ram:.24,climber:.14,sapper:.12,flyer:.16,shaman:.45,boss:1,colossus:1,queen:1,titan:1,knight:.3,archer:.25,rammer:.35,general:1,golem:1,wyrm:1,necro:1,arauto:1})[t]??.15;
  const n=t==='arauto'?5:t==='titan'?4:t==='queen'||t==='colossus'?3:t==='boss'?2:1;for(let k=0;k<n;k++)if(Math.random()<P*(big?.8:.22)){const rr=Math.max(big&&k===0?Math.min(2+(t==='arauto'?1:0),3):0,lootRarity(luck+(big?.12:0)));const [kind,data]=lootPick('any',rr);at(kind,rr,data)}
  if(Math.random()<(big?.4:r>=2?.06:.012))at('recruit',Math.max(1,lootRarity(luck)),{role:pick(['rep','col','gun','sol','med','sol'])});
  if(big||Math.random()<(r>=3?.12:r>=2?.05:.008))at('treasure',big?Math.max(t==='arauto'?4:t==='titan'?3:2,lootRarity(luck+.1)):Math.max(1,lootRarity(luck)),{})}
const _dir=new THREE.Vector3();
function enemyWallAt(e,cx,cz){if(!inb(cx,0,cz))return -1;const s=surfE(cx,cz);if(s<=e.gy+1.2)return -1;const y0=Math.max(0,Math.floor(e.gy+.01));for(let y=y0;y<Math.min(H,y0+4);y++){const i=idx(cx,y,cz);if(SOLIDM(vox[i]))return i}return -1}
function nearMinion(e,reach,dyMax=2.4){for(const m of minions){if(m.wounded)continue;if(hd(m.pos,e.pos)<e.radius+reach&&Math.abs(m.group.position.y-e.group.position.y)<dyMax)return m}return null}
function updateEnemy(e,dt){if(e.dead)return;e.bob+=dt*8;if(!e.stun)enemyAnim(e,dt);if(e.aff==='regen'&&e.hp<e.maxhp&&simTime-(e.lastHit||0)>2.5)e.hp=Math.min(e.maxhp,e.hp+e.maxhp*.04*dt);if(e.affRing)e.affRing.rotation.z+=dt*2;
  if(e.hit>0){e.hit-=dt;if(e.hit<=0)for(const p of e.parts)p.material.emissive.setHex(e.afire>0?0x7a2a00:(p.userData.em||0))}
  const fx=Math.floor(e.pos.x),fz=Math.floor(e.pos.z);
  if(!e.fly){const tg=CLIMBS(e.type)?topY(e.pos.x,e.pos.z):surfE(e.pos.x,e.pos.z);e.gy+=(tg-e.gy)*Math.min(1,dt*(tg<e.gy?5:9));
    const fy=Math.floor(e.gy+.05);const under=inb(fx,fy,fz)?vox[idx(fx,fy,fz)]:0;e.inLava=under===8;e.inWater=under===9;if(e.inWater&&(e.type==='ram'||e.type==='rammer'||e.type==='crawler')&&!e.fly){dmgEnemy(e,(18+state.wave*1.6)*dt*(e.type==='crawler'?.6:1),false);e.slowT=Math.max(e.slowT||0,.4);if(Math.random()<dt*3)spawnDebris(e.pos.x,e.gy+.4,e.pos.z,0x4fa8e8,1,.2)}
    if(e.type==='titan'){e.inLava=false;if(e.inWater)dmgEnemy(e,40*dt,false);e.trailT=(e.trailT||0)-dt;if(e.trailT<=0){e.trailT=.45;const ly=Math.floor(e.gy);for(let k=0;k<3;k++){const x=Math.floor(e.pos.x+rnd(-1.5,1.5)),z=Math.floor(e.pos.z+rnd(-1.5,1.5));if(inb(x,ly,z)&&vox[idx(x,ly,z)]===0&&!inside(x,z))setFluid(idx(x,ly,z),8,3,false)}}}
    if(e.inLava&&e.type==='imp'){e.hp=Math.min(e.maxhp,e.hp+25*dt);e.speedBoost=1}else if(e.inLava){dmgEnemy(e,(e.type==='colossus'?14:30)*dt,false);e.afire=Math.max(e.afire,1.5);if(Math.random()<dt*6)spawnFlame(e.pos.x+rnd(-.4,.4),e.gy+.3,e.pos.z+rnd(-.4,.4),.7)}
    if(e.dead)return}
  if(e.afire>0){e.afire-=dt;if(e.inWater||e.type==='titan'||e.type==='imp')e.afire=0;dmgEnemy(e,5*dt,false);if(Math.random()<dt*10)spawnFlame(e.pos.x+rnd(-.4,.4),e.group.position.y+rnd(.3,1.2)*e.sc,e.pos.z+rnd(-.4,.4),.6);if(e.dead)return}
  e.iceT-=dt;if(e.iceT<=0&&!e.fly){e.iceT=.3;const y0=Math.floor(e.gy+.05);for(const [dx,dz] of NB4){for(let y=y0;y<y0+2;y++){const x=fx+dx,z=fz+dz;if(inb(x,y,z)&&vox[idx(x,y,z)]===18){e.slowT=Math.max(e.slowT,.8)}}}}
  if(e.slowT>0){e.slowT-=dt;if(Math.random()<dt*4)spawnFlame(e.pos.x+rnd(-.4,.4),e.group.position.y+.8,e.pos.z+rnd(-.4,.4),.4,true)}
  const sf=(!e.fly&&vox[idx(clamp(Math.floor(e.pos.x),0,W-1),clamp(Math.floor(e.gy)-1,0,H-1),clamp(Math.floor(e.pos.z),0,D-1))]===31?.4:1)*(e.slowT>0?.4:1)*(e.inWater?.55:1)*(e.inLava?.7:1)*(state.ev==='blizzard'?.7:state.ev==='sandstorm'?1.12:state.ev==='rain'&&!e.fly?.9:1)*(state.climate==='pantano'&&!e.fly?.88:1);e.timer-=dt*(e.slowT>0?.5:1);
  if(e.type==='ship'){e.group.position.y=e.gy+Math.sin(e.bob*.3)*.15;e.group.rotation.z=Math.sin(e.bob*.2)*.05;e.spawnT=(e.spawnT??2)-dt;e.fireT=(e.fireT??3)-dt;if(e.spawnT<=0&&(e.crew||0)<10+Math.floor(state.wave/3)){e.spawnT=5;for(let k=0;k<2;k++){const p=makeEnemy('pirate',Math.min(3,rollRarity(state.wave*.01)),e.pos.x+rnd(-2,2),e.pos.z+rnd(-2,2));p.viaWall=Math.random()<.4}e.crew=(e.crew||0)+2}if(e.fireT<=0){e.fireT=4;let tg=null,bd=60;for(const t of turrets){if(!t.alive||t.team==='r')continue;const d=hd(t.pos,e.pos);if(d<bd){bd=d;tg=t.pos}}if(!tg)tg={x:CX+rnd(-10,10),z:CZ+rnd(-10,10)};throwRock(e,tg.x,tg.z,2.4,45+state.wave*3,0x2b2d4a,false)}return}
  if(e.stun>0){e.stun-=dt;e.vel.set(0,0,0);e.group.rotation.z=Math.sin(e.stun*9)*.12;if(e.stun<=0)e.group.rotation.z=0;return}
  if(e.boss2&&bossAI(e,dt))return;
  if(e.type==='boss'){e.spitT=(e.spitT??4)-dt;if(e.spitT<=0){e.spitT=5.5-Math.min(2.5,state.wave*.05);let tgt=null,bd=1e9;for(const t of turrets){if(!t.alive||t.team==='r')continue;const d=hd(t.pos,e.pos);if(d<bd&&d<38){bd=d;tgt=t.pos}}if(!tgt)tgt=CHEST;spitAcid(e,tgt)}}
  if(e.type==='colossus'&&e.legs.some(L=>L.alive)){e.stompT=(e.stompT??6)-dt;if(e.stompT<=1.1&&!e.sw&&hd(e.pos,CHEST)<22){e.sw=1;markGround(e.pos.x,e.pos.z,8,0xff3355,1.1)}if(e.stompT<=0&&hd(e.pos,CHEST)<22){e.stompT=7;e.sw=0;stomp(e)}}
  if(e.rival&&rivalBrain(e,dt))return;
  if(e.veinRaid&&veinBrain(e,dt,sf))return;
  if(e.type==='goblin'&&goblinBrain(e,dt,sf))return;if(NEW_BRAINS[e.type]&&NEW_BRAINS[e.type](e,dt,sf))return;
  if(e.type==='wolf'){e.packT=(e.packT??0)-dt;if(e.packT<=0){e.packT=1;let n=0;for(const o of enemies)if(!o.dead&&o.type==='wolf'&&Math.abs(o.pos.x-e.pos.x)<7&&Math.abs(o.pos.z-e.pos.z)<7)n++;const was=e.pack;e.pack=n>=3;if(e.pack&&!was){e.speed*=1.3;if(Math.random()<.3)label({x:e.pos.x,y:e.gy+1.6,z:e.pos.z},'Auuu!','#7d7f8f')}else if(!e.pack&&was)e.speed/=1.3}
    // wolves hunt minions caught outside the walls
    if(!e.stun){let v=null,bd=11;for(const m of minions){if(m.wounded>0||inside(m.pos.x,m.pos.z))continue;const d=hd(m.pos,e.pos);if(d<bd){bd=d;v=m}}
      if(v){const dx=v.pos.x-e.pos.x,dz=v.pos.z-e.pos.z,d=Math.hypot(dx,dz)||1;e.group.rotation.y=Math.atan2(dx,dz);if(d<e.radius+1.2){e.vel.set(0,0,0);if(e.timer<=0){e.timer=e.T.rate;hurtMinion(v,e.T.dmg*(e.pack?1.4:1),e)}return}
        const sp=e.speed*(e.slowT>0?.4:1)*(state.ev==='blizzard'?.7:state.ev==='sandstorm'?1.12:1)*(state.climate==='pantano'&&!e.fly?.88:1);e.pos.x+=dx/d*sp*dt;e.pos.z+=dz/d*sp*dt;e.gy+=(surfE(e.pos.x,e.pos.z)-e.gy)*Math.min(1,dt*9);e.group.position.y=e.gy+Math.abs(Math.sin(e.bob+=dt*12))*.15;return}}}
  if(e.type==='mistking'){e.tpT=(e.tpT??5)-dt;e.pulseT=(e.pulseT??3)-dt;
    if(e.pulseT<=0){e.pulseT=Math.max(4,8-e.blvl*.3);for(const t of turrets)if(t.alive&&t.team!=='r'&&hd(t.pos,e.pos)<28)t.reload=Math.max(t.reload,2.5);ringFx(e.pos.x,e.gy+1,e.pos.z,14,0xb56cf2);label({x:e.pos.x,y:e.gy+e.sc*1.8,z:e.pos.z},'🌫️ Pulso da Bruma: armas atordoadas!','#b56cf2')}
    if(e.tpT<=0){e.tpT=Math.max(6,11-e.blvl*.3);for(let k=0;k<14;k++)spawnDebris(e.pos.x,e.gy+2,e.pos.z,0x2a1f45,1,.5);const a=rnd(0,Math.PI*2),r=rnd(14,22);e.pos.x=clamp(CX+Math.cos(a)*r,4,W-5);e.pos.z=clamp(CZ+Math.sin(a)*r,4,D-5);e.gy=surfE(e.pos.x,e.pos.z);e.path=null;
      if(enemies.length<170)for(let k=0;k<4+Math.floor(e.blvl/2);k++){const s=makeEnemy(pick(['crawler','wolf','imp']),Math.min(3,1+Math.floor(e.blvl/4)),e.pos.x+rnd(-3,3),e.pos.z+rnd(-3,3));for(const p of s.parts)p.material.color.setHex(0x3a2f5a)}shake=Math.max(shake,.6);SFX.zap();label({x:e.pos.x,y:e.gy+e.sc*1.8,z:e.pos.z},'👑 O Rei da Bruma surge!','#b56cf2')}}
  if(e.type==='golem'){e.thrT=(e.thrT??4)-dt;if(e.thrT<=0){e.thrT=Math.max(2.8,7.5-e.blvl*.35);let tg=null,bd=48;for(const t of turrets){if(!t.alive||t.team==='r')continue;const d=hd(t.pos,e.pos);if(d<bd){bd=d;tg=t.pos}}if(!tg)tg={x:CHEST.x+rnd(-8,8),z:CHEST.z+rnd(-8,8)};throwRock(e,tg.x,tg.z,2.6+e.blvl*.12,55+e.blvl*14,0x75706a,false);label({x:e.pos.x,y:e.gy+e.sc*1.6,z:e.pos.z},'🪨','#75706a')}}
  if(e.type==='wyrm'){e.fbT=(e.fbT??2)-dt;if(e.fbT<=0){e.fbT=Math.max(1.2,3.4-e.blvl*.14);throwRock(e,e.pos.x+rnd(-2,2),e.pos.z+rnd(-2,2),2+e.blvl*.08,30+e.blvl*8,0xff7a2a,true)}}
  if(e.type==='necro'){e.raiseT=(e.raiseT??3)-dt;e.summ=(e.summ||[]).filter(s=>!s.dead);if(e.raiseT<=0){e.raiseT=Math.max(3,7-e.blvl*.3);if(enemies.length<160)for(let k=0;k<2+Math.floor(e.blvl/2);k++){const a=rnd(0,Math.PI*2);const s=makeEnemy('crawler',Math.min(3,Math.floor(e.blvl/3)),e.pos.x+Math.cos(a)*3,e.pos.z+Math.sin(a)*3);s.viaWall=true;for(const p of s.parts)p.material.color.setHex(0xe8e2d0);e.summ.push(s)}for(let k=0;k<10;k++)spawnDebris(e.pos.x,e.gy+2,e.pos.z,0x7dff9a,1,.3);label({x:e.pos.x,y:e.gy+3,z:e.pos.z},'💀 Erguei-vos!','#7dff9a')}}
  if(e.type==='queen'){e.sumT=(e.sumT??3)-dt;if(e.sumT<=0){e.sumT=5;const alive=enemies.filter(o=>!o.dead).length;if(alive<70){for(let k=0;k<3+Math.floor(state.wave/10);k++){const a=rnd(0,Math.PI*2);const s=makeEnemy(Math.random()<.25?'flyer':'crawler',rollRarity(state.wave*.004),e.pos.x+Math.cos(a)*3,e.pos.z+Math.sin(a)*3);s.viaWall=true}for(let k=0;k<12;k++)spawnDebris(e.pos.x,e.gy+2,e.pos.z,0xa86fd9,1,.3);label({x:e.pos.x,y:e.gy+3,z:e.pos.z},'👑 Enxame!','#a86fd9');SFX.zap()}}}
  if(e.type==='shaman'){for(const o of enemies){if(o===e||o.dead)continue;if(hd(o.pos,e.pos)<7&&o.hp<o.maxhp){o.hp=Math.min(o.maxhp,o.hp+10*dt);if(Math.random()<dt*2)spawnDebris(o.pos.x,o.group.position.y+1,o.pos.z,0x7dff9a,1,.15)}}}
  if(e.fuse>=0){e.fuse-=dt;e.group.scale.setScalar(1+Math.sin(e.fuse*40)*.08);if(e.fuse<=0){e.dead=true;scene.remove(e.group);explode(e.pos.x,e.gy+.5,e.pos.z,3.2+e.rarity*.3,115*(1+e.rarity*.3),{fire:true,src:'enemy'});state.kills++;state.wk++}return}
  if(e.fly){const tgtY=e.diveY!==undefined?e.diveY:e.alt;e.curY=(e.curY??e.alt)+(tgtY-(e.curY??e.alt))*Math.min(1,dt*3);e.group.position.y=e.curY+Math.sin(e.bob*.6)*.25;e.gy=e.curY-1;const w=e.group.userData.wings;if(w){w[0].rotation.z=Math.sin(e.bob*2.5)*.5;w[1].rotation.z=-Math.sin(e.bob*2.5)*.5}
    let tgt=null,bd=1e9;for(const t of turrets){if(!t.alive||t.team==='r')continue;const d=hd(t.pos,e.pos);if(d<bd){bd=d;tgt={p:t.pos,t}}}
    if(!tgt)for(const m of minions){if(m.wounded)continue;const d=hd(m.pos,e.pos);if(d<bd){bd=d;tgt={p:m.pos,m}}}if(!tgt)tgt={p:CHEST};
    const dx=tgt.p.x-e.pos.x,dz=tgt.p.z-e.pos.z,d=Math.hypot(dx,dz);e.group.rotation.y=Math.atan2(dx,dz);e.diveY=d<5?(tgt.t?tgt.t.pos.y+1.2:tgt.m?tgt.m.group.position.y+1.8:GY+3):undefined;
    if(d<2){e.vel.set(0,0,0);e.atkT=simTime;if(e.timer<=0){e.timer=e.T.rate;const dmg=e.T.dmg*(1+e.rarity*.3);if(tgt.t){damageTurret(tgt.t,dmg);spawnDebris(tgt.t.pos.x,tgt.t.pos.y+.5,tgt.t.pos.z,0x6d6a8a,2,.2);SFX.crunch(true)}else if(tgt.m)hurtMinion(tgt.m,dmg);else{const i=CHEST_VOX().find(i=>vox[i]);if(i!==undefined)damageVox(i,dmg,'enemy',e)}}return}
    e.vel.set(dx/d*e.speed*sf,0,dz/d*e.speed*sf);e.pos.x+=e.vel.x*dt;e.pos.z+=e.vel.z*dt;return}
  if(CLIMBS(e.type)){e.group.position.y=e.gy;
    let tt=null;for(const t of turrets)if(t.alive&&hd(t.pos,e.pos)<2.2&&Math.abs(t.pos.y-e.gy)<2.4){tt=t;break}
    const victim=nearMinion(e,1.3);if(tt||victim){e.vel.set(0,0,0);if(e.timer<=0){e.timer=e.T.rate;if(victim)hurtMinion(victim,e.T.dmg);else damageTurret(tt,e.T.dmg*1.5)}return}
    _dir.subVectors(CHEST,e.pos);_dir.y=0;const dist=_dir.length();_dir.normalize();
    if(dist<2.6){e.vel.set(0,0,0);if(e.timer<=0){e.timer=e.T.rate;const i=CHEST_VOX().find(i=>vox[i]);if(i!==undefined)damageVox(i,e.T.dmg,'enemy',e)}return}
    const sp=(e.gy>GY+.5?e.speed*.55:e.speed)*sf;e.vel.copy(_dir).multiplyScalar(sp);e.pos.addScaledVector(e.vel,dt);e.group.rotation.y=Math.atan2(_dir.x,_dir.z);e.group.position.y=e.gy;return}
  const victim=nearMinion(e,1.3);
  if(victim&&e.type!=='ram'&&e.type!=='rammer'&&e.type!=='sapper'){e.vel.set(0,0,0);if(e.timer<=0){e.timer=e.T.rate;hurtMinion(victim,e.T.dmg*(BIG(e.type)?.6:1),e);e.lunge=.25}if(e.lunge>0){e.lunge-=dt}e.group.position.y=e.gy;return}
  if(e.type==='sapper'&&victim){e.fuse=.5;return}
  if(e.state==='attack'){e.vel.set(0,0,0);if(!SOLIDM(vox[e.target])){e.state='walk';return}
    if(e.timer<=0){e.timer=e.T.rate;const tx=ix(e.target),tz=iz(e.target),ty=iy(e.target);
      if(e.type==='ram'||e.type==='rammer'||e.type==='brute'||BIG(e.type)){const R=BIG(e.type)?2:1;for(let dx=-R;dx<=R;dx++)for(let dz=-R;dz<=R;dz++)for(let y=ty;y<ty+3;y++)if(inb(tx+dx,y,tz+dz))damageVox(idx(tx+dx,y,tz+dz),e.T.dmg*(dx||dz?.45:1),'enemy',e);shake=Math.max(shake,.3);SFX.boom(false)}
      else damageVox(e.target,e.T.dmg*(1+e.rarity*.2),'enemy',e);e.lunge=.25}
    if(e.lunge>0){e.lunge-=dt;e.group.position.y=e.gy+Math.sin(Math.max(0,e.lunge)/.25*Math.PI)*.3}else e.group.position.y=e.gy;return}
  // anti-stuck: no progress for 9 s → smash the ground ahead (big) or hop forward
  if(!e.prog)e.prog={x:e.pos.x,z:e.pos.z,t:simTime};if(Math.hypot(e.pos.x-e.prog.x,e.pos.z-e.prog.z)>1.5)e.prog={x:e.pos.x,z:e.pos.z,t:simTime};
  else if(simTime-e.prog.t>9){e.prog.t=simTime;_dir.subVectors(CHEST,e.pos);_dir.y=0;_dir.normalize();const ax=e.pos.x+_dir.x*(e.radius+1),az=e.pos.z+_dir.z*(e.radius+1);
    if(BIG(e.type)){for(let dx=-2;dx<=2;dx++)for(let dz=-2;dz<=2;dz++)for(let y=Math.floor(e.gy);y<Math.floor(e.gy)+5;y++){const x=Math.floor(ax)+dx,z=Math.floor(az)+dz;if(inb(x,y,z)&&vox[idx(x,y,z)]&&!blue[idx(x,y,z)])damageVox(idx(x,y,z),400,'enemy',e)}shake=Math.max(shake,.5);SFX.boom(true)}
    else{e.pos.x+=_dir.x*1.6;e.pos.z+=_dir.z*1.6;e.gy+=1.5;e.state='walk'}}
  const goal=(inside(e.pos.x,e.pos.z)||e.type==='ram'||e.type==='rammer'||BIG(e.type)||e.rarity>=2||e.viaWall||e.type==='shaman')?CHEST:GATE;
  _dir.subVectors(goal,e.pos);_dir.y=0;const dist=_dir.length();_dir.normalize();if(goal===GATE&&dist<1.2)e.viaWall=true;
  const ahead=e.radius+.6;const nx=Math.floor(e.pos.x+_dir.x*ahead),nz=Math.floor(e.pos.z+_dir.z*ahead);
  let blockedBy=enemyWallAt(e,nx,nz);if(blockedBy<0&&!BIG(e.type)){blockedBy=enemyWallAt(e,Math.floor(e.pos.x+_dir.x*ahead+_dir.z*.4),Math.floor(e.pos.z+_dir.z*ahead-_dir.x*.4))}
  if(blockedBy>=0){if(e.type==='sapper'){e.fuse=.7;e.vel.set(0,0,0);return}e.state='attack';e.target=blockedBy;e.timer=e.type==='ram'?.2:e.T.rate*.5;return}
  if(goal===CHEST&&dist<2.6){e.vel.set(0,0,0);if(e.timer<=0){e.timer=e.T.rate;const i=CHEST_VOX().find(i=>vox[i]);if(i!==undefined)damageVox(i,e.T.dmg,'enemy',e)}return}
  e.vel.copy(_dir).multiplyScalar(e.speed*sf);e.pos.addScaledVector(e.vel,dt);e.group.position.y=e.gy+Math.abs(Math.sin(e.bob))*.12;e.group.rotation.y=Math.atan2(_dir.x,_dir.z);
  for(const o of enemies){if(o===e||o.dead||o.fly)continue;const dx=e.pos.x-o.pos.x,dz=e.pos.z-o.pos.z;const d2=dx*dx+dz*dz,mn=e.radius+o.radius;if(d2<mn*mn&&d2>1e-4){const d=Math.sqrt(d2),push=(mn-d)*.5;e.pos.x+=dx/d*push;e.pos.z+=dz/d*push}}}

// ───────── minions
const ROLES={rep:{n:'Reparador',hat:0xff8a5c,cost:15,ico:'🛠️',d:'Constrói a planta e conserta blocos e armas'},col:{n:'Coletor',hat:0x5cc08c,cost:10,ico:'🎒',d:'Busca o loot e leva ao baú'},
  gun:{n:'Artilheiro',hat:0xec5f6b,cost:20,ico:'🎯',d:'Opera uma arma: dobra a cadência'},sol:{n:'Soldado',hat:0x4f9cf2,cost:18,ico:'⚔️',d:'Luta corpo a corpo junto à muralha'},
  med:{n:'Curandeiro',hat:0xf27eb8,cost:22,ico:'💊',d:'Cura feridos e quem está em combate'}};
const TRAITS={rep:['Rápido','Covarde','Teimoso','Sortudo'],col:['Rápido','Covarde','Mochilão','Sortudo'],gun:['Olho de Águia','Teimoso','Covarde'],sol:['Forte','Teimoso','Rápido'],med:['Rápido','Teimoso','Sortudo']};
const TRAIT_DESC={'Rápido':'anda e trabalha mais rápido','Covarde':'foge de Devoradores próximos','Teimoso':'muita vida, nunca foge','Mochilão':'carrega +2 itens','Olho de Águia':'arma operada 25% mais rápida','Forte':'+40% de dano','Sortudo':'às vezes dobra o material'};
const minions=[];const claimed=new Map();
function buildProp(p,role){clearGroup(p);if(role==='rep')mmesh([[.06,.5,.06,.4,.45,.12,0,0,0,0x8a7055],[.2,.12,.12,.4,.72,.12,0,0,0,0x9aa0b2]],0xffffff,p);
  if(role==='col')mmesh([[.46,.52,.3,0,.62,-.33,0,0,0,0xb98d5a],[.4,.12,.32,0,.92,-.33,0,0,0,0x8a5a33],[.5,.1,.14,0,.95,-.33,0,0,0,0x6b8f4e],[.05,.4,.05,-.18,.6,-.17,0,0,0,0x6b4a2a],[.05,.4,.05,.18,.6,-.17,0,0,0,0x6b4a2a]],0xffffff,p);
  if(role==='gun')mmesh([[.08,.08,.42,.4,.52,.16,0,0,0,0x3b3f55],[.1,.1,.08,.4,.52,.38,0,0,0,0x9fd8ff]],0xffffff,p);
  if(role==='sol')mmesh([[.06,.48,.4,-.42,.55,.08,0,0,0,0x5a6b8a],[.07,.2,.16,-.44,.58,.08,0,0,0,0xffcf3d],[.05,.55,.05,.42,.62,.18,.3,0,0,0xdfe6f0],[.18,.05,.05,.42,.38,.1,0,0,0,0x6b5235]],0xffffff,p);
  if(role==='med')mmesh([[.3,.3,.14,.36,.48,-.05,0,0,0,0xffffff],[.06,.18,.02,.36,.48,.03,0,0,0,0xe0444f],[.18,.06,.02,.36,.48,.03,0,0,0,0xe0444f]],0xffffff,p)}
// v2.6 PERSONAGENS R1 — minions refeitos do zero: chibi expressivo, peças fundidas (poucas draw calls), braços/pernas articulados, rosto com expressões
const _mm4=new THREE.Matrix4(),_mq=new THREE.Quaternion(),_me=new THREE.Euler(),_mv=new THREE.Vector3(),_ms=new THREE.Vector3(1,1,1),_mc=new THREE.Color();
function mergeBoxes(parts){const pos=[],nor=[],col=[];for(const p of parts){const g=new THREE.BoxGeometry(p[0],p[1],p[2]).toNonIndexed();_me.set(p[6]||0,p[7]||0,p[8]||0);_mq.setFromEuler(_me);_mv.set(p[3],p[4],p[5]);_mm4.compose(_mv,_mq,_ms);g.applyMatrix4(_mm4);
  const P=g.attributes.position.array,Nn=g.attributes.normal.array;_mc.setHex(p[9]===undefined?0xffffff:p[9]);for(let k=0;k<P.length;k+=3){pos.push(P[k],P[k+1],P[k+2]);nor.push(Nn[k],Nn[k+1],Nn[k+2]);const sh=Nn[k+1]>.5?1.06:Nn[k+1]<-.5?.7:Math.abs(Nn[k])>.5?.9:1;col.push(Math.min(1,_mc.r*sh),Math.min(1,_mc.g*sh),Math.min(1,_mc.b*sh))}g.dispose()}
  const G=new THREE.BufferGeometry();G.setAttribute('position',new THREE.Float32BufferAttribute(pos,3));G.setAttribute('normal',new THREE.Float32BufferAttribute(nor,3));G.setAttribute('color',new THREE.Float32BufferAttribute(col,3));return G}
function mmesh(parts,color,parent,emis){const m=new THREE.Mesh(mergeBoxes(parts),new THREE.MeshLambertMaterial({color:color||0xffffff,vertexColors:true}));if(emis){m.material.emissive.setHex(emis);m.material.emissiveIntensity=.35}m.castShadow=true;parent.add(m);return m}
const SKINS=[0xffe0c4,0xf6cfa8,0xe8b98e,0xc98e64,0xa66e4a,0x7d5137],HAIRS=[0x2b2018,0x5a3a22,0x8a5a2b,0xd9a441,0xe8d6a0,0xb0402a,0x3a3f55,0xf0f0f0];
function buildLook(m,heroH){const g=m.group;if(m.look)g.remove(m.look);const L=new THREE.Group();g.add(L);m.look=L;const V=m.vis;const R=m.R;
  // pernas articuladas (grupo no quadril) com botas
  const legs=[];for(const s of[-1,1]){const hip=new THREE.Group();hip.position.set(s*.13,.34,0);L.add(hip);mmesh([[.17,.22,.18,0,-.11,0,0,0,0,V.pants],[.19,.12,.24,0,-.28,.03,0,0,0,0x3b2f2a]],0xffffff,hip);legs.push(hip)}
  // tronco (cor da roupa/armadura no material: m.body)
  const torso=[[.5,.42,.34,0,.55,0],[.52,.07,.36,0,.38,0,0,0,0,0x5a4632],[.08,.05,.02,0,.38,.18,0,0,0,0xffcf3d]];if(R&&m.role==='med')torso.push([.06,.2,.02,0,.58,.175,0,0,0,0xe0444f],[.2,.06,.02,0,.6,.175,0,0,0,0xe0444f]);
  if(m.role==='rep')torso.push([.52,.3,.03,0,.54,.17,0,0,0,0xe8a23a],[.06,.38,.03,-.17,.6,.175,0,0,0,0xe8a23a],[.06,.38,.03,.17,.6,.175,0,0,0,0xe8a23a]);
  m.body=mmesh(torso,m.cloth||V.shirt,L);
  // braços articulados no ombro, com mãos
  const arms=[];for(const s of[-1,1]){const sh=new THREE.Group();sh.position.set(s*.32,.72,0);L.add(sh);mmesh([[.14,.3,.15,0,-.13,0,0,0,0,V.shirt],[.13,.12,.14,0,-.33,0,0,0,0,V.skin]],0xffffff,sh);arms.push(sh)}m.arms=arms;
  // cabeça grande + cabelo + rosto
  const head=new THREE.Group();head.position.set(0,1.08,0);L.add(head);m.headG=head;
  const hp=[[.62,.56,.54,0,0,0,0,0,0,V.skin],[.1,.12,.1,-.33,-.02,0,0,0,0,V.skin],[.1,.12,.1,.33,-.02,0,0,0,0,V.skin],[.09,.05,.02,-.19,-.1,.275,0,0,0,0xf2a0a0],[.09,.05,.02,.19,-.1,.275,0,0,0,0xf2a0a0],[.06,.06,.04,0,-.03,.285,0,0,0,V.skinD]];
  const hc=V.hair;if(V.style===0)hp.push([.66,.14,.58,0,.3,-.01,0,0,0,hc],[.66,.18,.1,0,.18,.25,0,0,0,hc]);else if(V.style===1)hp.push([.66,.16,.58,0,.3,0,0,0,0,hc],[.2,.3,.16,0,.05,-.32,0,0,0,hc],[.1,.1,.1,0,-.14,-.36,0,0,0,hc]);else if(V.style===2)hp.push([.64,.1,.56,0,.3,0,0,0,0,hc],[.14,.14,.14,-.2,.38,0,.3,0,.3,hc],[.14,.16,.14,.05,.4,.05,-.2,0,.2,hc],[.14,.14,.14,.22,.37,-.05,.2,0,-.3,hc]);else hp.push([.68,.12,.6,0,.31,0,0,0,0,hc],[.08,.36,.5,-.33,.05,-.02,0,0,0,hc],[.08,.36,.5,.33,.05,-.02,0,0,0,hc]);
  if(V.beard)hp.push([.5,.16,.08,0,-.24,.25,0,0,0,hc]);mmesh(hp,0xffffff,head);
  m.eyesM=mmesh([[.1,.13,.03,-.14,.04,.28,0,0,0,0x1d1f33],[.1,.13,.03,.14,.04,.28,0,0,0,0x1d1f33],[.04,.04,.02,-.12,.08,.3,0,0,0,0xffffff],[.04,.04,.02,.16,.08,.3,0,0,0,0xffffff]],0xffffff,head);
  m.brows=[];for(const s of[-1,1]){const b=mmesh([[.15,.035,.03,0,0,0,0,0,0,V.hairD]],0xffffff,head);b.position.set(s*.14,.17,.285);m.brows.push(b)}
  m.mouth=mmesh([[.12,.035,.02,0,0,0,0,0,0,0x7a3030]],0xffffff,head);m.mouth.position.set(0,-.17,.28);
  // chapéu do papel (m.hats recolorível)
  const H=heroH;let hat;
  if(H){const c=H.col;if(H.id==='paladin')hat=[[.7,.22,.62,0,.34,0],[.12,.3,.5,0,.48,0],[.74,.05,.66,0,.24,0]];else if(H.id==='archer')hat=[[.72,.3,.64,0,.26,-.04],[.5,.2,.2,0,.3,-.32],[.2,.2,.14,0,.14,-.4]];else if(H.id==='mage')hat=[[.86,.06,.78,0,.3,0],[.5,.22,.46,0,.42,0],[.34,.22,.32,0,.62,-.04,-.15],[.18,.2,.18,0,.8,-.1,-.3]];else if(H.id==='engineer')hat=[[.68,.16,.6,0,.33,0],[.74,.04,.3,0,.27,.22],[.5,.08,.06,0,.17,.29,0,0,0,0x444a5a]];else if(H.id==='priestess')hat=[[.72,.34,.64,0,.24,-.04],[.08,.08,.02,0,.42,.29,0,0,0,0xffe680]];else hat=[[.68,.16,.6,0,.33,0],[.1,.3,.1,-.36,.45,0,0,0,.5,0xf1e6c8],[.1,.3,.1,.36,.45,0,0,0,-.5,0xf1e6c8]];
    m.hats=[mmesh(hat,c,head)];if(H.id==='priestess'){const halo=new THREE.Mesh(new THREE.TorusGeometry(.28,.035,6,20),new THREE.MeshBasicMaterial({color:0xffe680}));halo.rotation.x=Math.PI/2;halo.position.y=.62;head.add(halo)}
    const cape=mmesh([[.5,.62,.05,0,.5,-.2,.12]],c,L);m.cape=cape}
  else{const r=m.role;if(r==='rep')hat=[[.66,.18,.6,0,.33,0],[.72,.05,.7,0,.24,.03],[.06,.08,.04,0,.36,.3,0,0,0,0xffffff]];else if(r==='col')hat=[[.64,.12,.58,0,.31,0],[.42,.06,.24,0,.25,.36]];else if(r==='gun')hat=[[.66,.12,.62,0,.31,-.02,0,0,.18],[.12,.1,.12,.2,.38,0],[.46,.09,.06,0,.15,.29,0,0,0,0x3b3f55]];else if(r==='sol')hat=[[.68,.24,.62,0,.27,0],[.06,.22,.06,0,.06,.3],[.08,.22,.4,0,.48,-.04,0,0,0,0xd9414f]];else hat=[[.72,.36,.62,0,.22,-.05],[.5,.26,.08,0,-.02,-.3]];m.hats=[mmesh(hat,R.hat,head)]}
  m.legs=legs;if(m.role==='gun'&&!H){/* óculos já no chapéu */}
  m.blinkT=rnd(1,4)}
function rollVis(){const skin=pick(SKINS),hair=pick(HAIRS);const sc=new THREE.Color(skin).lerp(new THREE.Color(0x553322),.25).getHex();return{skin,skinD:sc,hair,hairD:new THREE.Color(hair).lerp(new THREE.Color(0x000000),.35).getHex(),style:rint(0,3),beard:Math.random()<.18,pants:pick([0x4a4e6b,0x5a4a3a,0x3f5a4a,0x6b4a5a]),shirt:pick([0xf6f1ff,0xe8e0cc,0xd9e6f2,0xf2dcd0]),size:rnd(.93,1.07)}}
function makeMinion(role,rarity,x,z){const R=ROLES[role];const g=new THREE.Group();
  const prop=new THREE.Group();g.add(prop);const wpn=new THREE.Group();g.add(wpn);const acc=new THREE.Group();g.add(acc);
  if(rarity>=1){const ring=new THREE.Mesh(new THREE.TorusGeometry(.45,.05,6,20),new THREE.MeshBasicMaterial({color:RARITY[rarity].c}));ring.rotation.x=Math.PI/2;ring.position.y=.06;g.add(ring)}
  const trait=(rarity>=1||Math.random()<.35)?pick(TRAITS[role]):null;
  const vis=rollVis();g.scale.setScalar(US*vis.size*(trait==='Teimoso'||trait==='Forte'?1.05:1));g.position.set(x,standY(x,z),z);scene.add(g);
  const used=new Set(minions.map(o=>o.name));const name=shuffle(NAMES.slice()).find(n=>!used.has(n))||pick(NAMES)+' '+rint(2,9);
  const m={xp:0,lvl:1,name,role,R,rarity,trait,group:g,pos:g.position,vis,body:null,hats:[],prop,wpn,acc,legs:[],hp:1,maxhp:0,state:'idle',timer:0,task:null,turret:null,wounded:0,bob:rnd(0,6),bag:[],eq:{arma:null,armadura:null,acessorio:null},st:null,speed:3,work:1,path:null,pathT:0,skip:new Map(),stuckT:0,bestD:1e9,burn:0,kills:0};
  buildLook(m);buildProp(prop,role);g.userData.minion=m;recompute(m);m.hp=m.maxhp;minions.push(m);return m}
// expressões, piscadas e braços (chamado por minion a cada quadro)
function lookTick(m,dt0){if(!m.eyesM)return;m.lkA=(m.lkA||0)+dt0;if(m.lkA<.04)return;const dt=m.lkA;m.lkA=0;m.blinkT-=dt;const bl=m.blinkT<0&&m.blinkT>-.12;if(m.blinkT<-.12)m.blinkT=rnd(2,5);const hurt=m.wounded>0;
  m.eyesM.scale.y=hurt?.25:bl?.12:1;const fight=m.role==='sol'&&m.state==='fight'||m.rage>0;const work=m.state==='work';const haul=m.bag&&m.bag.length>0;
  const bA=hurt?-.35:fight?.4:work?.18:0;m.brows[0].rotation.z=-bA;m.brows[1].rotation.z=bA;m.brows[0].position.y=m.brows[1].position.y=fight?.15:.17;
  m.mouth.scale.set(haul||work?.8:1,hurt?2.2:haul?2:fight?1.6:1,1);
  const sw=m.legs[0]?m.legs[0].rotation.x:0;if(m.arms){if(work){m.arms[1].rotation.x=-1.2-Math.abs(Math.sin(simTime*14))*.9;m.arms[0].rotation.x=-.3}else if(haul){m.arms[0].rotation.x=m.arms[1].rotation.x=-.9}else if(fight){m.arms[1].rotation.x=-.6-Math.abs(Math.sin(simTime*10))*1.1;m.arms[0].rotation.x=-.5}else{m.arms[0].rotation.x=-sw*.8;m.arms[1].rotation.x=sw*.8}}
  if(m.cape)m.cape.rotation.x=.12+Math.abs(sw)*.3}
function recompute(m){const st={atk:1,def:0,spd:1,hp:1,gun:1,work:1,cap:0,rate:1,reach:0,stun:0,thorns:0,burn:0};
  for(const sl of ['arma','armadura','acessorio']){const it=m.eq[sl];if(!it)continue;for(const k in it.st){if(k==='def'||k==='cap'||k==='reach'||k==='stun'||k==='thorns'||k==='burn')st[k]+=it.st[k];else st[k]*=it.st[k]}}
  st.def=Math.min(.8,st.def);const R=m.rarity,T=m.trait;if(m.rank){const vb=m.rank>1?1.35:1.15;st.atk*=vb;st.hp*=vb}const LV=1+(m.lvl-1)*.07;st.atk*=LV;st.gun*=1+(m.lvl-1)*.05;
  m.speed=1.5*(m.role==='col'?4.2:m.role==='sol'?3.8:3.4)*(1+R*.12)*(T==='Rápido'?1.3:1)*st.spd*(m.role==='col'?1+state.lootMag*.15:1);
  m.work=(1+R*.25)*(T==='Rápido'?1.25:1)*st.work*LV;
  const hb=(m.role==='sol'?85:45)*(T==='Teimoso'?1.8:1)*(1+R*.2)*st.hp*LV*(m.hero?2.5*(heroHas(m.hero,'hp')?1.5:1):1)*(m.role==='sol'&&state.buildings&&state.buildings.barracks?1.25:1);const ratio=m.maxhp?m.hp/m.maxhp:1;m.maxhp=hb;m.hp=Math.max(1,hb*ratio);m.st=st;
  clearGroup(m.wpn);clearGroup(m.acc);const a=m.eq.arma,ar=m.eq.armadura,ac=m.eq.acessorio;
  if(a){const c=RARITY[a.r].c;const len=a.k==='lanca'?1.2:a.k==='martelo'?.75:.7;const b=box(.1,len,.1,c,-.42,.55+len/2-.2,.15,m.wpn);b.material.emissive.setHex(c);b.material.emissiveIntensity=a.r>=2?.45:.15;if(a.k==='martelo'||a.k==='machado')box(.32,.2,.14,0x9aa0b2,-.42,.55+len-.25,.15,m.wpn)}
  m.cloth=ar?({couro:0xb98d5a,malha:0xb8bfcc,placas:0x8ea9c6,escudo:0xd4c9a8})[ar.k]:null;if(m.body)m.body.material.color.setHex(m.cloth||m.vis.shirt);if(ar&&ar.k==='escudo')box(.1,.5,.42,RARITY[ar.r].c,.38,.5,.05,m.wpn);
  if(ac){const c=RARITY[ac.r].c;const o=box(.16,.16,.16,c,0,.75,-.25,m.acc);o.material.emissive.setHex(c);o.material.emissiveIntensity=.4}}
function setRole(m,role){if(m.role===role)return;if(m.turret){m.turret.gunner=null;m.turret=null}dropBag(m);releaseTask(m);m.role=role;m.R=ROLES[role];buildLook(m,m.hero?HEROES.find(h=>h.id===m.hero):null);buildProp(m.prop,role);m.state='idle';recompute(m)}
function dropBag(m){for(const L of m.bag){L.carried=null;L.claimed=null;L.y=m.group.position.y+1;L.x=m.pos.x+rnd(-.5,.5);L.z=m.pos.z+rnd(-.5,.5);L.vy=3;L.rest=false}m.bag=[]}
function releaseTask(m){if(m.task&&m.task.i!==undefined&&claimed.get(m.task.i)===m)claimed.delete(m.task.i);if(m.task&&m.task.L&&m.task.L.claimed===m)m.task.L.claimed=null;m.task=null}
function hurtMinion(m,d,from){if(m.wounded>0)return;if(from&&from.aff==='vamp'&&!from.dead){from.hp=Math.min(from.maxhp,from.hp+d*2.5)}if(m.hp-d*(1-m.st.def)<=0)state.morale=Math.max(0,(state.morale??60)-3);d*=(1-m.st.def);if(from&&m.st.thorns)dmgEnemy(from,d*m.st.thorns*3,true);m.hp-=d;if(m.hp<=0&&uniqueSave(m))return;SFX.hurt();
  if(m.hp<=0){m.wounded=24;m.hp=0;dropBag(m);releaseTask(m);if(m.turret){m.turret.gunner=null;if(m.state==='man'&&m.turret.station){m.pos.x=m.turret.station.x;m.pos.z=m.turret.station.z}m.turret=null}
    m.state='wounded';m.group.rotation.z=Math.PI/2;m.group.position.y=standY(m.pos.x,m.pos.z)+.35;m.path=null;toast(`${m.name} ferido`,'r0');state.wwound++}}
function supported(i){const x=ix(i),y=iy(i),z=iz(i);if(y===0||SOLIDM(vox[idx(x,y-1,z)]))return true;for(const [dx,dz] of NB4){if(inb(x+dx,y,z+dz)&&SOLIDM(vox[idx(x+dx,y,z+dz)]))return true}return false}
function cellBusy(i){const x=ix(i),y=iy(i),z=iz(i);for(const m of minions)if(Math.floor(m.pos.x)===x&&Math.floor(m.pos.z)===z&&Math.abs(m.group.position.y-y)<1.8)return true;
  for(const e of enemies)if(!e.dead&&!e.fly&&Math.abs(e.pos.x-x-.5)<e.radius+.5&&Math.abs(e.pos.z-z-.5)<e.radius+.5&&Math.abs(e.gy-y)<1.8)return true;for(const L of loot)if(!L.carried&&Math.floor(L.x)===x&&Math.floor(L.z)===z&&Math.abs(L.y-y-.5)<1)return false;return false}
function findRepairTask(m){let best=null,bs=1e9;const mx=m.pos.x,mz=m.pos.z;
  if(state.demol&&state.demol.size){for(const i of state.demol){if(!vox[i]||vox[i]===5||blue[i]){state.demol.delete(i);continue}if((m.skip.get(i)||0)>simTime)continue;const cl=claimed.get(i);if(cl&&cl!==m)continue;const s=-60-(iy(i)-GY)*5+Math.hypot(ix(i)+.5-mx,iz(i)+.5-mz);if(s<bs){bs=s;best={k:'demol',i}}}}
  if(state.swapQ&&state.swapQ.size){for(const i of state.swapQ){const b=blue[i];if(!b||!vox[i]||vox[i]===b||vox[i]===5){state.swapQ.delete(i);continue}if((m.skip.get(i)||0)>simTime)continue;const cl=claimed.get(i);if(cl&&cl!==m)continue;const s=-40+(iy(i)-GY)*3+Math.hypot(ix(i)+.5-mx,iz(i)+.5-mz);if(s<bs){bs=s;best={k:'swap',i}}}}
  for(const i of blueList){const b=blue[i];if(!b||vox[i]===b)continue;if(b===5&&!vox[i]&&state.phase==='wave'&&!state.rebuildChest)continue;if((m.skip.get(i)||0)>simTime)continue;const cl=claimed.get(i);if(cl&&cl!==m)continue;
    const cost=SPECIAL_BLOCKS.includes(b)&&!TIER_RANK[b]&&!state.prepaid.has(i)?(MAT[b].cost||3):0;if(cost>state.material)continue;
    let ti=i,kind='build';if(!supported(i)){if(iy(i)>GY+1)continue;const x=ix(i),z=iz(i);let y=1;while(y<iy(i)&&vox[idx(x,y,z)]&&!FLUID(vox[idx(x,y,z)]))y++;if(y>=iy(i))continue;ti=idx(x,y,z);kind='fill';if((m.skip.get(ti)||0)>simTime)continue}
    const s=(b===5?-80:0)+(iy(i)-GY)*4+Math.hypot(ix(i)+.5-mx,iz(i)+.5-mz);if(s<bs){bs=s;best={k:kind,i:ti}}}
  for(const t of turrets){if(!t.alive||t.hp>=t.maxhp*.85||t.team==='r')continue;const cl=t.fixer;if(cl&&cl!==m)continue;const s=hd(t.pos,m.pos)-6;if(s<bs){bs=s;best={k:'turret',t}}}
  for(const i of damaged){const v=vox[i];if(!v||!blue[i]||hp[i]>=maxHpOf(v)){damaged.delete(i);continue}if((m.skip.get(i)||0)>simTime)continue;const cl=claimed.get(i);if(cl&&cl!==m)continue;const s=Math.hypot(ix(i)+.5-mx,iz(i)+.5-mz)+5;if(s<bs){bs=s;best={k:'fix',i}}}
  if(best){if(best.i!==undefined)claimed.set(best.i,m);if(best.t)best.t.fixer=m}return best}
function progress(m,d,dt,onStuck){if(d<m.bestD-.15){m.bestD=d;m.stuckT=0}else m.stuckT+=dt;if(m.stuckT>4){m.stuckT=0;m.bestD=1e9;onStuck();return false}return true}
function lootOK(L,m){if(L.claimed||L.carried||L.unreach>simTime)return false;if(L.kind==='treasure'&&L.age<40)return false;const fx=Math.floor(L.x),fy=Math.floor(L.y-.5),fz=Math.floor(L.z);
  if(inb(fx,fy,fz)&&vox[idx(fx,fy,fz)]===8)return false;if(state.phase!=='wave'||inside(L.x,L.z))return true;for(const e of enemies)if(!e.dead&&!e.fly&&Math.abs(e.pos.x-L.x)<7&&Math.abs(e.pos.z-L.z)<7)return false;return true}
function updateMinion(m,dt0){const dt=dt0*(.8+(state.morale??60)/100*.4);lookTick(m,dt0);if(m.frozen){m.group.position.y=standY(m.pos.x,m.pos.z);return}
  if(m.state==='wounded'||m.wounded>0){if(m.state!=='wounded'){m.state='wounded';m.group.rotation.z=Math.PI/2}m.wounded-=dt*state.healMul;if(m.wounded<=0){m.wounded=0;m.hp=m.maxhp*.6;m.state='idle';m.group.rotation.z=0;m.group.position.y=standY(m.pos.x,m.pos.z);toast(`${m.name} voltou!`,'r1')}return}
  m.timer-=dt;m.legs[0].rotation.x*=.9;m.legs[1].rotation.x*=.9;
  if(m.state!=='man'){const fx=Math.floor(m.pos.x),fz=Math.floor(m.pos.z),s=surf(m.pos.x,m.pos.z);if(inb(fx,s,fz)&&(vox[idx(fx,s,fz)]===8||(s>0&&vox[idx(fx,s-1,fz)]===8))){m.burn+=dt*14;if(Math.random()<dt*8)spawnFlame(m.pos.x,m.group.position.y+.3,m.pos.z,.5);if(m.burn>6){m.burn=0;hurtMinion(m,10)}}
    const wc=walkCell(fx,fz);if(wc<=-99&&!m.escT){m.escT=1}if(m.escT){m.escT-=dt;if(m.escT<=0)m.escT=0;const st=findStation(m.pos.x,m.pos.z);if(st&&hd(st,m.pos)>.3){m.pos.x+=(st.x-m.pos.x)*Math.min(1,dt*3);m.pos.z+=(st.z-m.pos.z)*Math.min(1,dt*3);m.group.position.y+=(standY(st.x,st.z)-m.group.position.y)*Math.min(1,dt*6)}}}
  if(m.wounded>0)return;
  if(m.trait==='Covarde'&&m.role!=='sol'&&m.state!=='man'){let near=null,bd=4.5;for(const e of enemies){if(e.dead||e.fly)continue;const d=hd(e.pos,m.pos);if(d<bd){bd=d;near=e}}if(near){const dx=m.pos.x-near.pos.x,dz=m.pos.z-near.pos.z,dl=Math.hypot(dx,dz)||1;walkRaw(m,m.pos.x+dx/dl*4,m.pos.z+dz/dl*3,dt,.1);if(Math.random()<dt*.5)label(m.pos,'!','#ec5f6b');return}}
  ({rep:updRep,col:updCol,gun:updGun,sol:updSol,med:updMed})[m.role](m,dt)}
function idleWander(m,dt,cx,cz){if(!m.raid&&m.role!=='sol'&&state.phase!=='wave'&&isNight()){// night: rest inside the keep hall, slowly healing
    const k=(m.bob*7|0)%9,kx=CX-2+(k%3)*2,kz=CZ-2+((k/3)|0)*2;if(walkTo(m,kx,kz,dt,.6)){m.resting=true;m.hp=Math.min(m.maxhp,m.hp+dt*3);if(Math.random()<dt*.15)label({x:m.pos.x,y:m.group.position.y+2.4,z:m.pos.z},'z','#8aa0d8')}return}
  m.resting=false;if(m.wSeed===undefined)m.wSeed=rnd(0,6.28);const wa=m.wSeed+Math.floor(simTime/9)*1.7;let wx=cx+Math.sin(wa)*3.5,wz=cz+Math.cos(wa*1.3)*2.5;if(walkCell(Math.floor(wx),Math.floor(wz))<=-99||m.pf>=2){if(!m.wHome||m.pf>=3){m.wHome={x:m.pos.x,z:m.pos.z};m.pf=0;m.path=null}wx=m.wHome.x+Math.sin(wa)*1.5;wz=m.wHome.z+Math.cos(wa)*1.5}walkTo(m,wx,wz,dt,.5)}
function updRep(m,dt){
  if(!m.task){if(m.timer>0){idleWander(m,dt,CX+3,CZ+4);return}m.task=findRepairTask(m);if(!m.task){m.timer=.6;return}m.bestD=1e9;m.stuckT=0;m.state='go'}
  const T=m.task;let tx,tz,y=GY;
  if(T.k==='turret'){if(!T.t.alive||T.t.hp>=T.t.maxhp){T.t.fixer=null;m.task=null;return}tx=T.t.pos.x;tz=T.t.pos.z}
  else{const i=T.i;if(T.k==='build'&&(vox[i]===blue[i]||!blue[i])){releaseTask(m);return}if(T.k==='fill'&&SOLIDM(vox[i])){releaseTask(m);return}if(T.k==='fix'&&(!vox[i]||hp[i]>=maxHpOf(vox[i]))){releaseTask(m);return}if(T.k==='demol'&&(!vox[i]||!state.demol||!state.demol.has(i))){releaseTask(m);return}if(T.k==='swap'&&(!state.swapQ||!state.swapQ.has(i)||!blue[i]||vox[i]===blue[i])){releaseTask(m);return}tx=ix(i)+.5;tz=iz(i)+.5;y=iy(i)}
  const d=Math.hypot(tx-m.pos.x,tz-m.pos.z);
  if(m.state==='go'){if(walkTo(m,tx,tz,dt,2.4)||d<(T.k==='turret'?2.6:3.4)){m.state='work';m.timer=(T.k==='fix'?.35:.5)/(m.work*state.repMul*reformMul());m.group.rotation.y=Math.atan2(tx-m.pos.x,tz-m.pos.z)}
    else progress(m,d,dt,()=>{if(T.i!==undefined)m.skip.set(T.i,simTime+12);if(T.t)T.t.fixer=null;releaseTask(m)});return}
  m.group.position.y=standY(m.pos.x,m.pos.z)+Math.abs(Math.sin(m.timer*25))*.08;
  if(m.timer>0)return;
  if(T.k==='demol'||T.k==='swap'){const i=T.i,v=vox[i];if(v){const c=MAT[v]?MAT[v].c:0x888888;if(T.k==='demol'){setVox(i,0);state.demol.delete(i);settleDirty=true;spawnDebris(ix(i)+.5,iy(i)+.5,iz(i)+.5,c,4,.22);SFX.crunch&&SFX.crunch(false)}else{const b=blue[i];setVox(i,b);hp[i]=maxHpOf(b);damaged.delete(i);state.swapQ.delete(i);spawnDebris(ix(i)+.5,iy(i)+.5,iz(i)+.5,c,3,.2);sparkle(ix(i)+.5,iy(i)+.9,iz(i)+.5,MAT[b].c,2);SFX.build()}gainXP(m,1)}releaseTask(m);m.state='idle';
    const nx=findRepairTask(m);if(nx&&nx.i!==undefined&&Math.hypot(ix(nx.i)+.5-m.pos.x,iz(nx.i)+.5-m.pos.z)<3.2){m.task=nx;m.state='work';m.timer=.5/(m.work*state.repMul*reformMul())}else if(nx){m.task=nx;m.state='go';m.bestD=1e9}return}
  if(T.k==='fill'){const i=T.i;if(!cellBusy(i)){setVox(i,iy(i)===GY-1?13:12);settleDirty=true;SFX.build();spawnDebris(ix(i)+.5,iy(i)+.5,iz(i)+.5,MAT[12].c,3,.2)}else m.skip.set(i,simTime+3);releaseTask(m);m.state='idle';return}
  if(T.k==='build'){const i=T.i,b=blue[i];const cost=SPECIAL_BLOCKS.includes(b)&&!TIER_RANK[b]&&!state.prepaid.has(i)?(MAT[b].cost||3):0;if(!cellBusy(i)&&state.material>=cost&&supported(i)){state.material-=cost;state.prepaid.delete(i);setVox(i,b);settleDirty=true;SFX.build();gainXP(m,1);spawnDebris(ix(i)+.5,y+.5,iz(i)+.5,MAT[b].c,3,.2)}else m.skip.set(i,simTime+3);releaseTask(m);m.state='idle';
    // keep building nearby blocks without going idle
    const nx=findRepairTask(m);if(nx&&(nx.i===undefined||Math.hypot(ix(nx.i)+.5-m.pos.x,iz(nx.i)+.5-m.pos.z)<3.2)){m.task=nx;m.state='work';m.timer=.5/(m.work*state.repMul*reformMul())}else if(nx){m.task=nx;m.state='go';m.bestD=1e9}return}
  if(T.k==='fix'){const i=T.i;if(vox[i]){hp[i]=Math.min(maxHpOf(vox[i]),hp[i]+maxHpOf(vox[i])*.5);if(hp[i]>=maxHpOf(vox[i]))damaged.delete(i);paint(i);SFX.pop()}releaseTask(m);m.state='idle';return}
  if(T.k==='turret'){const t=T.t;t.hp=Math.min(t.maxhp,t.hp+t.maxhp*.2);sparkle(t.pos.x,t.pos.y+.5,t.pos.z,0xffcf3d,3);SFX.pop();if(t.hp>=t.maxhp){t.fixer=null;m.task=null;m.state='idle'}else m.timer=.4/(m.work*state.repMul);return}}
function updCol(m,dt){const cap=4+m.rarity+m.st.cap+state.lootMag+(m.trait==='Mochilão'?2:0);
  if(m.bag.length<cap&&(m.state==='fetch'||m.state==='haul'))for(const L of loot){if(L.carried||(L.claimed&&L.claimed!==m)||L.kind==='treasure')continue;if(Math.abs(L.x-m.pos.x)<2&&Math.abs(L.z-m.pos.z)<2&&Math.abs(L.y-m.group.position.y)<3){if(m.task&&m.task.L===L)m.task=null;L.carried=m;L.claimed=m;L.slot=m.bag.length;m.bag.push(L);SFX.pop();if(m.bag.length>=cap)break}}
  if(m.state==='fetch'&&!m.task){m.state=m.bag.length>=cap?'haul':'idle';if(m.state==='idle'&&m.bag.length){let nx=null,bd=14;for(const o of loot){if(!lootOK(o,m))continue;const dd=hd(o,m.pos);if(dd<bd){bd=dd;nx=o}}if(nx){nx.claimed=m;m.task={L:nx};m.state='fetch';m.bestD=1e9}else m.state='haul'}}
  if(m.state==='haul'){const d=hd(m.pos,{x:CHEST.x,z:CHEST.z+2.8});if(walkTo(m,CHEST.x,CHEST.z+2.8,dt,1.3)||d<1.5){for(const L of m.bag)deposit(L,m);m.bag=[];m.state='idle';m.timer=.15}else progress(m,d,dt,()=>{m.pos.x=CHEST.x;m.pos.z=CHEST.z+2.8});return}
  if(m.state==='fetch'){const L=m.task&&m.task.L;if(!L||!loot.includes(L)||L.carried){m.task=null;m.state=m.bag.length?'haul':'idle';return}const d=Math.hypot(L.x-m.pos.x,L.z-m.pos.z);
    if(walkTo(m,L.x,L.z,dt,.8)||(d<1.3&&Math.abs(L.y-m.group.position.y)<3)){L.carried=m;L.slot=m.bag.length;m.bag.push(L);m.task=null;SFX.pop();
      let nx=null,bd=12;if(m.bag.length<cap)for(const o of loot){if(!lootOK(o,m))continue;const dd=hd(o,m.pos);if(dd<bd){bd=dd;nx=o}}
      if(nx){nx.claimed=m;m.task={L:nx};m.bestD=1e9}else m.state='haul'}
    else progress(m,d,dt,()=>{L.unreach=simTime+20;L.claimed=null;m.task=null;m.state=m.bag.length?'haul':'idle'});return}
  if(m.timer>0){idleWander(m,dt,CX+4,CZ+3);return}
  let best=null,bs=1e9;for(const L of loot){if(!lootOK(L,m))continue;const s=(L.prio?-60:0)-L.r*4+(L.kind==='turret'?-10:0)+hd(L,m.pos);if(s<bs){bs=s;best=L}}
  if(best){best.claimed=m;m.task={L:best};m.state='fetch';m.bestD=1e9;m.stuckT=0}else m.timer=.5}
const TV=t=>t.T.v+t.r*.5;
function updGun(m,dt){
  if(m.state==='man'){const t=m.turret;if(!t||!t.alive){m.turret=null;m.state='idle';m.group.position.y=standY(m.pos.x,m.pos.z);return}
    m.pos.x=t.pos.x-Math.sin(t.yaw)*1.25;m.pos.z=t.pos.z-Math.cos(t.yaw)*1.25;m.group.position.y=t.pos.y-.05;m.group.rotation.y=t.yaw;return}
  if(!m.turret||!m.turret.alive||m.turret.gunner!==m){m.turret=null;m.bowT=(m.bowT||0)-dt;if(m.bowT<=0){let tg=null,bd=20;for(const e of enemies){if(e.dead)continue;const d=hd(e.pos,m.pos);if(d<bd){bd=d;tg=e}}if(tg){m.bowT=.9/m.st.gun;const from=new THREE.Vector3(m.pos.x,m.group.position.y+1.6,m.pos.z),aim=enemyAim(tg);const vel=aim.sub(from).normalize().multiplyScalar(40);shoot(from,vel,2,9*m.st.gun*state.dmgMul,'bolt',{r:0,gunner:m});m.group.rotation.y=Math.atan2(tg.pos.x-m.pos.x,tg.pos.z-m.pos.z);SFX.twang()}}
    if(m.timer>0){idleWander(m,dt,CX-4,CZ-4);return}
    let best=null,bs=-1e9;for(const t of turrets){if(!t.alive||t.gunner||!t.station||t.team==='r')continue;if((m.skip.get(t)||0)>simTime)continue;const s=TV(t)*6-hd(t.pos,m.pos)*.3-postDist(m,t.pos.x,t.pos.z)*.6;if(s>bs){bs=s;best=t}}
    if(!best){m.timer=.8;return}best.gunner=m;m.turret=best;m.bestD=1e9;m.stuckT=0}
  const t=m.turret,st=t.station;if(!st){t.gunner=null;m.turret=null;return}const d=hd(st,m.pos);
  if(walkTo(m,st.x,st.z,dt,.6)||d<.8){m.state='man';SFX.pop();label(m.pos,'🎯','#ec5f6b')}else progress(m,d,dt,()=>{m.skip.set(t,simTime+15);t.gunner=null;m.turret=null})}
function updSol(m,dt){if(m.raid&&raidSoldier(m,dt))return;const RL=state.rally;let tgt=null,bd=1e9;for(const e of enemies){if(e.dead||(e.rival&&e.rmode==='guard')||(RL?Math.hypot(e.pos.x-RL.x,e.pos.z-RL.z)>14:Math.hypot(e.pos.x-CX,e.pos.z-CZ)>WR+30)||(e.fly&&e.group.position.y>m.group.position.y+3.2)||(!e.fly&&e.gy>GY+3))continue;const d=hd(e.pos,m.pos);const pri=postDist(m,e.pos.x,e.pos.z)*.6+(inside(e.pos.x,e.pos.z)?0:30)+(e.state==='attack'?-12:0)+(e.type==='shaman'?-10:0)+d;if(pri<bd){bd=pri;tgt=e}}
  if(tgt&&(inside(tgt.pos.x,tgt.pos.z)||state.phase!=='wave'||tgt.state==='attack'||hd(tgt.pos,m.pos)<14)){const reach=tgt.radius+1.3+m.st.reach;
    if(walkTo(m,tgt.pos.x,tgt.pos.z,dt,reach)||hd(tgt.pos,m.pos)<reach+.1){m.group.rotation.y=Math.atan2(tgt.pos.x-m.pos.x,tgt.pos.z-m.pos.z);
      if(m.timer<=0){m.timer=.7/(m.work*m.st.rate);const dmg=16*(1+m.rarity*.3)*(m.trait==='Forte'?1.4:1)*state.bladeMul*m.st.atk*(m.rage>0?3:1)*(cheerOn(m)?1.2:1);tgt.lastSol=m;hurtEnemy(tgt,uniqueCrit(m,dmg,tgt),{x:tgt.pos.x,y:tgt.gy+.6,z:tgt.pos.z});
        if(tgt.dead)gainXP(m,6+tgt.maxhp/12);if(m.st.stun&&Math.random()<m.st.stun)tgt.stun=Math.max(tgt.stun,.6);if(m.st.burn)tgt.afire=Math.max(tgt.afire,2);m.wpn.rotation.x=-1.2;spawnDebris(tgt.pos.x,tgt.gy+.8,tgt.pos.z,tgt.T.color,2,.2)}}
    m.wpn.rotation.x*=.85;return}
  // soldiers hold the field outside the walls, in front of the gate
  if(RL){idleWander(m,dt,RL.x+(((m.bob*13)|0)%5-2)*1.2,RL.z+(((m.bob*7)|0)%3-1)*1.2);return}
  {const p=postPos(m.post);const sideways=m.post==='leste'||m.post==='oeste';idleWander(m,dt,p.x+(sideways?(((m.bob*7)|0)%3)*1.5:(((m.bob*13)|0)%9-4)*1.6),p.z+(sideways?(((m.bob*13)|0)%9-4)*1.6:(((m.bob*7)|0)%3)*1.5))}}
function updMed(m,dt){let tgt=null,bd=1e9;for(const o of minions){if(o===m)continue;if(o.wounded>0){const d=hd(o.pos,m.pos);if(d<bd){bd=d;tgt=o}}}
  if(!tgt)for(const o of minions){if(o===m||o.state==='man')continue;if(o.hp<o.maxhp*.75){const d=hd(o.pos,m.pos)+8;if(d<bd&&d<45){bd=d;tgt=o}}}
  if(!tgt&&m.raid){const s=minions.find(o=>o.raid===m.raid&&o.role==='sol');if(s){walkTo(m,s.pos.x-1.5,s.pos.z-1.5,dt,1.5);return}m.raid=null}
  if(tgt){if(walkTo(m,tgt.pos.x,tgt.pos.z,dt,1.4)||hd(tgt.pos,m.pos)<1.6){const pw=(1+m.rarity*.3)*m.work;if(tgt.wounded>0){tgt.wounded-=dt*5*pw;if(tgt.wounded<=0)gainXP(m,5)}else tgt.hp=Math.min(tgt.maxhp,tgt.hp+14*pw*dt);if(Math.random()<dt*5)spawnDebris(tgt.pos.x,tgt.group.position.y+1,tgt.pos.z,0x7dff9a,1,.16)}return}
  idleWander(m,dt,CX-3,CZ+3)}

// ── boss abilities
const shots=[];const acidMat=lmat(0x9cff4a,.8),acidGeo=new THREE.SphereGeometry(.45,10,10);
function spitAcid(e,tgt){const from=new THREE.Vector3(e.pos.x,e.gy+e.sc*1.1,e.pos.z);const T=1.6,gr=18;const vel=new THREE.Vector3((tgt.x-from.x)/T,((tgt.y||GY)+.5-from.y+.5*gr*T*T)/T,(tgt.z-from.z)/T);
  const mesh=new THREE.Mesh(acidGeo,acidMat);mesh.position.copy(from);scene.add(mesh);shots.push({mesh,vel,gr,life:3,dmg:55+state.wave*2});SFX.whoosh();label({x:e.pos.x,y:e.gy+3,z:e.pos.z},'🤮','#5cc08c')}
function updateShots(dt){updateMarks(dt);for(const e of enemies)if(e.aura&&!e.dead){const p=.45+Math.sin(simTime*4)*.15;e.aura.material.opacity=p;if(e.fly)e.aura.position.y=-(e.group.position.y-(topY(e.pos.x,e.pos.z)))+.08}for(let i=shots.length-1;i>=0;i--){const s=shots[i];s.life-=dt;s.vel.y-=s.gr*dt;s.mesh.position.addScaledVector(s.vel,dt);const p=s.mesh.position;if(Math.random()<.5)spawnDebris(p.x,p.y,p.z,0x9cff4a,1,.15);
    let hit=cellSolid(p.x,p.y,p.z)||s.life<=0;if(!hit)for(const t of turrets)if(t.alive&&t.pos.distanceTo(p)<1){hit=true;break}
    if(hit){scene.remove(s.mesh);shots.splice(i,1);explode(p.x,p.y,p.z,2.6,s.dmg,{src:'enemy'});spawnDebris(p.x,p.y,p.z,0x9cff4a,14,.3)}}}
const rings=[];const ringMat=new THREE.MeshBasicMaterial({color:0xffe7b0,transparent:true,opacity:.7,side:THREE.DoubleSide,depthWrite:false});
function stomp(e){const r=new THREE.Mesh(new THREE.RingGeometry(.8,1.3,40),ringMat.clone());r.rotation.x=-Math.PI/2;r.position.set(e.pos.x,e.gy+.15,e.pos.z);scene.add(r);rings.push({m:r,t:0});
  for(let dx=-8;dx<=8;dx++)for(let dz=-8;dz<=8;dz++){const d=Math.hypot(dx,dz);if(d>8)continue;const x=Math.floor(e.pos.x)+dx,z=Math.floor(e.pos.z)+dz;for(let y=GY-2;y<GY+4;y++)if(inb(x,y,z)&&vox[idx(x,y,z)])damageVox(idx(x,y,z),45*(1-d/9),'enemy',null)}
  for(const m of minions)if(!m.wounded&&hd(m.pos,e.pos)<9&&m.state!=='man')hurtMinion(m,22);
  shake=Math.max(shake,1.1);SFX.boom(true);toast('O Colosso pisou!','r3')}
function updateRings(dt){for(let i=rings.length-1;i>=0;i--){const r=rings[i];r.t+=dt;const s=1+r.t*9;r.m.scale.set(s,s,s);r.m.material.opacity=.7*(1-r.t/.6);if(r.t>.6){scene.remove(r.m);rings.splice(i,1)}}}

const xpNeed=l=>Math.round(18*Math.pow(l,1.45));
function gainXP(m,n){if(!m||!minions.includes(m))return;m.xp+=n;while(m.xp>=xpNeed(m.lvl)&&m.lvl<30){m.xp-=xpNeed(m.lvl);m.lvl++;recompute(m);m.hp=m.maxhp;if(m.hero&&TALENT_LV.includes(m.lvl))setTimeout(()=>offerTalent(m),400);
  sparkle(m.pos.x,m.group.position.y+1.6,m.pos.z,0xffcf3d,14);ringFx(m.pos.x,m.group.position.y+.2,m.pos.z,2.4,0xffcf3d);label({x:m.pos.x,y:m.group.position.y,z:m.pos.z},`NÍVEL ${m.lvl}! ↑`,'#e0a000');SFX.loot(Math.min(4,Math.floor(m.lvl/5)));if(m.hero&&m.lvl%5===0)toast(`${m.name} chegou ao nível ${m.lvl}!`,'r3');}}

// ───────── body destruction: enemies are built from chunks that break off as they take damage
const _cv=new THREE.Vector3();
// v1.1 corpos em voxels pequenos: corpo e cabeça viram um InstancedMesh de cubinhos arredondados (casca colorida, interior "carne" escura)
const _vm=new THREE.Matrix4(),_vq=new THREE.Quaternion(),_vs=new THREE.Vector3(),_vp=new THREE.Vector3(),_vc=new THREE.Color(),_vc2=new THREE.Color(),_vflesh=new THREE.Color(0x4a1626),_vgeo=new THREE.BoxGeometry(1,1,1);
function vcells(mesh,vsz,maxN,flesh,pat,round){const p=mesh.geometry.parameters;if(!p||!p.width)return[];const W=p.width*mesh.scale.x,H=p.height*mesh.scale.y,Dp=p.depth*mesh.scale.z;
  let v=vsz;let nx,ny,nz;for(let t=0;t<10;t++){nx=Math.max(1,Math.round(W/v));ny=Math.max(1,Math.round(H/v));nz=Math.max(1,Math.round(Dp/v));if(nx*ny*nz*.62<=maxN)break;v*=1.18}
  const sx=W/nx,sy=H/ny,sz=Dp/nz;const base=mesh.material.color.clone();const P=3.2;mesh.updateMatrix();_vq.setFromEuler(mesh.rotation);const out=[];
  for(let i=0;i<nx;i++)for(let j=0;j<ny;j++)for(let k=0;k<nz;k++){const u=nx>1?(i+.5)/nx*2-1:0,w=ny>1?(j+.5)/ny*2-1:0,q=nz>1?(k+.5)/nz*2-1:0;const r=Math.pow(Math.abs(u),P)+Math.pow(Math.abs(w),P)+Math.pow(Math.abs(q),P);if(round&&r>1.08&&!(j===0&&r<1.6))continue;
    const shell=(i===0||i===nx-1||j===0||j===ny-1||k===0||k===nz-1)||r>.42;const c=new THREE.Color().copy(base);
    if(!shell&&flesh)c.lerp(_vflesh,.65);else{c.offsetHSL(0,0,w*.07+(Math.random()-.5)*.07);if(w<-.5&&round)c.lerp(_vc2.setHex(0x1d1f33),.18);if(pat&&pat({i,j,k,u,w,q}))c.lerp(_vc2.setHex(pat.col),.55)}
    const pos=new THREE.Vector3((i-(nx-1)/2)*sx,(j-(ny-1)/2)*sy,(k-(nz-1)/2)*sz).applyMatrix4(mesh.matrix);out.push({pos,q:_vq.clone(),sc:new THREE.Vector3(sx*.96,sy*.96,sz*.96),c,sh:shell,s:Math.max(sx,sy,sz),key:r+Math.random()*.5+(w>0?.2:0)+(shell?1:0)})}
  return out}
function vinst(e,cells,parent,emSrc){if(!cells.length)return[];const im=new THREE.InstancedMesh(_vgeo,new THREE.MeshLambertMaterial({color:0xffffff}),cells.length);im.castShadow=true;
  if(emSrc){const em=emSrc.material.emissive;if(em&&em.getHex()){im.material.emissive.copy(em);im.material.emissiveIntensity=emSrc.material.emissiveIntensity}im.userData.em=emSrc.userData.em}
  parent.add(im);cells.forEach((c,n)=>{_vm.compose(c.pos,c.q,c.sc);im.setMatrixAt(n,_vm);im.setColorAt(n,c.c)});im.instanceMatrix.needsUpdate=true;im.instanceColor.needsUpdate=true;e.vmeshes.push(im);
  return cells.map((c,n)=>({im,n,s:c.s,key:c.key}))}
const VPAT={wolf:c=>c.w>.3&&Math.abs(c.u)<.35,beetle:c=>Math.abs(c.u)<.12&&c.w>0,spider:c=>c.w>.4&&((c.k%3)===0),crawler:c=>c.w>.5&&(c.k%2===0),brute:c=>c.w<-.2&&c.w>-.6,slime:c=>Math.random()<.08,imp:c=>c.w>.6,boss:c=>c.w>.5&&Math.abs(c.u)<.25,colossus:c=>c.w>.6&&(c.i+c.k)%3===0,golem:c=>Math.random()<.12,titan:c=>Math.random()<.18,necro:c=>c.w>.2&&Math.abs(c.u)<.2};
const VPATC={wolf:0xdfe3ea,beetle:0x0f2222,spider:0xff4a5a,crawler:0xff9ad1,brute:0x3a2a20,slime:0xffffff,imp:0xffd04a,boss:0xff4a8a,colossus:0xec5f6b,golem:0x6f8f55,titan:0xffb13d,necro:0x7dff9a};
function setupChunks(e,body,head){const g=e.group,big=BIG(e.type);e.vmeshes=[];if(e.type==='ship'){e.chunks=g.children.filter(c=>c.isMesh&&c!==body);e.lost=0;e.keepN=2;return}
  const pat=VPAT[e.type]?Object.assign(VPAT[e.type],{col:VPATC[e.type]}):null;const vs=big?.3:.16+(e.rarity>=1?0:.02);
  const legSet=new Set(e.legs.map(L=>L.mesh));const wings=new Set(g.userData.wings||[]);const fx=new Set(fuses);
  // corpo + extras estáticos (chifres, placas, chapéus...) viram um único InstancedMesh no espaço do grupo
  let cells=vcells(body,vs,big?900:(e.rarity>=1||e.rival?300:190),true,pat,true);const done=[];
  for(const m of g.children){if(!m.isMesh||m===body||m===head||legSet.has(m)||wings.has(m)||fx.has(m)||m.children.length||m.userData.keep)continue;const em=m.material.emissive&&m.material.emissive.getHex()&&m.material.emissiveIntensity>=.5;if(em)continue;const c=vcells(m,vs*.8,big?120:28,false,null,false);if(c.length){cells=cells.concat(c.map(x=>({...x,key:x.key+.6})));done.push(m)}}
  {const cap=big?760:(e.rarity>=1||e.rival?320:230);if(cells.length>cap){const inn=cells.filter(c=>!c.sh),sh=cells.filter(c=>c.sh);cells=sh.concat(inn.slice(0,Math.max(0,cap-sh.length)));if(cells.length>cap*1.25)cells=cells.filter((c,i)=>!c.sh||i%Math.ceil(cells.length/(cap*1.25))===0||c.key>1.9)}}
  const bv=vinst(e,cells,g,body);if(bv.length){body.visible=false;for(const m of done)g.remove(m);e.parts[0]=bv[0].im}
  let hv=[];if(head&&head!==body&&head.geometry.parameters){const hc=vcells(head,vs*.85,big?260:80,true,null,true);hc.forEach(c=>c.pos.sub(head.position).applyQuaternion(_vq.copy(head.quaternion).invert()));hv=vinst(e,hc,head,head);if(hv.length){hv[0].im.position.set(0,0,0);head.material.colorWrite=false;head.material.depthWrite=false;head.castShadow=false;e.headVox=hv[0].im;e.parts.push(hv[0].im)}}
  const skip=new Set([body,...e.vmeshes]);if(e.type==='colossus')for(const L of e.legs)skip.add(L.mesh);
  const extras=g.children.filter(c=>!skip.has(c)&&c.isMesh&&c!==head).map(m=>({m,key:rnd(.9,2.2)}));
  const vox=[...bv,...hv.map(h=>({...h,key:h.key*.6}))];
  const all=[...extras,...vox.map(v=>({m:v,key:v.key})),{m:head,key:.5}].filter(c=>c.m).sort((a,b)=>b.key-a.key);e.chunks=all.map(c=>c.m);e.lost=0;e.keepN=Math.max(3,Math.ceil(vox.length*.22))}
function voxBurst(e,max){let n=0;for(let i=e.lost;i<e.chunks.length&&n<max;i++){const c=e.chunks[i];if(c&&c.im){c.im.getMatrixAt(c.n,_vm);_vp.setFromMatrixPosition(_vm);c.im.localToWorld(_vp);c.im.getColorAt(c.n,_vc);spawnDebris(_vp.x,_vp.y,_vp.z,_vc.getHex(),1,clamp(c.s*e.group.scale.x*1.1,.1,.6));n++}}}
function chipEnemy(e,d){const frac=clamp(1-e.hp/e.maxhp,0,1);const lim=e.chunks.length-e.keepN;const tgt=Math.min(lim,Math.floor(Math.pow(frac,.85)*lim*1.04));let n=0;
  while(e.lost<tgt&&n++<(e.chunks.length>120?26:14)){const m=e.chunks[e.lost++];detachChunk(e,m)}}
function detachChunk(e,m){if(m&&m.im){if(!m.im.parent)return;m.im.getMatrixAt(m.n,_vm);_vp.setFromMatrixPosition(_vm);m.im.localToWorld(_vp);m.im.getColorAt(m.n,_vc);_vm.makeScale(0,0,0);m.im.setMatrixAt(m.n,_vm);m.im.instanceMatrix.needsUpdate=true;spawnDebris(_vp.x,_vp.y,_vp.z,_vc.getHex(),1,clamp(m.s*e.group.scale.x*1.15,.1,.7));if(BIG(e.type)&&Math.random()<.04){shake=Math.max(shake,.2);SFX.crunch(true)}return}
  if(!m.parent)return;m.getWorldPosition(_cv);const gp=m.geometry.parameters||{width:.3,height:.3,depth:.3};const s=Math.max(gp.width*m.scale.x,gp.height*m.scale.y,gp.depth*m.scale.z);const col=m.material.colorWrite===false?e.T.color:m.material.color.getHex();m.parent.remove(m);
  const big=BIG(e.type);spawnDebris(_cv.x,_cv.y,_cv.z,col,big?4:2,clamp(s*.55,.12,big?.9:.4));if(big&&Math.random()<.35){shake=Math.max(shake,.25);SFX.crunch(true)}
  const leg=e.legs.find(L=>L.mesh===m);if(leg&&e.type!=='colossus'){leg.alive=false;e.speed*=.82;if(Math.random()<.5)label({x:e.pos.x,y:e.group.position.y+e.sc,z:e.pos.z},'manco!','#ec5f6b')}
  if(e.parts[1]===m){e.T={...e.T,dmg:e.T.dmg*.8};if(big)toast(`${e.T.n}: cabeça rachada! Ataques mais fracos.`,'r2')}}

// boss projectiles: boulders and fireballs lobbed onto the base (explode with 'enemy' source)
const marks=[];function markGround(x,z,r,color,t){const m=new THREE.Mesh(new THREE.RingGeometry(r*.85,r,28),new THREE.MeshBasicMaterial({color,transparent:true,opacity:.8,side:THREE.DoubleSide,depthWrite:false}));m.rotation.x=-Math.PI/2;m.position.set(x,Math.min(topY(x,z),GY+12)+.06,z);scene.add(m);marks.push({m,t,T:t})}
function updateMarks(dt){for(let i=marks.length-1;i>=0;i--){const k=marks[i];k.t-=dt;k.m.material.opacity=.8*Math.max(0,k.t/k.T)*(.6+.4*Math.sin(k.t*18));const s=k.line?1:1+(1-k.t/k.T)*.25;k.m.scale.set(s,s,s);if(k.t<=0){scene.remove(k.m);marks.splice(i,1)}}}
function throwRock(e,tx,tz,r,dmg,color,fire){markGround(tx,tz,r,fire?0xff7a2a:0xd9414f,e.fly?.7:1.5);const sx=e.pos.x,sy=e.gy+e.sc*1.4,sz=e.pos.z;const T=e.fly?.7:1.5;const ty=Math.min(topY(tx,tz),GY+12);const m=new THREE.Mesh(new THREE.DodecahedronGeometry(fire?.55:.8,0),lmat(color,fire?.9:.4));m.position.set(sx,sy,sz);scene.add(m);
  bombs.push({mesh:m,x:tx,z:tz,vx:(tx-sx)/T,vz:(tz-sz)/T,vy:(ty-sy+.5*30*T*T)/T,enemy:true,r,dmg,fire});if(!fire)SFX.thud();else SFX.whoosh()}

// ───────── creature anatomies beyond the classic quadruped
const CREATURES={
  goblin(sc,col,g){const body=box(.5*sc,.55*sc,.4*sc,0x5a4a35,0,.6*sc,0,g);const head=box(.5*sc,.45*sc,.45*sc,col,0,1.1*sc,.03*sc,g);eyes(head,.05*sc,.24*sc,.12*sc);
    for(const s of[-1,1])box(.32*sc,.1*sc,.08*sc,col,s*.36*sc,1.18*sc,0,g).rotation.z=s*.35;box(.4*sc,.12*sc,.4*sc,0x6b2d6b,0,1.38*sc,0,g);box(.22*sc,.22*sc,.22*sc,0x6b2d6b,0,1.55*sc,-.05*sc,g);
    const w=box(.08*sc,.5*sc,.08*sc,0xffcf3d,.32*sc,.7*sc,.18*sc,g);w.rotation.x=.6;box(.22*sc,.08*sc,.08*sc,0xbdb6d6,.32*sc,.95*sc,.32*sc,g);
    const legs=[];for(const s of[-1,1]){const lg=box(.14*sc,.32*sc,.14*sc,0x3b2d2a,s*.13*sc,.16*sc,0,g);legs.push({mesh:lg,alive:true,ox:s*.13*sc,oz:0})}return{body,head,legs}},
  ship(sc,col,g){const body=box(2.6*sc,.9*sc,1.2*sc,0x6b4426,0,.6*sc,0,g);box(2.9*sc,.25*sc,1.3*sc,0x4a2e18,0,1.05*sc,0,g);box(2.62*sc,.12*sc,1.22*sc,0xd9c08a,0,.35*sc,0,g);box(.7*sc,.5*sc,.9*sc,0x6b4426,-1.5*sc,1.0*sc,0,g);box(.5*sc,.35*sc,.6*sc,0x6b4426,1.6*sc,.75*sc,0,g);const head=box(.6*sc,.6*sc,.9*sc,0x5a3a20,1.2*sc,1.35*sc,0,g);box(.12*sc,2.6*sc,.12*sc,0x6b4a2a,0,2.3*sc,0,g);const sail=box(.08*sc,1.5*sc,1.6*sc,0xf2ead8,.1*sc,2.5*sc,0,g);box(.06*sc,.5*sc,.7*sc,0x2b2d4a,0,3.7*sc,0,g);for(const s of[-1,1])box(.35*sc,.2*sc,.2*sc,0x2b2d4a,s*.6*sc,.85*sc,.65*sc,g);return{body,head,legs:[]}},
  pirate(sc,col,g){const body=box(.6*sc,.75*sc,.45*sc,0x8a2f2f,0,.8*sc,0,g);const head=box(.5*sc,.45*sc,.45*sc,col,0,1.4*sc,.02*sc,g);eyes(head,.05*sc,.23*sc,.12*sc);box(.62*sc,.14*sc,.6*sc,0x2b2d4a,0,1.68*sc,0,g);box(.3*sc,.1*sc,.05*sc,0x2b2d4a,.1*sc,1.47*sc,.24*sc,g);box(.06*sc,.6*sc,.06*sc,0xdfe6f0,.4*sc,.95*sc,.25*sc,g);
    const legs=[];for(const s of[-1,1]){const lg=box(.16*sc,.4*sc,.16*sc,0x3b2d2a,s*.15*sc,.2*sc,0,g);legs.push({mesh:lg,alive:true,ox:s*.15*sc,oz:0})}return{body,head,legs}},
  wolf(sc,col,g){const body=box(.6*sc,.55*sc,1.4*sc,col,0,.6*sc,0,g);const head=box(.5*sc,.45*sc,.55*sc,col,0,.8*sc,.9*sc,g);box(.3*sc,.22*sc,.35*sc,shadeHex(col,-.2),0,.68*sc,1.25*sc,head.parent);eyes(head,.1*sc,.28*sc,.13*sc);
    for(const s of[-1,1])box(.12*sc,.25*sc,.1*sc,shadeHex(col,-.3),s*.17*sc,1.1*sc,.82*sc,g);box(.14*sc,.14*sc,.7*sc,col,0,.8*sc,-1.0*sc,g).rotation.x=-.5;
    const legs=[];for(const sx of[-1,1])for(const sz of[-1,1]){const lg=box(.16*sc,.45*sc,.16*sc,shadeHex(col,-.35),sx*.22*sc,.22*sc,sz*.5*sc,g);legs.push({mesh:lg,alive:true,ox:sx*.22*sc,oz:sz*.5*sc})}return{body,head,legs}},
  spider(sc,col,g){const body=box(1.0*sc,.45*sc,.9*sc,col,0,.55*sc,-.15*sc,g);const head=box(.55*sc,.4*sc,.45*sc,shadeHex(col,.15),0,.55*sc,.55*sc,g);
    for(let k=0;k<6;k++){const e=box(.07*sc,.07*sc,.04*sc,0xff4a5a,(k%3-1)*.14*sc,.12*sc+((k/3)|0)*.1*sc,.23*sc,head);e.material.emissive.setHex(0xff2a3a)}
    const legs=[];for(const s of[-1,1])for(let k=0;k<4;k++){const lg=box(.85*sc,.08*sc,.08*sc,shadeHex(col,-.3),s*.75*sc,.45*sc,(k-1.5)*.28*sc,g);lg.rotation.z=s*.45;legs.push({mesh:lg,alive:true,ox:s*.75*sc,oz:(k-1.5)*.28*sc})}return{body,head,legs}},
  slime(sc,col,g){const mat=new THREE.MeshLambertMaterial({color:col,transparent:true,opacity:.82});const body=new THREE.Mesh(new THREE.BoxGeometry(1.1*sc,.8*sc,1.1*sc),mat);body.position.y=.42*sc;body.castShadow=true;g.add(body);
    const head=box(.75*sc,.4*sc,.75*sc,shadeHex(col,.2),0,.95*sc,0,g);eyes(head,.05*sc,.38*sc,.18*sc);box(.25*sc,.25*sc,.25*sc,shadeHex(col,-.3),.2*sc,.4*sc,.1*sc,g);return{body,head,legs:[]}},
  imp(sc,col,g){const body=box(.55*sc,.7*sc,.45*sc,col,0,.7*sc,0,g);const head=box(.55*sc,.5*sc,.5*sc,col,0,1.3*sc,.05*sc,g);eyes(head,.05*sc,.26*sc,.14*sc);for(const s of[-1,1]){box(.08*sc,.3*sc,.08*sc,0x2b2d4a,s*.2*sc,1.65*sc,0,g);box(.5*sc,.06*sc,.3*sc,shadeHex(col,-.3),s*.45*sc,.95*sc,-.2*sc,g)}
    box(.08*sc,.08*sc,.6*sc,col,0,.5*sc,-.45*sc,g);const legs=[];for(const s of[-1,1]){const lg=box(.15*sc,.35*sc,.15*sc,0x2b2d4a,s*.15*sc,.18*sc,0,g);legs.push({mesh:lg,alive:true,ox:s*.15*sc,oz:0})}return{body,head,legs}},
  brute(sc,col,g){const body=box(1.0*sc,.9*sc,.7*sc,col,0,1.05*sc,0,g);const head=box(.45*sc,.4*sc,.45*sc,shadeHex(col,.1),0,1.65*sc,.15*sc,g);eyes(head,.03*sc,.23*sc,.11*sc);
    for(const s of[-1,1]){box(.35*sc,.9*sc,.35*sc,shadeHex(col,-.1),s*.68*sc,.85*sc,.1*sc,g);box(.42*sc,.35*sc,.42*sc,0x5a4a3a,s*.68*sc,.35*sc,.15*sc,g)}box(1.05*sc,.15*sc,.75*sc,0x5a3a2a,0,.62*sc,0,g);
    const legs=[];for(const s of[-1,1]){const lg=box(.3*sc,.55*sc,.3*sc,0x3b2d2a,s*.25*sc,.28*sc,0,g);legs.push({mesh:lg,alive:true,ox:s*.25*sc,oz:0})}return{body,head,legs}},
  beetle(sc,col,g){const body=box(1.0*sc,.55*sc,1.2*sc,shadeHex(col,-.25),0,.45*sc,0,g);const shell=box(1.1*sc,.35*sc,1.25*sc,col,0,.85*sc,-.05*sc,g);shell.material.emissive.setHex(0x0a3a3a);shell.material.emissiveIntensity=.4;box(.04*sc,.37*sc,1.27*sc,0x1b2b2b,0,.86*sc,-.05*sc,g);
    const head=box(.55*sc,.4*sc,.4*sc,shadeHex(col,-.35),0,.5*sc,.75*sc,g);eyes(head,.06*sc,.21*sc,.15*sc);for(const s of[-1,1])box(.1*sc,.1*sc,.5*sc,0x1b2b2b,s*.18*sc,.5*sc,1.1*sc,g);
    const legs=[];for(const s of[-1,1])for(let k=0;k<3;k++){const lg=box(.5*sc,.08*sc,.08*sc,0x1b2b2b,s*.6*sc,.25*sc,(k-1)*.4*sc,g);legs.push({mesh:lg,alive:true,ox:s*.6*sc,oz:(k-1)*.4*sc})}return{body,head,legs}}};
function shadeHex(c,k){const C=new THREE.Color(c);return(k<0?C.lerp(new THREE.Color(0x111122),-k):C.lerp(new THREE.Color(0xffffff),k)).getHex()}
// random physiognomy for the classic creatures: horns, back spikes, tails, extra eyes, tint
function decorate(type,sc,col,g,body,head){const R=Math.random;if(type!=='flyer'){body.material.color.offsetHSL(rnd(-.05,.05),rnd(-.08,.08),rnd(-.06,.06));head.material.color.copy(body.material.color)}
  if(R()<.35)for(const s of[-1,1]){const h=box(.08*sc,.32*sc,.08*sc,0xe8e2d0,s*.22*sc,.42*sc,.05*sc,head);h.rotation.z=-s*.35}
  if(R()<.3)for(let k=0;k<3;k++)box(.12*sc,.22*sc,.12*sc,shadeHex(col,-.3),0,.95*sc,(k-1)*.3*sc,g);
  if(R()<.3)box(.12*sc,.12*sc,.6*sc,shadeHex(col,-.15),0,.6*sc,-.8*sc,g).rotation.x=-.35;
  if(R()<.2){const e=box(.12*sc,.12*sc,.05*sc,0xffcf3d,0,.48*sc,.31*sc,head);e.material.emissive.setHex(0xffb13d)}
  if(R()<.2)box(.95*sc,.12*sc,1.15*sc,shadeHex(col,.25),0,.88*sc,0,g)}

// saboteurs: goblins that walk past your guns to disarm the sappers' field traps (they know where the triggers are)
function goblinBrain(e,dt,sf){const L=state.fieldTraps;if(!L||!L.length)return false;if(!e.tgtT||e.tgtT<simTime||!vox[e.tgt]||vox[e.tgt]!==state.fieldTrapM.get(e.tgt)){e.tgt=-1;let bd=46;for(const i of L){if(!vox[i]||vox[i]!==state.fieldTrapM.get(i))continue;const d=Math.hypot(ix(i)+.5-e.pos.x,iz(i)+.5-e.pos.z);if(d<bd){bd=d;e.tgt=i}}e.tgtT=simTime+2}
  if(e.tgt<0)return false;const tx=ix(e.tgt)+.5,tz=iz(e.tgt)+.5,dx=tx-e.pos.x,dz=tz-e.pos.z,d=Math.hypot(dx,dz)||1;e.group.rotation.y=Math.atan2(dx,dz);
  if(d<1.4){e.vel.set(0,0,0);e.disarm=(e.disarm||0)+dt;if(e.disarm>=1.1){e.disarm=0;const i=e.tgt,m=vox[i];spawnDebris(tx,GY+.6,tz,MAT[m].c,5,.3);setVox(i,0);state.trapsDisarmed=(state.trapsDisarmed||0)+1;if(Math.random()<.5)label({x:tx,y:GY+1.8,z:tz},'desarmado!','#7fae3a');e.tgt=-1}return true}
  const sp=e.speed*sf;e.pos.x+=dx/d*sp*dt;e.pos.z+=dz/d*sp*dt;e.gy+=(surfE(e.pos.x,e.pos.z)-e.gy)*Math.min(1,dt*9);e.group.position.y=e.gy+Math.abs(Math.sin(e.bob+=dt*12))*.12;return true}

// standard bearer: a knight carrying the horde's banner — enemies near it are faster and tougher; when it falls they panic
function makeBearer(e){e.bearer=true;e.maxhp*=2.2;e.hp=e.maxhp;const pole=box(.08*US,2.2*US,.08*US,0x6b4426,-.35*US,1.5*US,-.1*US,e.group);const flag=box(.6*US,.45*US,.04*US,0xd9414f,-.05*US,2.3*US,-.1*US,e.group);flag.material.emissive.setHex(0x5a1010);e.flag=flag}
let bearAcc=0;function bearerTick(dt){bearAcc+=dt;if(bearAcc<.5)return;bearAcc=0;for(const b of enemies){if(b.dead||!b.bearer)continue;if(b.flag)b.flag.rotation.y=Math.sin(simTime*4)*.3;for(const o of enemies)if(!o.dead&&o!==b&&Math.abs(o.pos.x-b.pos.x)<8&&Math.abs(o.pos.z-b.pos.z)<8){if(!(o.inspired>simTime))o.speed*=1.2;o.inspired=simTime+1.2;o.inspT=simTime}}
  for(const o of enemies)if(!o.dead&&o.inspT&&o.inspired<=simTime){o.speed/=1.2;o.inspT=0}}

// boss affixes (wave 15+): Furioso enrages below half health; Escudo carries a regenerating shield that soaks 85% of each hit
let bossAffAcc=0;function bossAffTick(dt){bossAffAcc+=dt;if(bossAffAcc<.25)return;const t=bossAffAcc;bossAffAcc=0;for(const e of enemies){if(e.dead||!e.bossAff)continue;
  if(e.bossAff==='furioso'&&!e.enraged&&e.hp<e.maxhp*.5){e.enraged=true;e.speed*=1.5;e.T={...e.T,dmg:e.T.dmg*1.5,rate:e.T.rate*.75};if(e.aura)e.aura.material=new THREE.MeshBasicMaterial({color:0xff3a2a,transparent:true,opacity:.75,side:THREE.DoubleSide,depthWrite:false});toast(`😡 ${e.T.n} enfureceu: mais rápido e mais forte!`,'r3');shake=Math.max(shake,.4)}
  if(e.bossAff==='escudo'){if(!e.shieldMesh){e.shieldMesh=new THREE.Mesh(new THREE.SphereGeometry(e.radius*1.6/e.group.scale.x,16,10),new THREE.MeshBasicMaterial({color:0x6fb6ff,transparent:true,opacity:.22,depthWrite:false}));e.shieldMesh.position.y=e.radius*1.2/e.group.scale.x;e.group.add(e.shieldMesh)}
    if(e.shield<e.shieldMax&&simTime-(e.lastHit||0)>4){const was=e.shield;e.shield=Math.min(e.shieldMax,e.shield+e.shieldMax*.06*t);if(was<=0&&e.shield>0)e.shieldMesh.visible=true}if(e.shieldMesh)e.shieldMesh.material.opacity=e.shield>0?.12+.18*(e.shield/e.shieldMax):0}}}
