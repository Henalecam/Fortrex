// ───────── progression: unlocks by wave, weapon and role limits raised by upgrades, posts for minions, auto-sell
const UNLOCK={turret:{cannon:1,ballista:1,mortar:3,flamer:5,tesla:7,wind:8,frost:10,catapult:12,sunray:15},role:{rep:1,col:1,gun:1,sol:1,med:3},
  block:{16:1,17:1,10:1,31:6,18:4,15:5,9:7,8:7,14:9,19:10,20:14},
  up:{oil:6,sappers:5,forge:12,bulwark:14,platform:2,quartel:3,door:3,explosive:4,oficina:4,wall:5,greek:6,escola:6,crit:8,portal:10,general:12,luck:14}};
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
  {id:'masonry',ico:'🧱',nm:'Alvenaria',get ds(){const t=state.blockTier||0;const nx=['madeira e pedra viram pedra e metal','pedra vira metal','metal vira obsidiana','obsidiana vira aço rúnico'][Math.min(3,t)];return t>=4?'A cidadela inteira é de aço rúnico.':`Troca os blocos da planta por melhores: ${nx}. Trocados de graça após a horda.`},max:4,cost:l=>[140,280,560,900][l]||999,need:l=>[4,8,13,19][l]||99,go(){upgradeMasonry()}},
  {id:'oil',ico:'🫕',nm:'Óleo fervente',ds:'As muralhas despejam óleo em quem escala: dano, queimadura e o escalador cai para fora. Mais níveis, mais frequente.',max:3,cost:l=>90+l*90,go(){}},
  {id:'cathedral',ico:'⛪',nm:'Catedral',ds:'Maravilha. Uma relíquia aleatória agora e a moral nunca cai abaixo de 55.',max:1,cost:()=>1100,need:()=>12,go(){const ks=Object.keys(RELICS);grantRelic(pick(ks));state.moraleFloor=Math.max(state.moraleFloor||0,55)}},
  {id:'observatory',ico:'🔭',nm:'Observatório',ds:'Maravilha. Todas as armas ganham +18% de alcance e enxergam através da bruma.',max:1,cost:()=>900,need:()=>10,go(){state.rangeMul=(state.rangeMul||1)*1.18}},
  {id:'greatwall',ico:'🏯',nm:'Grande Muralha',ds:'Maravilha. A muralha principal sobe 2 fileiras e os blocos da planta aguentam +25%.',max:1,cost:()=>1400,need:()=>14,go(){state.wallH+=2;state.blueHp=(state.blueHp||1)*1.25;buildBlueprint();if(state.phase!=='wave')startSelfRepair()}},
  {id:'statue',ico:'🗿',nm:'Estátua do Guardião',ds:'Maravilha. +25% de dano em tudo e heróis ganham 1 nível.',max:1,cost:()=>2000,need:()=>18,go(){state.dmgMul*=1.25;state.bladeMul*=1.25;for(const k in state.heroes||{}){const m=state.heroes[k].m;if(m){m.lvl=(m.lvl||1)+1;recompute(m)}}}},
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
function merchantArrive(){const w=state.wave,offers=[];let guard=0;while(offers.length<(state.buildings&&state.buildings.market?5:4)&&guard++<30){const r=Math.min(4,rollRarity(.06+w*.008)+(offers.length===0?1:0));const [kind,data]=lootPick('any',r);if(kind==='material')continue;offers.push({kind,data,r,price:Math.round((25+r*r*30)*(1+w*.03)*(state.buildings&&state.buildings.market?.75:1)),sold:false})}
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
  {id:'berserker',name:'Thor, o Berserker',ico:'🪓',ab:'Fúria',key:'Y',cd:42,col:0xd9414f,d:'8 s de fúria: soldados próximos causam o triplo de dano e correm mais'}];
