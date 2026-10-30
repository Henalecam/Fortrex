// ───────── the Realm: a living strategic map of fortresses that grow, wage war on each other and on us.
// The voxel map is always our own land; a fortress battle builds the enemy citadel on one side of it.
const REALM={cities:[],armies:[],facs:[],pois:[],log:[],t:0,spawnT:70,sel:null,open:false,nextId:1,deco:null};
const FAC_COLORS=[0xe8a21f,0xd9414f,0x8e5bd6,0x2f9a5e,0x2aa7b8,0xc4497f,0x7a7f3a,0x9b5a35,0x3d5bd6,0xe0662c,0x3f8f8a,0x6b4f9e];
const CITY_NAMES=['Cinzaforte','Garra Rubra','Pico do Corvo','Muralha Negra','Ponte de Ossos','Vale Sombrio','Trono de Ferro','Forja Rubra','Ninho de Vespas','Rocha Uivante','Dente de Lobo','Brasa Eterna','Torre Partida','Fosso Frio','Coroa de Espinhos','Lâmina Cinza','Olho da Tormenta','Bastião Velho','Cripta Dourada','Penhasco Rubro'];
const BATTLE_SLOTS=()=>[[CX+66,CZ],[CX-66,CZ],[CX,CZ+66],[CX,CZ-66]];
function rName(){const used=new Set(REALM.cities.map(c=>c.name));const free=CITY_NAMES.filter(n=>!used.has(n));return free.length?pick(free):pick(CITY_NAMES)+' '+['II','III','IV','V'][rint(0,3)]}
function newFac(color,name,isMe){const f={id:REALM.facs.length,color,name,isMe:!!isMe};REALM.facs.push(f);return f}
function addCity(x,y,lvl,fac,o={}){const c={id:REALM.nextId++,name:o.name||rName(),x,y,lvl,fac,garrison:6+lvl*4,home:!!o.home,raidT:rnd(40,110)};REALM.cities.push(c);return c}
function homeCity(){return REALM.cities.find(c=>c.home)}
function cityDef(c){return c.lvl*4+c.garrison*.8}
function rlog(txt,css='r0'){REALM.log.unshift({txt,css,t:simTime});REALM.log.length=Math.min(REALM.log.length,7)}
function initRealm(){REALM.cities.length=0;REALM.armies.length=0;REALM.pois.length=0;REALM.poiT=45;REALM.deco=null;REALM.selA=null;REALM.confirm=null;state.quest=null;REALM.facs.length=0;REALM.log.length=0;REALM.t=0;REALM.spawnT=150;REALM.sel=null;REALM.nextId=1;
  const me=newFac(0xe8a21f,'Fortrex',true);addCity(500,500,1,me,{name:'Fortrex',home:true});
  const n=13;for(let k=0;k<n;k++){const a=k/n*Math.PI*2+rnd(-.2,.2),r=k%2?rnd(170,260):rnd(300,430);const f=newFac(FAC_COLORS[1+k%(FAC_COLORS.length-1)],'');const c=addCity(500+Math.cos(a)*r,500+Math.sin(a)*r*.82,r<280?rint(1,2):rint(2,3),f);f.name=c.name}
  rlog('Treze fortalezas dividem o reino. Observe, cresça, conquiste.','r2')}
function facOf(c){return REALM.facs[c.fac.id]||c.fac}
function realmTick(dt){if(!REALM.cities.length)return;REALM.t+=dt;if(state.battleCd>0)state.battleCd-=dt;const H0=homeCity();
  for(const c of REALM.cities){const cap=c.lvl*22;if(c.garrison<cap)c.garrison=Math.min(cap,c.garrison+dt*(.04+c.lvl*.03));
    if(c.fac.isMe)continue;c.raidT-=dt;if(c.raidT>0||c.garrison<12)continue;c.raidT=rnd(35,80)/Math.min(2,1+c.lvl*.1);
    // pick a nearby target of another faction: weaker is likelier, our home is always tempting
    const grace=simTime<300;const cand=REALM.cities.filter(o=>o.fac!==c.fac&&!(grace&&o.fac.isMe)).map(o=>({o,s:Math.hypot(o.x-c.x,o.y-c.y)*(o.home?1.25:1)+cityDef(o)*2*Math.random()})).sort((a,b)=>a.s-b.s);if(!cand.length)continue;
    const T=cand[Math.min(cand.length-1,Math.random()<.7?0:1)].o;const g0=c.garrison*rnd(.5,.75);c.garrison-=g0;const p=g0+c.lvl*4;REALM.armies.push({from:c,to:T,fac:c.fac,power:p,x:c.x,y:c.y,speed:rnd(9,13)});
    if(T.fac.isMe)rlog(`${c.name} marcha contra ${T.home?'você':T.name}!`,'r3')}
  for(let i=REALM.armies.length-1;i>=0;i--){const A=REALM.armies[i];const dx=A.to.x-A.x,dy=A.to.y-A.y,d=Math.hypot(dx,dy);const st=A.speed*dt;
    if(d>st){A.x+=dx/d*st;A.y+=dy/d*st;continue}REALM.armies.splice(i,1);arrive(A)}
  // new, stronger fortresses rise at the edges of the known world
  REALM.spawnT-=dt;const foes=REALM.cities.filter(c=>!c.fac.isMe);if(REALM.spawnT<=0&&(foes.length<10||Math.random()<.3)){REALM.spawnT=rnd(70,120);const top=Math.max(1,...REALM.cities.map(c=>c.lvl));
    const a=rnd(0,Math.PI*2);const f=newFac(FAC_COLORS[1+REALM.facs.length%(FAC_COLORS.length-1)],'');const c=addCity(clamp(500+Math.cos(a)*rnd(380,470),40,960),clamp(500+Math.sin(a)*rnd(330,420),40,960),Math.min(12,top+rint(0,1)),f);f.name=c.name;rlog(`Uma nova fortaleza surge: ${c.name} (nv ${c.lvl})`,'r3')}
  // the world keeps getting stronger whether you fight or not
  REALM.growT=(REALM.growT??180)-dt;if(REALM.growT<=0){REALM.growT=rnd(140,210);const foes2=REALM.cities.filter(c=>!c.fac.isMe);if(foes2.length){const c=pick(foes2);c.lvl=Math.min(20,c.lvl+1);c.garrison+=c.lvl*3;c.flash=simTime;rlog(`${c.name} cresce para nv ${c.lvl}`,'r0')}}
  poiTick(dt);if(H0)H0.lvl=1+(state.conquests||0)}
