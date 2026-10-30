// ───────── progression: unlocks by wave, weapon and role limits raised by upgrades, posts for minions, auto-sell
const UNLOCK={turret:{cannon:1,ballista:1,mortar:3,flamer:5,tesla:7,wind:8,frost:10,catapult:12,sunray:15},role:{rep:1,col:1,gun:1,sol:1,med:3},
  block:{16:1,17:1,10:1,31:6,18:4,15:5,9:7,8:7,14:9,19:10,20:14},
  up:{crossbow:4,farol:7,kennel:5,oil:6,sappers:5,forge:12,bulwark:14,platform:2,quartel:3,door:3,explosive:4,oficina:4,wall:5,greek:6,escola:6,crit:8,portal:10,general:12,luck:14}};
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
  {id:'escola',ico:'🎓',nm:'Escola de artilharia',ds:'+2 vagas de artilheiro.',max:5,cost:l=>60+l*60,go(){}},
  {id:'oil',ico:'🫕',nm:'Óleo fervente',ds:'As muralhas despejam óleo em quem escala: dano, queimadura e o escalador cai para fora. Mais níveis, mais frequente.',max:3,cost:l=>90+l*90,go(){}},
  {id:'cathedral',ico:'⛪',nm:'Catedral',ds:'Maravilha. Uma relíquia aleatória agora e a moral nunca cai abaixo de 55.',max:1,cost:()=>1100,need:()=>12,go(){const ks=Object.keys(RELICS);grantRelic(pick(ks));state.moraleFloor=Math.max(state.moraleFloor||0,55)}},
  {id:'observatory',ico:'🔭',nm:'Observatório',ds:'Maravilha. Todas as armas ganham +18% de alcance e enxergam através da bruma.',max:1,cost:()=>900,need:()=>10,go(){state.rangeMul=(state.rangeMul||1)*1.18}},
  {id:'greatwall',ico:'🏯',nm:'Grande Muralha',ds:'Maravilha. A muralha principal sobe 2 fileiras e os blocos da planta aguentam +25%.',max:1,cost:()=>1400,need:()=>14,go(){state.wallH+=2;state.blueHp=(state.blueHp||1)*1.25;buildBlueprint();if(state.phase!=='wave')startSelfRepair()}},
  {id:'dragon',ico:'🐲',nm:'Ninho do dragão',ds:'Maravilha. Um dragão aliado sobrevoa a cidadela e cospe fogo nos maiores grupos de inimigos.',max:1,cost:()=>1600,need:()=>16,go(){toast('🐲 Um dragão aliado chocou no ninho e já sobrevoa a cidadela!','r4')}},
  {id:'statue',ico:'🗿',nm:'Estátua do Guardião',ds:'Maravilha. +25% de dano em tudo e heróis ganham 1 nível.',max:1,cost:()=>2000,need:()=>18,go(){state.dmgMul*=1.25;state.bladeMul*=1.25;for(const k in state.heroes||{}){const m=state.heroes[k].m;if(m){m.lvl=(m.lvl||1)+1;recompute(m)}}}},
  {id:'crossbow',ico:'🎯',nm:'Besteiros nas ameias',ds:'Besteiros fixos no topo da muralha disparam setas em quem chega perto (2 setas por nível a cada 1,5 s).',max:5,cost:l=>90+l*80,go(){}},
  {id:'farol',ico:'🗼',nm:'Farol',ds:'Ergue um farol no pátio: armas a até 24 blocos dele ganham +15% de alcance, a bruma quase não atrapalha e, no Pântano, a horda não se esconde mais à noite.',max:1,cost:()=>260,go(){raiseLighthouse()}},
  {id:'kennel',ico:'🐕',nm:'Canil',ds:'+1 cão de guarda por nível: corre atrás dos Devoradores perto do portão e morde. Ferido, volta ao canil e se recupera.',max:4,cost:l=>70+l*70,go(){}},
  {id:'sappers',ico:'💣',nm:'Sapadores',ds:'Espalham mais minas, espinhos, gelo, piche e barris pelo mapa a cada horda, nos caminhos dos Devoradores.',max:5,cost:l=>60+l*55,go(){}}];
function upReady(U){const lv=state.ups[U.id]||0;return isUnlocked('up',U.id)&&(!U.need||state.wave>=U.need(lv))}
function upLockWave(U){const lv=state.ups[U.id]||0;return Math.max(unlockWave('up',U.id),U.need?U.need(lv):1)}
// ───────── minefields: sappers scatter traps across the map where the horde walks (never paid back as material)
function trapKinds(){const k=[17,17,16];if(isUnlocked('block',18))k.push(18);if(isUnlocked('block',31))k.push(31);k.push(10);return k}
function scatterTraps(){const lv=state.ups.sappers||0;const n0=(state.fieldTraps||[]).length;state.fieldTraps=(state.fieldTraps||[]).filter(i=>vox[i]&&vox[i]===state.fieldTrapM.get(i));state.trapGone=(state.trapGone||0)+n0-state.fieldTraps.length;const cap=24+12*lv;let want=Math.min(2+3*lv+Math.floor(state.wave/4),cap-state.fieldTraps.length);let placed=0,guard=0;
  while(want>0&&guard++<40){let best=null,bs=-1;for(let s=0;s<24;s++){const a=rnd(0,Math.PI*2),r=rnd(WR+14,64),x=Math.floor(CX+Math.cos(a)*r),z=Math.floor(CZ+Math.sin(a)*r);if(x<3||z<3||x>W-4||z>D-4)continue;const h=(heat[x+z*W]||0)+Math.random()*2;if(h>bs){bs=h;best=[x,z,a]}}
    if(!best)continue;const [x0,z0,a]=best;const m=pick(trapKinds());const n=Math.min(want,m===10?1:rint(2,4));const px=-Math.sin(a),pz=Math.cos(a);
    for(let k=0;k<n;k++){const x=Math.round(x0+px*(k-n/2)*1.6),z=Math.round(z0+pz*(k-n/2)*1.6);if(surf(x,z)!==GY||!inb(x,GY,z))continue;const i=idx(x,GY,z);if(vox[i]||blue[i]||rown[i]||FLUID(vox[idx(x,GY-1,z)])||cellBusy(i))continue;
      setVox(i,m);hp[i]=MAT[m].hp;looted[i]=1;if(natBlue)natBlue[i]=0;state.fieldTraps.push(i);state.fieldTrapM.set(i,m);state.trapPlaced=(state.trapPlaced||0)+1;sparkle(x+.5,GY+1,z+.5,MAT[m].c,2);placed++;want--}}
  return placed}
const UPGRADES_LATE=[
  {id:'forge',ico:'🔱',nm:'Forja real',ds:'+5% de dano em todas as armas. Sem limite.',max:99,cost:l=>180+l*140,go(){state.dmgMul*=1.05}},
  {id:'bulwark',ico:'🛡️',nm:'Baluarte',ds:'Minions +8% de vida e armas +8% de integridade. Sem limite.',max:99,cost:l=>160+l*130,go(){state.turretHp*=1.08;for(const t of turrets){t.maxhp*=1.08;t.hp*=1.08}for(const m of minions){m.maxhp*=1.08}}}];
UPGRADES.unshift(...UPGRADES_EXTRA);UPGRADES.push(...UPGRADES_LATE);
// ───────── travelling merchant: shows up every 3 waves with a rotating stock; what you buy is unloaded at the gate
function merchantArrive(){const w=state.wave,offers=[];let guard=0;while(offers.length<(state.buildings&&state.buildings.market?5:4)&&guard++<30){const r=Math.min(4,lootRarity(.06+w*.008)+(offers.length===0?1:0));const [kind,data]=lootPick('any',r);if(kind==='material')continue;offers.push({kind,data,r,price:Math.round((25+r*r*30)*(1+w*.03)*(state.buildings&&state.buildings.market?.75:1)),sold:false})}
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
  titan:{ico:'🌋',n:'Núcleo de Lava',d:'+5% de chance de crítico',go(){state.critBonus+=.05}},
  mistking:{ico:'🌫️',n:'Coroa da Bruma',d:'+15% de dano, +2 vagas de arma e +10 de moral',go(){state.dmgMul*=1.15;state.ups.platform=(state.ups.platform||0)+1;state.morale=Math.min(100,(state.morale||60)+10)}}};
function grantRelic(t){const R=RELICS[t];if(!R)return;state.relics=state.relics||{};state.relics[t]=(state.relics[t]||0)+1;R.go();toast(`${R.ico} Relíquia: ${R.n} — ${R.d}`,'r4');renderGoals();checkHeroes()}
function relicsHtml(){const r=state.relics||{};const k=Object.keys(r);if(!k.length)return'';return`<div class="rel">${k.map(t=>`<span title="${RELICS[t].n}: ${RELICS[t].d}">${RELICS[t].ico}${r[t]>1?`<sub>×${r[t]}</sub>`:''}</span>`).join('')}</div>`}
// ───────── heroes: unique legendaries who join as you collect relics (1, 3 and 5), each with an active ability
const HEROES=[
  {id:'paladin',name:'Aurora, a Paladina',ico:'⭐',ab:'Martelo Sagrado',key:'Q',cd:40,col:0xffcf3d,need:1,d:'dano e atordoamento em área, cura minions próximos'},
  {id:'archer',name:'Lyra, a Arqueira',ico:'🏹',ab:'Chuva de Flechas',key:'E',cd:32,col:0x5cc08c,need:3,d:'três rajadas no maior grupo de inimigos ao alcance'},
  {id:'mage',name:'Orin, o Mago do Gelo',ico:'❄️',ab:'Nova de Gelo',key:'T',cd:45,col:0x8fe3ff,need:5,d:'congela e fere tudo ao redor, transforma lava em obsidiana'},
  {id:'engineer',name:'Bruna, a Engenheira',ico:'🔧',ab:'Reconstrução',key:'G',cd:50,col:0xff8a5c,d:'reergue na hora até 160 blocos da planta e conserta todas as armas'},
  {id:'priestess',name:'Selene, a Sacerdotisa',ico:'🕯️',ab:'Luz Restauradora',key:'O',cd:55,col:0xfff1b0,d:'cura todos os minions próximos, levanta os feridos e restaura os blocos da muralha ao redor'},
  {id:'berserker',name:'Thor, o Berserker',ico:'🪓',ab:'Fúria',key:'Y',cd:42,col:0xd9414f,d:'8 s de fúria: soldados próximos causam o triplo de dano e correm mais'}];
const HERO_SLOTS=[1,3,5,8];
const HERO_LORE={priestess:'Guardiã do último templo da luz. Onde ela reza, a pedra se fecha e os caídos voltam a ficar de pé.',paladin:'Jurou proteger Fortrex quando a bruma engoliu sua ordem. O martelo ainda brilha com a luz do último templo.',archer:'Caçadora das torres do norte; dizem que nunca errou uma flecha desde que perdeu o irmão para os Lobos da Bruma.',mage:'Exilado da Academia por congelar um rio inteiro. Agora congela o que vier pela frente.',engineer:'Reconstruiu sozinha a ponte de Ponte de Ossos. Para ela, toda ruína é só uma planta esperando.',berserker:'Ninguém sabe de onde veio. Quando ele grita, até os soldados mais cansados lembram por que lutam.'};
function relicCount(){return Object.values(state.relics||{}).reduce((a,b)=>a+b,0)}
function spawnHero(H){const m=makeMinion('sol',4,GATE.x+rnd(-1,1),GATE.z+2);m.hero=H.id;m.name=H.name;m.group.scale.setScalar(1.35);recompute(m);m.hp=m.maxhp;
  const halo=new THREE.Mesh(new THREE.TorusGeometry(.35,.06,6,16),new THREE.MeshBasicMaterial({color:H.col}));halo.rotation.x=Math.PI/2;halo.position.y=2.35;m.group.add(halo);
  state.heroes=state.heroes||{};state.heroes[H.id]={m,cd:0};const b=$('bHero_'+H.id);if(b)b.hidden=false;toast(`${H.ico} ${H.name} se junta a você! ${H.ab} (tecla ${H.key}): ${H.d}.`,'r4')}
function checkHeroes(){if(state.heroOffer||state.choosing||hasMod('semherois'))return;const n=relicCount(),k=Object.keys(state.heroes||{}).length;if(k>=HERO_SLOTS.length||n<HERO_SLOTS[k])return;const left=HEROES.filter(H=>!(state.heroes&&state.heroes[H.id]));if(!left.length)return;
  const opts=shuffle(left.slice()).slice(0,2);if(opts.length===1||state.autoReward||window.__headless){spawnHero(opts[0]);return}state.heroOffer=true;state.choosing=true;
  const box=$('rewardCards');box.innerHTML='';$('rewardTitle').textContent='Um herói quer se juntar à sua causa!';$('reward').querySelector('.sub').textContent='Escolha um herói. O outro segue seu caminho.';
  for(const H of opts){const el=document.createElement('button');el.className='rcard r4';el.innerHTML=`<div class="ico">${H.ico}</div><div class="nm">${esc(H.name)}</div><div class="ds"><b>${H.ab}</b> (tecla ${H.key}): ${esc(H.d)}.</div><div class="rr">Herói lendário</div>`;el.onclick=()=>{spawnHero(H);$('reward').style.display='none';state.choosing=false;state.heroOffer=false;updateHud()};box.appendChild(el)}
  $('reward').style.display='flex';SFX.open()}
function heroAbility(id){const H=HEROES.find(h=>h.id===id);const S=state.heroes&&state.heroes[id];if(!H||!S||!minions.includes(S.m)){toast('Este herói ainda não chegou','r0');return}const m=S.m;
  if(m.wounded>0){toast(`${H.name.split(',')[0]} está ferido(a)`,'r0');return}if(S.cd>0){toast(`${H.ab} em ${Math.ceil(S.cd)} s`,'r0');return}const L=m.lvl||1,mul=(1+(L-1)*.07)*(heroHas(id,'pow')?1.4:1);S.cd=H.cd*(heroHas(id,'cd')?.75:1)*(state.buildings&&state.buildings.shrine?.7:1)*Math.max(.55,1-(L-1)*.02);const w=state.wave*mul;
  if(id==='priestess'){const r=14+L*.2;let n=0,b=0;for(const o of minions){if(o.away)continue;const d=Math.hypot(o.pos.x-m.pos.x,o.pos.z-m.pos.z);if(d>r)continue;if(o.wounded>0){o.wounded=0;o.hp=o.maxhp*.5;n++}else{o.hp=Math.min(o.maxhp,o.hp+o.maxhp*.6*mul)}}
    for(const i of blueList){if(b>=60+L*4)break;if(vox[i]!==blue[i])continue;const x=ix(i),z=iz(i);if(Math.hypot(x-m.pos.x,z-m.pos.z)>r)continue;const mh=maxHpOf(vox[i]);if(hp[i]<mh){hp[i]=mh;damaged.delete(i);paint(i);b++}}
    for(let k=0;k<30;k++)spawnDebris(m.pos.x+rnd(-r,r)*.6,m.group.position.y+rnd(.5,3),m.pos.z+rnd(-r,r)*.6,0xfff1b0,1,.15);toast(`🕯️ Luz Restauradora: ${n} feridos de pé, ${b} blocos restaurados`,'r4');SFX.open()}
  else if(id==='paladin'){const r=7+L*.08,dmg=120+w*8;for(const e of enemies){if(e.dead||e.fly)continue;const d=Math.hypot(e.pos.x-m.pos.x,e.pos.z-m.pos.z);if(d<r){dmgEnemy(e,dmg*(1-d/r*.5),true,true);e.stun=Math.max(e.stun||0,2)}}
    for(const o of minions){if(Math.hypot(o.pos.x-m.pos.x,o.pos.z-m.pos.z)<r){if(o.wounded>0)o.wounded=Math.min(o.wounded,1);else o.hp=o.maxhp}}ringFx(m.pos.x,m.group.position.y+.5,m.pos.z,r,0xffcf3d)}
  if(id==='archer'){let best=null,bn=0;for(const e of enemies){if(e.dead||Math.hypot(e.pos.x-m.pos.x,e.pos.z-m.pos.z)>45)continue;let n=0;for(const o of enemies)if(!o.dead&&Math.abs(o.pos.x-e.pos.x)<6&&Math.abs(o.pos.z-e.pos.z)<6)n++;if(n>bn){bn=n;best=e}}
    if(!best){S.cd=2;toast('Nenhum inimigo ao alcance','r0');return}const x=best.pos.x,z=best.pos.z;for(let k=0;k<3;k++)state.volleys.push({x,z,t:.35+k*.45,dmg:70+w*6})}
  if(id==='engineer'){let n=0;const near=blueList.filter(i=>blue[i]&&vox[i]!==blue[i]&&(!SPECIAL_BLOCKS.includes(blue[i])||TIER_RANK[blue[i]])).sort((a,b)=>Math.hypot(ix(a)-m.pos.x,iz(a)-m.pos.z)-Math.hypot(ix(b)-m.pos.x,iz(b)-m.pos.z));for(const i of near){if(n>=160)break;if(vox[i]&&!FLUID(vox[i]))continue;if(!supported(i)||cellBusy(i))continue;setVox(i,blue[i]);hp[i]=maxHpOf(blue[i]);n++;if(n%6===0)sparkle(ix(i)+.5,iy(i)+.6,iz(i)+.5,0xff8a5c,1)}
    for(const t of turrets)if(t.alive&&t.team!=='r')t.hp=t.maxhp;label({x:m.pos.x,y:m.group.position.y+4,z:m.pos.z},`+${n} blocos`,'#ff8a5c')}
  if(id==='berserker'){state.rageT=8;for(const o of minions)if(o.role==='sol'&&Math.hypot(o.pos.x-m.pos.x,o.pos.z-m.pos.z)<14)o.rage=8;ringFx(m.pos.x,m.group.position.y+.5,m.pos.z,14,0xd9414f)}
  if(id==='mage'){const r=10+L*.1;for(const e of enemies){if(e.dead)continue;const d=Math.hypot(e.pos.x-m.pos.x,e.pos.z-m.pos.z);if(d<r){dmgEnemy(e,(60+w*5)*(e.type==='titan'?2.5:1),true);e.slowT=Math.max(e.slowT,6);e.stun=Math.max(e.stun||0,1)}}freezeAround(m.pos.x,GY,m.pos.z,4);ringFx(m.pos.x,m.group.position.y+.5,m.pos.z,r,0x8fe3ff);SFX.freeze()}
  shake=Math.max(shake,.7);slowmo=Math.max(slowmo,.4);SFX.open();label({x:m.pos.x,y:m.group.position.y+3,z:m.pos.z},`${H.ico} ${H.ab}!`,'#e0a000')}
