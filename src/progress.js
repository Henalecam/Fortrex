// ───────── progression: unlocks by wave, weapon and role limits raised by upgrades, posts for minions, auto-sell
const UNLOCK={turret:{cannon:1,ballista:1,mortar:3,flamer:5,tesla:7,frost:10,catapult:12},role:{rep:1,col:1,gun:1,sol:1,med:3},
  block:{16:1,17:1,10:1,18:4,15:5,9:7,8:7,14:9,19:10,20:14},
  up:{forge:12,bulwark:14,platform:2,quartel:3,door:3,explosive:4,oficina:4,wall:5,greek:6,escola:6,crit:8,portal:10,general:12,luck:14}};
function unlockWave(kind,k){return(UNLOCK[kind]&&UNLOCK[kind][k])||1}
function isUnlocked(kind,k){return state.wave>=unlockWave(kind,k)}
function checkUnlocks(){const w=state.wave,got=[];for(const k in UNLOCK.turret)if(UNLOCK.turret[k]===w)got.push(TURRETS[k].ico+' '+TURRETS[k].n);for(const k in UNLOCK.role)if(UNLOCK.role[k]===w)got.push(ROLES[k].ico+' '+ROLES[k].n);
  for(const k in UNLOCK.block)if(UNLOCK.block[k]===w)got.push(MAT[k].n);for(const k in UNLOCK.up)if(UNLOCK.up[k]===w){const U=UPGRADES.find(u=>u.id===k);if(U)got.push(U.ico+' '+U.nm)}
  if(w%8===0)got.push('+1 vaga de arma');if(got.length)toast(`🔓 Horda ${w}: ${got.join(', ')}`,'r4')}
function turretCap(){return 6+2*(state.ups.platform||0)+Math.floor(state.wave/8)+((state.expStage||0)>=3?4:0)+((state.expStage||0)>=6?3:0)}
function turretCount(){return turrets.filter(t=>t.alive&&t.team!=='r').length}
function canInstall(){if(turretCount()<turretCap())return true;toast(`Limite de ${turretCap()} armas. Compre 🧱 Plataformas de armas nos Upgrades.`,'r0');return false}
const ROLE_BASE={rep:6,col:7,gun:4,sol:6,med:2};
function roleCap(r){const u=state.ups;return ROLE_BASE[r]+(r==='sol'?3*(u.quartel||0):r==='med'?(u.quartel||0):r==='rep'||r==='col'?2*(u.oficina||0):r==='gun'?2*(u.escola||0):0)}
function roleCount(r){return minions.filter(m=>m.role===r).length}
function roleFree(r){return isUnlocked('role',r)&&roleCount(r)<roleCap(r)}
function roleBlock(r){if(!isUnlocked('role',r))return`🔒 ${ROLES[r].n} libera na horda ${unlockWave('role',r)}`;if(roleCount(r)>=roleCap(r))return`Limite de ${roleCap(r)} ${ROLES[r].n}s. ${r==='sol'||r==='med'?'Compre 🏯 Quartel':r==='gun'?'Compre 🎓 Escola de artilharia':'Compre 🏭 Oficina'} nos Upgrades.`;return''}
const POSTS={auto:{n:'Livre',ico:'🔄'},sul:{n:'Portão (sul)',ico:'⬇️'},norte:{n:'Norte',ico:'⬆️'},leste:{n:'Leste',ico:'➡️'},oeste:{n:'Oeste',ico:'⬅️'},torre:{n:'Torre',ico:'🏰'}};
function postPos(p){switch(p){case'norte':return{x:CX,z:WA-7};case'leste':return{x:WB+8,z:CZ};case'oeste':return{x:WA-8,z:CZ};case'torre':return{x:CX,z:CZ+3};default:return{x:CX,z:WB+9}}}
function postDist(m,x,z){if(!m.post||m.post==='auto')return 0;const p=postPos(m.post);return Math.hypot(x-p.x,z-p.z)}
// auto-sell: equipment nobody would upgrade to, and spare weapons that do not fit the walls
function autoSellTick(dt){if(!state.autoSell)return;state.sellT=(state.sellT||0)-dt;if(state.sellT>0)return;state.sellT=4;let g=0,n=0;const A=state.inv.armory;
  for(const it of A.slice()){const useful=minions.some(m=>itemScore(it,m.role)>itemScore(m.eq[it.slot],m.role)+.02);if(!useful&&it.r<=2){A.splice(A.indexOf(it),1);g+=Math.ceil(sellValue(it)*.12);n++}}
  const T=state.inv.turrets;const keep=Math.max(0,turretCap()-turretCount())+2;if(T.length>keep){T.sort((a,b)=>TURRETS[b.type].v+b.r-(TURRETS[a.type].v+a.r));for(const t of T.splice(keep)){g+=1+t.r*t.r;n++}}
  if(n){state.material+=g;label({x:CHEST.x,y:GY+3,z:CHEST.z},`💰 +${g}`,'#c99a1a');SFX.coin();refreshPanels()}}