const HERO_SLOTS=[1,3,5];
const HERO_LORE={paladin:'Jurou proteger Fortrex quando a bruma engoliu sua ordem. O martelo ainda brilha com a luz do último templo.',archer:'Caçadora das torres do norte; dizem que nunca errou uma flecha desde que perdeu o irmão para os Lobos da Bruma.',mage:'Exilado da Academia por congelar um rio inteiro. Agora congela o que vier pela frente.',engineer:'Reconstruiu sozinha a ponte de Ponte de Ossos. Para ela, toda ruína é só uma planta esperando.',berserker:'Ninguém sabe de onde veio. Quando ele grita, até os soldados mais cansados lembram por que lutam.'};
function relicCount(){return Object.values(state.relics||{}).reduce((a,b)=>a+b,0)}
function spawnHero(H){const m=makeMinion('sol',4,GATE.x+rnd(-1,1),GATE.z+2);m.hero=H.id;m.name=H.name;m.group.scale.setScalar(1.35);recompute(m);m.hp=m.maxhp;
  const halo=new THREE.Mesh(new THREE.TorusGeometry(.35,.06,6,16),new THREE.MeshBasicMaterial({color:H.col}));halo.rotation.x=Math.PI/2;halo.position.y=2.35;m.group.add(halo);
  state.heroes=state.heroes||{};state.heroes[H.id]={m,cd:0};const b=$('bHero_'+H.id);if(b)b.hidden=false;toast(`${H.ico} ${H.name} se junta a você! ${H.ab} (tecla ${H.key}): ${H.d}.`,'r4')}
function checkHeroes(){if(state.heroOffer||state.choosing)return;const n=relicCount(),k=Object.keys(state.heroes||{}).length;if(k>=HERO_SLOTS.length||n<HERO_SLOTS[k])return;const left=HEROES.filter(H=>!(state.heroes&&state.heroes[H.id]));if(!left.length)return;
  const opts=shuffle(left.slice()).slice(0,2);if(opts.length===1||state.autoReward||window.__headless){spawnHero(opts[0]);return}state.heroOffer=true;state.choosing=true;
  const box=$('rewardCards');box.innerHTML='';$('rewardTitle').textContent='Um herói quer se juntar à sua causa!';$('reward').querySelector('.sub').textContent='Escolha um herói. O outro segue seu caminho.';
  for(const H of opts){const el=document.createElement('button');el.className='rcard r4';el.innerHTML=`<div class="ico">${H.ico}</div><div class="nm">${esc(H.name)}</div><div class="ds"><b>${H.ab}</b> (tecla ${H.key}): ${esc(H.d)}.</div><div class="rr">Herói lendário</div>`;el.onclick=()=>{spawnHero(H);$('reward').style.display='none';state.choosing=false;state.heroOffer=false;updateHud()};box.appendChild(el)}
  $('reward').style.display='flex';SFX.open()}