function ringFx(x,y,z,r,c){for(let k=0;k<40;k++){const a=k/40*Math.PI*2;spawnDebris(x+Math.cos(a)*r*.8,y,z+Math.sin(a)*r*.8,c,1,.3)}}
function heroTick(dt){for(const k in state.heroes||{}){const m=state.heroes[k].m;if(m&&m.wounded<=0&&heroHas(k,'regen')&&m.hp<m.maxhp)m.hp=Math.min(m.maxhp,m.hp+m.maxhp*.02*dt)}for(const o of minions)if(o.rage>0){o.rage-=dt;if(Math.random()<dt*6)spawnFlame(o.pos.x,o.group.position.y+1,o.pos.z,.4)}state.volleys=state.volleys||[];for(let i=state.volleys.length-1;i>=0;i--){const V=state.volleys[i];V.t-=dt;if(V.t>0)continue;state.volleys.splice(i,1);
    for(let k=0;k<26;k++)spawnDebris(V.x+rnd(-5,5),GY+rnd(3,9),V.z+rnd(-5,5),0x8a6a45,1,.18);for(const e of enemies)if(!e.dead&&Math.abs(e.pos.x-V.x)<6&&Math.abs(e.pos.z-V.z)<6)dmgEnemy(e,V.dmg,true);SFX.twang()}
  checkHeroes();for(const H of HEROES){const S=state.heroes&&state.heroes[H.id];const b=$('bHero_'+H.id);if(!b)continue;if(!S){b.hidden=true;continue}if(S.cd>0)S.cd-=dt;if(!minions.includes(S.m)){b.hidden=true;continue}b.hidden=false;
    b.querySelector('.cost').textContent=innerWidth<600?(S.m.wounded>0?'✚':S.cd>0?Math.ceil(S.cd)+'s':''):(S.m.wounded>0?'ferido':S.cd>0?Math.ceil(S.cd)+'s':'pronto')+` · nv ${S.m.lvl||1}`;b.title=`${H.name} (nv ${S.m.lvl||1}): ${H.ab} (${H.key}) — ${H.d}. Sobe de nível lutando.`;b.classList.toggle('on',S.cd<=0&&!(S.m.wounded>0))}}

// ───────── the citadel grows by itself: a new outer ring, bastions and a moat are drawn into the blueprint as waves go by.
// Building is free (repairers' labour is the only limit); after each wave everything mends itself.
const EXP_STAGES=[{w:3,n:'Paliçada de madeira'},{w:6,n:'Muralha externa de pedra'},{w:9,n:'Quatro bastiões com plataformas de armas'},{w:12,n:'Reforço de metal e portão externo'},{w:15,n:'Fosso de água (aríetes e rastejadores afundam e se afogam)'},{w:18,n:'Torres de vigia (enxergam através da bruma e da areia)'},{w:21,n:'Campo de espinhos além do fosso'},{w:24,n:'Base de obsidiana e ameias de aço rúnico'}];
function ringCells(R,f){for(let x=CX-R;x<=CX+R;x++)for(let z=CZ-R;z<=CZ+R;z++){const edge=Math.max(Math.abs(x-CX),Math.abs(z-CZ));if(edge<R-1||edge>R)continue;f(x,z)}}
function clearFor(i){if(vox[i]&&!blue[i]&&!rown[i]&&vox[i]!==5){removeVox(i,'dig')}}
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

// ───────── morale: victories and night rest lift it, wounds and endless waves wear it down; it speeds up or slows every minion (±20%)
function moraleTick(dt){let m=state.morale??60;if(state.phase==='wave'){state.waveT=(state.waveT||0)+dt;if(state.waveT>90)m-=dt*.35}else{state.waveT=0;if(isNight())m+=dt*1.2;else m+=dt*.15}
  state.morale=clamp(m,Math.max(state.buildings&&state.buildings.granary?45:0,state.moraleFloor||0),100);const el=$('morale');if(el){const v=Math.round(state.morale);el.textContent=`${v>=70?'😄':v>=40?'🙂':v>=20?'😟':'😩'} ${v}`;el.title=`Moral ${v}%: minions ${v>=50?'+':''}${Math.round((v/100*.4-.2)*100)}% de rendimento. Sobe vencendo hordas, chefes e descansando à noite; cai com feridos e hordas longas.`;el.style.color=v<25?'var(--bad)':''}}
// ───────── achievements (kept in the browser across runs) and end-of-run stats
const ACH=[
  {id:'contr',ico:'📜',n:'Mercenário',d:'Cumpra 10 contratos de horda',c:()=>(state.contractsDone||0)>=10},
  {id:'cstreak',ico:'🔥',n:'Palavra de honra',d:'Cumpra 5 contratos seguidos',c:()=>(state.conStreak||0)>=5},
  {id:'dogs',ico:'🐕',n:'Matilha',d:'Tenha 4 cães de guarda',c:()=>(state.ups.kennel||0)>=4},
  {id:'expd',ico:'🧭',n:'Explorador',d:'Complete 3 expedições',c:()=>(state.expDone||0)>=3},
  {id:'deal',ico:'🧙',n:'Negociante',d:'Aceite um trato do viajante',c:()=>!!state.dealTaken},
  {id:'troph',ico:'🏳️',n:'Caçador de estandartes',d:'Capture 5 estandartes inimigos',c:()=>(state.trophies||0)>=5},
  {id:'ally',ico:'🤝',n:'Diplomata',d:'Tenha 2 cidades aliadas',c:()=>REALM.cities.filter(c=>c.ally).length>=2},
  {id:'wonder',ico:'🏛️',n:'Construtor de maravilhas',d:'Construa uma Maravilha',c:()=>['cathedral','observatory','greatwall','statue'].some(k=>state.ups[k])},
  {id:'w10',ico:'🛡️',n:'Sobrevivente',d:'Chegue à horda 10',c:()=>state.wave>=10},
  {id:'w20',ico:'🏰',n:'Muralha Viva',d:'Chegue à horda 20',c:()=>state.wave>=20},
  {id:'w30',ico:'👑',n:'Lenda da Bruma',d:'Chegue à horda 30',c:()=>state.wave>=30},
  {id:'k1000',ico:'💥',n:'Estilhaçador',d:'Abata 1000 inimigos numa partida',c:()=>state.kills>=1000},
  {id:'k5000',ico:'☠️',n:'Moedor',d:'Abata 5000 inimigos numa partida',c:()=>state.kills>=5000},
  {id:'boss3',ico:'🦷',n:'Caçador de Chefes',d:'Derrote 3 chefes',c:()=>relicCount()>=3},
  {id:'boss7',ico:'🐉',n:'Colecionador de Relíquias',d:'Tenha 7 relíquias',c:()=>relicCount()>=7},
  {id:'fort1',ico:'⚔️',n:'Primeira Conquista',d:'Destrua uma fortaleza inimiga',c:()=>(state.fortsWon||0)>=1},
  {id:'fort5',ico:'🏯',n:'Flagelo dos Reinos',d:'Destrua 5 fortalezas',c:()=>(state.fortsWon||0)>=5},
  {id:'hero3',ico:'⭐',n:'Távola Redonda',d:'Reúna 3 heróis',c:()=>Object.keys(state.heroes||{}).length>=3},
  {id:'combo50',ico:'🔥',n:'Reação em Cadeia',d:'Faça um combo ×50',c:()=>(state.comboBest||0)>=50},
  {id:'rank6',ico:'🎖️',n:'Coroado',d:'Alcance o título de Rei',c:()=>rankIdx()>=6},
  {id:'exp8',ico:'🏗️',n:'Arquiteto',d:'Complete toda a expansão da cidadela',c:()=>(state.expStage||0)>=EXP_STAGES.length},
  {id:'brutal15',ico:'💀',n:'Brutalmente Honesto',d:'Chegue à horda 15 no Brutal',c:()=>OPTS.diff==='brutal'&&state.wave>=15},
  {id:'king',ico:'🌫️',n:'Regicida',d:'Derrote o Rei da Bruma',c:()=>!!(state.relics&&state.relics.mistking)},
  {id:'quest5',ico:'🗺️',n:'Aventureiro',d:'Conclua 5 objetivos do mapa',c:()=>(state.questsDone||0)>=5}];
const ACHS=(()=>{try{return JSON.parse(localStorage.getItem('fortrex_ach')||'{}')}catch(e){return{}}})();
function achTick(dt){state.achT=(state.achT||0)-dt;if(state.achT>0)return;state.achT=2;for(const A of ACH){if(ACHS[A.id])continue;let ok=false;try{ok=A.c()}catch(e){}if(ok){ACHS[A.id]=Date.now();(state.achRun=state.achRun||[]).push(A.id);try{localStorage.setItem('fortrex_ach',JSON.stringify(ACHS))}catch(e){}toast(`🏆 Conquista: ${A.ico} ${A.n} — ${A.d}`,'r4',true);SFX.loot(4)}}}
function achSummary(){const got=ACH.filter(A=>ACHS[A.id]);const run=(state.achRun||[]).map(id=>ACH.find(A=>A.id===id)).filter(Boolean);
  return `<div class="achs"><div class="ds">🏆 Conquistas ${got.length}/${ACH.length}${run.length?` · nesta partida: ${run.map(A=>A.ico+' '+A.n).join(', ')}`:''}</div><div class="achrow">${ACH.map(A=>`<span class="${ACHS[A.id]?'on':''}" title="${A.n}: ${A.d}">${A.ico}</span>`).join('')}</div></div>`}
function runStats(){return `<div class="rstats"><span>🌊 Horda <b>${state.wave}</b></span><span>💥 <b>${state.kills}</b> abates</span><span>🔥 combo <b>×${state.comboBest||0}</b></span><span>🦷 <b>${relicCount()}</b> relíquias</span><span>🏯 <b>${state.fortsWon||0}</b> fortalezas</span><span>🗺️ <b>${state.questsDone||0}</b> objetivos</span><span>👑 ${RANKS[rankIdx()].n}</span><span>${DIFF().ico} ${DIFF().n}</span></div>`}
// ───────── festival: every 7 waves the citadel celebrates; click the floating lanterns for material and morale
const lanterns=[];const LANT_GEO=new THREE.OctahedronGeometry(1.05,0);const LANT_COL=[0xffcf3d,0xff8a5c,0xb56cf2,0x5cc08c,0x4f9cf2];
function startFestival(){state.morale=Math.min(100,(state.morale??60)+10);for(let k=0;k<16;k++){const a=rnd(0,Math.PI*2),r=rnd(5,26);const m=new THREE.Mesh(LANT_GEO,new THREE.MeshLambertMaterial({color:pick(LANT_COL),emissive:0xffb13d,emissiveIntensity:.9}));m.scale.y=1.4;
    m.position.set(CX+Math.cos(a)*r,GY+rnd(5,12),CZ+Math.sin(a)*r);const g=new THREE.Group();g.add(m);g.position.copy(m.position);m.position.set(0,0,0);scene.add(g);const L={g,t:rnd(13,17),ph:rnd(0,6),val:4+state.wave};g.userData.lantern=L;lanterns.push(L)}
  toast('🎉 Festival na cidadela! Clique nas lanternas que flutuam para ganhar material e moral.','r4');SFX.open()}
function popLantern(L,auto){const k=lanterns.indexOf(L);if(k<0)return;lanterns.splice(k,1);scene.remove(L.g);const v=auto?Math.ceil(L.val*.25):L.val;state.material+=v;if(!auto){state.morale=Math.min(100,(state.morale??60)+2);label({x:L.g.position.x,y:L.g.position.y-1,z:L.g.position.z},`+${v}`,'#c99a1a');SFX.coin()}
  for(let j=0;j<10;j++)spawnDebris(L.g.position.x,L.g.position.y,L.g.position.z,pick(LANT_COL),1,.18)}
function festivalTick(dt){for(let i=lanterns.length-1;i>=0;i--){const L=lanterns[i];L.t-=dt;L.ph+=dt;L.g.position.y+=dt*.35;L.g.position.x+=Math.sin(L.ph*.7)*dt*.4;L.g.rotation.y+=dt;if(L.t<=0)popLantern(L,true)}}
// ───────── first-time tips: short, contextual, each shown once (remembered in the browser)
const TIPS_SEEN=(()=>{try{return JSON.parse(localStorage.getItem('fortrex_tips')||'{}')}catch(e){return{}}})();
const TIPS=[{id:'start',c:()=>simTime>3,t:'👥 Seus minions trabalham sozinhos: reparam, coletam, lutam e operam armas. Clique em um para ver a ficha.'},
  {id:'wave',c:()=>state.phase==='wave'&&state.wave===1,t:'🔥 Clique num inimigo para concentrar o fogo de todas as armas nele.'},
  {id:'auto',c:()=>state.wave>=2&&state.phase==='rest',t:'⚙️ No menu Automação você liga construção, upgrades, venda e recompensas automáticas.'},
  {id:'shop',c:()=>state.material>=90&&state.wave>=2,t:'⬆️ Gaste material em Upgrades: mais armas, mais vagas de minion, mais dano.'},
  {id:'build',c:()=>state.wave>=3&&state.phase==='rest',t:'🧱 Em Construir você coloca blocos, armadilhas e instala armas do arsenal. A base cresce sozinha também.'},
  {id:'save',c:()=>state.wave>=3&&state.savedWave===state.wave&&state.phase==='rest',t:'💾 O jogo salva sozinho a cada horda. Para continuar depois, use ▶ Continuar na tela inicial.'},
  {id:'rush',c:()=>rushBonus()>=8,t:'⚡ Ímpeto: chamar a próxima horda logo depois da anterior rende material extra — o botão mostra quanto.'},
  {id:'bomb',c:()=>state.wave>=4&&state.phase==='wave'&&enemies.length>25,t:'💣 Muitos inimigos? Use a Bomba (25 material) e clique onde ela deve cair.'},
  {id:'mason',c:()=>false,t:'🧱 Alvenaria (Upgrades) troca os blocos da cidadela por materiais melhores, de graça, depois de cada horda.'},
  {id:'affix',c:()=>enemies.some(e=>e.aff&&!e.dead),t:'💍 Anéis coloridos nos pés marcam inimigos de elite: amarelo veloz, azul blindado, vermelho vampiro, laranja explode ao morrer, verde regenera.'},
  {id:'sappers',c:()=>(state.fieldTraps||[]).length>=4,t:'💣 Os sapadores espalham minas, espinhos e barris pelo mapa onde a horda passa. Compre Sapadores para mais armadilhas.'},
  {id:'rally',c:()=>!!state.vein||enemies.some(e=>e.alpha&&!e.dead),t:'🚩 Reunir: toque no mapa e os soldados vão até lá por 30 s — ótimo para defender o veio de ouro ou caçar o lobo alfa.'},
  {id:'oil',c:()=>state.wave>=6&&!state.ups.oil&&!!state.climbHitChest,t:'🫕 Escaladores e aranhas passam por cima das muralhas. Óleo fervente (Upgrades) derruba eles lá de cima.'},
  {id:'goblin',c:()=>enemies.some(e=>e.type==='goblin'&&!e.dead),t:'🔧 Sabotadores (duendes com chave inglesa) desarmam as armadilhas dos Sapadores. Concentre o fogo neles.'},
  {id:'bearer',c:()=>enemies.some(e=>e.bearer&&!e.dead),t:'🚩 Um porta-estandarte inimigo acelera e protege a horda ao redor. Clique nele para concentrar o fogo: quando cai, todos por perto entram em pânico.'},
  {id:'ward',c:()=>state.wave>=8&&state.phase==='wave'&&chestAlive()<18,t:'🛡️ O baú está sendo atacado! Use a Égide do Guardião (dock) para proteger a cidadela por 7 s.'},
  {id:'hero',c:()=>Object.keys(state.heroes||{}).length>0,t:'⭐ Heróis têm habilidades: use o botão no dock ou as teclas Q/E/T/G/Y.'},
  {id:'realm',c:()=>simTime>240,t:'🗺️ Abra o Reino (M): fortalezas rivais crescem e guerreiam. Lá você vê objetivos e declara guerra.'},
  {id:'war',c:()=>!!battle(),t:'⚔️ Uma fortaleza inimiga surgiu! Use ⚔️ Atacar para mandar soldados destruir o núcleo vermelho.'}];
let tipT=0,tipShow=0;
function tipTick(dt){if(window.__headless||state.choosing)return;if(state.card&&innerWidth<700){if(tipShow>0){$('ftip').style.display='none';tipShow=0}return}if(tipShow>0){tipShow-=dt;if(tipShow<=0)$('ftip').style.display='none';return}tipT-=dt;if(tipT>0)return;tipT=1.5;for(const T of TIPS){if(TIPS_SEEN[T.id])continue;let ok=false;try{ok=T.c()}catch(e){}if(!ok)continue;TIPS_SEEN[T.id]=1;try{localStorage.setItem('fortrex_tips',JSON.stringify(TIPS_SEEN))}catch(e){}
  const el=$('ftip');el.innerHTML=`<span>${T.t}</span><button class="btn sm" id="tipX">Entendi</button>`;el.style.display='flex';$('tipX').onclick=()=>{el.style.display='none';tipShow=0};tipShow=9;break}}

// ───────── rally flag: plant a banner and every soldier at home gathers there for 30 s (click again to cancel)
let flagMesh=null;
function removeFlag(){if(flagMesh){scene.remove(flagMesh);flagMesh=null}}
function setRally(x,z){removeFlag();state.rally={x,z,t:state.buildings&&state.buildings.barracks?60:30};const g=new THREE.Group();box(.12,3,.12,0x6b4a2a,0,1.5,0,g);box(1.1,.7,.06,0xd9414f,.55,2.6,0,g);g.position.set(x,surf(x,z),z);scene.add(g);flagMesh=g;toast('🚩 Soldados, reúnam-se!','r2',true);SFX.whoosh()}
function rallyTick(dt){const R=state.rally;if(!R)return;R.t-=dt;if(flagMesh)flagMesh.children[1].rotation.y=Math.sin(simTime*4)*.3;if(R.t<=0){state.rally=null;removeFlag()}}

// field traps trigger by proximity: walking past is enough (enemies path around solid blocks, so waiting to be hit rarely happened)
let trapAcc=0,trapRT=0;function trapTick(dt){trapRT-=dt;if(trapRT<=0){trapRT=.5;refreshTrapRings()}trapAcc+=dt;if(trapAcc<.2||state.phase!=='wave')return;const t=trapAcc;trapAcc=0;const L=state.fieldTraps;if(!L||!L.length)return;const at=new Map();for(const i of L)if(vox[i])at.set(ix(i)+iz(i)*W,i);if(!at.size)return;
  for(const e of enemies){if(e.dead||e.fly||e.type==='goblin')continue;const fx=Math.floor(e.pos.x),fz=Math.floor(e.pos.z);for(let dz=-1;dz<=1;dz++)for(let dx=-1;dx<=1;dx++){const i=at.get(fx+dx+(fz+dz)*W);if(i===undefined)continue;const m=vox[i];if(m!==state.fieldTrapM.get(i))continue;
    if(m===17||m===10){at.delete(fx+dx+(fz+dz)*W);removeVox(i,'trap');state.trapHits=(state.trapHits||0)+1}
    else if(m===16){dmgEnemy(e,(6+state.wave*1.4)*t*5,true);hp[i]-=6*t*5;if(hp[i]<=0)removeVox(i,'trap');state.trapHits=(state.trapHits||0)+t}
    else if(m===18){e.slowT=Math.max(e.slowT||0,1.6);hp[i]-=5*t*5;if(hp[i]<=0)removeVox(i,'trap')}
    else if(m===31){e.slowT=Math.max(e.slowT||0,1.2)}}}}