function arrive(A){const T=A.to;if(A.fac===T.fac){T.garrison+=A.power;return}
  if(T.home){// they come for us: a fortress-vs-fortress battle, or a raid if we are already at war
    const src=A.from;if(!battle()&&!(state.battleCd>0)&&src.fac===A.fac){startBattle(src,'defend',A.power)}else{const n=Math.min(10,2+Math.round(A.power/8));const R=battle();for(let k=0;k<n;k++){const e=edgeRaider(src,A.power)}toast(`Tropas de ${src.name} invadem suas terras: ${n} guerreiros!`,'r3')}return}
  const def=cityDef(T);if(A.power>def*rnd(.8,1.2)){const src=A.from;removeCity(T);if(REALM.cities.includes(src)){src.lvl=Math.min(20,src.lvl+1);src.garrison+=Math.max(4,(A.power-def)*.6)+T.garrison*.3;src.flash=simTime}
    rlog(`${src.name} destruiu ${T.name} e sobe para nv ${src.lvl}`,'r1');riseAfterFall(T,src)}
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
  const od=battleOdds(c.lvl);if(kind==='defend'){toast(`⚔️ ${c.name} (nv ${c.lvl}) ergueu uma fortaleza de cerco nas suas terras! Chance de vitória: ${pctS(od.p)} (${oddsText(od.p)}). Destrua o núcleo vermelho.`,'r3');rlog(`${c.name} sitia Fortrex!`,'r3')}
  else{toast(`⚔️ Guerra contra ${c.name} (nv ${c.lvl})! A fortaleza deles está à vista. Use ⚔️ Atacar.`,'r2');rlog(`Fortrex declara guerra a ${c.name}`,'r2')}
  cam.target.set((cx+CX)/2,GY+1.5,(cz+CZ)/2);return true}
function battleWon(R){const c=R.city;if(!c)return;state.fortsWon=(state.fortsWon||0)+1;addFame(15*c.lvl);goalEvent('fort',1,{lvl:c.lvl});if(R.kind==='defend')goalEvent('defend');removeCity(c);rlog(`Fortrex destruiu ${c.name}! A fortaleza sumiu do mapa.`,'r4');R.ruinT=30;state.battleCd=160;state.realmIncome=0;riseAfterFall(c,null)}
function removeCity(T){const k=REALM.cities.indexOf(T);if(k<0||T.home)return;REALM.cities.splice(k,1);for(let i=REALM.armies.length-1;i>=0;i--){const A=REALM.armies[i];if(A.to===T){const alt=REALM.cities.filter(o=>o.fac!==A.fac).sort((a,b)=>Math.hypot(a.x-A.x,a.y-A.y)-Math.hypot(b.x-A.x,b.y-A.y))[0];if(alt)A.to=alt;else REALM.armies.splice(i,1)}}if(REALM.sel===T)REALM.sel=null;if(REALM.confirm===T)REALM.confirm=null}
function clearBattleRuins(){for(const R of rivals){for(const [i] of R.rblue){if(rown[i]){if(vox[i]){if(Math.random()<.08)spawnDebris(ix(i)+.5,iy(i)+.5,iz(i)+.5,MAT[vox[i]].c,1,.25);setVox(i,0)}rown[i]=0}}}rivals.length=0;settleDirty=true;updateModeUi()}
function ruinTick(dt){for(const R of rivals){if(R.alive||R.ruinT===undefined)continue;R.ruinT-=dt;if(R.ruinT<=0){R.ruinT=undefined;clearBattleRuins();toast('As ruínas da fortaleza inimiga desmoronam. O campo está livre.','r0');return}}}
function realmWaveIncome(){const inc=state.realmIncome||0;if(inc>0){state.material+=inc;toast(`Tributo das suas cidades: +${inc} material`,'r1')}}

// ───────── odds: how likely is a direct battle to go our way (shown before every confirmation)
function ourForce(){let atk=0,def=0;for(const m of minions){if(m.wounded>0)continue;const k=1+m.lvl*.08+m.rarity*.3;if(m.role==='sol')atk+=k*(m.st?m.st.atk:1);else if(m.role==='med')atk+=.35;else if(m.role==='gun')def+=.5*k;else if(m.role==='rep')def+=.25}
  for(const t of turrets)if(t.alive&&t.team!=='r')def+=1.1+(t.r||0)*.35;return{atk,def}}
function fortForce(lvl){const guards=(4+lvl*2)*(1+lvl*.12),tur=Math.min(8,3+lvl)*1.4,gen=3+lvl*1.5;return{guards,tur,gen,total:guards+gen+tur*.7}}
function oddsText(p){return p>=.75?'Vitória provável':p>=.5?'Equilibrada, com vantagem sua':p>=.3?'Arriscada':'Muito difícil: contrate e equipe mais soldados'}
function battleOdds(lvl){const F=ourForce(),E=fortForce(lvl);const us=F.atk+F.def*.35;const p=clamp(1/(1+Math.exp(-(us-E.total)/(E.total*.3+2))),.03,.97);return{p,us,E,F}}
function questOdds(q){const F=ourForce();const us=F.def*.9+F.atk*.8;const p=clamp(1/(1+Math.exp(-(us-q.E)/(q.E*.3+2))),.03,.97);return{p,us}}
function pctS(p){return Math.round(p*100)+'%'}
function oddsHtml(o,label){const col=o.p>=.6?'#2f9a5e':o.p>=.35?'#c99a1a':'#d9414f';return`<div class="odds"><div class="obar"><i style="width:${pctS(o.p)};background:${col}"></i></div><b style="color:${col}">${label||'Chance de vitória'}: ${pctS(o.p)}</b> · ${oddsText(o.p)}</div>`}

// ───────── secondary objectives on the realm map: boss lairs, skirmishes, ancient ruins
const POI_KINDS={boss:{ico:'💀',n:'Covil',d:'Um chefe colossal desperta e marcha até a sua cidadela. Derrote-o para saquear o covil.'},
  skirmish:{ico:'⚔️',n:'Escaramuça',d:'Um bando de saqueadores acampou nas suas terras. Batalha aberta, sem muralhas.'},
  ruins:{ico:'💎',n:'Ruínas',d:'Ruínas antigas cheias de tesouro, guardadas por criaturas da bruma.'},
  elite:{ico:'🏆',n:'Desafio',d:'Poucos inimigos lendários, muito fortes. Recompensa rara.'},
  meteor:{ico:'☄️',n:'Chuva de estrelas',d:'Por 45 s meteoros caem pelo mapa: destroem tudo, mas deixam cristais e loot.'},
  blitz:{ico:'🌪️',n:'Cerco relâmpago',d:'Uma enxurrada de criaturas da bruma vinda de um só lado, sem aviso.'}};