const UPGRADES_EXTRA=[
  {id:'platform',ico:'🧱',nm:'Plataformas de armas',ds:'+2 armas instaladas na fortaleza.',max:6,cost:l=>70+l*70,go(){}},
  {id:'quartel',ico:'🏯',nm:'Quartel',ds:'+3 vagas de soldado e +1 de curandeiro.',max:5,cost:l=>60+l*60,go(){}},
  {id:'oficina',ico:'🏭',nm:'Oficina',ds:'+2 vagas de reparador e +2 de coletor.',max:5,cost:l=>50+l*50,go(){}},
  {id:'escola',ico:'🎓',nm:'Escola de artilharia',ds:'+2 vagas de artilheiro.',max:5,cost:l=>60+l*60,go(){}}];
const UPGRADES_LATE=[
  {id:'forge',ico:'🔱',nm:'Forja real',ds:'+5% de dano em todas as armas. Sem limite.',max:99,cost:l=>180+l*140,go(){state.dmgMul*=1.05}},
  {id:'bulwark',ico:'🛡️',nm:'Baluarte',ds:'Minions +8% de vida e armas +8% de integridade. Sem limite.',max:99,cost:l=>160+l*130,go(){state.turretHp*=1.08;for(const t of turrets){t.maxhp*=1.08;t.hp*=1.08}for(const m of minions){m.maxhp*=1.08}}}];
UPGRADES.unshift(...UPGRADES_EXTRA);UPGRADES.push(...UPGRADES_LATE);
// ───────── travelling merchant: shows up every 3 waves with a rotating stock; what you buy is unloaded at the gate
function merchantArrive(){const w=state.wave,offers=[];let guard=0;while(offers.length<4&&guard++<30){const r=Math.min(4,rollRarity(.06+w*.008)+(offers.length===0?1:0));const [kind,data]=lootPick('any',r);if(kind==='material')continue;offers.push({kind,data,r,price:Math.round((25+r*r*30)*(1+w*.03)),sold:false})}
  state.merchant={offers,until:w+2};$('bMerch').hidden=false;toast('🛒 O mercador chegou ao portão! Ofertas por 2 hordas.','r3');renderMerch()}
function merchantLeave(){if(!state.merchant)return;state.merchant=null;$('bMerch').hidden=true;$('merch').style.display='none'}
function offerName(o){const d=o.data;return o.kind==='equip'?`${itemIco(d.item)} ${d.item.n}`:o.kind==='block'?`🧱 ${d.n}× ${MAT[d.m].n}`:o.kind==='turret'?`${TURRETS[d.type].ico} ${TURRETS[d.type].n}`:o.kind==='recruit'?`${ROLES[d.role].ico} Recruta ${ROLES[d.role].n}`:o.kind}
function renderMerch(){const el=$('merch');if(!el)return;const M=state.merchant;if(!M){el.innerHTML='';return}
  el.innerHTML=`<div class="ds" style="width:100%;text-align:center">🛒 Mercador itinerante · fica até a horda ${M.until} · as compras chegam pelo portão</div>`+M.offers.map((o,k)=>`<button class="btn" data-buy="${k}" ${o.sold||state.material<o.price?'disabled':''} title="${esc(o.kind==='equip'?itemLines(o.data.item).join(' · '):'')}"><span style="color:var(--${RARITY[o.r].css})">${offerName(o)}</span> <span class="cost">${o.sold?'vendido':o.price}</span></button>`).join('');
  for(const b of el.querySelectorAll('[data-buy]'))b.onclick=()=>{const o=M.offers[+b.dataset.buy];if(o.sold||state.material<o.price)return;state.material-=o.price;o.sold=true;spawnLoot(GATE.x+rnd(-1,1),GY+1.5,GATE.z+3,o.kind,o.r,o.data);SFX.coin();SFX.loot(o.r);renderMerch();updateHud()}}