// field-trap markers: a flat hazard ring around each sapper trap so it reads as a device, not a stray block
const TRAP_RING=(()=>{const g=new THREE.RingGeometry(1.0,1.4,4,1);g.rotateX(-Math.PI/2);g.rotateY(Math.PI/4);const m=new THREE.InstancedMesh(g,new THREE.MeshBasicMaterial({color:0xffffff,transparent:true,opacity:.95,depthWrite:false}),180);m.count=0;m.frustumCulled=false;m.instanceColor=new THREE.InstancedBufferAttribute(new Float32Array(180*3),3);scene.add(m);return m})();
let trapRingN=-1;const _trc=new THREE.Color(),_trm=new THREE.Matrix4();
function refreshTrapRings(){const L=(state.fieldTraps||[]).filter(i=>vox[i]&&vox[i]===state.fieldTrapM.get(i));let k=0;for(const i of L){if(k>=180)break;_trm.makeTranslation(ix(i)+.5,GY+.04,iz(i)+.5);TRAP_RING.setMatrixAt(k,_trm);_trc.setHex(vox[i]===17||vox[i]===10?0xffcf3d:vox[i]===16?0xd9414f:vox[i]===18?0x8fe3ff:0x2a2422);TRAP_RING.setColorAt(k,_trc);k++}TRAP_RING.count=k;TRAP_RING.instanceMatrix.needsUpdate=true;TRAP_RING.instanceColor.needsUpdate=true;trapRingN=k}

// boiling oil: walls pour on climbers (climbers and spiders were most of the chest damage when the walls held)
let oilAcc=0;function oilTick(dt){const lv=state.ups.oil||0;if(!lv||state.phase!=='wave')return;oilAcc+=dt;if(oilAcc<.5)return;const t=oilAcc;oilAcc=0;const rings=[WR];if((state.expStage||0)>=1)rings.push(WR+8);
  for(const e of enemies){if(e.dead||e.fly||!CLIMBS(e.type)||e.gy<GY+1.5||(e.oilCd||0)>simTime)continue;const dx=e.pos.x-CX,dz=e.pos.z-CZ,d=Math.max(Math.abs(dx),Math.abs(dz));if(!rings.some(R=>d>R-2.5&&d<R+2.5))continue;if(Math.random()>t*(.35+.2*lv))continue;
    e.oilCd=simTime+5-lv;dmgEnemy(e,(18+state.wave*3)*(1+.4*(lv-1)),true);if(lv>=2)e.afire=Math.max(e.afire||0,2.5);const L=Math.hypot(dx,dz)||1;e.pos.x+=dx/L*2.6;e.pos.z+=dz/L*2.6;e.stun=Math.max(e.stun||0,1.2);
    spawnDebris(e.pos.x,e.gy+1.2,e.pos.z,0x3a2a1a,6,.35);if(Math.random()<.4)label({x:e.pos.x,y:e.gy+2,z:e.pos.z},'óleo!','#ff8a3c');state.oilHits=(state.oilHits||0)+1}}

// ───────── gold veins: from wave 6 a vein can surface outside the walls. It pays while standing; part of the horde comes to loot it.
let veinMesh=null,veinAcc=0;
function veinCells(){const V=state.vein;if(!V)return[];return V.cells.filter(i=>vox[i]===19)}
function spawnVein(){if(state.vein||state.wave<6||state.wave%4!==2)return;for(let t=0;t<60;t++){const a=rnd(0,Math.PI*2),r=rnd(WR+12,WR+30),x=Math.floor(CX+Math.cos(a)*r),z=Math.floor(CZ+Math.sin(a)*r);let ok=true;
    for(let dx=-1;dx<=1&&ok;dx++)for(let dz=-1;dz<=1;dz++){const X=x+dx,Z=z+dz;if(surf(X,Z)!==GY||!inb(X,GY,Z)){ok=false;break}const i=idx(X,GY,Z);if(vox[i]||blue[i]||rown[i]||FLUID(vox[idx(X,GY-1,Z)])){ok=false;break}}if(!ok)continue;
    const cells=[];const put=(X,Y,Z)=>{const i=idx(X,Y,Z);setVox(i,19);hp[i]=MAT[19].hp*4;looted[i]=1;if(natBlue)natBlue[i]=0;cells.push(i)};for(let dx=-1;dx<=1;dx++)for(let dz=-1;dz<=1;dz++)if(Math.abs(dx)+Math.abs(dz)<2||Math.random()<.6)put(x+dx,GY,z+dz);put(x,GY+1,z);
    state.vein={x:x+.5,z:z+.5,cells,total:cells.length};const dir=Math.abs(x-CX)>Math.abs(z-CZ)?(x>CX?'leste':'oeste'):(z>CZ?'sul':'norte');toast(`⛏️ Um veio de ouro brotou a ${dir}! Rende material enquanto estiver de pé — e a horda vai tentar saqueá-lo. Use 🚩 Reunir para defendê-lo.`,'r4');SFX.open();return}}
function veinTick(dt){const V=state.vein;if(!V){if(veinMesh){scene.remove(veinMesh);veinMesh=null}return}veinAcc+=dt;if(veinAcc<1)return;const t=veinAcc;veinAcc=0;const n=veinCells().length;
  if(!veinMesh){veinMesh=new THREE.Mesh(new THREE.RingGeometry(2.6,3.1,32),new THREE.MeshBasicMaterial({color:0xffcf3d,transparent:true,opacity:.7,side:THREE.DoubleSide,depthWrite:false}));veinMesh.rotation.x=-Math.PI/2;veinMesh.position.set(V.x,GY+.06,V.z);scene.add(veinMesh)}
  if(!n){toast('⛏️ O veio de ouro foi saqueado pela horda.','r3');state.vein=null;return}
  state.veinGain=(state.veinGain||0)+n*.06*t;if(state.veinGain>=1){const k=Math.floor(state.veinGain);state.veinGain-=k;state.material+=k;if(Math.random()<.4)label({x:V.x,y:GY+2.4,z:V.z},`+${k}`,'#c99a1a')}}
// raiders: some of the horde breaks off to dig the vein out
function veinBrain(e,dt,sf){const L=veinCells();if(!L.length){e.veinRaid=false;return false}let best=-1,bd=1e9;for(const i of L){const d=Math.hypot(ix(i)+.5-e.pos.x,iz(i)+.5-e.pos.z);if(d<bd){bd=d;best=i}}
  const tx=ix(best)+.5,tz=iz(best)+.5,dx=tx-e.pos.x,dz=tz-e.pos.z,d=Math.hypot(dx,dz)||1;e.group.rotation.y=Math.atan2(dx,dz);
  if(d<1.5+e.radius){e.vel.set(0,0,0);if(e.timer<=0){e.timer=e.T.rate;damageVox(best,e.T.dmg,'enemy',e)}return true}
  const sp=e.speed*sf;e.pos.x+=dx/d*sp*dt;e.pos.z+=dz/d*sp*dt;e.gy+=(surfE(e.pos.x,e.pos.z)-e.gy)*Math.min(1,dt*9);e.group.position.y=e.gy+Math.abs(Math.sin(e.bob+=dt*12))*.12;return true}

// ───────── districts: at waves 4, 10, 16 and 22 the citadel offers a building — you pick one of three, each changes how you play
const BUILDINGS={
  forge:{ico:'⚒️',n:'Ferraria',d:'+10% de dano das armas e as armas se consertam sozinhas durante a horda.',mat:4,go(){state.dmgMul*=1.1}},
  arcane:{ico:'🔮',n:'Torre arcana',d:'A cada 12 s de horda, um raio arcano atinge o inimigo mais forte ao alcance.',mat:15,go(){}},
  granary:{ico:'🌾',n:'Celeiro',d:'A moral nunca cai abaixo de 45 e os feridos voltam 30% mais rápido.',mat:2,go(){state.healMul*=1.3;state.morale=Math.max(state.morale??60,60)}},
  market:{ico:'⚖️',n:'Mercado',d:'O mercador cobra 25% menos e vende uma oferta a mais.',mat:23,go(){}},
  barracks:{ico:'🛡️',n:'Caserna',d:'Soldados ganham +25% de vida e a bandeira 🚩 dura o dobro.',mat:24,go(){for(const m of minions)if(m.role==='sol'){recompute(m)}}},
  shrine:{ico:'⛩️',n:'Santuário',d:'Heróis recarregam as habilidades 30% mais rápido.',mat:14,go(){}}};
const BUILD_WAVES=[4,10,16,22];const BUILD_SPOTS=[[-10,-10],[10,-10],[-10,10],[10,10]];
function offerBuilding(){state.buildings=state.buildings||{};const k=Object.keys(state.buildings).length;if(k>=BUILD_SPOTS.length||state.choosing)return;
  const left=Object.keys(BUILDINGS).filter(b=>!state.buildings[b]);if(!left.length)return;const opts=shuffle(left.slice()).slice(0,3);
  if(state.autoReward||window.__headless){raiseBuilding(opts[0]);return}state.choosing=true;
  const box=$('rewardCards');box.innerHTML='';$('rewardTitle').textContent='A cidadela cresce: escolha um novo distrito';$('reward').querySelector('.sub').textContent='Os reparadores constroem de graça. Cada distrito muda o jeito de jogar.';
  for(const id of opts){const B=BUILDINGS[id];const el=document.createElement('button');el.className='rcard r3';el.innerHTML=`<div class="ico">${B.ico}</div><div class="nm">${B.n}</div><div class="ds">${B.d}</div><div class="rr">Distrito</div>`;el.onclick=()=>{raiseBuilding(id);$('reward').style.display='none';state.choosing=false;updateHud()};box.appendChild(el)}
  $('reward').style.display='flex';SFX.open()}
function raiseBuilding(id){const B=BUILDINGS[id];state.buildings=state.buildings||{};const k=Object.keys(state.buildings).length;const [ox,oz]=BUILD_SPOTS[k%BUILD_SPOTS.length];state.buildings[id]={k};B.go();
  const bx=CX+ox,bz=CZ+oz;const put=(x,y,z,m)=>{if(!inb(x,y,z))return;const i=idx(x,y,z);if(blue[i]===5||vox[i]===5)return;if(vox[i]&&!blue[i])clearFor(i);placeBlue(i,m)};
  for(let dx=-1;dx<=1;dx++)for(let dz=-1;dz<=1;dz++){for(let y=0;y<3;y++)if(Math.abs(dx)===1||Math.abs(dz)===1)if(!(dz===1&&dx===0&&y<2))put(bx+dx,GY+y,bz+dz,y===2?B.mat:3);put(bx+dx,GY+3,bz+dz,22)}put(bx,GY+4,bz,B.mat);
  if(state.phase!=='wave')startSelfRepair();toast(`${B.ico} Novo distrito: ${B.n} — ${B.d}`,'r4')}
let distAcc=0,arcT=8;function districtTick(dt){const Bd=state.buildings;if(!Bd||state.phase!=='wave')return;distAcc+=dt;
  if(Bd.arcane){arcT-=dt;if(arcT<=0){arcT=12;let best=null,bh=0;for(const e of enemies){if(e.dead)continue;const d=Math.hypot(e.pos.x-CX,e.pos.z-CZ);if(d>48)continue;if(e.hp>bh){bh=e.hp;best=e}}
    if(best){const [ox,oz]=BUILD_SPOTS[Bd.arcane.k%4];const sx=CX+ox,sz=CZ+oz;for(let k=0;k<10;k++){const f=k/10;spawnDebris(sx+(best.pos.x-sx)*f,GY+5+(best.gy+1-GY-5)*f,sz+(best.pos.z-sz)*f,0xb56cf2,1,.12)}dmgEnemy(best,90+state.wave*12,true,true);label({x:best.pos.x,y:best.gy+2.2,z:best.pos.z},'✦','#b56cf2');SFX.zap&&SFX.zap()}}}
  if(distAcc<1)return;const t=distAcc;distAcc=0;if(Bd.forge)for(const tu of turrets)if(tu.alive&&tu.team!=='r'&&tu.hp<tu.maxhp)tu.hp=Math.min(tu.maxhp,tu.hp+tu.maxhp*.015*t)}

// night hunt: on rest-phase nights an alpha wolf prowls outside the walls — optional prey for the soldiers, a rare chest if it falls
function huntTick(dt){if(state.phase!=='rest'||state.wave<5||!isNight()||state.choosing)return;const night=Math.floor((simTime/DAY_LEN)+.3+.2);if(state.huntNight===night)return;state.huntNight=night;if(Math.random()<.35)return;
  const a=rnd(0,Math.PI*2),r=WR+26,x=CX+Math.cos(a)*r,z=CZ+Math.sin(a)*r;const e=makeEnemy('wolf',Math.min(4,2+Math.floor(state.wave/10)),x,z);e.alpha=true;e.group.scale.setScalar(1.7);e.maxhp*=7;e.hp=e.maxhp;e.radius*=1.5;e.speed*=1.15;e.T={...e.T,dmg:e.T.dmg*2.2};
  toast('🐺 Um lobo alfa ronda a cidadela esta noite. Derrube-o (🚩 Reunir) por um tesouro raro.','r3')}

// ───────── hero talents: at levels 3, 6 and 9 a hero picks one of two talents (kept in the save as state.heroTal)
const TALENTS={cd:{ico:'⚡',n:'Prontidão',d:'Habilidade recarrega 25% mais rápido.'},pow:{ico:'💥',n:'Fúria do campeão',d:'Habilidade 40% mais forte.'},hp:{ico:'❤️',n:'Coração de ferro',d:'+50% de vida.'},regen:{ico:'🌿',n:'Vigor',d:'Regenera 2% da vida por segundo.'}};
const TALENT_LV=[3,6,9];
function heroHas(id,t){const T=state.heroTal&&state.heroTal[id];return !!(T&&T.includes(t))}
function offerTalent(m){const id=m.hero;if(!id||!minions.includes(m))return;state.heroTal=state.heroTal||{};const have=state.heroTal[id]||[];const due=TALENT_LV.filter(l=>m.lvl>=l).length;if(have.length>=due)return;
  if(state.choosing){setTimeout(()=>offerTalent(m),3000);return}const left=Object.keys(TALENTS).filter(t=>!have.includes(t));if(!left.length)return;const opts=shuffle(left.slice()).slice(0,2);const H=HEROES.find(h=>h.id===id);
  const take=t=>{state.heroTal[id]=[...have,t];recompute(m);toast(`${H.ico} ${H.name.split(',')[0]}: ${TALENTS[t].ico} ${TALENTS[t].n}`,'r4');setTimeout(()=>offerTalent(m),700)};
  if(state.autoReward||window.__headless){take(opts[0]);return}state.choosing=true;const box=$('rewardCards');box.innerHTML='';$('rewardTitle').textContent=`${H.ico} ${H.name.split(',')[0]} chegou ao nível ${m.lvl}: escolha um talento`;$('reward').querySelector('.sub').textContent='O talento é permanente e fica salvo com o herói.';
  for(const t of opts){const T=TALENTS[t];const el=document.createElement('button');el.className='rcard r4';el.innerHTML=`<div class="ico">${T.ico}</div><div class="nm">${T.n}</div><div class="ds">${T.d}</div><div class="rr">Talento</div>`;el.onclick=()=>{take(t);$('reward').style.display='none';state.choosing=false;updateHud()};box.appendChild(el)}
  $('reward').style.display='flex';SFX.open()}
// on phones the hero buttons float in their own column above the dock, so the dock keeps two rows
function placeHeroBar(){return;const narrow=innerWidth<600;let bar=$('heroBar');if(!bar){bar=document.createElement('div');bar.id='heroBar';document.body.appendChild(bar)}const dock=document.querySelector('.dock');const anchor=$('bomb');
  for(const H of HEROES){const b=$('bHero_'+H.id);if(!b)continue;if(narrow&&b.parentNode!==bar)bar.appendChild(b);else if(!narrow&&b.parentNode!==dock)dock.insertBefore(b,anchor)}}
addEventListener('resize',placeHeroBar);setTimeout(placeHeroBar,0);

// allies answer the call: while a rival fortress besieges you, each allied city sends soldiers (they leave when the fight ends)
let allyAcc=0;function allyTick(dt){allyAcc+=dt;if(allyAcc<1)return;allyAcc=0;const R=battle();const helpers=minions.filter(m=>m.allyHelp);
  if(!R){if(helpers.length){for(const m of helpers){scene.remove(m.group);minions.splice(minions.indexOf(m),1)}state.allyHelpFor=null}return}
  if(state.allyHelpFor===R.name)return;const A=REALM.cities.filter(c=>c.ally&&!c.fac.isMe);if(!A.length)return;state.allyHelpFor=R.name;let n=0;
  for(const c of A)for(let k=0;k<Math.min(3,1+Math.floor(c.lvl/2))&&n<8;k++,n++){const m=makeMinion('sol',Math.min(3,1+Math.floor(c.lvl/3)),GATE.x+rnd(-2,2),GATE.z+3+rnd(0,2));m.allyHelp=true;m.name=`${m.name} de ${c.name}`;for(const p of m.hats)p.material.color.setHex(hex2int(facOf(c).color))}
  if(n)toast(`🤝 Seus aliados mandaram ${n} soldados contra ${R.name}!`,'r4')}
function hex2int(c){return typeof c==='number'?c:parseInt(String(c).replace('#',''),16)}

// Guardian's aegis: an active shield over the citadel — 7 s of near-immunity for blueprint blocks, 100 s cooldown, from wave 8
let wardMesh=null;
function wardUp(){if(hasMod('semegide'))return false;if(state.wave<8||(state.wardCd||0)>0||state.phase!=='wave')return false;state.wardT=7;state.wardCd=100;
  if(!wardMesh){wardMesh=new THREE.Mesh(new THREE.SphereGeometry(WR+4,32,16,0,Math.PI*2,0,Math.PI/2),new THREE.MeshBasicMaterial({color:0x8fe3ff,transparent:true,opacity:.18,side:THREE.DoubleSide,depthWrite:false}));wardMesh.position.set(CX,GY,CZ);scene.add(wardMesh)}wardMesh.visible=true;
  SFX.open();shake=Math.max(shake,.25);toast('🛡️ Égide do Guardião: a cidadela está protegida por 7 s!','r4');return true}
function wardTick(dt){const b=$('bWard');if(b){const on=state.wave>=8;if(b.hidden===on)b.hidden=!on;const cd=state.wardCd||0;$('wardCd').textContent=state.wardT>0?Math.ceil(state.wardT)+'s':cd>0?Math.ceil(cd)+'s':'';b.classList.toggle('on',state.wardT>0)}
  if(state.wardCd>0)state.wardCd-=dt;if(state.wardT>0){state.wardT-=dt;if(wardMesh){wardMesh.material.opacity=.12+.08*Math.sin(simTime*8);if(state.wardT<=0)wardMesh.visible=false}}}

// momentum: calling the next wave within 12 s of the last one pays material (more the sooner, scaled by wave) — a reward for confident play
function rushBonus(){if(state.phase!=='rest'||state.wave<3||state.restStart==null)return 0;const el=simTime-state.restStart;if(el>=12)return 0;return Math.round((12-el)*(1+state.wave*.12))}