function bossFor(l){return ['boss','golem','wyrm','necro','colossus','queen','titan'][Math.min(6,Math.floor((l-1)/2))]}
function spawnPoi(){const kinds=['boss','boss','skirmish','skirmish','ruins','ruins','elite','meteor','blitz','blitz'];const kind=pick(kinds);const top=Math.max(1,...REALM.cities.filter(c=>!c.fac.isMe).map(c=>c.lvl));const lvl=Math.max(1,Math.min(14,Math.round(top*rnd(.5,1))+(kind==='boss'?1:0)));
  let x,y,ok=false;for(let t=0;t<40&&!ok;t++){const a=rnd(0,Math.PI*2),r=rnd(120,420);x=500+Math.cos(a)*r;y=500+Math.sin(a)*r*.85;ok=REALM.cities.every(c=>Math.hypot(c.x-x,c.y-y)>60)&&REALM.pois.every(p=>Math.hypot(p.x-x,p.y-y)>60)}if(!ok)return;
  const names={boss:['do Devorador Antigo','da Fera de Lava','da Rainha Pálida','do Colosso Adormecido'],skirmish:['dos Lobos Rubros','da Lâmina Cega','dos Saqueadores Cinza','do Corvo Faminto'],ruins:['de Velhoforte','do Templo Afundado','da Torre Caída','de Ouro Antigo'],elite:['dos Campeões','da Arena Rubra','dos Cinco Reis'],meteor:['do Céu Partido','das Estrelas Cadentes'],blitz:['da Bruma Uivante','do Vento Negro']};
  const n=kind==='skirmish'?5+lvl*2:kind==='ruins'?8+lvl*2:kind==='elite'?3+Math.floor(lvl/3):kind==='blitz'?14+lvl*4:1;const E=kind==='boss'?8+lvl*4:kind==='skirmish'?n*(1+lvl*.12):kind==='elite'?n*(2.2+lvl*.35):kind==='meteor'?6+lvl*1.5:kind==='blitz'?n*.5:n*.55;
  const P={id:REALM.nextId++,kind,lvl,x,y,ttl:rnd(200,300),n,E,name:`${POI_KINDS[kind].n} ${pick(names[kind])}`};REALM.pois.push(P);rlog(`${POI_KINDS[kind].ico} ${P.name} (nv ${lvl}) apareceu no mapa`,'r2')}
function edgePos(px,py){const H0=homeCity();const a=Math.atan2(py-H0.y,px-H0.x);return[clamp(CX+Math.cos(a)*(W*.45),4,W-5),clamp(CZ+Math.sin(a)*(D*.45),4,D-5)]}
function acceptPoi(P){if(state.quest){toast('Termine o objetivo atual primeiro','r0');return false}const [x,z]=edgePos(P.x,P.y);const units=[];
  if(P.kind==='boss'){const e=makeEnemy(bossFor(P.lvl),Math.min(4,1+Math.floor(P.lvl/3)),x,z);e.maxhp*=1+P.lvl*.12;e.hp=e.maxhp;units.push(e);toast(`💀 ${P.name}: ${e.T.n} vem aí!`,'r4')}
  else if(P.kind==='skirmish'){const fake={alive:true,lvl:P.lvl,name:P.name,guards:[],cx:x,cz:z,wr:0,core:[],edge:true};for(let k=0;k<P.n;k++){const e=makeEnemy(pick(['knight','knight','archer','rammer']),Math.min(4,rollRarity(P.lvl*.04)),x+rnd(-4,4),z+rnd(-4,4));e.rival=fake;e.rmode='raid';e.home={x,z};units.push(e)}toast(`⚔️ ${P.name}: ${P.n} saqueadores avançam!`,'r3')}
  else if(P.kind==='elite'){for(let k=0;k<P.n;k++){const e=makeEnemy(pick(['ram','climber','shaman','sapper','ram']),k===0?4:3,x+rnd(-4,4),z+rnd(-4,4));e.maxhp*=2+P.lvl*.15;e.hp=e.maxhp;e.speed*=1.15;units.push(e)}toast(`🏆 ${P.name}: campeões lendários entram em campo!`,'r4')}
  else if(P.kind==='meteor'){state.starfall=45;state.meteorT=1;toast(`☄️ ${P.name}: o céu se parte por 45 s!`,'r4')}
  else if(P.kind==='blitz'){for(let k=0;k<P.n;k++){const e=makeEnemy(pick(['crawler','crawler','climber','ram','flyer','sapper']),Math.min(4,rollRarity(P.lvl*.05)),x+rnd(-8,8),z+rnd(-8,8));e.viaWall=Math.random()<.5;units.push(e)}toast(`🌪️ ${P.name}: ${P.n} criaturas de uma vez!`,'r4')}
  else{for(let k=0;k<P.n;k++)units.push(makeEnemy(pick(['crawler','climber','crawler','sapper','flyer']),Math.min(4,rollRarity(P.lvl*.05)),x+rnd(-5,5),z+rnd(-5,5)));toast(`💎 ${P.name}: os guardiões da bruma despertam!`,'r2')}
  state.quest={P,units,last:{x,z}};REALM.pois.splice(REALM.pois.indexOf(P),1);rlog(`Fortrex aceita: ${P.name}`,'r2');cam.target.set((x+CX)/2,GY+1.5,(z+CZ)/2);return true}
function questTick(dt){const q=state.quest;if(!q)return;if(q.P.kind==='meteor'){state.starfall-=dt;meteorTick(dt);if(state.starfall>0)return;q.last={x:CHEST.x+rnd(-12,12),z:CHEST.z+rnd(14,20)}}let alive=0;for(const e of q.units){if(!e.dead){alive++;q.last={x:e.pos.x,z:e.pos.z}}}if(alive)return;state.quest=null;const P=q.P,L=q.last;
  const nt=P.kind==='ruins'?3:P.kind==='boss'||P.kind==='elite'?2:1;for(let k=0;k<nt;k++)spawnLoot(L.x+rnd(-1.5,1.5),GY+2,L.z+rnd(-1.5,1.5),'treasure',Math.min(4,(P.kind==='boss'?2:1)+Math.floor(P.lvl/3)+(k===0?1:0)),{});
  const g=(P.kind==='boss'?10:P.kind==='skirmish'||P.kind==='blitz'?6:P.kind==='elite'?9:4)*P.lvl;spawnLoot(L.x,GY+2,L.z,'material',0,{amount:g});state.conquests=(state.conquests||0)+(P.kind==='boss'?1:0);
  addFame((P.kind==='boss'?15:10)*P.lvl);goalEvent('poi');state.questsDone=(state.questsDone||0)+1;
  toast(`${POI_KINDS[P.kind].ico} ${P.name} concluído! Tesouro no campo.`,'r4');rlog(`Fortrex venceu ${P.name}`,'r4');slowmo=Math.max(slowmo,.8)}
