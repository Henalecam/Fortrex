// ───────── the Realm: a living strategic map of fortresses that grow, wage war on each other and on us.
// The voxel map is always our own land; a fortress battle builds the enemy citadel on one side of it.
const REALM={cities:[],armies:[],facs:[],log:[],t:0,spawnT:70,sel:null,open:false,nextId:1};
const FAC_COLORS=[0xe8a21f,0xd9414f,0x8e5bd6,0x2f9a5e,0x2aa7b8,0xc4497f,0x7a7f3a,0x9b5a35,0x3d5bd6,0xe0662c,0x3f8f8a,0x6b4f9e];
const CITY_NAMES=['Cinzaforte','Garra Rubra','Pico do Corvo','Muralha Negra','Ponte de Ossos','Vale Sombrio','Trono de Ferro','Forja Rubra','Ninho de Vespas','Rocha Uivante','Dente de Lobo','Brasa Eterna','Torre Partida','Fosso Frio','Coroa de Espinhos','Lâmina Cinza','Olho da Tormenta','Bastião Velho','Cripta Dourada','Penhasco Rubro'];
const BATTLE_SLOTS=()=>[[CX+56,CZ],[CX-56,CZ],[CX,CZ+56],[CX,CZ-56]];
function rName(){const used=new Set(REALM.cities.map(c=>c.name));const free=CITY_NAMES.filter(n=>!used.has(n));return free.length?pick(free):pick(CITY_NAMES)+' '+['II','III','IV','V'][rint(0,3)]}
function newFac(color,name,isMe){const f={id:REALM.facs.length,color,name,isMe:!!isMe};REALM.facs.push(f);return f}
function addCity(x,y,lvl,fac,o={}){const c={id:REALM.nextId++,name:o.name||rName(),x,y,lvl,fac,garrison:6+lvl*4,home:!!o.home,raidT:rnd(40,110)};REALM.cities.push(c);return c}
function homeCity(){return REALM.cities.find(c=>c.home)}
function cityDef(c){return c.lvl*4+c.garrison*.8}
function rlog(txt,css='r0'){REALM.log.unshift({txt,css,t:simTime});REALM.log.length=Math.min(REALM.log.length,7)}
function initRealm(){REALM.cities.length=0;REALM.armies.length=0;REALM.facs.length=0;REALM.log.length=0;REALM.t=0;REALM.spawnT=150;REALM.sel=null;REALM.nextId=1;
  const me=newFac(0xe8a21f,'Fortrex',true);addCity(500,500,1,me,{name:'Fortrex',home:true});
  const n=10;for(let k=0;k<n;k++){const a=k/n*Math.PI*2+rnd(-.2,.2),r=k%2?rnd(170,260):rnd(300,430);const f=newFac(FAC_COLORS[1+k%(FAC_COLORS.length-1)],'');const c=addCity(500+Math.cos(a)*r,500+Math.sin(a)*r*.82,r<280?rint(1,2):rint(2,3),f);f.name=c.name}
  rlog('Dez fortalezas dividem o reino. Observe, cresça, conquiste.','r2')}
function facOf(c){return REALM.facs[c.fac.id]||c.fac}
function realmTick(dt){if(!REALM.cities.length)return;REALM.t+=dt;if(state.battleCd>0)state.battleCd-=dt;const H0=homeCity();
  for(const c of REALM.cities){const cap=c.lvl*22;if(c.garrison<cap)c.garrison=Math.min(cap,c.garrison+dt*(.04+c.lvl*.03));
    if(c.fac.isMe)continue;c.raidT-=dt;if(c.raidT>0||c.garrison<12)continue;c.raidT=rnd(35,80)/Math.min(2,1+c.lvl*.1);
    // pick a nearby target of another faction: weaker is likelier, our home is always tempting
    const grace=simTime<220;const cand=REALM.cities.filter(o=>o.fac!==c.fac&&!(grace&&o.fac.isMe)).map(o=>({o,s:Math.hypot(o.x-c.x,o.y-c.y)*(o.home?.7:1)+cityDef(o)*2*Math.random()})).sort((a,b)=>a.s-b.s);if(!cand.length)continue;
    const T=cand[Math.min(cand.length-1,Math.random()<.7?0:1)].o;const g0=c.garrison*rnd(.5,.75);c.garrison-=g0;const p=g0+c.lvl*4;REALM.armies.push({from:c,to:T,fac:c.fac,power:p,x:c.x,y:c.y,speed:rnd(9,13)});
    if(T.fac.isMe)rlog(`${c.name} marcha contra ${T.home?'você':T.name}!`,'r3')}
  for(let i=REALM.armies.length-1;i>=0;i--){const A=REALM.armies[i];const dx=A.to.x-A.x,dy=A.to.y-A.y,d=Math.hypot(dx,dy);const st=A.speed*dt;
    if(d>st){A.x+=dx/d*st;A.y+=dy/d*st;continue}REALM.armies.splice(i,1);arrive(A)}
  // new, stronger fortresses rise at the edges of the known world
  REALM.spawnT-=dt;const foes=REALM.cities.filter(c=>!c.fac.isMe);if(REALM.spawnT<=0&&(foes.length<10||Math.random()<.3)){REALM.spawnT=rnd(70,120);const top=Math.max(1,...REALM.cities.map(c=>c.lvl));
    const a=rnd(0,Math.PI*2);const f=newFac(FAC_COLORS[1+REALM.facs.length%(FAC_COLORS.length-1)],'');const c=addCity(clamp(500+Math.cos(a)*rnd(380,470),40,960),clamp(500+Math.sin(a)*rnd(330,420),40,960),Math.min(12,top+rint(0,1)),f);f.name=c.name;rlog(`Uma nova fortaleza surge: ${c.name} (nv ${c.lvl})`,'r3')}
  if(H0)H0.lvl=1+(state.conquests||0)}