// chest status: hidden while intact; appears (blinking red) the moment the chest loses a block, with a warning
let chestAcc=0,chestLast=-1;function chestTick(dt){chestAcc+=dt;if(chestAcc<.3)return;chestAcc=0;const n=chestAlive(),tot=_chestVox.length||18;const el=$('chestSt');if(!el)return;
  if(n<tot){el.hidden=false;el.textContent=`📦 ${n}/${tot}`;el.classList.toggle('hurt',state.phase==='wave')}else el.hidden=true;
  if(chestLast>=0&&n<chestLast&&state.phase==='wave'&&simTime-(state.chestWarnT||-99)>12){state.chestWarnT=simTime;toast(`💔 O baú está sendo destruído: ${n}/${tot} pedaços! Pedaços perdidos só voltam no descanso.`,'r3')}chestLast=n}

// volcanic wastes: during waves the earth erupts — marked spots get hit by lava bombs (hurt everyone, set fires, scar the ground)
let eruptT=14;const pendingLava=[];const LAVA_COL_GEO=new THREE.CylinderGeometry(.35,.9,12,10,1,true);
function volcanoTick(dt){if(state.climate!=='vulcao'||state.phase!=='wave'||state.wave<4){if(state.phase!=="wave"){eruptT=14;for(const L of pendingLava)if(L.col)scene.remove(L.col);pendingLava.length=0}return}eruptT-=dt;
  if(eruptT<=0){eruptT=rnd(32,48);const n=3+Math.floor(state.wave/6);for(let k=0;k<n;k++){const a=rnd(0,Math.PI*2),r=Math.random()<.2?rnd(7,WR-2):rnd(WR+4,60);const x=CX+Math.cos(a)*r,z=CZ+Math.sin(a)*r;markGround(x,z,2.4,0xff5a1a,1.6+k*.25);const col=new THREE.Mesh(LAVA_COL_GEO,new THREE.MeshBasicMaterial({color:0xff7a2a,transparent:true,opacity:.55,depthWrite:false}));col.position.set(x,surf(x,z)+6,z);scene.add(col);pendingLava.push({x,z,t:1.6+k*.25,col})}
    toast('🌋 Erupção! Bombas de lava vão cair nas marcas laranja.','r3');shake=Math.max(shake,.35);SFX.boom&&SFX.boom(true)}
  for(let i=pendingLava.length-1;i>=0;i--){const L=pendingLava[i];L.t-=dt;if(L.col){L.col.material.opacity=.35+.3*Math.sin(simTime*14);L.col.scale.x=L.col.scale.z=1+Math.max(0,1.6-L.t)*.4}if(L.t>0)continue;pendingLava.splice(i,1);if(L.col){scene.remove(L.col);L.col.material.dispose()}explode(Math.floor(L.x),Math.floor(surf(L.x,L.z)),Math.floor(L.z),2.4,60+state.wave*4,{fire:true,src:'env'});for(let k=0;k<6;k++)spawnFlame(L.x+rnd(-1.5,1.5),surf(L.x,L.z)+rnd(.2,1.2),L.z+rnd(-1.5,1.5),1)}}

// biome rules: every land plays differently
//  Rubro (deserto): midday heat wears down soldiers fighting outside the walls
//  Gelada (neve): frozen lakes crack under heavy enemies, dropping them into icy water
//  Bruma (pântano): at night the horde stays hidden in the fog until it is close
let bioAcc=0;function biomeTick(dt){bioAcc+=dt;if(bioAcc<.3)return;const t=bioAcc;bioAcc=0;const k=state.climate;climUi();
  if(k==='deserto'&&state.phase==='wave'){const p=dayPhase();if(p>.4&&p<.6){if(state.heatDay!==Math.floor(simTime/DAY_LEN)){state.heatDay=Math.floor(simTime/DAY_LEN);toast('☀️ Calor do meio-dia: soldados fora das muralhas se cansam.','r3')}
    for(const m of minions)if(m.role==='sol'&&m.wounded<=0&&!inside(m.pos.x,m.pos.z)&&!m.hero)m.hp=Math.max(1,m.hp-m.maxhp*.007*t)}}
  if(k==='neve'&&state.phase==='wave'){for(const e of enemies){if(e.dead||e.fly)continue;if(!(BIG(e.type)||e.type==='brute'||e.type==='ram'||e.type==='rammer'||e.type==='beetle'))continue;const x=Math.floor(e.pos.x),z=Math.floor(e.pos.z);const i=idx(x,GY-1,z);if(!inb(x,GY-1,z)||vox[i]!==18||blue[i])continue;
    if(Math.random()<t*(BIG(e.type)?2:.8)){for(const [dx,dz] of [[0,0],[1,0],[-1,0],[0,1],[0,-1]]){const j=idx(x+dx,GY-1,z+dz);if(inb(x+dx,GY-1,z+dz)&&vox[j]===18&&!blue[j]){setVox(j,0);setFluid(j,9,4,true);spawnDebris(x+dx+.5,GY,z+dz+.5,0xd8f3ff,3,.25)}}if(Math.random()<.3)label({x:e.pos.x,y:e.gy+1.8,z:e.pos.z},'o gelo racha!','#8fe3ff');e.slowT=Math.max(e.slowT||0,2)}}}
  if(k==='pantano'){const hide=state.phase==='wave'&&isNight()&&!state.ups.farol;for(const e of enemies){if(e.dead)continue;const far=hide&&!BIG(e.type)&&Math.hypot(e.pos.x-CX,e.pos.z-CZ)>WR+14&&state.focus!==e;if(e.group.visible===far)e.group.visible=!far}}}

// guard dogs (Canil upgrade): fast biters that patrol in front of the gate; they live outside the minion system and are rebuilt from state.ups.kennel
const dogs=[];
function makeDog(k){const g=new THREE.Group();const col=[0x8a5a35,0x3b2d2a,0xd9b48a,0x6b6e8f][k%4];box(.45,.4,.9,col,0,.45,0,g);box(.38,.36,.42,col,0,.62,.55,g);box(.2,.16,.22,0x2b2d4a,0,.55,.78,g);for(const s of[-1,1])box(.1,.16,.08,shadeHex(col,-.25),s*.12,.86,.5,g);box(.42,.08,.1,0xd9414f,0,.5,.36,g);box(.08,.08,.35,col,0,.62,-.55,g).rotation.x=-.6;
  const legs=[];for(const sx of[-1,1])for(const sz of[-1,1])legs.push(box(.12,.3,.12,shadeHex(col,-.2),sx*.16,.15,sz*.3,g));g.scale.setScalar(US*.85);const x=GATE.x+(k-1.5)*1.6,z=GATE.z+4;g.position.set(x,standY(x,z),z);scene.add(g);const band=box(.3,.1,.3,0xffffff,0,.95,.55,g);band.visible=false;
  const d={g,pos:g.position,legs,k,hp:0,maxhp:0,hurtT:0,biteT:0,tgt:null,bob:rnd(0,6),band,bites:0};g.userData.dog=d;return d}
function dogTick(dt){const want=state.ups.kennel||0;while(dogs.length<want)dogs.push(makeDog(dogs.length));while(dogs.length>want){const d=dogs.pop();scene.remove(d.g)}if(!dogs.length)return;
  const W8=state.wave;for(const d of dogs){const mh=60+W8*12;if(!d.maxhp)d.hp=mh;d.maxhp=mh;const home={x:GATE.x+(d.k-1.5)*1.6,z:GATE.z+4};
    if(d.hurtT>0){d.hurtT-=dt;if(d.hurtT<=0)d.hp=d.maxhp;d.tgt=null}
    else if(!d.tgt||d.tgt.dead||Math.hypot(d.tgt.pos.x-GATE.x,d.tgt.pos.z-GATE.z)>30){d.tgt=null;let bd=22;for(const e of enemies){if(e.dead||e.fly||BIG(e.type))continue;const dd=Math.hypot(e.pos.x-d.pos.x,e.pos.z-d.pos.z);if(dd<bd&&Math.hypot(e.pos.x-GATE.x,e.pos.z-GATE.z)<26){bd=dd;d.tgt=e}}}
    const T=d.tgt?{x:d.tgt.pos.x,z:d.tgt.pos.z}:home;const dx=T.x-d.pos.x,dz=T.z-d.pos.z,dist=Math.hypot(dx,dz);
    if(d.tgt&&dist<1.3+d.tgt.radius){d.biteT-=dt;if(d.biteT<=0){d.biteT=.7;dmgEnemy(d.tgt,(10+W8*1.8)*state.bladeMul,true);d.bites++;d.hp-=(d.tgt.T.dmg||5)*.5;state.dogBites=(state.dogBites||0)+1;if(Math.random()<.15)label({x:d.pos.x,y:d.pos.y+1.2,z:d.pos.z},'au!','#8a5a35');if(d.hp<=0){d.hurtT=20;toast('🐕 Um cão de guarda se feriu e voltou ao canil','r1')}}}
    else if(dist>.4){const sp=(d.hurtT>0?3:d.tgt?7.5:4)*dt;const st=Math.min(sp,dist);d.pos.x+=dx/dist*st;d.pos.z+=dz/dist*st;d.g.rotation.y=Math.atan2(dx,dz);d.bob+=dt*14}
    d.pos.y=standY(d.pos.x,d.pos.z)+(d.tgt?Math.abs(Math.sin(d.bob))*.12:0);d.legs.forEach((L,i)=>L.rotation.x=Math.sin(d.bob+(i%2?Math.PI:0))*.5);d.band.visible=d.hurtT>0;d.g.rotation.z=d.hurtT>0&&Math.hypot(home.x-d.pos.x,home.z-d.pos.z)<.6?1.3:0}}

// expeditions (from the Realm panel): 3 collectors leave for 2 waves and come back with material and maybe a treasure
function expAvail(){return minions.filter(m=>m.role==='col'&&!m.away&&!m.hero&&m.wounded<=0)}
function expeditionHtml(){const X=state.expedition;if(X)return `<div class="rc"><b>🧭 Expedição em andamento</b><div class="ds">${X.n} coletores voltam na horda ${X.back} com material${X.lvl>=2?' e talvez um tesouro':''}.</div></div>`;
  const av=expAvail().length;const ok=av>=4&&state.phase==='rest'&&state.wave>=3;return `<div class="rc"><b>🧭 Expedição</b><div class="ds">Mande 3 coletores explorar o reino por 2 hordas: voltam com ~${expReward()} material e chance de tesouro. Você fica sem eles enquanto isso.</div>${ok?'<button class="btn primary" id="expGo">Enviar expedição</button>':`<div class="ds">${state.wave<3?'Disponível a partir da horda 3.':state.phase!=='rest'?'Só no descanso entre hordas.':'Precisa de pelo menos 4 coletores livres.'}</div>`}</div>`}
function expReward(){return Math.round(30+state.wave*9)}
function sendExpedition(){if(state.expedition||state.phase!=='rest')return;const L=expAvail().slice(0,3);if(L.length<3)return;for(const m of L){m.away=true;m.group.visible=false;m.task=null;m.bag=[];m.pos.set(CHEST.x,GY,CHEST.z)}
  state.expedition={n:3,back:state.wave+2,lvl:Math.min(4,1+Math.floor(state.wave/6))};toast('🧭 A expedição partiu: 3 coletores voltam em 2 hordas.','r3')}
function expeditionReturn(){const X=state.expedition;if(!X||state.wave<X.back)return;state.expedition=null;let n=0;for(const m of minions)if(m.away){m.away=false;m.group.visible=true;m.pos.set(GATE.x+rnd(-2,2),standY(GATE.x,GATE.z+3),GATE.z+3);n++}
  state.expDone=(state.expDone||0)+1;const g=expReward();spawnLoot(GATE.x,GY+1.5,GATE.z+3,'material',0,{amount:g});if(Math.random()<.35+X.lvl*.1)spawnLoot(GATE.x+1,GY+1.5,GATE.z+3,'treasure',Math.max(1,lootRarity(.05+state.wave*.005+X.lvl*.03)),{});
  toast(`🧭 A expedição voltou com ${g} material${n?'':''}! Os coletores estão no portão.`,'r4');SFX.open()}

// the wandering stranger: sometimes after a wave a hooded traveller offers a risky deal (accept one or walk away)
const DEALS={
  blood:{ico:'🩸',n:'Pacto de sangue',d:w=>`+${150+w*12} material agora, mas a próxima horda vem com 50% mais inimigos.`,ok:()=>true,go(w){state.material+=150+w*12;state.nextWaveMul=1.5}},
  bless:{ico:'✨',n:'Bênção inquieta',d:()=>'Armas +25% de dano nas próximas 3 hordas, mas a moral cai 25.',ok:()=>true,go(w){state.blessUntil=w+2;state.morale=Math.max(0,(state.morale??60)-25)}},
  relic:{ico:'🗝️',n:'Relíquia roubada',d:()=>'Pague 350 material por uma relíquia aleatória.',ok:()=>state.material>=350,go(){state.material-=350;grantRelic(pick(Object.keys(RELICS)))}},
  mercs:{ico:'🗡️',n:'Mercenários',d:w=>`Pague ${80+w*6} material: 4 soldados raros se juntam a você agora.`,ok:w=>state.material>=80+w*6,go(w){state.material-=80+w*6;for(let k=0;k<4;k++)makeMinion('sol',2,GATE.x+rnd(-2,2),GATE.z+3)}},
  gamble:{ico:'🎲',n:'Dados do viajante',d:()=>'Aposte 100 material: 50% de chance de receber 260.',ok:()=>state.material>=100,go(){state.material-=100;if(Math.random()<.5){state.material+=260;toast('🎲 Você ganhou 260 material!','r4')}else toast('🎲 O viajante leva seus 100 material e some na estrada.','r2')}}};
function strangerVisit(){const w=state.wave;if(w<6||state.choosing||Math.random()>.22||state.lastStranger===w)return;state.lastStranger=w;if(state.autoReward||window.__headless)return;
  const ks=shuffle(Object.keys(DEALS).filter(k=>DEALS[k].ok(w))).slice(0,2);if(!ks.length)return;state.choosing=true;const box=$('rewardCards');box.innerHTML='';
  $('rewardTitle').textContent='🧙 Um viajante encapuzado propõe um trato';$('reward').querySelector('.sub').textContent='Aceite um dos tratos ou siga sem ele.';
  const close=()=>{$('reward').style.display='none';state.choosing=false;updateHud()};
  for(const k of ks){const D=DEALS[k];const el=document.createElement('button');el.className='rcard r3';el.innerHTML=`<div class="ico">${D.ico}</div><div class="nm">${D.n}</div><div class="ds">${D.d(w)}</div><div class="rr">Trato</div>`;el.onclick=()=>{D.go(w);state.dealTaken=true;toast(`${D.ico} ${D.n} aceito.`,'r3');close()};box.appendChild(el)}
  const no=document.createElement('button');no.className='rcard r0';no.innerHTML='<div class="ico">🚶</div><div class="nm">Recusar</div><div class="ds">O viajante dá de ombros e vai embora.</div>';no.onclick=close;box.appendChild(no);
  $('reward').style.display='flex';SFX.open()}

// active effects chip: blessings, pacts, expeditions, captured banners
let buffAcc=0;function buffTick(dt){buffAcc+=dt;if(buffAcc<.5)return;buffAcc=0;{const gb=$('bGate');if(gb){const c=!!state.gateClosed;if(gb.classList.contains('on')!==c){gb.classList.toggle('on',c);gb.firstChild.textContent=c?'🔒':'🚪'}}}const el=$('buffSt');if(!el)return;const p=[];
  if((state.blessUntil||0)>=state.wave)p.push(`✨ +25% · ${state.blessUntil-state.wave+1} h`);if(state.nextWaveMul)p.push('🩸 próxima horda +50%');if(state.expedition)p.push(`🧭 volta h${state.expedition.back}`);if(state.trophies)p.push(`🏳️×${state.trophies}`);if(state.challenge&&state.challenge.mods)p.unshift(`🏆 ${state.challenge.mods.map(k=>CH_MODS[k]?CH_MODS[k].ico:'').join('')}`);
  const t=p.join('  ');if(el.textContent!==t)el.textContent=t;const h=!p.length;if(el.hidden!==h)el.hidden=h}

// portcullis: close the gate to make the doors 2.5× tougher — but minions can't walk through it either
function toggleGate(){state.gateClosed=!state.gateClosed;for(const i of blueList)if(vox[i]===7){const mh=maxHpOf(7);hp[i]=state.gateClosed?Math.min(mh,hp[i]*2.5):Math.min(mh,hp[i]);paint(i)}
  for(const m of minions)m.path=null;$('bGate').classList.toggle('on',!!state.gateClosed);$('bGate').firstChild.textContent=state.gateClosed?'🔒':'🚪';toast(state.gateClosed?'🔒 Portão fechado: a porta aguenta muito mais, mas ninguém passa.':'🚪 Portão aberto.','r2',true);SFX.build&&SFX.build()}

// automatic gate + stranded-collector warning
let gateAcc=0;function gateTick(dt){gateAcc+=dt;if(gateAcc<1)return;gateAcc=0;
  if(state.autoGate){if(state.phase==='wave'){let n=0;for(const e of enemies)if(!e.dead&&(e.type==='ram'||e.type==='rammer'||e.type==='brute')&&Math.hypot(e.pos.x-GATE.x,e.pos.z-GATE.z)<22)n++;if(n>=2&&!state.gateClosed)toggleGate()}else if(state.gateClosed)toggleGate()}
  if(state.gateClosed){const out=minions.filter(m=>!m.away&&m.role==='col'&&!inside(m.pos.x,m.pos.z)).length;if(out&&simTime-(state.gateWarnT||-99)>30){state.gateWarnT=simTime;toast(`🔒 ${out} coletor(es) presos do lado de fora do portão fechado.`,'r2',true)}}}

// lighthouse: a tall blueprint tower north of the keep with a rotating beam of light
let lightBeam=null;
function raiseLighthouse(){const bx=CX,bz=CZ-12;const put=(x,y,z,m)=>{if(!inb(x,y,z))return;const i=idx(x,y,z);if(blue[i]===5||vox[i]===5)return;if(vox[i]&&!blue[i])clearFor(i);placeBlue(i,m)};
  for(let y=0;y<13;y++)for(let dx=-1;dx<=1;dx++)for(let dz=-1;dz<=1;dz++)if(Math.abs(dx)===1||Math.abs(dz)===1||y===12)put(bx+dx,GY+y,bz+dz,y%4===3?22:3);put(bx,GY+13,bz,15);
  if(state.phase!=='wave')startSelfRepair();toast('🗼 O farol foi erguido: armas próximas enxergam mais longe e a bruma recua.','r4')}