function poiTick(dt){REALM.poiT=(REALM.poiT??50)-dt;if(REALM.poiT<=0){REALM.poiT=rnd(40,70);if(REALM.pois.length<6)spawnPoi()}for(let i=REALM.pois.length-1;i>=0;i--){const P=REALM.pois[i];P.ttl-=dt;if(P.ttl<=0){REALM.pois.splice(i,1);if(REALM.sel===P)REALM.sel=null}}questTick(dt)}
// when a fortress falls, another one grows
function riseAfterFall(T,by){const others=REALM.cities.filter(c=>c!==T&&c!==by&&!c.fac.isMe&&c.fac!==(by&&by.fac));if(Math.random()<.5&&others.length){const c=pick(others);c.lvl=Math.min(14,c.lvl+1);c.garrison+=c.lvl*5;c.flash=simTime;rlog(`Com a queda de ${T.name}, ${c.name} se fortalece (nv ${c.lvl})`,'r3')}
  if(REALM.cities.filter(c=>!c.fac.isMe).length<8||(REALM.cities.length<14&&Math.random()<.5)){const a=Math.atan2(T.y-500,T.x-500)+rnd(-1.2,1.2);const f=newFac(FAC_COLORS[1+REALM.facs.length%(FAC_COLORS.length-1)],'');let x=clamp(500+Math.cos(a)*rnd(330,450),50,950),y=clamp(500+Math.sin(a)*rnd(300,400),50,950);const c=addCity(x,y,Math.min(14,T.lvl+1),f);f.name=c.name;c.flash=simTime;rlog(`Das cinzas de ${T.name} surge ${c.name} (nv ${c.lvl})`,'r3')}}

// ───────── realm map overlay
let rcv=null,rctx=null;
function rng(seed){return()=>{seed|=0;seed=seed+0x6D2B79F5|0;let t=Math.imul(seed^seed>>>15,1|seed);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296}}
function genDeco(){const R=rng(rint(1,1e9)),D={coast:[],mts:[],forests:[],lakes:[],rivers:[]};const far=(x,y,d)=>REALM.cities.every(c=>Math.hypot(c.x-x,c.y-y)>d);
  for(let k=0;k<72;k++){const a=k/72*Math.PI*2;const r=430+Math.sin(a*3+R()*.5)*22+Math.sin(a*7)*12+R()*16;D.coast.push([500+Math.cos(a)*r*1.08,500+Math.sin(a)*r*.98])}
  for(let k=0;k<26;k++){const a=R()*Math.PI*2,r=60+R()*360,x=500+Math.cos(a)*r,y=500+Math.sin(a)*r*.88;if(!far(x,y,48))continue;const n=2+Math.floor(R()*3);for(let j=0;j<n;j++)D.mts.push({x:x+j*14-n*6+R()*6,y:y+R()*10-j*3,s:14+R()*12})}
  for(let k=0;k<30;k++){const a=R()*Math.PI*2,r=40+R()*390,x=500+Math.cos(a)*r,y=500+Math.sin(a)*r*.88;if(!far(x,y,36))continue;const n=5+Math.floor(R()*9),t=[];for(let j=0;j<n;j++)t.push([x+(R()-.5)*40,y+(R()-.5)*26,4+R()*4]);D.forests.push(t)}
  for(let k=0;k<5;k++){const a=R()*Math.PI*2,r=80+R()*320,x=500+Math.cos(a)*r,y=500+Math.sin(a)*r*.88;if(far(x,y,50))D.lakes.push({x,y,rx:14+R()*20,ry:9+R()*12,a:R()*3})}
  for(let k=0;k<2;k++){const a=R()*Math.PI*2;let x=500+Math.cos(a)*80,y=500+Math.sin(a)*70;const pts=[[x,y]];const da=a+(R()-.5)*.6;for(let j=0;j<9;j++){x+=Math.cos(da+(R()-.5)*.9)*45;y+=Math.sin(da+(R()-.5)*.9)*40;pts.push([x,y])}D.rivers.push(pts)}
  REALM.deco=D}