// ───────── relics: every boss you bring down leaves a permanent bonus (they stack)
const RELICS={boss:{ico:'🦷',n:'Dente do Devorador',d:'+8% de dano das armas',go(){state.dmgMul*=1.08}},
  golem:{ico:'🪨',n:'Coração de Pedra',d:'Reparadores 15% mais rápidos',go(){state.repMul*=1.15}},
  wyrm:{ico:'🐉',n:'Escama da Serpe',d:'Projéteis incendeiam (+1 Fogo grego)',go(){state.greek++}},
  colossus:{ico:'🦶',n:'Pata do Colosso',d:'+0,8 de raio da Bomba',go(){state.bombR+=.8}},
  necro:{ico:'📕',n:'Tomo do Necromante',d:'Feridos voltam 30% mais rápido',go(){state.healMul*=1.3}},
  queen:{ico:'👑',n:'Coroa da Rainha',d:'Drops mais raros',go(){state.luck+=.03}},
  titan:{ico:'🌋',n:'Núcleo de Lava',d:'+5% de chance de crítico',go(){state.critBonus+=.05}}};
function grantRelic(t){const R=RELICS[t];if(!R)return;state.relics=state.relics||{};state.relics[t]=(state.relics[t]||0)+1;R.go();toast(`${R.ico} Relíquia: ${R.n} — ${R.d}`,'r4');renderGoals();checkHeroes()}
function relicsHtml(){const r=state.relics||{};const k=Object.keys(r);if(!k.length)return'';return`<div class="rel">${k.map(t=>`<span title="${RELICS[t].n}: ${RELICS[t].d}">${RELICS[t].ico}${r[t]>1?`<sub>×${r[t]}</sub>`:''}</span>`).join('')}</div>`}
// ───────── heroes: unique legendaries who join as you collect relics (1, 3 and 5), each with an active ability
const HEROES=[
  {id:'paladin',name:'Aurora, a Paladina',ico:'⭐',ab:'Martelo Sagrado',key:'Q',cd:40,col:0xffcf3d,need:1,d:'dano e atordoamento em área, cura minions próximos'},
  {id:'archer',name:'Lyra, a Arqueira',ico:'🏹',ab:'Chuva de Flechas',key:'E',cd:32,col:0x5cc08c,need:3,d:'três rajadas no maior grupo de inimigos ao alcance'},
  {id:'mage',name:'Orin, o Mago do Gelo',ico:'❄️',ab:'Nova de Gelo',key:'T',cd:45,col:0x8fe3ff,need:5,d:'congela e fere tudo ao redor, transforma lava em obsidiana'}];
function relicCount(){return Object.values(state.relics||{}).reduce((a,b)=>a+b,0)}
function spawnHero(H){const m=makeMinion('sol',4,GATE.x+rnd(-1,1),GATE.z+2);m.hero=H.id;m.name=H.name;m.group.scale.setScalar(1.35);m.maxhp*=2.5;m.hp=m.maxhp;
  const halo=new THREE.Mesh(new THREE.TorusGeometry(.35,.06,6,16),new THREE.MeshBasicMaterial({color:H.col}));halo.rotation.x=Math.PI/2;halo.position.y=2.35;m.group.add(halo);
  state.heroes=state.heroes||{};state.heroes[H.id]={m,cd:0};const b=$('bHero_'+H.id);if(b)b.hidden=false;toast(`${H.ico} ${H.name} se junta a você! ${H.ab} (tecla ${H.key}): ${H.d}.`,'r4')}