function lightTick(dt){if(!state.ups.farol){if(lightBeam){scene.remove(lightBeam);lightBeam=null}return}
  if(!lightBeam){lightBeam=new THREE.Mesh(new THREE.ConeGeometry(4,26,16,1,true),new THREE.MeshBasicMaterial({color:0xfff1b0,transparent:true,opacity:.18,depthWrite:false,side:THREE.DoubleSide}));lightBeam.geometry.translate(0,-13,0);lightBeam.geometry.rotateZ(Math.PI/2);lightBeam.position.set(CX+.5,GY+13.5,CZ-11.5);scene.add(lightBeam)}
  lightBeam.rotation.y+=dt*.8;lightBeam.visible=isNight()||state.ev==='mist'||state.ev==='rain'||state.climate==='pantano';lightBeam.material.opacity=.14+.06*Math.sin(simTime*3)}

// crossbowmen on the battlements: volleys of bolts at enemies close to the main wall
const BOLT_MAT=new THREE.LineBasicMaterial({color:0xfff6e0,transparent:true,opacity:.9});const bolts=[];let boltAcc=0;
function crossbowTick(dt){for(let i=bolts.length-1;i>=0;i--){const b=bolts[i];b.t-=dt;b.l.material.opacity=Math.max(0,b.t/.18);if(b.t<=0){scene.remove(b.l);b.l.geometry.dispose();bolts.splice(i,1)}}
  const lv=state.ups.crossbow||0;if(!lv||state.phase!=='wave')return;boltAcc+=dt;if(boltAcc<1.5)return;boltAcc=0;
  const near=enemies.filter(e=>!e.dead&&Math.abs(Math.max(Math.abs(e.pos.x-CX),Math.abs(e.pos.z-CZ))-WR)<14);if(!near.length)return;
  for(let k=0;k<lv*2;k++){const e=near[(Math.random()*near.length)|0];const dx=e.pos.x-CX,dz=e.pos.z-CZ;const m=Math.max(Math.abs(dx),Math.abs(dz))||1;const sx=CX+dx/m*WR,sz=CZ+dz/m*WR,sy=GY+(state.wallH||7)+.5;
    dmgEnemy(e,(8+state.wave*1.6)*state.dmgMul,false);const g=new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(sx,sy,sz),new THREE.Vector3(e.pos.x,e.group.position.y+.8,e.pos.z)]);const l=new THREE.Line(g,BOLT_MAT.clone());scene.add(l);bolts.push({l,t:.18})}
  if(SFX.pop)SFX.pop()}

// allied dragon (Wonder): circles the citadel, every 4 s dives a cone of fire on the densest enemy cluster
let dragon=null;
function makeDragon(){const g=new THREE.Group();const c=0x3fae6a;box(1.2,.9,3,c,0,0,0,g);const h=box(.9,.8,1.1,c,0,.3,1.9,g);box(.5,.3,.6,0xf6d76b,0,.05,2.5,g);for(const s of[-1,1]){box(.12,.5,.12,0xf6f1ff,s*.3,.85,1.9,g)}box(.4,.4,2,shadeHex(c,-.15),0,.1,-2.3,g);
  const wings=[];for(const s of[-1,1]){const w=new THREE.Group();w.position.set(s*.6,.3,0);const m=box(3,.12,1.8,0x2f8a55,s*1.5,0,0,w);g.add(w);wings.push(w)}g.scale.setScalar(1.3);scene.add(g);const sh=new THREE.Mesh(new THREE.CircleGeometry(2.6,20),new THREE.MeshBasicMaterial({color:0x000000,transparent:true,opacity:.22,depthWrite:false}));sh.rotation.x=-Math.PI/2;sh.scale.set(1,1.6,1);scene.add(sh);return{g,wings,a:0,cd:3,sh,perch:0,hp:1,down:0,claw:0}}
const _dhurt=new THREE.Color(0xd8342c);function dragonTick(dt){if(!state.ups.dragon){if(dragon){scene.remove(dragon.g);scene.remove(dragon.sh);dragon=null}return}if(!dragon)dragon=makeDragon();const D=dragon;if(state.phase!=='wave'){D.hp=Math.min(1,D.hp+dt*.05);D.down=0}const rest=state.phase!=='wave'||D.down>0;D.perch+=((rest?1:0)-D.perch)*Math.min(1,dt*.8);D.a+=dt*.35*(1-D.perch);const R=30,fx=CX+Math.cos(D.a)*R,fz=CZ+Math.sin(D.a)*R,fy=GY+13+Math.sin(simTime*1.3)*1.2;const px=CX+.5,pz=CZ+.5,py=GY+KH+2.2;const x=fx+(px-fx)*D.perch,z=fz+(pz-fz)*D.perch;D.g.position.set(x,fy+(py-fy)*D.perch,z);D.g.rotation.y=-D.a;D.sh.position.set(x,surf(x,z)+.05,z);D.sh.rotation.z=D.a;D.sh.visible=D.perch<.9;
  for(const [k,w] of D.wings.entries())w.rotation.z=(k?-1:1)*(D.perch>.9?.9:Math.sin(simTime*6)*.5);if(state.phase!=='wave')return;if(D.down>0){D.down-=dt;D.hp=Math.min(1,D.hp+dt*.02);if(D.down<=0)toast('🐲 O dragão volta aos céus!','r2');return}const Y=D.g.position.y;D.claw-=dt;let nf=null,nd=7;for(const e of enemies){if(e.dead||e.type!=='flyer')continue;const d=Math.hypot(e.pos.x-x,e.pos.z-z);if(d<22&&d>.8){const st=Math.min(d-.8,e.speed*dt*1.6);e.pos.x+=(x-e.pos.x)/d*st;e.pos.z+=(z-e.pos.z)/d*st}if(d<4)D.hp-=e.T.dmg*dt*.005*(1+state.wave*.02);if(d<nd){nd=d;nf=e}}if(nf&&D.claw<=0){D.claw=1.1;dmgEnemy(nf,(30+state.wave*5)*state.dmgMul,true)}window.__dhp=D.hp;if(!D.mats){D.mats=[];D.g.traverse(o=>{if(o.material&&o.material.color.getHex()===0x3fae6a){o.material=o.material.clone();D.mats.push(o.material)}})}for(const mt of D.mats)mt.color.setHex(0x3fae6a).lerp(_dhurt,(1-D.hp)*.8);window.__dfly=[enemies.filter(e=>!e.dead&&e.type==='flyer').length,+(nd).toFixed(1)];if(D.hp<=0){D.hp=0;D.down=25;toast('🐲 Os voadores derrubaram o dragão! Ele se recolhe na torre por 25 s.','r3');return}D.cd-=dt;if(D.cd>0)return;D.cd=4;
  let best=null,bs=0;for(const e of enemies){if(e.dead)continue;let n=0;for(const o of enemies)if(!o.dead&&Math.abs(o.pos.x-e.pos.x)<5&&Math.abs(o.pos.z-e.pos.z)<5)n++;if(n>bs&&Math.hypot(e.pos.x-x,e.pos.z-z)<45){bs=n;best=e}}if(!best)return;
  const tx=best.pos.x,tz=best.pos.z;for(let k=0;k<26;k++){const f=k/26;spawnFlame(x+(tx-x)*f+rnd(-1,1)*f*2,D.g.position.y+(best.gy+.5-D.g.position.y)*f,z+(tz-z)*f+rnd(-1,1)*f*2,1.2)}
  for(const e of enemies)if(!e.dead&&Math.hypot(e.pos.x-tx,e.pos.z-tz)<5){dmgEnemy(e,(40+state.wave*7)*state.dmgMul,true);if(e.type!=='imp'&&e.type!=='titan')e.afire=Math.max(e.afire||0,3)}if(SFX.boom)SFX.boom(false)}

// v0.93 veteranos: soldados ganham patente por abates
const VET=[[20,'Veterano','🎖️',0xc9902a],[50,'Lenda','🌟',0xffb800]];
function vetCrest(m){if(m.crest){m.group.remove(m.crest)}if(!m.rank)return;const V=VET[m.rank-1];m.crest=box(.3,.3,.3,V[3],0,1.95,0,m.group);m.crest.rotation.set(.6,.785,0)}
function vetKill(m){if(!m||m.dead||m.hero||!minions.includes(m))return;m.kills=(m.kills||0)+1;const nr=VET.filter(v=>m.kills>=v[0]).length;if(nr>(m.rank||0)){m.rank=nr;const V=VET[nr-1];recompute(m);m.hp=m.maxhp;vetCrest(m);toast(`${V[2]} ${m.name} virou ${V[1]} (${m.kills} abates): +${nr>1?35:15}% vida e ataque.`,'r2');if(SFX.chime)SFX.chime()}}
function vetRestore(m){if(m.hero)return;m.rank=VET.filter(v=>(m.kills||0)>=v[0]).length;if(m.rank){recompute(m);vetCrest(m)}}

// v0.94 contratos de horda: objetivo bônus opcional a cada horda
const CONTRACTS=[
 {id:'rapido',ico:'⏱️',d:c=>`Vença em até ${c.goal} s`,goal:w=>Math.round(35+w*3.5),ok:c=>simTime-c.t0<=c.goal,m:1},
 {id:'intocado',ico:'🛡️',d:()=>'Nenhum inimigo acerta o baú',goal:()=>0,ok:c=>!c.hit,m:1.2},
 {id:'semferidos',ico:'❤️',d:c=>c.goal?`No máximo ${c.goal} minion${c.goal>1?'s':''} ferido${c.goal>1?'s':''}`:'Nenhum minion ferido',goal:w=>Math.floor(w/8),ok:c=>state.wwound<=c.goal,m:1},
 {id:'tropa',ico:'⚔️',d:c=>`Soldados abatem ${c.goal} inimigos`,goal:w=>Math.round(4+w*.6),ok:c=>(c.sol||0)>=c.goal,m:1.1},
 {id:'elite',ico:'💍',d:c=>`Abata ${c.goal} elites`,goal:w=>Math.max(2,Math.floor(w/4)),ok:c=>(c.el||0)>=c.goal,m:1.3,min:10},
];
function offerContract(){state.contract=null;const w=state.wave;if(w<3||w%5===0||state.ev==='siege')return;const pool=CONTRACTS.filter(C=>!C.min||w>=C.min);const C=pick(pool);state.contract={id:C.id,goal:C.goal(w),t0:simTime};toast(`📜 Contrato da horda: ${C.ico} ${C.d(state.contract)} → +${contractPay(C)} material`,'r1')}
function contractPay(C){return Math.round((18+state.wave*3)*C.m*(1+Math.min(4,state.conStreak||0)*.15))}
function resolveContract(){const c=state.contract;state.contract=null;if(!c)return'';const C=CONTRACTS.find(x=>x.id===c.id);if(!C)return'';const ok=C.ok(c);state.contractsDone=(state.contractsDone||0)+(ok?1:0);if(ok){const p=contractPay(C);state.conStreak=(state.conStreak||0)+1;state.material+=p;addFame(5);return`<div>📜 Contrato cumprido: ${C.ico} ${C.d(c)} · <b>+${p}</b> material${state.conStreak>=2?` · 🔥 sequência ${state.conStreak} (+${Math.min(4,state.conStreak)*15}% no próximo)`:''}</div>`}const lost=state.conStreak||0;state.conStreak=0;return`<div style="opacity:.7">📜 Contrato perdido: ${C.ico} ${C.d(c)}${lost>=2?` · sequência de ${lost} quebrada`:''}</div>`}
window.__contract=()=>state.contract?{...state.contract}:null;
window.__cdone=()=>state.contractsDone||0;

// v0.95 chip do contrato no HUD
const CPROG={rapido:c=>{const r=Math.ceil(c.goal-(simTime-c.t0));return r>=0?`${r} s`:'tempo esgotado'},intocado:c=>c.hit?'baú atingido':'baú ok',semferidos:c=>`${state.wwound}/${c.goal} feridos`,tropa:c=>`${c.sol||0}/${c.goal}`,elite:c=>`${c.el||0}/${c.goal}`};
let _conT=0,_conH='';function contractTick(dt){_conT-=dt;if(_conT>0)return;_conT=.25;const el=$('conSt');const c=state.contract;if(!c||state.phase!=='wave'){if(!el.hidden)el.hidden=true;return}const C=CONTRACTS.find(x=>x.id===c.id);if(!C)return;const ok=C.ok(c),fail=(c.id==='intocado'&&c.hit)||(c.id==='semferidos'&&state.wwound>c.goal)||(c.id==='rapido'&&simTime-c.t0>c.goal);const h=`📜 ${C.ico} ${CPROG[c.id](c)}${fail?' ✗':ok&&(c.id==='tropa'||c.id==='elite')?' ✓':''}${(state.conStreak||0)>=2?` 🔥${state.conStreak}`:''}`;if(h!==_conH){_conH=h;el.textContent=h;el.title=C.d(c);el.style.color=fail?'#e0564f':ok?'var(--r1)':''}if(el.hidden)el.hidden=false}

// v1.0 climas: os antigos biomas viram eventos que chegam e vão embora durante a partida
const CLIM_NAMES={campo:'Estação fértil',deserto:'Onda de calor',neve:'Inverno rigoroso',vulcao:'Despertar vulcânico',pantano:'Bruma do pântano'};
function climateWave(){if(state.climate){state.climateLeft=(state.climateLeft||1)-1;if(state.climateLeft<=0){const B=BIOMES[state.climate];if(state.climate==='neve')thawIce();toast(`${B.ico} ${CLIM_NAMES[state.climate]} terminou.`,'r1');state.lastClimate=state.climate;state.climate=null}return}
  if(state.wave<4||Math.random()>.35)return;const ks=Object.keys(BIOMES).filter(k=>k!==state.lastClimate);const k=pick(ks);state.climate=k;state.climateLeft=rint(3,5);const B=BIOMES[k];if(k==='neve')freezeWater();toast(`${B.ico} Clima: ${CLIM_NAMES[k]} por ${state.climateLeft} hordas — ${B.rule}`,'r3',true)}
function freezeWater(){let n=0;for(let x=1;x<W-1;x++)for(let z=1;z<D-1;z++){const i=idx(x,GY-1,z);if(FLUID(vox[i])&&!blue[i]){setVox(i,18);n++}}state.frozeN=n}
function thawIce(){for(let x=1;x<W-1;x++)for(let z=1;z<D-1;z++){const i=idx(x,GY-1,z);if(vox[i]===18&&!blue[i]){setVox(i,0);setFluid(i,9,4,true)}}}
let _climH='';function climUi(){const el=$('climSt');if(!el)return;const k=state.climate;if(!k){if(!el.hidden)el.hidden=true;return}const B=BIOMES[k];const h=`${B.ico} ${CLIM_NAMES[k]} · ${state.climateLeft}`;if(h!==_climH){_climH=h;el.textContent=h;el.title=`${CLIM_NAMES[k]}: ${B.rule} (mais ${state.climateLeft} horda${state.climateLeft>1?'s':''})`}if(el.hidden)el.hidden=false}
window.__clim=k=>{if(k){state.climate=k;state.climateLeft=3;if(k==='neve')freezeWater()}return [state.climate,state.climateLeft,state.frozeN]};

// v1.2 chefes: aparência, fases e golpes telegrafados
function bossLook(type,sc,col,g,body,head){const p=body.geometry.parameters,bw=p.width*body.scale.x,bh=p.height*body.scale.y,bd=p.depth*body.scale.z;const by=body.position.y,bz=body.position.z;
  const metal=0x3a3f55,bone=0xf1e6c8,dk=shadeHex(col,-.35);
  for(const s of[-1,1]){const pl=box(.18*bw,bh*.7,bd*.7,metal,s*(bw*.5+.06*bw),by,bz,g);pl.rotation.z=s*.08}
  const n=Math.max(3,Math.round(bd/.6));for(let k=0;k<n;k++){const sp=box(.14*bw,.22*bh+.1*bh*(k%2),.14*bw,k%2?bone:dk,0,by+bh*.55+.06*bh*(k%2),bz-bd*.4+bd*.8*k/(n-1),g);sp.rotation.x=-.25}
  if(head&&head.geometry.parameters){const hp=head.geometry.parameters,hw=hp.width*head.scale.x,hh=hp.height*head.scale.y,hd2=hp.depth*head.scale.z;
    if(type!=='queen'&&type!=='mistking'){for(const s of[-1,1]){const h1=box(.16*hw,.5*hh,.16*hw,bone,s*hw*.42,hh*.55,-hd2*.05,head);h1.rotation.z=-s*.5;const h2=box(.12*hw,.35*hh,.12*hw,bone,s*hw*.62,hh*.95,-hd2*.05,head);h2.rotation.z=-s*.9}}
    for(const s of[-1,1]){const ey=box(.2*hw,.11*hh,.05,0xff3b3b,s*hw*.22,hh*.08,hd2*.52,head);ey.material.emissive.setHex(0xff2020);ey.material.emissiveIntensity=1.2}
    box(.6*hw,.08*hh,.06,0x1d1f33,0,-hh*.22,hd2*.52,head)}}
function bossTint(e){const k=e.ph-1;const col=k===1?0xff7a2a:0xff2050;for(const im of e.vmeshes){im.material.emissive.setHex(col);im.material.emissiveIntensity=.18+k*.14;im.userData.em=col}}
function bossPhase(e,n){e.ph=n;e.speed*=1.15;e.T={...e.T,dmg:e.T.dmg*1.2,rate:e.T.rate*.88};bossTint(e);shake=Math.max(shake,.9);hitstop=Math.max(hitstop,.12);
  label({x:e.pos.x,y:e.group.position.y+e.sc*2.2,z:e.pos.z},n===2?'FASE 2!':'FÚRIA!','#ff4a5a');toast(`${e.T.n} ${n===2?'se enfurece':'entra em fúria final'} — fase ${n}!`,'r3');
  const r=new THREE.Mesh(new THREE.RingGeometry(.8,1.3,40),ringMat.clone());r.rotation.x=-Math.PI/2;r.position.set(e.pos.x,e.gy+.15,e.pos.z);scene.add(r);rings.push({m:r,t:0});
  bossSummon(e,1+n);e.mv=null;e.mvT=1.2;if(state.boss===e)showBoss(e);SFX.boom&&SFX.boom(true)}
const BOSS_ADD={boss:'crawler',colossus:'brute',queen:'flyer',titan:'imp',golem:'beetle',wyrm:'imp',necro:'crawler',mistking:'wolf'};
function bossSummon(e,k){if(enemies.filter(o=>!o.dead).length>160)return;const t=BOSS_ADD[e.type]||'crawler';for(let i=0;i<k;i++){const a=rnd(0,Math.PI*2),r=e.radius+2;const s=makeEnemy(t,rollRarity(state.wave*.004),e.pos.x+Math.cos(a)*r,e.pos.z+Math.sin(a)*r);s.viaWall=true;markGround(s.pos.x,s.pos.z,1.2,0xb56cf2,.6)}}
const _lineMat=()=>new THREE.MeshBasicMaterial({color:0xff3355,transparent:true,opacity:.6,side:THREE.DoubleSide,depthWrite:false});
function markLine(x,z,ang,len,w,t){const m=new THREE.Mesh(new THREE.PlaneGeometry(w,len),_lineMat());m.rotation.x=-Math.PI/2;m.rotation.z=-ang;m.position.set(x+Math.sin(ang)*len/2,Math.min(topY(x,z),GY+12)+.08,z+Math.cos(ang)*len/2);scene.add(m);marks.push({m,t,T:t,line:true})}
function bossMovePick(e){const dC=Math.hypot(CHEST.x-e.pos.x,CHEST.z-e.pos.z);const o=[];
  const near=minions.some(m=>!m.wounded&&hd(m.pos,e.pos)<8)||turrets.some(t=>t.alive&&t.team!=='r'&&hd(t.pos,e.pos)<9)||dC<WR+6;
  if(!e.fly&&near)o.push('slam','slam');if(!e.fly&&dC>8&&dC<44)o.push('charge');o.push('volley');if(e.ph>=2)o.push('summon');if(e.type==='arauto'){o.push('meteor','void');if(e.ph>=2)o.push('blink')}if(e.ph>=3&&!e.fly)o.push('slam','charge');return pick(o)}
