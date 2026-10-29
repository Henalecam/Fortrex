// ───────── progression: unlocks by wave, weapon and role limits raised by upgrades, posts for minions, auto-sell
const UNLOCK={turret:{cannon:1,ballista:1,mortar:3,flamer:5,tesla:7,frost:10},role:{rep:1,col:1,gun:1,sol:1,med:3},
  block:{16:1,17:1,10:1,18:4,15:5,9:7,8:7,14:9,19:10,20:14},
  up:{platform:2,quartel:3,door:3,explosive:4,oficina:4,wall:5,greek:6,escola:6,crit:8,portal:10,general:12,luck:14}};
function unlockWave(kind,k){return(UNLOCK[kind]&&UNLOCK[kind][k])||1}
function isUnlocked(kind,k){return state.wave>=unlockWave(kind,k)}
function checkUnlocks(){const w=state.wave,got=[];for(const k in UNLOCK.turret)if(UNLOCK.turret[k]===w)got.push(TURRETS[k].ico+' '+TURRETS[k].n);for(const k in UNLOCK.role)if(UNLOCK.role[k]===w)got.push(ROLES[k].ico+' '+ROLES[k].n);
  for(const k in UNLOCK.block)if(UNLOCK.block[k]===w)got.push(MAT[k].n);for(const k in UNLOCK.up)if(UNLOCK.up[k]===w){const U=UPGRADES.find(u=>u.id===k);if(U)got.push(U.ico+' '+U.nm)}
  if(w%8===0)got.push('+1 vaga de arma');if(got.length)toast(`🔓 Horda ${w}: ${got.join(', ')}`,'r4')}
function turretCap(){return 6+2*(state.ups.platform||0)+Math.floor(state.wave/8)}
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
  for(const it of A.slice()){const useful=minions.some(m=>itemScore(it,m.role)>itemScore(m.eq[it.slot],m.role)+.02);if(!useful&&it.r<=2){A.splice(A.indexOf(it),1);g+=Math.ceil(sellValue(it)*.25);n++}}
  const T=state.inv.turrets;const keep=Math.max(0,turretCap()-turretCount())+2;if(T.length>keep){T.sort((a,b)=>TURRETS[b.type].v+b.r-(TURRETS[a.type].v+a.r));for(const t of T.splice(keep)){g+=2+t.r*t.r*2;n++}}
  if(n){state.material+=g;label({x:CHEST.x,y:GY+3,z:CHEST.z},`💰 +${g}`,'#c99a1a');SFX.coin();refreshPanels()}}
const UPGRADES_EXTRA=[
  {id:'platform',ico:'🧱',nm:'Plataformas de armas',ds:'+2 armas instaladas na fortaleza.',max:6,cost:l=>70+l*70,go(){}},
  {id:'quartel',ico:'🏯',nm:'Quartel',ds:'+3 vagas de soldado e +1 de curandeiro.',max:5,cost:l=>60+l*60,go(){}},
  {id:'oficina',ico:'🏭',nm:'Oficina',ds:'+2 vagas de reparador e +2 de coletor.',max:5,cost:l=>50+l*50,go(){}},
  {id:'escola',ico:'🎓',nm:'Escola de artilharia',ds:'+2 vagas de artilheiro.',max:5,cost:l=>60+l*60,go(){}}];
UPGRADES.unshift(...UPGRADES_EXTRA);
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
function grantRelic(t){const R=RELICS[t];if(!R)return;state.relics=state.relics||{};state.relics[t]=(state.relics[t]||0)+1;R.go();toast(`${R.ico} Relíquia: ${R.n} — ${R.d}`,'r4');renderGoals();if(!state.hero)spawnHero()}
function relicsHtml(){const r=state.relics||{};const k=Object.keys(r);if(!k.length)return'';return`<div class="rel">${k.map(t=>`<span title="${RELICS[t].n}: ${RELICS[t].d}">${RELICS[t].ico}${r[t]>1?`<sub>×${r[t]}</sub>`:''}</span>`).join('')}</div>`}
// ───────── the hero: a unique legendary paladin who joins after the first boss; active ability on a cooldown
function spawnHero(){const m=makeMinion('sol',4,GATE.x,GATE.z+2);m.hero=true;m.name='Aurora, a Paladina';m.group.scale.setScalar(1.35);m.maxhp*=2.5;m.hp=m.maxhp;state.hero=m;state.heroCd=0;
  const halo=new THREE.Mesh(new THREE.TorusGeometry(.35,.06,6,16),new THREE.MeshBasicMaterial({color:0xffcf3d}));halo.rotation.x=Math.PI/2;halo.position.y=2.35;m.group.add(halo);
  $('bHero').hidden=false;toast('⭐ Aurora, a Paladina, se junta a você! Use ⭐ Martelo Sagrado (tecla Q).','r4')}
function heroAbility(){const m=state.hero;if(!m||!minions.includes(m)){toast('A heroína não está entre nós','r0');return}if(m.wounded>0){toast('Aurora está ferida','r0');return}if(state.heroCd>0){toast(`Martelo Sagrado em ${Math.ceil(state.heroCd)} s`,'r0');return}
  state.heroCd=40;const r=7,dmg=120+state.wave*8;for(const e of enemies){if(e.dead)continue;const d=Math.hypot(e.pos.x-m.pos.x,e.pos.z-m.pos.z);if(d<r&&!e.fly){dmgEnemy(e,dmg*(1-d/r*.5),true,true);e.stun=Math.max(e.stun||0,2)}}
  for(const o of minions){if(Math.hypot(o.pos.x-m.pos.x,o.pos.z-m.pos.z)<r){if(o.wounded>0)o.wounded=Math.min(o.wounded,1);else o.hp=o.maxhp}}
  for(let k=0;k<40;k++){const a=k/40*Math.PI*2;spawnDebris(m.pos.x+Math.cos(a)*r*.8,m.group.position.y+.5,m.pos.z+Math.sin(a)*r*.8,0xffcf3d,1,.3)}shake=Math.max(shake,.7);slowmo=Math.max(slowmo,.5);SFX.open();label({x:m.pos.x,y:m.group.position.y+3,z:m.pos.z},'⭐ Martelo Sagrado!','#e0a000')}
function heroTick(dt){if(state.heroCd>0)state.heroCd-=dt;const b=$('bHero');if(!b||b.hidden)return;const m=state.hero;if(!m||!minions.includes(m)){b.hidden=true;state.hero=null;return}b.querySelector('.cost').textContent=m.wounded>0?'ferida':state.heroCd>0?Math.ceil(state.heroCd)+'s':'pronto';b.classList.toggle('on',state.heroCd<=0&&!(m.wounded>0))}