function arrive(A){const T=A.to;if(A.fac===T.fac){T.garrison+=A.power;return}
  if(T.home){// they come for us: a fortress-vs-fortress battle, or a raid if we are already at war
    const src=A.from;if(!battle()&&!(state.battleCd>0)&&src.fac===A.fac){startBattle(src,'defend',A.power)}else{const n=Math.min(14,3+Math.round(A.power/6));const R=battle();for(let k=0;k<n;k++){const e=edgeRaider(src,A.power)}toast(`Tropas de ${src.name} invadem suas terras: ${n} guerreiros!`,'r3')}return}
  const def=cityDef(T);if(A.power>def*rnd(.8,1.2)){const old=T.fac;const lost=old.isMe;T.fac=A.fac;T.garrison=Math.max(4,(A.power-def)*.6);const src=A.from;if(src.fac===A.fac)src.lvl=Math.min(14,src.lvl+1);
    rlog(`${src.name} conquistou ${T.name}${lost?' (era sua!)':''}. ${src.name} sobe para nv ${src.lvl}`,lost?'r3':'r1');if(lost)toast(`Perdemos ${T.name} para ${src.name}!`,'r3')}
  else{T.garrison=Math.max(1,T.garrison-A.power*.5);rlog(`${T.name} repeliu ${A.from.name}`,'r0')}}
function edgeRaider(src,power){const H0=homeCity();const a=Math.atan2(src.y-H0.y,src.x-H0.x);const x=clamp(CX+Math.cos(a)*(W*.46),3,W-4),z=clamp(CZ+Math.sin(a)*(D*.46),3,D-4);
  const fakeR={alive:true,lvl:src.lvl,name:src.name,guards:[],cx:x,cz:z,wr:0,core:[],edge:true};const e=makeEnemy(pick(['knight','knight','archer','rammer']),Math.min(4,rollRarity(src.lvl*.04)),x+rnd(-3,3),z+rnd(-3,3));e.rival=fakeR;e.rmode='raid';e.home={x,z};return e}