function bossAI(e,dt){const f=e.hp/e.maxhp;if(e.ph<2&&f<.66)bossPhase(e,2);else if(e.ph<3&&f<.33)bossPhase(e,3);
  if(!e.mv){e.mvT-=dt;if(e.mvT>0||state.phase!=='wave')return false;const k=bossMovePick(e);e.mvT=Math.max(2.6,7.2-e.ph*1.3-Math.min(1.5,state.wave*.03));
    if(k==='volley'){const n=2+e.ph;const tg=turrets.filter(t=>t.alive&&t.team!=='r'&&hd(t.pos,e.pos)<50);for(let i=0;i<n;i++){const t=tg.length?pick(tg).pos:{x:CHEST.x+rnd(-9,9),z:CHEST.z+rnd(-9,9)};setTimeout(()=>{if(!e.dead)throwRock(e,t.x+rnd(-1.5,1.5),t.z+rnd(-1.5,1.5),2,(24+state.wave*2.5)*(1+.15*e.ph),e.type==='titan'||e.type==='wyrm'?0xff7a2a:0x6b5a7a,e.type==='titan'||e.type==='wyrm')},i*260)}label({x:e.pos.x,y:e.group.position.y+e.sc*2,z:e.pos.z},'rajada!','#ffb13d');return false}
    if(k==='meteor'){const n=5+e.ph*2;for(let i=0;i<n;i++)setTimeout(()=>{if(!e.dead)throwRock(e,CHEST.x+rnd(-WR+2,WR-2),CHEST.z+rnd(-WR+2,WR-2),2.6,(40+state.wave*3)*(1+.15*e.ph),0xc86cff,true)},i*180);label({x:e.pos.x,y:e.group.position.y+e.sc*2,z:e.pos.z},'☄️ chuva do abismo!','#c86cff');return false}
    if(k==='void'){ringFx(e.pos.x,e.gy+1,e.pos.z,14,0xa040ff);for(const m of minions){if(m.wounded)continue;const dx=e.pos.x-m.pos.x,dz=e.pos.z-m.pos.z,d=Math.hypot(dx,dz);if(d<16&&d>1){const k2=Math.min(3,d-1);m.pos.x+=dx/d*k2;m.pos.z+=dz/d*k2;hurtMinion(m,(14+state.wave*1.2)*(1+.15*e.ph),e)}}label({x:e.pos.x,y:e.group.position.y+e.sc*2,z:e.pos.z},'🌀 vazio!','#a040ff');shake=Math.max(shake,.5);return false}
    if(k==='blink'){for(let i=0;i<16;i++)spawnDebris(e.pos.x,e.gy+2,e.pos.z,0x2a1438,1,.5);const a=rnd(0,Math.PI*2),r=rnd(WR+4,WR+10);e.pos.x=clamp(CX+Math.cos(a)*r,4,W-5);e.pos.z=clamp(CZ+Math.sin(a)*r,4,D-5);e.gy=surfE(e.pos.x,e.pos.z);e.group.position.y=e.gy;e.path=null;bossSummon(e,2);label({x:e.pos.x,y:e.gy+e.sc*2,z:e.pos.z},'⚡ teleporte!','#c86cff');return false}
    if(k==='summon'){bossSummon(e,2+e.ph);label({x:e.pos.x,y:e.group.position.y+e.sc*2,z:e.pos.z},'invocação!','#b56cf2');return false}
    if(k==='slam'){const R=5.5+e.ph*.8;e.mv={k,t:1.25-e.ph*.12,R,y0:e.group.position.y};markGround(e.pos.x,e.pos.z,R,0xff3355,e.mv.t);SFX.whoosh&&SFX.whoosh();return true}
    if(k==='charge'){const ang=Math.atan2(CHEST.x-e.pos.x,CHEST.z-e.pos.z);const len=Math.min(Math.hypot(CHEST.x-e.pos.x,CHEST.z-e.pos.z)-2,15+e.ph*2);e.mv={k,t:1.05-e.ph*.1,ang,len,dash:0,hit:new Set()};markLine(e.pos.x,e.pos.z,ang,len,e.radius*2+.6,e.mv.t);e.group.rotation.y=ang;return true}
    return false}
  const M=e.mv;M.t-=dt;
  if(M.k==='slam'){if(M.t>0){e.group.position.y=M.y0+Math.max(0,Math.sin((1-M.t/1.25)*Math.PI))*1.6;return true}
    e.group.position.y=M.y0;const R=M.R,dmg=(30+state.wave*2.8)*(1+.2*e.ph);shake=Math.max(shake,1.1);hitstop=Math.max(hitstop,.08);SFX.boom&&SFX.boom(true);
    const r=new THREE.Mesh(new THREE.RingGeometry(.8,1.3,40),ringMat.clone());r.rotation.x=-Math.PI/2;r.position.set(e.pos.x,e.gy+.15,e.pos.z);r.scale.setScalar(R*.6);scene.add(r);rings.push({m:r,t:0});
    for(let dx=-Math.ceil(R);dx<=Math.ceil(R);dx++)for(let dz=-Math.ceil(R);dz<=Math.ceil(R);dz++){const d=Math.hypot(dx,dz);if(d>R)continue;const x=Math.floor(e.pos.x)+dx,z=Math.floor(e.pos.z)+dz;for(let y=GY-1;y<GY+3;y++)if(inb(x,y,z)&&vox[idx(x,y,z)])damageVox(idx(x,y,z),dmg*.9*(1-d/(R+1)),'enemy',e)}
    for(const m of minions)if(!m.wounded&&hd(m.pos,e.pos)<R)hurtMinion(m,dmg*.7,e);for(const t of turrets)if(t.alive&&t.team!=='r'&&hd(t.pos,e.pos)<R)damageTurret(t,dmg*1.2);
    for(let k=0;k<14;k++){const a=k/14*Math.PI*2;spawnDebris(e.pos.x+Math.cos(a)*R*.8,e.gy+.4,e.pos.z+Math.sin(a)*R*.8,0x8a7a6a,1,.35)}e.mv=null;return true}
  if(M.k==='charge'){if(M.t>0){e.group.rotation.z=Math.sin(M.t*40)*.05;return true}e.group.rotation.z=0;const sp=(18+e.ph*3)*dt;M.dash+=sp;const x=e.pos.x+Math.sin(M.ang)*sp,z=e.pos.z+Math.cos(M.ang)*sp;
    let blocked=false;const fx=Math.floor(x+Math.sin(M.ang)*e.radius),fz=Math.floor(z+Math.cos(M.ang)*e.radius);for(let y=Math.floor(e.gy);y<Math.floor(e.gy)+3;y++)if(inb(fx,y,fz)&&SOLIDM(vox[idx(fx,y,fz)])){damageVox(idx(fx,y,fz),(90+state.wave*7)*(1+.2*e.ph),'enemy',e);blocked=true}
    if(!blocked){e.pos.x=x;e.pos.z=z;e.gy=surfE(x,z);e.group.position.y=e.gy}if(Math.random()<.6)spawnDebris(e.pos.x,e.gy+.2,e.pos.z,0x8a7a6a,1,.25);
    for(const m of minions)if(!m.wounded&&!M.hit.has(m)&&hd(m.pos,e.pos)<e.radius+1){M.hit.add(m);hurtMinion(m,(26+state.wave*2.4)*(1+.2*e.ph),e)}
    if(M.dash>=M.len||blocked&&Math.random()<dt*3){shake=Math.max(shake,.6);e.mv=null;e.stun=Math.max(e.stun||0,.6)}return true}
  e.mv=null;return false}
window.__bossX=(t,m)=>{const e=makeEnemy(t||'boss',1,CX+30,CZ+6);if(m){e.maxhp*=m;e.hp=e.maxhp}showBoss(e);return [e.type,Math.round(e.maxhp)]};
window.__bossSt=()=>{const e=enemies.find(o=>!o.dead&&o.boss2);return e?{ph:e.ph,mv:e.mv&&e.mv.k,hp:+(e.hp/e.maxhp).toFixed(2)}:null};
window.__hitBoss=f=>{const e=enemies.find(o=>!o.dead&&o.boss2);if(e)dmgEnemy(e,e.maxhp*f,true);return e?e.hp/e.maxhp:0};
window.__bpos=()=>{const e=enemies.find(o=>!o.dead&&o.boss2);return e?{x:e.pos.x,z:e.pos.z}:{x:CX,z:CZ}};

// v1.3 templates de castelo: trocar o estilo faz os reparadores demolirem e construírem bloco por bloco
function finishBlue(arr,put){const G=y=>GY+y;
  // corredor sul: porta em toda muralha no eixo do portão até o baú
  for(let z=CZ+2;z<=Math.min(D-2,CZ+WR+7);z++)for(let x=CX-2;x<=CX+1;x++){for(let y=0;y<4;y++){const i=idx(x,G(y),z);if(arr[i]&&arr[i]!==5)arr[i]=z>WB-WT?7:(z>CZ+4?7:0)}}
  for(let x=CX-2;x<=CX+2;x++)for(let z=CZ-2;z<=CZ+2;z++)for(let y=0;y<4;y++)arr[idx(x,G(y),z)]=0;
  for(let x=CX-1;x<=CX+1;x++)for(let z=CZ-1;z<=CZ+1;z++){for(let y=0;y<2;y++)arr[idx(x,G(y),z)]=5;arr[idx(x,G(2),z)]=0}
  for(const [ox,oz] of OUTPOSTS)for(let dx=-2;dx<=2;dx++)for(let dz=-2;dz<=2;dz++){for(let y=0;y<4;y++)put(ox+dx,G(y),oz+dz,3);put(ox+dx,G(4),oz+dz,2);if((Math.abs(dx)===2||Math.abs(dz)===2)&&((dx+dz)&1))put(ox+dx,G(5),oz+dz,2)}
  const anc=[...TOWER_ANCHORS,...KEEP_ANCHORS,...(typeof MID_ANCHORS==='function'?MID_ANCHORS():[])];for(const a of anc){const x=ix(a),y=iy(a),z=iz(a);for(let yy=GY;yy<=y;yy++)if(!arr[idx(x,yy,z)])arr[idx(x,yy,z)]=6;for(let yy=y+1;yy<=Math.min(H-1,y+4);yy++)arr[idx(x,yy,z)]=0}}
function _cb(put){const G=y=>GY+y;const o={
  fill(x0,x1,y0,y1,z0,z1,m){for(let x=x0;x<=x1;x++)for(let z=z0;z<=z1;z++)for(let y=y0;y<=y1;y++)put(x,G(y),z,typeof m==='function'?m(x,y,z):m)},
  sqWall(r,t,h,m,top){for(let x=CX-r;x<=CX+r;x++)for(let z=CZ-r;z<=CZ+r;z++){const d=Math.max(Math.abs(x-CX),Math.abs(z-CZ));if(d>r||d<=r-t)continue;for(let y=0;y<h;y++)put(x,G(y),z,typeof m==='function'?m(y):m);if((x+z)&1)put(x,G(h),z,top||m)}},
  tower(x,z,s,h,m,roof,ban){o.fill(x,x+s-1,0,h-1,z,z+s-1,m);for(let k=0;roof&&k<Math.ceil(s/2)+1;k++)o.fill(x-1+k,x+s-k,h+k,h+k,z-1+k,z+s-k,roof);if(ban){const c=Math.floor(s/2);put(x+c,G(h+Math.ceil(s/2)+1),z+c,23);put(x+c,G(h+Math.ceil(s/2)+2),z+c,23)}},
  crown(x,z,s,h,m){for(let a=x;a<x+s;a++)for(let b=z;b<z+s;b++)if((a===x||a===x+s-1||b===z||b===z+s-1)&&((a+b)&1))put(a,G(h),b,m)},
  round(cx,cz,r,y0,y1,m,shell){for(let x=cx-r;x<=cx+r;x++)for(let z=cz-r;z<=cz+r;z++){const d=Math.hypot(x-cx,z-cz);if(d>r+.4)continue;if(shell&&d<r+.4-shell)continue;for(let y=y0;y<=y1;y++)put(x,G(y),z,m)}},
  cone(cx,cz,r,y0,m){for(let k=0;k<=r;k++)o.round(cx,cz,r-k,y0+k,y0+k,m)},
  keep(kr,kh,m,floor){for(let x=CX-kr;x<=CX+kr;x++)for(let z=CZ-kr;z<=CZ+kr;z++){const sh=x<=CX-kr+1||x>=CX+kr-1||z<=CZ-kr+1||z>=CZ+kr-1;for(let y=0;y<kh;y++){const win=sh&&(y%4===3)&&((x+z)%3===0);if(sh&&!win)put(x,G(y),z,m);else if(!sh&&y>0&&y%6===0&&(Math.abs(x-CX)>1||Math.abs(z-CZ)>1))put(x,G(y),z,floor||3)}put(x,G(kh-1),z,m);if((x===CX-kr||x===CX+kr||z===CZ-kr||z===CZ+kr)&&((x+z)&1))put(x,G(kh),z,m)}}};return o}
const CASTLES={
  classico:{ico:'🏰',n:'Clássico',d:'A cidadela de sempre: muralha, quatro torres e torre de menagem com pináculos.',b(){}},
  colossal:{ico:'🏯',n:'Cidadela Colossal',d:'Duas muralhas concêntricas, oito torres com telhados e uma torre de menagem com grande pináculo central.',b(put){const c=_cb(put);
    c.sqWall(WR,WT,10,y=>y<6?3:24,24);c.sqWall(11,2,13,y=>y<8?3:24,4);
    for(const [x,z] of TOWERS)c.tower(x,z,TS,TOWER_H,6);
    for(const [x,z] of [[CX-12,CZ-12],[CX+9,CZ-12],[CX-12,CZ+9],[CX+9,CZ+9]])c.tower(x,z,4,17,24,22,true);
    for(const [x,z] of [[CX-2,CZ-WR],[WA,CZ-2],[WB-3,CZ-2]])c.fill(x,x+3,0,TOWER_H-1,z,z+3,6);
    c.keep(KR,KH,3,3);for(const [dx,dz] of [[-KR,-KR],[KR-2,-KR],[-KR,KR-2],[KR-2,KR-2]])c.tower(CX+dx,CZ+dz,3,KH+6,24,22,true);
    c.fill(CX-1,CX+1,KH,KH+8,CZ-1,CZ+1,24);c.cone(CX,CZ,2,KH+9,22);put(CX,GY+KH+12,CZ,23);put(CX,GY+KH+13,CZ,23)}},
  zigurate:{ico:'🛕',n:'Zigurate Solar',d:'Pirâmide escalonada de obsidiana e ouro, coroada por um obelisco de cristal; obeliscos nos cantos.',b(put){const c=_cb(put);
    c.sqWall(WR,WT,6,14,27);for(const [x,z] of TOWERS){c.tower(x,z,TS,TOWER_H,14);c.crown(x,z,TS,TOWER_H,27)}
    for(const [x,z] of [[CX-2,CZ-WR],[WA,CZ-2],[WB-3,CZ-2]])c.fill(x,x+3,0,TOWER_H-1,z,z+3,14);
    const L=[[12,0,2],[10,0,5],[8,0,8],[6,0,11],[5,0,14]];for(const [r,y0,y1] of L)for(let x=CX-r;x<=CX+r;x++)for(let z=CZ-r;z<=CZ+r;z++){const d=Math.max(Math.abs(x-CX),Math.abs(z-CZ));if(d<r-1)continue;for(let y=y0;y<=y1;y++)put(x,GY+y,z,d===r&&y===y1?27:(y===y1-1&&d===r?24:14))}
    c.fill(CX-4,CX+4,14,14,CZ-4,CZ+4,14);c.fill(CX-1,CX+1,15,17,CZ-1,CZ+1,15);c.fill(CX,CX,18,24,CZ,CZ,27);put(CX,GY+25,CZ,15);
    for(const [x,z] of [[CX-15,CZ-15],[CX+15,CZ-15],[CX-15,CZ+15],[CX+15,CZ+15]]){c.fill(x,x,0,13,z,z,14);put(x,GY+14,z,27);put(x,GY+15,z,15)}}},
  agulhas:{ico:'⛪',n:'Agulhas Góticas',d:'Muralha de pedra negra, um anel de doze agulhas ligadas por arcos e uma catedral com campanário gigante.',b(put){const c=_cb(put);
    c.sqWall(WR,WT,8,24,24);for(const [x,z] of TOWERS){c.tower(x,z,TS,TOWER_H,24);const ox=x<CX?x-2:x+TS,oz=z<CZ?z-2:z+TS;c.tower(ox,oz,2,20,24,22,false)}
    for(const [x,z] of [[CX-2,CZ-WR],[WA,CZ-2],[WB-3,CZ-2]])c.fill(x,x+3,0,TOWER_H-1,z,z+3,24);
    const P=[];for(let k=0;k<12;k++){const a=k/12*Math.PI*2+.13;const x=Math.round(CX+Math.cos(a)*12),z=Math.round(CZ+Math.sin(a)*12);if(z>CZ+8&&Math.abs(x-CX)<4)continue;P.push([x,z]);c.tower(x,z,2,k%2?18:23,24,22,k%3===0)}
    for(let k=0;k<P.length;k++){const [x1,z1]=P[k],[x2,z2]=P[(k+1)%P.length];const n=Math.max(Math.abs(x2-x1),Math.abs(z2-z1));for(let t=0;t<=n;t++){const x=Math.round(x1+(x2-x1)*t/n),z=Math.round(z1+(z2-z1)*t/n);put(x,GY+11,z,3);put(x,GY+12,z,24)}}
    c.keep(KR,KH,24,3);c.fill(CX-1,CX+1,KH,KH+8,CZ-KR,CZ-KR+2,24);c.fill(CX-2,CX+2,KH+9,KH+9,CZ-KR-1,CZ-KR+3,22);c.fill(CX-1,CX+1,KH+10,KH+10,CZ-KR,CZ-KR+2,22);put(CX,GY+KH+11,CZ-KR+1,23);put(CX,GY+KH+12,CZ-KR+1,23)}},
  estrela:{ico:'⭐',n:'Forte Estrela',d:'Muralha em estrela de oito pontas com quinas de metal e uma torre redonda gigante com cúpula.',b(put){const c=_cb(put);
    for(let x=CX-WR-5;x<=CX+WR+5;x++)for(let z=CZ-WR-5;z<=CZ+WR+5;z++){const a=Math.atan2(z-CZ,x-CX),d=Math.hypot(x-CX,z-CZ);const r=WR-1+4.2*Math.pow(Math.max(0,Math.cos(4*a)),3);if(Math.abs(d-r)>1.5)continue;for(let y=0;y<9;y++)put(x,GY+y,z,y<5?3:4);if((x+z)&1)put(x,GY+9,z,4)}
    for(const [x,z] of TOWERS)c.tower(x,z,TS,TOWER_H,6);for(const [x,z] of [[CX-2,CZ-WR],[WA,CZ-2],[WB-3,CZ-2]])c.fill(x,x+3,0,TOWER_H-1,z,z+3,6);
    c.round(CX,CZ,7,0,KH-1,3,2);c.round(CX,CZ,7,KH-1,KH-1,3);for(let x=CX-7;x<=CX+7;x++)for(let z=CZ-7;z<=CZ+7;z++){const d=Math.hypot(x-CX,z-CZ);if(d>6.6&&d<7.4&&((x+z)&1))put(x,GY+KH,z,4)}
    c.round(CX,CZ,2,KH,KH+7,24);c.cone(CX,CZ,3,KH+8,22);put(CX,GY+KH+12,CZ,23);put(CX,GY+KH+13,CZ,23)}},
};
function setCastle(id){if(!CASTLES[id]||state.castle===id||(!state.castle&&id==='classico'))return false;const old=blue.slice();state.castle=id;buildBlueprint();reformFrom(old);toast(`${CASTLES[id].ico} Novo estilo: ${CASTLES[id].n}. Os reparadores vão desmontar e montar bloco por bloco.`,'r4');if(typeof renderBuild==='function')renderBuild();return true}
function reformFrom(old){state.demol=state.demol||new Set();state.swapQ=state.swapQ||new Set();let nd=0,ns=0,nb=0;
  for(let i=0;i<N;i++){const o=old[i],b=blue[i],v=vox[i];if(!o&&!b)continue;if(!v||v===5||FLUID(v)){if(b&&!v)nb++;continue}
    if(o&&!b){state.demol.add(i);nd++}else if(b&&v!==b){state.swapQ.add(i);ns++}}
  state.healQ=[];state.reformN=nd+ns+nb;state.reforming=true;return [nd,ns,nb]}