function heroAbility(id){const H=HEROES.find(h=>h.id===id);const S=state.heroes&&state.heroes[id];if(!H||!S||!minions.includes(S.m)){toast('Este herói ainda não chegou','r0');return}const m=S.m;
  if(m.wounded>0){toast(`${H.name.split(',')[0]} está ferido(a)`,'r0');return}if(S.cd>0){toast(`${H.ab} em ${Math.ceil(S.cd)} s`,'r0');return}const L=m.lvl||1,mul=(1+(L-1)*.07)*(heroHas(id,'pow')?1.4:1);S.cd=H.cd*(heroHas(id,'cd')?.75:1)*(state.buildings&&state.buildings.shrine?.7:1)*Math.max(.55,1-(L-1)*.02);const w=state.wave*mul;
  if(id==='paladin'){const r=7+L*.08,dmg=120+w*8;for(const e of enemies){if(e.dead||e.fly)continue;const d=Math.hypot(e.pos.x-m.pos.x,e.pos.z-m.pos.z);if(d<r){dmgEnemy(e,dmg*(1-d/r*.5),true,true);e.stun=Math.max(e.stun||0,2)}}
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

// ───────── morale: victories and night rest lift it, wounds and endless waves wear it down; it speeds up or slows every minion (±20%)
function moraleTick(dt){let m=state.morale??60;if(state.phase==='wave'){state.waveT=(state.waveT||0)+dt;if(state.waveT>90)m-=dt*.35}else{state.waveT=0;if(isNight())m+=dt*1.2;else m+=dt*.15}
  state.morale=clamp(m,Math.max(state.buildings&&state.buildings.granary?45:0,state.moraleFloor||0),100);const el=$('morale');if(el){const v=Math.round(state.morale);el.textContent=`${v>=70?'😄':v>=40?'🙂':v>=20?'😟':'😩'} ${v}`;el.title=`Moral ${v}%: minions ${v>=50?'+':''}${Math.round((v/100*.4-.2)*100)}% de rendimento. Sobe vencendo hordas, chefes e descansando à noite; cai com feridos e hordas longas.`;el.style.color=v<25?'var(--bad)':''}}
// ───────── achievements (kept in the browser across runs) and end-of-run stats
const ACH=[
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
const TIPS=[{id:'ward',c:()=>state.wave>=8&&state.phase==='wave'&&chestAlive()<18,t:'🛡️ O baú está sendo atacado! Use a Égide do Guardião (dock) para proteger a cidadela por 7 s.'},{id:'bearer',c:()=>enemies.some(e=>e.bearer&&!e.dead),t:'🚩 Um porta-estandarte inimigo acelera e protege a horda ao redor. Clique nele para concentrar o fogo: quando cai, todos por perto entram em pânico.'},{id:'goblin',c:()=>enemies.some(e=>e.type==='goblin'&&!e.dead),t:'🔧 Sabotadores (duendes com chave inglesa) desarmam as armadilhas dos Sapadores. Concentre o fogo neles.'},{id:'oil',c:()=>state.wave>=6&&state.phase==='rest'&&!state.ups.oil&&enemies.length===0,t:'🫕 Escaladores e aranhas passam por cima das muralhas. Óleo fervente (Upgrades) derruba eles lá de cima.'},{id:'mason',c:()=>state.wave>=4&&state.phase==='rest'&&!state.ups.masonry,t:'🧱 Alvenaria (Upgrades) troca os blocos da cidadela por materiais melhores, de graça, depois de cada horda.'},{id:'sappers',c:()=>(state.fieldTraps||[]).length>=4,t:'💣 Os sapadores espalham minas, espinhos e barris pelo mapa onde a horda passa. Compre Sapadores para mais armadilhas.'},{id:'affix',c:()=>enemies.some(e=>e.aff&&!e.dead),t:'💍 Anéis coloridos nos pés marcam inimigos de elite: amarelo veloz, azul blindado, vermelho vampiro, laranja explode ao morrer, verde regenera.'},
  {id:'start',c:()=>simTime>3,t:'👥 Seus minions trabalham sozinhos: reparam, coletam, lutam e operam armas. Clique em um para ver a ficha.'},
  {id:'wave',c:()=>state.phase==='wave'&&state.wave===1,t:'🔥 Clique num inimigo para concentrar o fogo de todas as armas nele.'},
  {id:'auto',c:()=>state.wave>=2&&state.phase==='rest',t:'⚙️ No menu Automação você liga construção, upgrades, venda e recompensas automáticas.'},
  {id:'shop',c:()=>state.material>=90&&state.wave>=2,t:'⬆️ Gaste material em Upgrades: mais armas, mais vagas de minion, mais dano.'},
  {id:'build',c:()=>state.wave>=3&&state.phase==='rest',t:'🧱 Em Construir você coloca blocos, armadilhas e instala armas do arsenal. A base cresce sozinha também.'},
  {id:'realm',c:()=>simTime>240,t:'🗺️ Abra o Reino (M): fortalezas rivais crescem e guerreiam. Lá você vê objetivos e declara guerra.'},
  {id:'war',c:()=>!!battle(),t:'⚔️ Uma fortaleza inimiga surgiu! Use ⚔️ Atacar para mandar soldados destruir o núcleo vermelho.'},
  {id:'hero',c:()=>Object.keys(state.heroes||{}).length>0,t:'⭐ Heróis têm habilidades: use o botão no dock ou as teclas Q/E/T/G/Y.'},
  {id:'bomb',c:()=>state.wave>=4&&state.phase==='wave'&&enemies.length>25,t:'💣 Muitos inimigos? Use a Bomba (25 material) e clique onde ela deve cair.'}];
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
function placeHeroBar(){const narrow=innerWidth<600;let bar=$('heroBar');if(!bar){bar=document.createElement('div');bar.id='heroBar';document.body.appendChild(bar)}const dock=document.querySelector('.dock');const anchor=$('bomb');
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
function wardUp(){if(state.wave<8||(state.wardCd||0)>0||state.phase!=='wave')return false;state.wardT=7;state.wardCd=100;
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
function volcanoTick(dt){if(!BIOME.volcanic||state.phase!=='wave'){if(state.phase!=="wave"){eruptT=14;for(const L of pendingLava)if(L.col)scene.remove(L.col);pendingLava.length=0}return}eruptT-=dt;
  if(eruptT<=0){eruptT=rnd(32,48);const n=3+Math.floor(state.wave/6);for(let k=0;k<n;k++){const a=rnd(0,Math.PI*2),r=Math.random()<.2?rnd(4,WR-2):rnd(WR+4,60);const x=CX+Math.cos(a)*r,z=CZ+Math.sin(a)*r;markGround(x,z,2.4,0xff5a1a,1.6+k*.25);const col=new THREE.Mesh(LAVA_COL_GEO,new THREE.MeshBasicMaterial({color:0xff7a2a,transparent:true,opacity:.55,depthWrite:false}));col.position.set(x,surf(x,z)+6,z);scene.add(col);pendingLava.push({x,z,t:1.6+k*.25,col})}
    toast('🌋 Erupção! Bombas de lava vão cair nas marcas laranja.','r3');shake=Math.max(shake,.35);SFX.boom&&SFX.boom(true)}
  for(let i=pendingLava.length-1;i>=0;i--){const L=pendingLava[i];L.t-=dt;if(L.col){L.col.material.opacity=.35+.3*Math.sin(simTime*14);L.col.scale.x=L.col.scale.z=1+Math.max(0,1.6-L.t)*.4}if(L.t>0)continue;pendingLava.splice(i,1);if(L.col){scene.remove(L.col);L.col.material.dispose()}explode(Math.floor(L.x),Math.floor(surf(L.x,L.z)),Math.floor(L.z),2.4,60+state.wave*4,{fire:true,src:'env'});for(let k=0;k<6;k++)spawnFlame(L.x+rnd(-1.5,1.5),surf(L.x,L.z)+rnd(.2,1.2),L.z+rnd(-1.5,1.5),1)}}

// biome rules: every land plays differently
//  Rubro (deserto): midday heat wears down soldiers fighting outside the walls
//  Gelada (neve): frozen lakes crack under heavy enemies, dropping them into icy water
//  Bruma (pântano): at night the horde stays hidden in the fog until it is close
let bioAcc=0;function biomeTick(dt){bioAcc+=dt;if(bioAcc<.3)return;const t=bioAcc;bioAcc=0;const k=state.biomeKey;
  if(k==='deserto'&&state.phase==='wave'){const p=dayPhase();if(p>.4&&p<.6){if(state.heatDay!==Math.floor(simTime/DAY_LEN)){state.heatDay=Math.floor(simTime/DAY_LEN);toast('☀️ Calor do meio-dia: soldados fora das muralhas se cansam.','r3')}
    for(const m of minions)if(m.role==='sol'&&m.wounded<=0&&!inside(m.pos.x,m.pos.z)&&!m.hero)m.hp=Math.max(1,m.hp-m.maxhp*.012*t)}}
  if(k==='neve'&&state.phase==='wave'){for(const e of enemies){if(e.dead||e.fly)continue;if(!(BIG(e.type)||e.type==='brute'||e.type==='ram'||e.type==='rammer'||e.type==='beetle'))continue;const x=Math.floor(e.pos.x),z=Math.floor(e.pos.z);const i=idx(x,GY-1,z);if(!inb(x,GY-1,z)||vox[i]!==18||blue[i])continue;
    if(Math.random()<t*(BIG(e.type)?2:.8)){for(const [dx,dz] of [[0,0],[1,0],[-1,0],[0,1],[0,-1]]){const j=idx(x+dx,GY-1,z+dz);if(inb(x+dx,GY-1,z+dz)&&vox[j]===18&&!blue[j]){setVox(j,0);setFluid(j,9,4,true);spawnDebris(x+dx+.5,GY,z+dz+.5,0xd8f3ff,3,.25)}}if(Math.random()<.3)label({x:e.pos.x,y:e.gy+1.8,z:e.pos.z},'o gelo racha!','#8fe3ff');e.slowT=Math.max(e.slowT||0,2)}}}
  if(k==='pantano'){const hide=state.phase==='wave'&&isNight();for(const e of enemies){if(e.dead)continue;const far=hide&&!BIG(e.type)&&Math.hypot(e.pos.x-CX,e.pos.z-CZ)>WR+14&&state.focus!==e;if(e.group.visible===far)e.group.visible=!far}}}