function battle(){return rivals.find(r=>r.alive&&r.city)}
function slotFor(c){const H0=homeCity();const a=Math.atan2(c.y-H0.y,c.x-H0.x);const S=BATTLE_SLOTS();const k=Math.abs(Math.cos(a))>Math.abs(Math.sin(a))?(Math.cos(a)>0?0:1):(Math.sin(a)>0?2:3);return S[k]}
function startBattle(c,kind,power){if(battle())return false;clearBattleRuins();const [cx,cz]=slotFor(c);
  const fc=facOf(c).color;MAT[26].c=fc;MAT[25].c=new THREE.Color(fc).lerp(new THREE.Color(0x2b2d4a),.55).getHex();
  const R={k:0,cx,cz,wr:11,name:c.name,lvl:c.lvl,alive:true,core:[],raidT:kind==='defend'?12:55,guards:[],rblue:new Map(),regenT:0,city:c,kind,color:facOf(c).color};rivals.length=0;rivals.push(R);
  const put=(x,y,z,m)=>{if(!inb(x,y,z))return;const i=idx(x,y,z);if(FLUID(vox[i])){fluids.delete(i);fluidSrc.delete(i)}vox[i]=m;hp[i]=MAT[m].hp};
  buildRivals(put);for(let x=cx-R.wr-3;x<=cx+R.wr+3;x++)for(let z=cz-R.wr-3;z<=cz+R.wr+3;z++){if(x<0||z<0||x>=W||z>=D)continue;for(let y=GY-1;y<H;y++){const i=idx(x,y,z);hp[i]=vox[i]?MAT[vox[i]].hp:0;touch(i)}markCol(x,z)}
  if(natBlue)for(const [i] of R.rblue)natBlue[i]=0;
  spawnRivalForces();updateModeUi();shake=1;SFX.boom(true);
  if(kind==='defend'){toast(`⚔️ ${c.name} (nv ${c.lvl}) ergueu uma fortaleza de cerco nas suas terras! Destrua o núcleo vermelho.`,'r3');rlog(`${c.name} sitia Fortrex!`,'r3')}
  else{toast(`⚔️ Guerra contra ${c.name} (nv ${c.lvl})! A fortaleza deles está à vista. Use ⚔️ Atacar.`,'r2');rlog(`Fortrex declara guerra a ${c.name}`,'r2')}
  cam.target.set((cx+CX)/2,GY+1.5,(cz+CZ)/2);return true}
function battleWon(R){const c=R.city;if(!c)return;c.fac=homeCity().fac;c.garrison=8;rlog(`Fortrex conquistou ${c.name}! (+${c.lvl*8} material por horda)`,'r4');R.ruinT=30;state.battleCd=160;state.realmIncome=REALM.cities.filter(o=>o.fac.isMe&&!o.home).reduce((a,o)=>a+o.lvl*8,0);
  for(const o of REALM.cities)if(!o.fac.isMe&&o.fac===R.city.fac)o.garrison*=.7}
function clearBattleRuins(){for(const R of rivals){for(const [i] of R.rblue){if(rown[i]){if(vox[i]){if(Math.random()<.08)spawnDebris(ix(i)+.5,iy(i)+.5,iz(i)+.5,MAT[vox[i]].c,1,.25);setVox(i,0)}rown[i]=0}}}rivals.length=0;settleDirty=true;updateModeUi()}
function ruinTick(dt){for(const R of rivals){if(R.alive||R.ruinT===undefined)continue;R.ruinT-=dt;if(R.ruinT<=0){R.ruinT=undefined;clearBattleRuins();toast('As ruínas da fortaleza inimiga desmoronam. O campo está livre.','r0');return}}}
function realmWaveIncome(){const inc=state.realmIncome||0;if(inc>0){state.material+=inc;toast(`Tributo das suas cidades: +${inc} material`,'r1')}}

