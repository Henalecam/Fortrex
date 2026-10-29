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