function reformActive(){return !!(state.reforming||(state.demol&&state.demol.size)||(state.swapQ&&state.swapQ.size))}
function reformMul(){return reformActive()?6:1}
// melhor bloco disponível: com Upgrade automático ligado, os reparadores trocam bloco por bloco
const TIER_WAVES=[4,8,13,19];
function autoTierTick(){if(!state.autoUp||reformActive())return;const mw=Math.max(state.maxWave||1,state.wave);const av=TIER_WAVES.filter(w=>mw>=w).length;if(av<=(state.blockTier||0))return;
  const old=blue.slice();state.blockTier=(state.blockTier||0)+1;buildBlueprint();const r=reformFrom(old);toast(`🧱 Bloco melhor disponível: ${MAT[tierMat(3)].n}. Os reparadores trocam ${r[1]} blocos, um por um.`,'r4')}
let _refT=0;function reformTick(dt){_refT-=dt;if(_refT>0)return;_refT=1;autoTierTick();let miss=0;if(state.reforming){for(const i of blueList){const b=blue[i];if(b&&b!==5&&vox[i]!==b&&!FLUID(vox[i]))miss++}}
  const n=(state.demol?state.demol.size:0)+(state.swapQ?state.swapQ.size:0)+miss;if(state.reforming&&!n){state.reforming=false;toast('🏰 Obra concluída: a cidadela está no novo estilo.','r4')}
  crewTick(n);const el=$('refSt');if(!el)return;if(!n){if(!el.hidden)el.hidden=true;return}el.hidden=false;el.textContent=`🔨 ${n}`;el.title=`Obra na cidadela: ${n} blocos para desmontar, trocar ou construir`}
// equipe temporária de pedreiros enquanto há obra grande (some quando acaba)
function crewTick(n){const crew=minions.filter(m=>m.crew);const want=n>40&&state.reforming?Math.min(18,6+Math.floor(n/300)):0;
  if(crew.length<want){for(let k=crew.length;k<want;k++){const m=makeMinion('rep',1,GATE.x+rnd(-1.5,1.5),GATE.z+2+rnd(0,2));m.crew=true;m.name='Pedreiro';m.work*=1.3}}
  else if(crew.length>want){for(const m of crew.slice(want)){releaseTask(m);scene.remove(m.group);const k=minions.indexOf(m);if(k>=0)minions.splice(k,1)}}}
window.__castle=id=>{const ok=setCastle(id);return [ok,state.demol?state.demol.size:0,state.swapQ?state.swapQ.size:0,blueList.length]};
window.__miss=()=>{const o={};let n=0;for(const i of blueList){const b=blue[i];if(b&&b!==5&&vox[i]!==b){n++;const k=`v${vox[i]}b${b}s${supported(i)?1:0}y${iy(i)-GY}`;o[k]=(o[k]||0)+1}}return [n,Object.entries(o).sort((a,b)=>b[1]-a[1]).slice(0,12)]};
window.__ref=()=>[state.demol?state.demol.size:0,state.swapQ?state.swapQ.size:0,blueList.filter(i=>vox[i]!==blue[i]&&blue[i]!==5).length,minions.filter(m=>m.crew).length,state.blockTier||0];

// v1.4 ferramentas de construção: fileira arrastando, altura (− / =), pequenas obras com rotação
const CRAFT={a:null,b:null,cells:[]};
const gInst=new THREE.InstancedMesh(new THREE.BoxGeometry(1.02,1.02,1.02),new THREE.MeshBasicMaterial({color:0xffffff,transparent:true,opacity:.32,depthWrite:false}),900);gInst.count=0;gInst.frustumCulled=false;scene.add(gInst);
function craftH(d){const B=state.build;B.h=clamp((B.h||1)+d,1,12);if(typeof renderBuild==='function')renderBuild();toast(`Altura: ${B.h}`,'r0')}
function craftColumn(i){const o=[];for(let k=0;k<(state.build.h||1);k++){const j=i+k*W*D;if(iy(j)>=H-1)break;o.push(j)}return o}
function craftLine(a,b){const x0=ix(a),z0=iz(a),y=iy(a),x1=ix(b),z1=iz(b);const n=Math.min(48,Math.max(Math.abs(x1-x0),Math.abs(z1-z0)));const o=[];const seen=new Set();for(let t=0;t<=n;t++){const x=Math.round(x0+(x1-x0)*(n?t/n:0)),z=Math.round(z0+(z1-z0)*(n?t/n:0));if(!inb(x,y,z))continue;const i=idx(x,y,z);if(seen.has(i))continue;seen.add(i);o.push(...craftColumn(i))}return o}
const cellFree=i=>(vox[i]===0||(FLUID(vox[i])&&!fluidSrc.has(i)))&&!blue[i]&&!(natBlue&&natBlue[i])&&!turretAt(i-W*D)&&!cellBusy(i);
const _gm=new THREE.Matrix4(),_gc=new THREE.Color();
function ghostCells(list){let n=0;for(const [i,ok] of list){if(n>=900)break;_gm.makeTranslation(ix(i)+.5,iy(i)+.5,iz(i)+.5);gInst.setMatrixAt(n,_gm);gInst.setColorAt(n,_gc.setHex(ok?0x5cc08c:0xec5f6b));n++}gInst.count=n;gInst.instanceMatrix.needsUpdate=true;if(gInst.instanceColor)gInst.instanceColor.needsUpdate=true}
function craftPreview(T){if(!T||!state.build.on){if(gInst.count){gInst.count=0}return}const B=state.build;
  if(T.kind==='prefab'){ghostCells(prefabCells(T.i).map(([i,m])=>[i,cellFree(i)]));return}
  if(T.kind==='place'&&(B.h||1)>1){ghostCells(craftColumn(T.i).map(i=>[i,cellFree(i)]));return}gInst.count=0}
function craftDown(cx,cy){const T=buildTarget(cx,cy);if(!T||T.kind!=='place'){CRAFT.a=null;return}CRAFT.a=T.i;CRAFT.b=T.i;CRAFT.m=T.m}
function craftMove(cx,cy){const T=buildTarget(cx,cy);if(T&&(T.kind==='place')){CRAFT.b=idx(ix(T.i),iy(CRAFT.a),iz(T.i))}const cells=craftLine(CRAFT.a,CRAFT.b);CRAFT.cells=cells;ghostCells(cells.map(i=>[i,cellFree(i)]));ghost.visible=false;const n=cells.filter(cellFree).length;showTip(cx,cy,`Fileira: ${n} blocos de ${MAT[CRAFT.m].n}`,'')}
function craftUp(dragged){const a=CRAFT.a;CRAFT.a=null;if(!dragged){gInst.count=0;return}const cells=CRAFT.cells.length?CRAFT.cells:craftLine(a,CRAFT.b);CRAFT.cells=[];gInst.count=0;placeCells(cells,CRAFT.m)}
function placeCells(cells,m){let n=0;const special=!BASIC_BLOCKS.includes(m);for(const i of cells){if(!cellFree(i))continue;if(special){if(!(state.inv.blocks[m]>0))break;state.inv.blocks[m]--;state.prepaid.add(i)}placeBlue(i,m);n++}
  if(n){SFX.build();toast(`🧱 ${n} bloco${n>1?'s':''} de ${MAT[m].n} na planta — os reparadores constroem`,'r1')}else SFX.hurt();if(special&&!state.inv.blocks[m])state.build.sel=3;if(typeof renderBuild==='function')renderBuild();updateHud();return n}
// pequenas obras (relativas ao bloco mirado; rot gira 90°)
const PREFABS={
  vigia:{ico:'🗼',n:'Torre de vigia',d:'Torre 3×3 de 8 de altura com ameias — ótimo lugar para uma arma.',cells(){const o=[];for(let x=-1;x<=1;x++)for(let z=-1;z<=1;z++){for(let y=0;y<8;y++)o.push([x,y,z,3]);if((x+z)&1)o.push([x,8,z,3])}return o}},
  muro:{ico:'🧱',n:'Muro com ameias',d:'Trecho de muralha 7×2 com 4 de altura e ameias.',cells(){const o=[];for(let x=-3;x<=3;x++)for(let z=0;z<=1;z++){for(let y=0;y<4;y++)o.push([x,y,z,3]);if(z===0&&!(x&1))o.push([x,4,z,3])}return o}},
  bunker:{ico:'🛖',n:'Bunker',d:'Casamata 5×5 de metal, oca, com teto e seteiras.',cells(){const o=[];for(let x=-2;x<=2;x++)for(let z=-2;z<=2;z++){const sh=Math.abs(x)===2||Math.abs(z)===2;for(let y=0;y<3;y++)if(sh&&!(y===1&&(x===0||z===0)))o.push([x,y,z,4]);o.push([x,3,z,4])}return o}},
  ponte:{ico:'🌉',n:'Ponte',d:'Passarela de madeira de 11 blocos sobre pilares de pedra.',cells(){const o=[];for(let x=-5;x<=5;x++){o.push([x,3,0,2]);if(x%5===0)for(let y=0;y<3;y++)o.push([x,y,0,3])}return o}},
  escada:{ico:'🪜',n:'Escadaria',d:'Degraus de pedra subindo 6 blocos.',cells(){const o=[];for(let k=0;k<6;k++)for(let y=0;y<=k;y++)for(let z=0;z<=1;z++)o.push([k,y,z,3]);return o}},
  portal:{ico:'⛩️',n:'Arco',d:'Arco de pedra 5 de largura e 5 de altura com estandartes.',cells(){const o=[];for(const x of[-2,2])for(let y=0;y<5;y++)o.push([x,y,0,3]);for(let x=-2;x<=2;x++)o.push([x,5,0,3]);o.push([-2,6,0,23],[2,6,0,23]);return o}},
  minado:{ico:'💣',n:'Campo minado',d:'Xadrez de minas 5×5 (usa minas do inventário; faltando, vira espinhos ou pedra).',cells(){const o=[];for(let x=-2;x<=2;x++)for(let z=-2;z<=2;z++)if((x+z)%2===0)o.push([x,0,z,17]);return o}},
  barricada:{ico:'🛢️',n:'Barricada de barris',d:'Linha de 7 barris explosivos atrás de um murinho.',cells(){const o=[];for(let x=-3;x<=3;x++){o.push([x,0,0,10]);o.push([x,0,1,3]);o.push([x,1,1,3])}return o}},
};
function prefabCells(i){const P=PREFABS[state.build.pf];if(!P)return[];const r=state.build.rot||0;const x0=ix(i),y0=iy(i),z0=iz(i);const o=[];for(const [dx,dy,dz,m] of P.cells()){let ax=dx,az=dz;for(let k=0;k<r;k++){const t=ax;ax=-az;az=t}const x=x0+ax,y=y0+dy,z=z0+az;if(inb(x,y,z))o.push([idx(x,y,z),m])}return o}
function placePrefab(i){const cs=prefabCells(i);let n=0,sub=0;for(const [j,m0] of cs){if(!cellFree(j))continue;let m=m0;if(!BASIC_BLOCKS.includes(m)&&m!==23){if(state.inv.blocks[m]>0){state.inv.blocks[m]--;state.prepaid.add(j)}else if(m===17&&state.inv.blocks[16]>0){m=16;state.inv.blocks[16]--;state.prepaid.add(j);sub++}else{m=3;sub++}}placeBlue(j,m);n++}
  const P=PREFABS[state.build.pf];if(n){SFX.build();toast(`${P.ico} ${P.n}: ${n} blocos na planta${sub?` (${sub} substituídos por falta no inventário)`:''} — os reparadores constroem`,'r1')}else SFX.hurt();renderBuild();updateHud()}
window.__craft=(kind,a)=>{const i=idx(CX+40,GY,CZ+6);if(kind==='line'){CRAFT.a=i;CRAFT.b=idx(CX+50,GY,CZ+6);CRAFT.m=3;CRAFT.cells=craftLine(CRAFT.a,CRAFT.b);craftUp(true);return blueList.length}if(kind==='pf'){state.build.pf=a;return placePrefab(idx(CX+40,GY,CZ-8))||blueList.length}};
window.__rebuildTest=()=>{const i=idx(CX+45,GY,CZ+6);const had=vox[i];removeVox(i,'enemy');return [had,vox[i],blue[i]]};
window.__cellAt=(dx,dz)=>{const i=idx(CX+dx,GY,CZ+dz);return [vox[i],blue[i]]};

// v1.5 bestiário novo: escudeiro, cavador, bombardeiro, mímico, golem de cristal, cavaleiro (e estilhaços)
Object.assign(ETYPES,{
  escudeiro:{hp:110,speed:1.9,dmg:14,rate:1,color:0x6a7aa8,radius:.7,n:'Escudeiro'},
  cavador:{hp:70,speed:2.2,dmg:16,rate:.8,color:0x8a6a48,radius:.6,n:'Cavador'},
  bombardeiro:{hp:60,speed:2.6,dmg:0,rate:3,color:0x5b5f7a,radius:.6,n:'Bombardeiro'},
  mimico:{hp:160,speed:4.2,dmg:22,rate:.7,color:0x9a6a3a,radius:.7,n:'Mímico'},
  cristal:{hp:260,speed:1.4,dmg:28,rate:1.3,color:0x7fd8f0,radius:.9,n:'Golem de Cristal'},
  cavaleiro:{hp:150,speed:3.6,dmg:24,rate:1,color:0x7a5a3a,radius:.8,n:'Cavaleiro da Bruma'},
  shard:{hp:30,speed:3.2,dmg:8,rate:.6,color:0x9fe8ff,radius:.45,n:'Estilhaço'}});