// ───────── realm map overlay
let rcv=null,rctx=null;
function openRealm(){REALM.open=true;$('realm').style.display='flex';rcv=$('realmCanvas');rctx=rcv.getContext('2d');drawRealm();renderRealmInfo()}
function closeRealm(){REALM.open=false;$('realm').style.display='none'}
function rView(){const r=rcv.getBoundingClientRect();const s=Math.min(r.width,r.height)/1000*.96;return{s,ox:(r.width-1000*s)/2,oy:(r.height-1000*s)/2,w:r.width,h:r.height}}
function drawRealm(){if(!REALM.open||!rctx)return;const dpr=Math.min(2,window.devicePixelRatio||1);const r=rcv.getBoundingClientRect();if(rcv.width!==Math.round(r.width*dpr)){rcv.width=Math.round(r.width*dpr);rcv.height=Math.round(r.height*dpr)}
  const g=rctx;g.setTransform(dpr,0,0,dpr,0,0);const V=rView();g.clearRect(0,0,V.w,V.h);const P=(x,y)=>[V.ox+x*V.s,V.oy+y*V.s];
  // land
  const [lx,ly]=P(500,500);const grad=g.createRadialGradient(lx,ly,40*V.s,lx,ly,560*V.s);grad.addColorStop(0,'#cfe8b8');grad.addColorStop(.75,'#b9dba4');grad.addColorStop(1,'#9cc7d6');g.fillStyle=grad;g.beginPath();g.ellipse(lx,ly,490*V.s,470*V.s,0,0,Math.PI*2);g.fill();
  // influence of each faction
  for(const c of REALM.cities){const [x,y]=P(c.x,c.y);g.fillStyle=hex(facOf(c).color)+'22';g.beginPath();g.arc(x,y,(34+c.lvl*6)*V.s,0,Math.PI*2);g.fill()}
  // roads to nearest neighbours
  g.strokeStyle='rgba(120,100,70,.25)';g.lineWidth=1.5;g.setLineDash([4,5]);for(const c of REALM.cities){const nb=REALM.cities.filter(o=>o!==c).sort((a,b)=>Math.hypot(a.x-c.x,a.y-c.y)-Math.hypot(b.x-c.x,b.y-c.y)).slice(0,2);for(const o of nb){const [a,b]=P(c.x,c.y),[x,y]=P(o.x,o.y);g.beginPath();g.moveTo(a,b);g.lineTo(x,y);g.stroke()}}g.setLineDash([]);
  // armies
  for(const A of REALM.armies){const [ax,ay]=P(A.x,A.y),[tx,ty]=P(A.to.x,A.to.y);const col=hex(A.fac.color);g.strokeStyle=col+(A.to.fac.isMe?'cc':'66');g.lineWidth=A.to.fac.isMe?2:1.2;g.beginPath();g.moveTo(ax,ay);g.lineTo(tx,ty);g.stroke();
    const n=Math.min(6,1+Math.floor(A.power/8));const ang=Math.atan2(ty-ay,tx-ax);for(let k=0;k<n;k++){const bx=ax-Math.cos(ang)*k*6+Math.sin(ang)*((k%2)*4-2),by=ay-Math.sin(ang)*k*6-Math.cos(ang)*((k%2)*4-2);g.fillStyle=col;g.beginPath();g.arc(bx,by,3,0,Math.PI*2);g.fill()}
    g.fillStyle='#2b2d4a';g.font='600 10px Fredoka,sans-serif';g.textAlign='center';g.fillText(Math.round(A.power),ax,ay-8)}
  // cities
  for(const c of REALM.cities){const [x,y]=P(c.x,c.y);const col=hex(facOf(c).color);const s=(10+Math.min(10,c.lvl)*1.3)*Math.max(.7,V.s*1.4);
    if(c.home){g.fillStyle='rgba(255,207,61,.35)';g.beginPath();g.arc(x,y,s*1.9,0,Math.PI*2);g.fill()}
    if(REALM.sel===c){g.strokeStyle='#ff8a5c';g.lineWidth=3;g.beginPath();g.arc(x,y,s*1.7,0,Math.PI*2);g.stroke()}
    const war=rivals.some(R=>R.alive&&R.city===c);if(war){g.strokeStyle='#d9414f';g.lineWidth=2;g.setLineDash([3,3]);g.beginPath();g.arc(x,y,s*2.1+Math.sin(performance.now()/200)*2,0,Math.PI*2);g.stroke();g.setLineDash([])}
    g.fillStyle='rgba(43,45,74,.18)';g.fillRect(x-s*.9+2,y-s*.2+3,s*1.8,s*1.1);
    g.fillStyle=col;g.fillRect(x-s*.9,y-s*.2,s*1.8,s*1.1);g.fillRect(x-s*.9,y-s*.75,s*.5,s*.6);g.fillRect(x+s*.4,y-s*.75,s*.5,s*.6);g.fillRect(x-s*.3,y-s,s*.6,s*.85);
    g.fillStyle='#fff';g.fillRect(x-s*.15,y+s*.35,s*.3,s*.55);
    g.fillStyle='#2b2d4a';g.font=`700 ${c.home?13:11}px Fredoka,sans-serif`;g.textAlign='center';g.fillText((c.home?'👑 ':'')+c.name,x,y+s*1.35+10);g.font='600 10px Nunito,sans-serif';g.fillStyle='#6b6e8f';g.fillText(`nv ${c.lvl} · ⚔ ${Math.round(c.garrison)}`,x,y+s*1.35+22)}
  // log
  g.textAlign='left';g.font='600 12px Nunito,sans-serif';let ly2=V.h-16;const nl=Math.min(6,REALM.log.length);if(nl){g.fillStyle='rgba(255,255,255,.72)';g.fillRect(6,V.h-14-nl*17,Math.min(V.w-12,470),nl*17+8)}for(const L of REALM.log.slice(0,6)){g.fillStyle=getComputedStyle(document.documentElement).getPropertyValue('--'+L.css)||'#2b2d4a';g.globalAlpha=.95;g.fillText('• '+L.txt,14,ly2);ly2-=17}g.globalAlpha=1}