function checkHeroes(){const n=relicCount();for(const H of HEROES)if(n>=H.need&&!(state.heroes&&state.heroes[H.id]))spawnHero(H)}
function heroAbility(id){const H=HEROES.find(h=>h.id===id);const S=state.heroes&&state.heroes[id];if(!H||!S||!minions.includes(S.m)){toast('Este herói ainda não chegou','r0');return}const m=S.m;
  if(m.wounded>0){toast(`${H.name.split(',')[0]} está ferido(a)`,'r0');return}if(S.cd>0){toast(`${H.ab} em ${Math.ceil(S.cd)} s`,'r0');return}const L=m.lvl||1,mul=1+(L-1)*.07;S.cd=H.cd*Math.max(.55,1-(L-1)*.02);const w=state.wave*mul;
  if(id==='paladin'){const r=7+L*.08,dmg=120+w*8;for(const e of enemies){if(e.dead||e.fly)continue;const d=Math.hypot(e.pos.x-m.pos.x,e.pos.z-m.pos.z);if(d<r){dmgEnemy(e,dmg*(1-d/r*.5),true,true);e.stun=Math.max(e.stun||0,2)}}
    for(const o of minions){if(Math.hypot(o.pos.x-m.pos.x,o.pos.z-m.pos.z)<r){if(o.wounded>0)o.wounded=Math.min(o.wounded,1);else o.hp=o.maxhp}}ringFx(m.pos.x,m.group.position.y+.5,m.pos.z,r,0xffcf3d)}
  if(id==='archer'){let best=null,bn=0;for(const e of enemies){if(e.dead||Math.hypot(e.pos.x-m.pos.x,e.pos.z-m.pos.z)>45)continue;let n=0;for(const o of enemies)if(!o.dead&&Math.abs(o.pos.x-e.pos.x)<6&&Math.abs(o.pos.z-e.pos.z)<6)n++;if(n>bn){bn=n;best=e}}
    if(!best){S.cd=2;toast('Nenhum inimigo ao alcance','r0');return}const x=best.pos.x,z=best.pos.z;for(let k=0;k<3;k++)state.volleys.push({x,z,t:.35+k*.45,dmg:70+w*6})}
  if(id==='mage'){const r=10+L*.1;for(const e of enemies){if(e.dead)continue;const d=Math.hypot(e.pos.x-m.pos.x,e.pos.z-m.pos.z);if(d<r){dmgEnemy(e,(60+w*5)*(e.type==='titan'?2.5:1),true);e.slowT=Math.max(e.slowT,6);e.stun=Math.max(e.stun||0,1)}}freezeAround(m.pos.x,GY,m.pos.z,4);ringFx(m.pos.x,m.group.position.y+.5,m.pos.z,r,0x8fe3ff);SFX.freeze()}
  shake=Math.max(shake,.7);slowmo=Math.max(slowmo,.4);SFX.open();label({x:m.pos.x,y:m.group.position.y+3,z:m.pos.z},`${H.ico} ${H.ab}!`,'#e0a000')}
function ringFx(x,y,z,r,c){for(let k=0;k<40;k++){const a=k/40*Math.PI*2;spawnDebris(x+Math.cos(a)*r*.8,y,z+Math.sin(a)*r*.8,c,1,.3)}}
function heroTick(dt){state.volleys=state.volleys||[];for(let i=state.volleys.length-1;i>=0;i--){const V=state.volleys[i];V.t-=dt;if(V.t>0)continue;state.volleys.splice(i,1);
    for(let k=0;k<26;k++)spawnDebris(V.x+rnd(-5,5),GY+rnd(3,9),V.z+rnd(-5,5),0x8a6a45,1,.18);for(const e of enemies)if(!e.dead&&Math.abs(e.pos.x-V.x)<6&&Math.abs(e.pos.z-V.z)<6)dmgEnemy(e,V.dmg,true);SFX.twang()}
  checkHeroes();for(const H of HEROES){const S=state.heroes&&state.heroes[H.id];const b=$('bHero_'+H.id);if(!b)continue;if(!S){b.hidden=true;continue}if(S.cd>0)S.cd-=dt;if(!minions.includes(S.m)){b.hidden=true;continue}b.hidden=false;
    b.querySelector('.cost').textContent=(S.m.wounded>0?'ferido':S.cd>0?Math.ceil(S.cd)+'s':'pronto')+` · nv ${S.m.lvl||1}`;b.title=`${H.name} (nv ${S.m.lvl||1}): ${H.ab} (${H.key}) — ${H.d}. Sobe de nível lutando.`;b.classList.toggle('on',S.cd<=0&&!(S.m.wounded>0))}}