function openRealm(){REALM.open=true;$('realm').style.display='flex';rcv=$('realmCanvas');rctx=rcv.getContext('2d');if(!REALM.deco)genDeco();drawRealm();renderRealmInfo()}
function closeRealm(){REALM.open=false;$('realm').style.display='none'}
function rView(){const r=rcv.getBoundingClientRect();const s=Math.min(r.width,r.height)/1000*.98;return{s,ox:(r.width-1000*s)/2,oy:(r.height-1000*s)/2,w:r.width,h:r.height}}
function shade(c,k){const C=new THREE.Color(c);return'#'+(k<0?C.lerp(new THREE.Color(0x1d1e33),-k):C.lerp(new THREE.Color(0xffffff),k)).getHexString()}
function drawRealm(){if(!REALM.open||!rctx)return;const dpr=Math.min(2,window.devicePixelRatio||1);const r=rcv.getBoundingClientRect();if(rcv.width!==Math.round(r.width*dpr)||rcv.height!==Math.round(r.height*dpr)){rcv.width=Math.round(r.width*dpr);rcv.height=Math.round(r.height*dpr)}
  const g=rctx;g.setTransform(dpr,0,0,dpr,0,0);const V=rView(),S=V.s,now=performance.now()/1000;const P=(x,y)=>[V.ox+x*S,V.oy+y*S];const D=REALM.deco||(genDeco(),REALM.deco);
  // sea
  const sea=g.createLinearGradient(0,0,0,V.h);sea.addColorStop(0,'#8fcbdc');sea.addColorStop(1,'#6aaac4');g.fillStyle=sea;g.fillRect(0,0,V.w,V.h);
  g.strokeStyle='rgba(255,255,255,.18)';g.lineWidth=1.2;for(let k=0;k<26;k++){const y=(k*41+now*6)%V.h,x=(k*137)%V.w;g.beginPath();g.moveTo(x,y);g.quadraticCurveTo(x+10,y-4,x+20,y);g.quadraticCurveTo(x+30,y+4,x+40,y);g.stroke()}
  // land with sandy coast
  const path=()=>{g.beginPath();D.coast.forEach(([x,y],k)=>{const [a,b]=P(x,y);k?g.lineTo(a,b):g.moveTo(a,b)});g.closePath()};
  path();g.strokeStyle='rgba(255,255,255,.35)';g.lineWidth=16*S+6;g.stroke();path();g.strokeStyle='#eadcae';g.lineWidth=8*S+3;g.stroke();
  const [cx0,cy0]=P(500,500);const land=g.createRadialGradient(cx0,cy0,30*S,cx0,cy0,520*S);land.addColorStop(0,'#d7ebb4');land.addColorStop(.7,'#c3dfa0');land.addColorStop(1,'#a9cf8d');path();g.fillStyle=land;g.fill();
  g.save();path();g.clip();
  // territories
  for(const c of REALM.cities){const [x,y]=P(c.x,c.y);const rad=(48+c.lvl*7)*S;const tg=g.createRadialGradient(x,y,rad*.2,x,y,rad);tg.addColorStop(0,hex(facOf(c).color)+'40');tg.addColorStop(1,hex(facOf(c).color)+'00');g.fillStyle=tg;g.beginPath();g.arc(x,y,rad,0,Math.PI*2);g.fill()}
  // rivers and lakes
  for(const rv of D.rivers){g.beginPath();rv.forEach(([x,y],k)=>{const [a,b]=P(x,y);k?g.lineTo(a,b):g.moveTo(a,b)});g.strokeStyle='#7fbfd6';g.lineWidth=5*S+1.5;g.lineJoin='round';g.lineCap='round';g.stroke();g.strokeStyle='rgba(255,255,255,.35)';g.lineWidth=1.5*S+.5;g.stroke()}
  for(const L of D.lakes){const [x,y]=P(L.x,L.y);g.fillStyle='#86c4d8';g.beginPath();g.ellipse(x,y,L.rx*S,L.ry*S,L.a,0,Math.PI*2);g.fill();g.strokeStyle='#e9ddb0';g.lineWidth=2;g.stroke()}
  // forests
  for(const F of D.forests)for(const [fx,fy,fr] of F){const [x,y]=P(fx,fy);const rr=fr*S*1.4+1.5;g.fillStyle='rgba(43,60,40,.18)';g.beginPath();g.ellipse(x+1.5,y+rr*.7,rr,rr*.45,0,0,Math.PI*2);g.fill();g.fillStyle='#6fa45f';g.beginPath();g.arc(x,y,rr,0,Math.PI*2);g.fill();g.fillStyle='#8cc075';g.beginPath();g.arc(x-rr*.3,y-rr*.3,rr*.55,0,Math.PI*2);g.fill()}
  // mountains
  for(const M of D.mts){const [x,y]=P(M.x,M.y);const s=M.s*S*1.3+3;g.fillStyle='#9a9384';g.beginPath();g.moveTo(x-s,y+s*.5);g.lineTo(x,y-s*.8);g.lineTo(x+s,y+s*.5);g.closePath();g.fill();g.fillStyle='#7d7769';g.beginPath();g.moveTo(x,y-s*.8);g.lineTo(x+s,y+s*.5);g.lineTo(x+s*.15,y+s*.5);g.closePath();g.fill();g.fillStyle='#f4f1e8';g.beginPath();g.moveTo(x-s*.32,y-s*.27);g.lineTo(x,y-s*.8);g.lineTo(x+s*.32,y-s*.27);g.lineTo(x+s*.1,y-s*.35);g.lineTo(x-s*.05,y-s*.22);g.closePath();g.fill()}
  g.restore();
  // roads
  g.strokeStyle='rgba(140,110,70,.45)';g.lineWidth=2.2;g.setLineDash([6,5]);const seen=new Set();for(const c of REALM.cities){const nb=REALM.cities.filter(o=>o!==c).sort((a,b)=>Math.hypot(a.x-c.x,a.y-c.y)-Math.hypot(b.x-c.x,b.y-c.y)).slice(0,2);for(const o of nb){const key=Math.min(c.id,o.id)+'-'+Math.max(c.id,o.id);if(seen.has(key))continue;seen.add(key);const [a,b]=P(c.x,c.y),[x,y]=P(o.x,o.y);const mx=(a+x)/2+(b-y)*.12,my=(b+y)/2+(x-a)*.12;g.beginPath();g.moveTo(a,b);g.quadraticCurveTo(mx,my,x,y);g.stroke()}}g.setLineDash([]);
  // points of interest
  for(const Q of REALM.pois){const [x,y]=P(Q.x,Q.y);const K=POI_KINDS[Q.kind];const pr=13+Math.sin(now*3)*2;g.fillStyle=Q.kind==='boss'?'rgba(217,65,79,.22)':Q.kind==='skirmish'?'rgba(232,162,31,.22)':'rgba(79,156,242,.22)';g.beginPath();g.arc(x,y,pr+6,0,Math.PI*2);g.fill();
    g.fillStyle='#fff';g.beginPath();g.arc(x,y,13,0,Math.PI*2);g.fill();g.strokeStyle=REALM.sel===Q?'#ff8a5c':'rgba(43,45,74,.3)';g.lineWidth=REALM.sel===Q?3:1.5;g.stroke();
    g.strokeStyle='#2b2d4a';g.lineWidth=2.5;g.beginPath();g.arc(x,y,16,-Math.PI/2,-Math.PI/2+Math.PI*2*clamp(Q.ttl/300,0,1));g.stroke();g.font='15px sans-serif';g.textAlign='center';g.textBaseline='middle';g.fillText(K.ico,x,y+1);g.textBaseline='alphabetic';
    g.font='700 10px Fredoka,sans-serif';g.fillStyle='#2b2d4a';g.fillText(`${Q.name.split(' ').slice(0,3).join(' ')} · nv ${Q.lvl}`,x,y+28)}
  // armies
  for(const A of REALM.armies){const [ax,ay]=P(A.x,A.y),[tx,ty]=P(A.to.x,A.to.y);const col=hex(A.fac.color);const vs=A.to.fac.isMe;g.strokeStyle=col+(vs?'dd':'77');g.lineWidth=vs?2.4:1.4;g.setLineDash([5,4]);g.lineDashOffset=-now*20;g.beginPath();g.moveTo(ax,ay);g.lineTo(tx,ty);g.stroke();g.setLineDash([]);
    const ang=Math.atan2(ty-ay,tx-ax);g.fillStyle=col;g.beginPath();g.moveTo(tx-Math.cos(ang)*14,ty-Math.sin(ang)*14);g.lineTo(tx-Math.cos(ang)*22+Math.sin(ang)*5,ty-Math.sin(ang)*22-Math.cos(ang)*5);g.lineTo(tx-Math.cos(ang)*22-Math.sin(ang)*5,ty-Math.sin(ang)*22+Math.cos(ang)*5);g.fill();
    const n=Math.min(7,1+Math.floor(A.power/8));for(let k=0;k<n;k++){const bob=Math.sin(now*8+k)*1;const bx=ax-Math.cos(ang)*k*5.5+Math.sin(ang)*((k%2)*5-2.5),by=ay-Math.sin(ang)*k*5.5-Math.cos(ang)*((k%2)*5-2.5)+bob;g.fillStyle=shade(A.fac.color,-.25);g.beginPath();g.arc(bx,by,3.2,0,Math.PI*2);g.fill()}
    g.strokeStyle='#5a4630';g.lineWidth=1.5;g.beginPath();g.moveTo(ax,ay);g.lineTo(ax,ay-16);g.stroke();g.fillStyle=col;g.beginPath();g.moveTo(ax,ay-16);g.quadraticCurveTo(ax+6,ay-16+Math.sin(now*6)*2,ax+11,ay-13);g.lineTo(ax,ay-10);g.fill();
    g.fillStyle='#fff';g.strokeStyle='rgba(43,45,74,.25)';const tw=20;g.beginPath();g.roundRect?g.roundRect(ax-tw/2,ay+6,tw,12,6):g.rect(ax-tw/2,ay+6,tw,12);g.fill();g.stroke();g.fillStyle='#2b2d4a';g.font='700 9px Fredoka,sans-serif';g.textAlign='center';g.fillText(Math.round(A.power),ax,ay+15);if(REALM.selA===A){g.strokeStyle='#ff8a5c';g.lineWidth=2.5;g.beginPath();g.arc(ax,ay-4,14,0,Math.PI*2);g.stroke()}}
  // fortresses
  for(const c of REALM.cities){const [x,y]=P(c.x,c.y);const fc=facOf(c).color,col=hex(fc);const s=(9+Math.min(12,c.lvl)*1.1)*Math.max(.75,S*1.5);
    if(c.flash&&simTime-c.flash<12){const k=(simTime-c.flash)/12;g.strokeStyle=`rgba(255,177,61,${1-k})`;g.lineWidth=3;g.beginPath();g.arc(x,y,s*(1.5+k*2.5),0,Math.PI*2);g.stroke()}
    if(c.home){const hg=g.createRadialGradient(x,y,s*.5,x,y,s*2.6);hg.addColorStop(0,'rgba(255,207,61,.55)');hg.addColorStop(1,'rgba(255,207,61,0)');g.fillStyle=hg;g.beginPath();g.arc(x,y,s*2.6,0,Math.PI*2);g.fill()}
    if(REALM.sel===c){g.strokeStyle='#ff8a5c';g.lineWidth=3;g.beginPath();g.arc(x,y+s*.2,s*1.9,0,Math.PI*2);g.stroke()}
    if(rivals.some(R=>R.alive&&R.city===c)){g.strokeStyle='#d9414f';g.lineWidth=2.5;g.setLineDash([4,3]);g.lineDashOffset=now*12;g.beginPath();g.arc(x,y+s*.2,s*2.2+Math.sin(now*5)*2,0,Math.PI*2);g.stroke();g.setLineDash([])}
    g.fillStyle='rgba(43,45,74,.22)';g.beginPath();g.ellipse(x+2,y+s*.95,s*1.25,s*.32,0,0,Math.PI*2);g.fill();
    const stone=c.fac.isMe?'#efe9dc':'#b9b2c8',dark=c.fac.isMe?'#cfc6b2':'#9a92ad';
    // walls with crenellations
    g.fillStyle=stone;g.fillRect(x-s,y-s*.15,s*2,s*1.05);g.fillStyle=dark;g.fillRect(x-s,y+s*.55,s*2,s*.35);for(let k=0;k<5;k++){g.fillStyle=stone;g.fillRect(x-s+k*s*.44,y-s*.32,s*.24,s*.2)}
    // towers with faction roofs
    const tower=(tx,tw,th)=>{g.fillStyle=stone;g.fillRect(tx-tw/2,y-th,tw,th+s*.9);g.fillStyle=dark;g.fillRect(tx+tw*.15,y-th,tw*.35,th+s*.9);g.fillStyle=col;g.beginPath();g.moveTo(tx-tw*.7,y-th);g.lineTo(tx,y-th-tw*1.1);g.lineTo(tx+tw*.7,y-th);g.closePath();g.fill();g.fillStyle=shade(fc,-.3);g.beginPath();g.moveTo(tx,y-th-tw*1.1);g.lineTo(tx+tw*.7,y-th);g.lineTo(tx,y-th);g.closePath();g.fill()};
    tower(x-s*.82,s*.45,s*.55);tower(x+s*.82,s*.45,s*.55);tower(x,s*.62,s*1.0+Math.min(6,c.lvl)*s*.06);
    // flag
    const fy=y-s*1.0-Math.min(6,c.lvl)*s*.06-s*.62*1.1;g.strokeStyle='#5a4630';g.lineWidth=1.3;g.beginPath();g.moveTo(x,fy);g.lineTo(x,fy-s*.7);g.stroke();g.fillStyle=col;g.beginPath();g.moveTo(x,fy-s*.7);g.quadraticCurveTo(x+s*.3,fy-s*.7+Math.sin(now*5+c.id)*s*.08,x+s*.6,fy-s*.6);g.lineTo(x,fy-s*.4);g.fill();
    // gate
    g.fillStyle='#6b4a2f';g.beginPath();g.moveTo(x-s*.2,y+s*.9);g.lineTo(x-s*.2,y+s*.45);g.quadraticCurveTo(x,y+s*.25,x+s*.2,y+s*.45);g.lineTo(x+s*.2,y+s*.9);g.fill();
    // level badge
    g.fillStyle=col;g.beginPath();g.arc(x+s*1.05,y-s*.35,8,0,Math.PI*2);g.fill();g.strokeStyle='#fff';g.lineWidth=1.5;g.stroke();g.fillStyle='#fff';g.font='700 9px Fredoka,sans-serif';g.textAlign='center';g.fillText(c.lvl,x+s*1.05,y-s*.35+3);
    // label pill
    const label=(c.home?'👑 ':'')+c.name;g.font=`700 ${c.home?12:11}px Fredoka,sans-serif`;const lw=g.measureText(label).width+12;g.fillStyle='rgba(255,255,255,.85)';const ly=y+s*1.2+4;g.beginPath();g.roundRect?g.roundRect(x-lw/2,ly,lw,28,8):g.rect(x-lw/2,ly,lw,28);g.fill();
    g.fillStyle='#2b2d4a';g.fillText(label,x,ly+12);g.font='600 9.5px Nunito,sans-serif';g.fillStyle='#6b6e8f';g.fillText(`⚔ ${Math.round(c.garrison)} · ${c.fac.isMe?'sua':facOf(c).name.split(' ')[0]}`,x,ly+24)}
  // compass + title
  const [kx,ky]=[V.w-38,38];g.fillStyle='rgba(255,255,255,.7)';g.beginPath();g.arc(kx,ky,22,0,Math.PI*2);g.fill();g.fillStyle='#d9414f';g.beginPath();g.moveTo(kx,ky-18);g.lineTo(kx+5,ky);g.lineTo(kx-5,ky);g.fill();g.fillStyle='#2b2d4a';g.beginPath();g.moveTo(kx,ky+18);g.lineTo(kx+5,ky);g.lineTo(kx-5,ky);g.fill();g.font='700 9px Fredoka,sans-serif';g.textAlign='center';g.fillText('N',kx,ky-21+(-2));
  g.font='700 18px Fredoka,sans-serif';g.textAlign='left';g.fillStyle='rgba(43,45,74,.8)';g.fillText('Reino de Fortrex',16,28);
  // event log
  g.font='600 12px Nunito,sans-serif';let ly2=V.h-14;const nl=Math.min(6,REALM.log.length);if(nl){g.fillStyle='rgba(255,255,255,.78)';g.beginPath();g.roundRect?g.roundRect(8,V.h-18-nl*17,Math.min(V.w-16,480),nl*17+10,10):g.rect(8,V.h-18-nl*17,Math.min(V.w-16,480),nl*17+10);g.fill()}
  const maxW=Math.min(V.w-16,480)-16;if(V.w<520)g.font='600 10.5px Nunito,sans-serif';for(const L of REALM.log.slice(0,6)){g.fillStyle=getComputedStyle(document.documentElement).getPropertyValue('--'+L.css)||'#2b2d4a';if(L.css==='r0')g.fillStyle='#6b6e8f';let t='• '+L.txt;if(g.measureText(t).width>maxW){while(t.length>4&&g.measureText(t+'…').width>maxW)t=t.slice(0,-1);t+='…'}g.fillText(t,16,ly2);ly2-=17}}