function renderRealmInfo(){const el=$('realmInfo');const c=REALM.sel;const mine=REALM.cities.filter(o=>o.fac.isMe);const facs=new Set(REALM.cities.map(o=>o.fac.id)).size;
  let h=`<div class="rh">🗺️ Reino</div><div class="ds">${REALM.cities.length} fortalezas · ${facs} impérios · você tem ${mine.length} ${mine.length===1?'cidade':'cidades'}${state.realmIncome?` (+${state.realmIncome}/horda)`:''}</div>`;
  const A=REALM.selA;if(A&&REALM.armies.includes(A)){const eta=Math.hypot(A.to.x-A.x,A.to.y-A.y)/A.speed;const n=Math.round(A.power/3);h+=`<div class="rc"><b style="color:${hex(A.fac.color)}">⚔️ Exército de ${A.from.name}</b><div class="ds">Rumo a ${A.to.home?'<b>Fortrex (você!)</b>':A.to.name} · força ${Math.round(A.power)} · ~${n} guerreiros (cavaleiros, arqueiros, aríetes) · chega em ${Math.ceil(eta)} s</div><div class="ds">Defesa do alvo: ${Math.round(cityDef(A.to))}${A.to.home?'':A.power>cityDef(A.to)?' → provável conquista':' → provável derrota'}</div></div>`}
  if(c){const f=facOf(c);const war=battle();h+=`<div class="rc"><b style="color:${hex(f.color)}">${c.home?'👑 ':''}${c.name}</b><div class="ds">Nível ${c.lvl} · guarnição ${Math.round(c.garrison)} · império ${f.isMe?'seu':f.name} (${REALM.cities.filter(o=>o.fac===c.fac).length} cidades)</div>`;
    if(!f.isMe)h+=war?`<div class="ds">Já em guerra com ${war.name}. Termine essa batalha primeiro.</div>`:`<button class="btn primary" id="realmAtk">⚔️ Declarar guerra</button><div class="ds">A fortaleza deles será erguida ao lado da sua. Destrua o núcleo vermelho para conquistá-la.</div>`;
    h+='</div>'}else h+='<div class="ds" style="margin-top:8px">Clique numa fortaleza para ver detalhes. Linhas são exércitos em marcha; os números são a força.</div>';
  el.innerHTML=h;const b=$('realmAtk');if(b)b.onclick=()=>{if(startBattle(c,'attack')){closeRealm()}}}
function realmClick(ev){const r=rcv.getBoundingClientRect();const V=rView();const mx=(ev.clientX-r.left-V.ox)/V.s,my=(ev.clientY-r.top-V.oy)/V.s;
  {let ba=null,bd=18;for(const A of REALM.armies){const d=Math.hypot(A.x-mx,A.y-my);if(d<bd){bd=d;ba=A}}if(ba){REALM.sel=null;REALM.selA=ba;renderRealmInfo();drawRealm();return}}REALM.selA=null;let best=null,bd=40;for(const c of REALM.cities){const d=Math.hypot(c.x-mx,c.y-my);if(d<bd){bd=d;best=c}}REALM.sel=best;renderRealmInfo();drawRealm()}

// ───────── after every wave the citadel mends itself: structural blueprint blocks regrow for free over a few seconds
function startSelfRepair(){const q=[];for(const i of blueList){const b=blue[i];if(!b||SPECIAL_BLOCKS.includes(b)||b===5)continue;if(vox[i]===b&&hp[i]>=maxHpOf(b))continue;if(vox[i]&&vox[i]!==b&&!FLUID(vox[i]))continue;q.push(i)}
  q.sort((a,b)=>iy(a)-iy(b));state.healQ=q;state.healT=0;if(q.length)toast(`A cidadela se reconstrói sozinha: ${q.length} blocos`,'r1')}
function selfRepairTick(dt){const q=state.healQ;if(!q||!q.length)return;const per=Math.max(8,Math.ceil(q.length/6));state.healT+=dt*per;let n=0;const keep=[];
  for(const i of q){if(state.healT<1){keep.push(i);continue}const b=blue[i];if(!b)continue;if(vox[i]===b){hp[i]=maxHpOf(b);damaged.delete(i);paint(i);state.healT-=1;n++;continue}
    if(vox[i]&&!FLUID(vox[i]))continue;if(!supported(i)||cellBusy(i)){keep.push(i);continue}setVox(i,b);hp[i]=maxHpOf(b);state.healT-=1;n++;if(Math.random()<.12)sparkle(ix(i)+.5,iy(i)+.6,iz(i)+.5,0x9fe3ff,1)}
  state.healQ=keep.length&&n===0&&state.healT>=1?keep.slice(1):keep;if(n)SFX.build()}