// ───────── the citadel grows by itself: a new outer ring, bastions and a moat are drawn into the blueprint as waves go by.
// Building is free (repairers' labour is the only limit); after each wave everything mends itself.
const EXP_STAGES=[{w:3,n:'Paliçada de madeira'},{w:6,n:'Muralha externa de pedra'},{w:9,n:'Quatro bastiões com plataformas de armas'},{w:12,n:'Reforço de metal e portão externo'},{w:15,n:'Fosso de água'},{w:18,n:'Torres de vigia nas muralhas externas'},{w:21,n:'Campo de espinhos além do fosso'},{w:24,n:'Base de obsidiana e ameias de aço rúnico'}];
function ringCells(R,f){for(let x=CX-R;x<=CX+R;x++)for(let z=CZ-R;z<=CZ+R;z++){const edge=Math.max(Math.abs(x-CX),Math.abs(z-CZ));if(edge<R-1||edge>R)continue;f(x,z)}}
function clearFor(i){if(vox[i]&&!blue[i]&&!rown[i]&&vox[i]!==5){removeVox(i,'dig')}if(natBlue)natBlue[i]=0}
function expansionTick(){const st=state.expStage||0;if(st>=EXP_STAGES.length||state.wave<EXP_STAGES[st].w)return;state.expStage=st+1;const R=WR+8,gap=(x,z)=>z>CZ&&Math.abs(x-CX+.5)<2.6;
  const put=(x,y,z,m)=>{if(!inb(x,y,z))return;const i=idx(x,y,z);if(blue[i]===5)return;clearFor(i);placeBlue(i,m)};
  if(st===0)ringCells(R,(x,z)=>{if(gap(x,z))return;for(let y=0;y<3;y++)put(x,GY+y,z,2)});
  if(st===1)ringCells(R,(x,z)=>{if(gap(x,z))return;for(let y=0;y<5;y++)put(x,GY+y,z,3);if((x+z)%2===0)put(x,GY+5,z,3)});
  if(st===2){state.extraAnchors=[];for(const [sx,sz] of [[-1,-1],[1,-1],[-1,1],[1,1]]){const bx=CX+sx*R,bz=CZ+sz*R;for(let dx=-2;dx<=2;dx++)for(let dz=-2;dz<=2;dz++)for(let y=0;y<9;y++)put(bx+dx,GY+y,bz+dz,6);state.extraAnchors.push(idx(bx,GY+8,bz))}}
  if(st===3){ringCells(R,(x,z)=>{if(gap(x,z))return;put(x,GY+4,z,4)});for(let x=CX-2;x<=CX+1;x++)for(let z=CZ+R-1;z<=CZ+R;z++)for(let y=0;y<4;y++)put(x,GY+y,z,7)}
  if(st===4){const Rm=R+3;ringCells(Rm,(x,z)=>{if(z>CZ&&Math.abs(x-CX+.5)<3.6)return;const i=idx(x,GY-1,z);if(blue[i]||rown[i]||vox[i]===5||vox[i]===8)return;for(let y=GY;y<GY+3;y++){const j=idx(x,y,z);if(vox[j]&&!blue[j])removeVox(j,'dig')}setVox(i,0);setFluid(i,9,4,true);if(natBlue)natBlue[i]=0})}
  if(st===5){for(const [sx,sz] of [[0,-1],[-1,0],[1,0]]){const bx=CX+sx*R,bz=CZ+sz*R;for(let dx=-1;dx<=1;dx++)for(let dz=-1;dz<=1;dz++)for(let y=0;y<11;y++)put(bx+dx,GY+y,bz+dz,6);(state.extraAnchors=state.extraAnchors||[]).push(idx(bx,GY+10,bz))}}
  if(st===6){ringCells(R+5,(x,z)=>{if(z>CZ&&Math.abs(x-CX+.5)<4.6)return;if((x+z)%3)return;const i=idx(x,GY,z);if(vox[i]&&!blue[i])clearFor(i);if(!vox[i]&&!blue[i]){placeBlue(i,16);state.prepaid.add(i)}})}
  if(st===7)ringCells(R,(x,z)=>{if(gap(x,z))return;put(x,GY,z,14);if((x+z)%2===0)put(x,GY+5,z,20)});
  toast(`🏗️ A cidadela cresce: ${EXP_STAGES[st].n}! Os reparadores constroem de graça.`,'r4')}