function renderRealmInfo(){const el=$('realmInfo');if(!el)return;const c=REALM.sel&&REALM.sel.kind?null:REALM.sel,Q=REALM.sel&&REALM.sel.kind?REALM.sel:null;const mine=REALM.cities.filter(o=>o.fac.isMe);const facs=new Set(REALM.cities.map(o=>o.fac.id)).size;const F=ourForce();
  let h=`<div class="rh">🗺️ Reino</div><div class="ds">${REALM.cities.length} fortalezas · ${facs} impérios · você tem ${mine.length} ${mine.length===1?'cidade':'cidades'}${state.realmIncome?` (+${state.realmIncome}/horda)`:''}</div><div class="ds">Sua força: ataque ${F.atk.toFixed(0)} · defesa ${F.def.toFixed(0)}</div>`;
  if(state.quest)h+=`<div class="ds">🎯 Objetivo ativo: <b>${state.quest.P.name}</b> (${state.quest.units.filter(e=>!e.dead).length} inimigos restantes)</div>`;
  const A=REALM.selA;if(A&&REALM.armies.includes(A)){const eta=Math.hypot(A.to.x-A.x,A.to.y-A.y)/A.speed;const n=Math.round(A.power/3);h+=`<div class="rc"><b style="color:${hex(A.fac.color)}">⚔️ Exército de ${A.from.name}</b><div class="ds">Rumo a ${A.to.home?'<b>Fortrex (você!)</b>':A.to.name} · força ${Math.round(A.power)} · ~${n} guerreiros · chega em ${Math.ceil(eta)} s</div>`;
    if(A.to.home){const o=battleOdds(A.from.lvl);h+=`<div class="ds">Se chegar, ergue uma fortaleza de cerco ao lado da sua.</div>${oddsHtml(o,'Chance de defender')}`}else h+=`<div class="ds">Defesa do alvo: ${Math.round(cityDef(A.to))} → ${A.power>cityDef(A.to)?'provável conquista':'provável derrota'}</div>`;h+='</div>'}
  if(Q){const K=POI_KINDS[Q.kind];const o=questOdds(Q);h+=`<div class="rc"><b>${K.ico} ${Q.name}</b><div class="ds">Nível ${Q.lvl} · ${Q.kind==='boss'?`chefe: ${ETYPES[bossFor(Q.lvl)].n} nv ${Q.lvl}`:Q.kind==='meteor'?'45 s de meteoros':`${Q.n} inimigos`} · some em ${Math.ceil(Q.ttl)} s</div><div class="ds">${K.d}</div><div class="ds">Recompensa: ${Q.kind==='ruins'?3:Q.kind==='boss'||Q.kind==='elite'?2:1} tesouro(s) + ${(Q.kind==='boss'?10:Q.kind==='skirmish'||Q.kind==='blitz'?6:Q.kind==='elite'?9:4)*Q.lvl} material</div>${oddsHtml(o)}
    ${state.quest?'<div class="ds">Termine o objetivo atual primeiro.</div>':REALM.confirm===Q?`<button class="btn primary" id="realmGo">✅ Confirmar (${pctS(o.p)})</button><button class="btn" id="realmNo">Cancelar</button>`:`<button class="btn primary" id="realmAsk">Aceitar desafio</button>`}</div>`}
  if(c){const f=facOf(c);const war=battle();h+=`<div class="rc"><b style="color:${hex(f.color)}">${c.home?'👑 ':''}${c.name}</b><div class="ds">Nível ${c.lvl} · guarnição ${Math.round(c.garrison)} · império ${f.isMe?'seu':f.name} (${REALM.cities.filter(o=>o.fac===c.fac).length} cidades)</div>`;
    if(!f.isMe){const o=battleOdds(c.lvl);h+=`<div class="ds">Batalha definitiva: fortaleza contra fortaleza. Inimigo: ~${Math.round(4+c.lvl*2)} guardas, ${Math.min(8,3+c.lvl)} torres e o General. Você: ataque ${o.F.atk.toFixed(0)} + defesa ${o.F.def.toFixed(0)}.</div>${oddsHtml(o)}`;
      h+=war?`<div class="ds">Já em guerra com ${war.name}. Termine essa batalha primeiro.</div>`:state.battleCd>0?`<div class="ds">Tropas descansando: ${Math.ceil(state.battleCd)} s</div>`:REALM.confirm===c?`<button class="btn primary" id="realmGo">⚔️ Confirmar guerra (${pctS(o.p)})</button><button class="btn" id="realmNo">Cancelar</button>`:`<button class="btn primary" id="realmAsk">⚔️ Declarar guerra…</button>`}
    h+='</div>'}
  if(!c&&!Q&&!A)h+='<div class="ds" style="margin-top:8px">Clique numa fortaleza, num exército ou num objetivo (💀 covil, ⚔️ escaramuça, 💎 ruínas). Antes de qualquer batalha você vê a chance de vitória.</div>';
  el.innerHTML=h;const sel=REALM.sel;const ask=$('realmAsk');if(ask)ask.onclick=()=>{REALM.confirm=sel;renderRealmInfo()};const no=$('realmNo');if(no)no.onclick=()=>{REALM.confirm=null;renderRealmInfo()};
  const go=$('realmGo');if(go)go.onclick=()=>{REALM.confirm=null;if(sel.kind){if(acceptPoi(sel)){REALM.sel=null;closeRealm()}}else if(startBattle(sel,'attack')){REALM.sel=null;closeRealm()}}}