const SCX={cristal:1.3,cavaleiro:1.15,mimico:1.05,shard:.7,bombardeiro:.9};
const _L=(g,sc,c,pts)=>pts.map(([x,y,z,w,h])=>{const lg=box(w*sc,h*sc,w*sc,c,x*sc,y*sc,z*sc,g);return{mesh:lg,alive:true,ox:x*sc,oz:z*sc}});
Object.assign(CREATURES,{
  escudeiro(sc,col,g){const body=box(.7*sc,.8*sc,.5*sc,col,0,.85*sc,0,g);const head=box(.5*sc,.45*sc,.45*sc,0xd9c8a8,0,1.5*sc,.02*sc,g);eyes(head,.03*sc,.23*sc,.11*sc);
    box(.6*sc,.25*sc,.55*sc,0x8a93a8,0,1.78*sc,0,g);box(.1*sc,.2*sc,.5*sc,0xd9414f,0,1.98*sc,0,g);
    const sh=box(1.0*sc,1.3*sc,.14*sc,0x9aa3b8,0,.9*sc,.42*sc,g);box(.75*sc,1.05*sc,.04*sc,0x4f6aa8,0,.9*sc,.5*sc,g);box(.3*sc,.3*sc,.05*sc,0xffcf3d,0,1.0*sc,.53*sc,g);
    box(.08*sc,.9*sc,.08*sc,0xdfe6f0,-.45*sc,1.0*sc,.1*sc,g);return{body,head,legs:_L(g,sc,0x3b3f55,[[-.18,.22,0,.22,.45],[.18,.22,0,.22,.45]])}},
  cavador(sc,col,g){const body=box(.95*sc,.5*sc,1.15*sc,col,0,.4*sc,0,g);const head=box(.55*sc,.4*sc,.5*sc,shadeHex(col,.1),0,.45*sc,.75*sc,g);eyes(head,.08*sc,.26*sc,.12*sc);
    box(.22*sc,.18*sc,.25*sc,0xf2a6b8,0,.38*sc,1.08*sc,g);for(const s of[-1,1]){box(.3*sc,.12*sc,.35*sc,0xe8dcc0,s*.48*sc,.2*sc,.62*sc,g);for(let k=-1;k<=1;k++)box(.06*sc,.06*sc,.22*sc,0xf5efe0,s*.48*sc+k*.09*sc,.14*sc,.86*sc,g)}
    box(.6*sc,.12*sc,.8*sc,shadeHex(col,-.2),0,.68*sc,-.05*sc,g);return{body,head,legs:_L(g,sc,shadeHex(col,-.3),[[-.35,.1,-.35,.18,.2],[.35,.1,-.35,.18,.2]])}},
  bombardeiro(sc,col,g){const body=box(.7*sc,.55*sc,.9*sc,col,0,.6*sc,0,g);const head=box(.45*sc,.4*sc,.4*sc,shadeHex(col,.15),0,.75*sc,.6*sc,g);eyes(head,.05*sc,.21*sc,.11*sc);
    const w1=box(1.3*sc,.06*sc,.5*sc,0x9aa3b8,-.95*sc,.75*sc,0,g),w2=box(1.3*sc,.06*sc,.5*sc,0x9aa3b8,.95*sc,.75*sc,0,g);g.userData.wings=[w1,w2];
    const bomb=box(.36*sc,.36*sc,.36*sc,0x2b2d4a,0,.15*sc,0,g);box(.08*sc,.15*sc,.08*sc,0xff7a2a,0,.38*sc,0,g);box(.25*sc,.25*sc,.3*sc,0xffcf3d,0,.55*sc,-.55*sc,g);return{body,head,legs:[]}},
  mimico(sc,col,g){const body=box(1.0*sc,.6*sc,.8*sc,col,0,.45*sc,0,g);box(1.04*sc,.1*sc,.84*sc,0xffcf3d,0,.72*sc,0,g);box(.2*sc,.25*sc,.05*sc,0xffcf3d,0,.55*sc,.42*sc,g);
    const head=box(1.0*sc,.3*sc,.8*sc,shadeHex(col,.08),0,.95*sc,0,g);box(1.04*sc,.06*sc,.84*sc,0xffcf3d,0,1.08*sc,0,g);for(let k=-3;k<=3;k++){box(.08*sc,.14*sc,.08*sc,0xfff6e0,k*.13*sc,.82*sc,.36*sc,g);box(.08*sc,.12*sc,.08*sc,0xfff6e0,k*.13*sc+.06*sc,.84*sc,-.36*sc,g)}
    box(.2*sc,.05*sc,.5*sc,0xd9414f,0,.8*sc,.2*sc,g);for(const s of[-1,1]){const ey=box(.12*sc,.12*sc,.05,0xffe25a,s*.22*sc,.98*sc,.41*sc,g);ey.material.emissive.setHex(0xffb000);ey.material.emissiveIntensity=.9}
    return{body,head,legs:_L(g,sc,0x4a3020,[[-.38,.1,-.28,.16,.22],[.38,.1,-.28,.16,.22],[-.38,.1,.28,.16,.22],[.38,.1,.28,.16,.22]])}},
  cristal(sc,col,g){const body=box(.95*sc,1.0*sc,.7*sc,col,0,1.0*sc,0,g);body.material.emissive.setHex(0x1a6a8a);body.material.emissiveIntensity=.3;const head=box(.5*sc,.45*sc,.45*sc,shadeHex(col,.2),0,1.72*sc,.05*sc,g);eyes(head,.05*sc,.23*sc,.11*sc);
    for(const [x,y,z,h,r] of [[-.35,1.6,-.1,.6,.3],[.3,1.65,-.15,.75,-.25],[0,1.5,-.35,.5,0],[-.5,1.2,.1,.4,.6],[.5,1.25,.05,.45,-.6]]){const c=box(.18*sc,h*sc,.18*sc,0xc8f6ff,x*sc,y*sc,z*sc,g);c.rotation.z=r}
    for(const s of[-1,1])box(.32*sc,.85*sc,.32*sc,shadeHex(col,-.1),s*.68*sc,.95*sc,.05*sc,g);return{body,head,legs:_L(g,sc,shadeHex(col,-.25),[[-.25,.25,0,.3,.5],[.25,.25,0,.3,.5]])}},
  cavaleiro(sc,col,g){const body=box(.6*sc,.6*sc,1.4*sc,col,0,.85*sc,0,g);const hh=box(.35*sc,.5*sc,.6*sc,col,0,1.25*sc,.85*sc,g);box(.3*sc,.1*sc,.6*sc,0x2b2d4a,0,1.45*sc,.2*sc,g);box(.1*sc,.5*sc,.5*sc,0x2b2d4a,0,1.15*sc,-.75*sc,g);
    box(.5*sc,.6*sc,.4*sc,0x5e5670,0,1.45*sc,-.05*sc,g);const head=box(.4*sc,.4*sc,.4*sc,0x8a93a8,0,1.95*sc,0,g);box(.3*sc,.06*sc,.05,0x1d1f33,0,1.97*sc,.21*sc,g);box(.06*sc,.3*sc,.3*sc,0xd9414f,0,2.25*sc,-.05*sc,g);
    const lance=box(.08*sc,.08*sc,2.0*sc,0xd9c8a8,.35*sc,1.5*sc,.6*sc,g);box(.14*sc,.14*sc,.3*sc,0xdfe6f0,.35*sc,1.5*sc,1.65*sc,g);eyes(hh,.12*sc,.31*sc,.12*sc);
    return{body,head,legs:_L(g,sc,shadeHex(col,-.3),[[-.2,.28,-.5,.16,.56],[.2,.28,-.5,.16,.56],[-.2,.28,.5,.16,.56],[.2,.28,.5,.16,.56]])}},
  shard(sc,col,g){const body=box(.6*sc,.5*sc,.6*sc,col,0,.45*sc,0,g);const head=box(.35*sc,.3*sc,.3*sc,0xc8f6ff,0,.85*sc,.1*sc,g);eyes(head,.03*sc,.16*sc,.08*sc);box(.14*sc,.4*sc,.14*sc,0xc8f6ff,.15*sc,.95*sc,-.1*sc,g).rotation.z=.4;return{body,head,legs:_L(g,sc,0x5ab8d8,[[-.18,.12,0,.14,.24],[.18,.12,0,.14,.24]])}}});
function crystalShard(e){let v=null,bd=12;for(const m of minions){if(m.wounded)continue;const d=hd(m.pos,e.pos);if(d<bd){bd=d;v=m}}if(!v)return;hurtMinion(v,8+state.wave*.6,e);label({x:v.pos.x,y:v.group.position.y+1.6,z:v.pos.z},'✦ reflexo','#9fe8ff');for(let k=0;k<3;k++)spawnDebris(v.pos.x,v.group.position.y+1,v.pos.z,0x9fe8ff,1,.15)}
function _walkStraight(e,tx,tz,sp,dt){const dx=tx-e.pos.x,dz=tz-e.pos.z,d=Math.hypot(dx,dz)||1;e.group.rotation.y=Math.atan2(dx,dz);e.pos.x+=dx/d*sp*dt;e.pos.z+=dz/d*sp*dt;return d}
const NEW_BRAINS={
  escudeiro(e,dt){e.gT=(e.gT||0)-dt;if(e.gT<=0){e.gT=.4;for(const o of enemies)if(!o.dead&&o!==e&&Math.abs(o.pos.x-e.pos.x)<4.2&&Math.abs(o.pos.z-e.pos.z)<4.2)o.guardUntil=simTime+.6}return false},
  cavador(e,dt,sf){if(e.surfaced)return false;const d=Math.hypot(CHEST.x-e.pos.x,CHEST.z-e.pos.z);if(d>WR-4){e.under=true;_walkStraight(e,CHEST.x,CHEST.z,e.speed*1.15*sf,dt);e.gy=surfE(e.pos.x,e.pos.z);e.group.position.y=e.gy-1.35;e.dT=(e.dT||0)-dt;if(e.dT<=0){e.dT=.12;spawnDebris(e.pos.x,GY+.2,e.pos.z,0x8a6a48,1,.22)}return true}
    e.under=false;e.surfaced=true;e.path=null;e.gy=surfE(e.pos.x,e.pos.z);e.group.position.y=e.gy;for(let k=0;k<10;k++)spawnDebris(e.pos.x,GY+.5,e.pos.z,0x8a6a48,1,.35);label({x:e.pos.x,y:e.gy+2,z:e.pos.z},'⛏️ por baixo da muralha!','#ffb13d');shake=Math.max(shake,.3);return false},
  bombardeiro(e,dt,sf){e.curY=(e.curY??e.alt)+((e.alt+2)-(e.curY??e.alt))*Math.min(1,dt*2);e.group.position.y=e.curY+Math.sin(e.bob*.6)*.3;e.gy=e.curY-1;e.bob+=dt*3;const w=e.group.userData.wings;if(w){w[0].rotation.z=Math.sin(e.bob*2.5)*.5;w[1].rotation.z=-Math.sin(e.bob*2.5)*.5}
    if(!e.bt||(e.bt.t&&!e.bt.t.alive)){const ts=turrets.filter(t=>t.alive&&t.team!=='r');e.bt=ts.length?{t:pick(ts)}:{p:{x:CHEST.x+rnd(-6,6),z:CHEST.z+rnd(-6,6)}}}const tp=e.bt.t?e.bt.t.pos:e.bt.p;const d=_walkStraight(e,tp.x,tp.z,e.speed*sf,dt);
    e.bT=(e.bT??1)-dt;if(d<2.2&&e.bT<=0){e.bT=e.T.rate;throwRock(e,tp.x+rnd(-.8,.8),tp.z+rnd(-.8,.8),2.2,(22+state.wave*2.2)*(1+e.rarity*.3),0x2b2d4a,true);if(Math.random()<.4)e.bt=null}return true},
  mimico(e,dt){if(e.dormant===undefined){e.dormant=rnd(9,14);const a=rnd(0,Math.PI*2),r=rnd(WR+6,WR+14);e.pos.x=clamp(CX+Math.cos(a)*r,4,W-5);e.pos.z=clamp(CZ+Math.sin(a)*r,4,D-5);e.gy=surfE(e.pos.x,e.pos.z);e.group.position.y=e.gy}
    const lid=e.parts[1];e.under=e.dormant>0;if(e.dormant>0){e.dormant-=dt;if(minions.some(m=>!m.wounded&&hd(m.pos,e.pos)<3))e.dormant=0;if(lid)lid.rotation.x=Math.random()<.01?-.2:0;e.group.position.y=e.gy;if(e.dormant<=0)label({x:e.pos.x,y:e.gy+2,z:e.pos.z},'É UM MÍMICO!','#ffcf3d');return true}
    if(lid)lid.rotation.x=-.35-Math.abs(Math.sin(simTime*12))*.4;return false},
  cristal(e){e.afire=0;if(!e.armd){e.armd=1;e.armor=Math.min(.75,e.armor+.35)}return false},
  cavaleiro(e,dt,sf){if(e.mounted===undefined)e.mounted=true;if(e.mounted&&e.hp<e.maxhp*.5){e.mounted=false;e.speed*=.55;label({x:e.pos.x,y:e.gy+2.2,z:e.pos.z},'desmontado!','#ec5f6b');for(const L of e.legs)L.mesh.scale.y=.4}
    if(!e.mounted)return false;const C=e.chg;if(C){C.t-=dt;if(C.t>0)return true;const sp=e.speed*2.6*sf;const x=e.pos.x+Math.sin(C.ang)*sp*dt,z=e.pos.z+Math.cos(C.ang)*sp*dt;let hit=false;const fx=Math.floor(x+Math.sin(C.ang)),fz=Math.floor(z+Math.cos(C.ang));for(let y=Math.floor(e.gy);y<Math.floor(e.gy)+2;y++)if(inb(fx,y,fz)&&SOLIDM(vox[idx(fx,y,fz)])){damageVox(idx(fx,y,fz),45+state.wave*3,'enemy',e);hit=true}
      if(!hit){e.pos.x=x;e.pos.z=z;e.gy=surfE(x,z);e.group.position.y=e.gy}C.dash+=sp*dt;for(const m of minions)if(!m.wounded&&hd(m.pos,e.pos)<1.6&&!C.h.has(m)){C.h.add(m);hurtMinion(m,e.T.dmg*1.5,e)}if(C.dash>9||hit){e.chg=null;e.chT=6;e.path=null}return true}
    e.chT=(e.chT??rnd(3,6))-dt;const dC=Math.hypot(CHEST.x-e.pos.x,CHEST.z-e.pos.z);if(e.chT<=0&&dC<WR+14&&dC>6){const ang=Math.atan2(CHEST.x-e.pos.x,CHEST.z-e.pos.z);e.group.rotation.y=ang;markLine(e.pos.x,e.pos.z,ang,9,1.6,.7);e.chg={t:.7,ang,dash:0,h:new Set()};return true}return false}};
const NEW_DEATH={cristal(e){for(let k=0;k<3;k++){const s=makeEnemy('shard',e.rarity,e.pos.x+rnd(-1,1),e.pos.z+rnd(-1,1));s.viaWall=true}},
  mimico(e){spawnLoot(e.pos.x,e.gy+1.5,e.pos.z,'treasure',Math.min(4,2+Math.floor(state.wave/12)),{});spawnLoot(e.pos.x+.5,e.gy+1.5,e.pos.z,'material',0,{amount:10+state.wave});label({x:e.pos.x,y:e.gy+2,z:e.pos.z},'💰 tesouro!','#ffcf3d')}};

// v1.6 RAIDS: opcional no descanso, três estágios de inimigos insanos e o Arauto do Abismo
ETYPES.arauto={hp:5200,speed:1.2,dmg:95,rate:1.2,color:0x2a1438,radius:2.1,n:'Arauto do Abismo'};SCX.arauto=2.6;
CREATURES.arauto=function(sc,col,g){const body=box(1.2*sc,1.1*sc,.8*sc,col,0,1.25*sc,0,g);const head=box(.6*sc,.55*sc,.55*sc,0x3d1f52,0,2.05*sc,.05*sc,g);
  box(1.6*sc,.35*sc,.9*sc,0x4b2a66,0,1.75*sc,0,g);for(const s of[-1,1]){box(.35*sc,1.0*sc,.35*sc,col,s*.85*sc,1.2*sc,.05*sc,g);box(.42*sc,.3*sc,.42*sc,0x7a3aa8,s*.85*sc,.62*sc,.05*sc,g);const w=box(1.1*sc,.08*sc,.7*sc,0x1a0a26,s*1.3*sc,1.9*sc,-.4*sc,g);w.rotation.z=s*.35}
  const orb=box(.3*sc,.3*sc,.3*sc,0xc86cff,0,1.35*sc,.42*sc,g);orb.material.emissive.setHex(0xa040ff);orb.material.emissiveIntensity=1;
  const cr=box(.5*sc,.18*sc,.5*sc,0xc86cff,0,2.42*sc,.05*sc,g);cr.material.emissive.setHex(0xa040ff);cr.material.emissiveIntensity=.8;
  return{body,head,legs:_L(g,sc,0x1a0a26,[[-.32,.36,0,.36,.72],[.32,.36,0,.36,.72]])}};
BOSS_ADD.arauto='cavaleiro';
const RAID_EVERY=4;
function raidReady(){const mw=Math.max(state.maxWave||1,state.wave);return mw>=6&&state.phase==='rest'&&!state.choosing&&!state.raid&&mw>=(state.nextRaid||6)}
function raidLvl(){return Math.max(state.maxWave||1,state.wave)+3}
function raidSpec(st){const L=raidLvl();const q=[];const elite=['escudeiro','cavaleiro','brute','beetle','wolf','imp','spider','bombardeiro','cristal','cavador'];
  if(st===1){for(let i=0;i<14+L;i++)q.push(pick(elite))}
  else if(st===2){const mb=['golem','necro','wyrm','boss'];q.push(pick(mb),pick(mb));for(let i=0;i<10+L;i++)q.push(pick(elite))}
  else{q.push('arauto');for(let i=0;i<8+Math.floor(L/2);i++)q.push(pick(elite))}return q}
function startRaid(){if(!raidReady())return;const L=raidLvl();state.raid={st:1,w0:state.wave,L};state.wave=L;state.ev=null;state.phase='rest';startWave();state.ev='raid';state.queue=raidSpec(1);state.contract=null;
  $('event').style.display='inline-flex';$('event').textContent='☠️ Raid 1/3';$('event').style.color='var(--r4)';toast(`☠️ RAID nível ${L}: três ondas de inimigos insanos. No fim, o Arauto do Abismo.`,'r4',true);SFX.boom&&SFX.boom(true);shake=Math.max(shake,.6)}
function raidStageEnd(){const R=state.raid;if(R.st<3){R.st++;state.queue=raidSpec(R.st);$('event').textContent=`☠️ Raid ${R.st}/3`;toast(R.st===2?'☠️ Raid 2/3: mini-chefes chegando!':'☠️ Raid 3/3: o ARAUTO DO ABISMO desperta!','r4',true);shake=Math.max(shake,.5);return}
  const L=R.L;state.wave=R.w0;state.raid=null;state.ev=null;state.phase='rest';state.restStart=simTime;state.restT=20;$('event').style.display='none';state.raidsDone=(state.raidsDone||0)+1;state.nextRaid=Math.max(state.maxWave||1,state.wave)+RAID_EVERY;
  const mat=120+L*12;state.material+=mat;addFame(30+L*2);for(let k=0;k<3;k++)spawnLoot(CHEST.x+rnd(-3,3),GY+3,CHEST.z+3+rnd(0,2),'treasure',Math.min(4,3+(k===0&&L>=15?1:0)),{});
  $('report').style.display='block';$('report').innerHTML=`<b>☠️ Raid nível ${L} vencida!</b> +${mat} material, 3 tesouros raros e renome. Próxima raid na horda ${state.nextRaid}.`;toast('☠️ RAID VENCIDA! Tesouros raros no pátio.','r4',true);SFX.fanfare&&SFX.fanfare(true);startSelfRepair();updateHud()}
function raidFail(){const R=state.raid;state.raid=null;for(const e of enemies)if(!e.dead&&!e.rival){e.dead=true;scene.remove(e.group)}state.queue=[];state.ev=null;state.wave=R.w0;$('event').style.display='none';state.boss=null;hideBoss();
  for(const i of _chestVox){setVox(i,5);hp[i]=maxHpOf(5)}const pen=Math.floor(state.material*.1);state.material-=pen;state.phase='rest';state.restStart=simTime;state.restT=25;state.nextRaid=Math.max(state.maxWave||1,state.wave)+2;startSelfRepair();
  $('report').style.display='block';$('report').innerHTML=`<b>☠️ A raid rompeu o baú.</b> Você continua na horda ${state.wave}${pen?` · −${pen} material`:''}. Nova tentativa na horda ${state.nextRaid}.`;toast('☠️ Raid perdida — a cidadela resiste.','r3',true);updateHud()}
let _raidT=0;function raidTick(dt){_raidT-=dt;if(_raidT<=0){_raidT=.4;const b=$('raidGo');if(b){const ok=raidReady();if(b.hidden===ok)b.hidden=!ok}}
  if(!state.raid)return;for(const e of enemies){if(e.dead||e.rm||e.rival)continue;e.rm=1;if(e.type==='arauto'){e.ph=1;showBoss(e);continue}
    if(BIG(e.type)){e.maxhp*=.55;e.hp=e.maxhp;e.group.scale.multiplyScalar(.85);continue}
    e.maxhp*=1.6;e.hp=e.maxhp;e.speed*=1.12;e.armor=Math.min(.7,(e.armor||0)+.12);if(!e.aff){e.aff=pick(['fast','armor','vamp','boom','regen']);if(e.aff==='fast')e.speed*=1.3;if(e.aff==='armor')e.armor=Math.min(.75,e.armor+.25)}
    for(const im of e.vmeshes||[]){im.material.emissive.setHex(0x7a20c8);im.material.emissiveIntensity=.22;im.userData.em=0x7a20c8}}}
$('raidGo').onclick=()=>startRaid();
window.__raid=()=>{state.maxWave=Math.max(state.maxWave||1,8);state.nextRaid=0;startRaid();return state.raid?{...state.raid,q:state.queue.length}:null};
window.__raidSt=()=>state.raid?{st:state.raid.st,q:state.queue.length,en:enemies.filter(e=>!e.dead).length,wave:state.wave}:{done:state.raidsDone||0,wave:state.wave,next:state.nextRaid};