function realmClick(ev){const r=rcv.getBoundingClientRect();const V=rView();const mx=(ev.clientX-r.left-V.ox)/V.s,my=(ev.clientY-r.top-V.oy)/V.s;REALM.confirm=null;
  {let ba=null,bd=18;for(const A of REALM.armies){const d=Math.hypot(A.x-mx,A.y-my);if(d<bd){bd=d;ba=A}}if(ba){REALM.sel=null;REALM.selA=ba;renderRealmInfo();drawRealm();return}}REALM.selA=null;
  let best=null,bd=40;for(const c of [...REALM.cities,...REALM.pois]){const d=Math.hypot(c.x-mx,c.y-my);if(d<bd){bd=d;best=c}}REALM.sel=best;renderRealmInfo();drawRealm()}

// ───────── after every wave the citadel mends itself: structural blueprint blocks regrow for free over a few seconds
function startSelfRepair(){const q=[];for(const i of blueList){const b=blue[i];if(!b||SPECIAL_BLOCKS.includes(b)||b===5)continue;if(vox[i]===b&&hp[i]>=maxHpOf(b))continue;if(vox[i]&&vox[i]!==b&&!FLUID(vox[i]))continue;q.push(i)}
  q.sort((a,b)=>iy(a)-iy(b));state.healQ=q;state.healT=0;if(q.length)toast(`A cidadela se reconstrói sozinha: ${q.length} blocos`,'r1')}
function selfRepairTick(dt){const q=state.healQ;if(!q||!q.length)return;const per=Math.max(8,Math.ceil(q.length/6));state.healT+=dt*per;let n=0;const keep=[];
  for(const i of q){if(state.healT<1){keep.push(i);continue}const b=blue[i];if(!b)continue;if(vox[i]===b){hp[i]=maxHpOf(b);damaged.delete(i);paint(i);state.healT-=1;n++;continue}
    if(vox[i]&&!FLUID(vox[i]))continue;if(!supported(i)||cellBusy(i)){keep.push(i);continue}setVox(i,b);hp[i]=maxHpOf(b);state.healT-=1;n++;if(Math.random()<.12)sparkle(ix(i)+.5,iy(i)+.6,iz(i)+.5,0x9fe3ff,1)}
  state.healQ=keep.length&&n===0&&state.healT>=1?keep.slice(1):keep;if(n)SFX.build()}

// ───────── purpose: renown, ranks and contracts. Growing in rank also makes the world answer harder.
const RANKS=[{n:'Senhor de Aldeia',f:0},{n:'Barão',f:200},{n:'Visconde',f:650},{n:'Conde',f:1400},{n:'Marquês',f:2600},{n:'Duque',f:4300},{n:'Rei',f:6800},{n:'Imperador',f:10000},{n:'Lenda de Fortrex',f:15000}];
function rankIdx(){let k=0;for(let i=0;i<RANKS.length;i++)if((state.fame||0)>=RANKS[i].f)k=i;return k}
function addFame(n,why){const before=rankIdx();state.fame=(state.fame||0)+Math.round(n);const after=rankIdx();
  if(after>before){state.rank=after;MAX_MINIONS_BONUS=after*6;toast(`👑 Novo título: ${RANKS[after].n}! +6 vagas de minion. O reino reage: inimigos mais fortes.`,'r4');SFX.open();slowmo=Math.max(slowmo,.8);for(const c of REALM.cities)if(!c.fac.isMe){c.garrison+=c.lvl*2}offerRewards()}
  renderGoals()}
let MAX_MINIONS_BONUS=0;
const CONTRACT_T=[
  r=>({k:'fort',n:1,lvl:Math.max(1,2+r),txt:`Destrua uma fortaleza nv ${Math.max(1,2+r)}+`,fame:60+r*30}),
  r=>({k:'poi',n:1+Math.floor(r/3),txt:`Conclua ${1+Math.floor(r/3)} objetivo(s) do mapa`,fame:35+r*15}),
  r=>({k:'boss',n:1,txt:'Derrote um chefe (horda ou covil)',fame:40+r*20}),
  r=>({k:'wave',n:3+Math.floor(r/2),txt:`Vença ${3+Math.floor(r/2)} hordas`,fame:30+r*12}),
  r=>({k:'flawless',n:1,txt:'Vença uma horda sem nenhum minion ferido',fame:45+r*18}),
  r=>({k:'kills',n:150+r*120,txt:`Abata ${150+r*120} inimigos`,fame:30+r*15}),
  r=>({k:'defend',n:1,txt:'Derrote uma fortaleza que sitia você',fame:70+r*30})];
function newContract(){const r=rankIdx();const have=new Set((state.contracts||[]).map(c=>c.k));const pool=CONTRACT_T.map(f=>f(r)).filter(c=>!have.has(c.k));const c=pick(pool);c.p=0;return c}
function initGoals(){state.fame=0;state.rank=0;MAX_MINIONS_BONUS=0;state.contracts=[];for(let k=0;k<3;k++)state.contracts.push(newContract());renderGoals()}
function goalEvent(k,v=1,o={}){if(!state.contracts)return;let done=false;for(const c of state.contracts){if(c.k!==k)continue;if(k==='fort'&&(o.lvl||0)<c.lvl)continue;c.p=Math.min(c.n,c.p+v);if(c.p>=c.n&&!c.done){c.done=true;done=true;
    toast(`📜 Contrato cumprido: ${c.txt} (+${c.fame} renome)`,'r4');spawnLoot(CHEST.x+rnd(-1,1),GY+2,CHEST.z+3,'treasure',Math.min(4,1+Math.floor(rankIdx()/2)),{});addFame(c.fame)}}
  if(done)state.contracts=state.contracts.map(c=>c.done?newContract():c);if(done||k!=='kills'||Math.random()<.08)renderGoals()}
function renderGoals(){const el=$('goals');if(!el||!state.contracts)return;el.onclick=()=>el.classList.toggle('min');const r=rankIdx(),nx=RANKS[r+1];
  el.innerHTML=`<div class="gr">👑 ${RANKS[r].n} <span>${state.fame||0}${nx?` / ${nx.f}`:''} renome</span></div>`+relicsHtml()+state.contracts.map(c=>`<div class="gc"><div>${c.txt}</div><div class="gb"><i style="width:${Math.round(c.p/c.n*100)}%"></i></div><span>${Math.floor(c.p)}/${c.n} · +${c.fame}</span></div>`).join('')}
