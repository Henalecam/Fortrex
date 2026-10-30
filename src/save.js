// ───────── save / continue: a snapshot taken between waves (localStorage). It stores meaning, not internals:
// world voxels (run-length), state fields, minions, turrets, heroes and the realm — so saves survive game updates.
const SAVE_KEY='fortrex_save_v1';const GAME_VERSION=0.62;
// player-facing changelog shown once when a save from an older version is continued
const CHANGES=[[0.42,'🔧 Sabotadores: duendes que desarmam as armadilhas dos Sapadores.'],[0.43,'🩸 Lua de sangue: evento com muitos inimigos de elite, mas cada abate rende material.'],
  [0.44,'⛏️ Veio de ouro disputado fora das muralhas — rende material, a horda tenta saquear.'],[0.45,'🌊 O fosso afoga aríetes e rastejadores.'],
  [0.46,'🏘️ Distritos: nas hordas 4, 10, 16 e 22 escolha Ferraria, Torre arcana, Celeiro, Mercado, Caserna ou Santuário.'],[0.47,'🐺 Caçada noturna: um lobo alfa ronda à noite e deixa tesouro raro.'],
  [0.48,'🔕 Menos avisos repetidos; inimigos tardios mais resistentes.'],[0.49,'🏛️ Maravilhas (Observatório, Catedral, Grande Muralha, Estátua) e dock do celular em 2 linhas.'],
  [0.50,'🗂️ Upgrades em abas (✨ Pronto mostra só o que dá para comprar) e esta tela de novidades.'],
  [0.51,'⭐ Talentos de herói nos níveis 3, 6 e 9; heróis não perdem mais a vida extra ao subir de nível; no celular os heróis ficam numa coluna própria.'],
  [0.52,'🤝 Socorro no reino: ajude uma fortaleza cercada e ela vira aliada (não ataca você e paga tributo a cada horda). Talentos aparecem na ficha do herói.'],
  [0.53,'🤝 Aliados mandam soldados quando uma fortaleza rival cerca você; aliadas aparecem com 🤝 no mapa do reino.'],
  [0.54,'🚩 Porta-estandarte inimigo (horda 12+): acelera e protege a horda ao redor; derrube-o para causar pânico. Mapa do reino mais legível no celular.'],
  [0.55,'🛡️ Égide do Guardião (horda 8+): botão no dock que deixa a cidadela quase invulnerável por 7 s, recarga de 100 s.'],
  [0.56,'⚡ Ímpeto: chamar a próxima horda nos primeiros 12 s de descanso rende material (o botão mostra quanto). Normal ficou um pouco mais difícil e o baú sofre o dobro de dano quando alcançado.'],
  [0.57,'💔 Pedaços do baú destruídos durante a horda só são reconstruídos no descanso (antes os reparadores refaziam na hora). A Engenheira ainda pode reerguê-los com Reconstrução.'],
  [0.58,'📦 Contador do baú no topo da tela aparece piscando quando ele perde pedaços, com aviso.'],
  [0.59,'🌀 Nova arma: Torre de vento (horda 8+) — rajada em cone que empurra a horda para trás e derruba escaladores.'],
  [0.60,'😡🔷 Chefes da horda 15+ podem vir Furiosos (enfurecem abaixo da metade da vida) ou com Escudo (bolha que absorve dano e se regenera se você parar de atacar). Torre de vento não empurra o mesmo inimigo de novo por 4 s.'],
  [0.61,'🔷 A barra do chefe mostra o escudo em azul listrado. 🏳️ Cada estandarte inimigo capturado dá +2% de dano permanente (até 15).'],
  [0.62,'🌋 Novo bioma: Ermo Vulcânico (em partidas novas) — muita lava e erupções durante as hordas: bombas de lava caem nas marcas laranja.']];
function showNews(since){const L=CHANGES.filter(([v])=>v>since+1e-9);if(!L.length)return;$('newsSub').textContent=`Desde a versão ${since.toFixed(2)} que você jogou:`;$('newsList').innerHTML=L.map(([v,t])=>`<li>${esc(t)} <span class="v">v${v.toFixed(2)}</span></li>`).join('');$('news').hidden=false;$('newsOk').onclick=()=>{$('news').hidden=true}}
const SAVE_SKIP=new Set(['running','card','focus','boss','healQ','rally','heroes','quest','caravan','volleys','build','choosing','heroOffer','bombMode','rallyMode','queue','starfall','blitz']);
function rleEnc(a){const out=[];let i=0;while(i<a.length){const v=a[i];let n=1;while(i+n<a.length&&a[i+n]===v&&n<65535)n++;out.push(v,n&255,n>>8);i+=n}
  const u=new Uint8Array(out);let s='';for(let k=0;k<u.length;k+=8192)s+=String.fromCharCode.apply(null,u.subarray(k,k+8192));return btoa(s)}
function rleDec(b64,a){const s=atob(b64);let p=0;for(let k=0;k+2<s.length;k+=3){const v=s.charCodeAt(k),n=s.charCodeAt(k+1)|(s.charCodeAt(k+2)<<8);a.fill(v,p,p+n);p+=n}}
function plain(v,depth=0){if(v===null||typeof v!=='object')return typeof v==='function'?undefined:v;if(depth>6)return undefined;
  if(v instanceof Map)return{$m:[...v].map(([k,x])=>[k,plain(x,depth+1)])};if(v instanceof Set)return{$s:[...v]};
  if(v.isObject3D||v.group||v.mesh||v.isVector3)return undefined;if(Array.isArray(v))return v.map(x=>plain(x,depth+1)).filter(x=>x!==undefined);
  const o={};for(const k in v){const x=plain(v[k],depth+1);if(x!==undefined)o[k]=x}return o}
function revive(v){if(v===null||typeof v!=='object')return v;if(Array.isArray(v))return v.map(revive);if(v.$m)return new Map(v.$m.map(([k,x])=>[k,revive(x)]));if(v.$s)return new Set(v.$s);const o={};for(const k in v)o[k]=revive(v[k]);return o}
function canSave(){return state.running&&state.phase==='rest'&&!state.choosing&&!battle()&&!state.quest&&!state.caravan&&!enemies.some(e=>!e.dead&&!e.alpha)}
function saveGame(manual){if(!canSave()){if(manual)toast('Só dá para salvar entre hordas, sem batalha ou missão em andamento','r0');return false}
  try{const st={};for(const k in state){if(SAVE_SKIP.has(k))continue;const x=plain(state[k]);if(x!==undefined)st[k]=x}
    const d={v:1,ver:GAME_VERSION,at:Date.now(),wave:state.wave,diff:OPTS.diff||'normal',biome:state.biomeKey,simTime,state:st,
      vox:rleEnc(vox),looted:rleEnc(looted),rown:rleEnc(rown),
      minions:minions.filter(m=>!m.allyHelp).map(m=>({role:m.role,r:m.rarity,name:m.name,lvl:m.lvl,xp:m.xp,trait:m.trait,kills:m.kills,hero:m.hero||null,x:m.pos.x,z:m.pos.z,eq:plain(m.eq)})),
      turrets:turrets.filter(t=>t.alive&&t.team!=='r').map(t=>({type:t.type,r:t.r,anchor:t.anchor})),
      realm:{t:REALM.t,spawnT:REALM.spawnT,poiT:REALM.poiT,nextId:REALM.nextId,facs:REALM.facs.map(f=>({...f})),cities:REALM.cities.map(c=>({...c,fac:c.fac.id})),pois:plain(REALM.pois),log:REALM.log.slice(-30)}};
    localStorage.setItem(SAVE_KEY,JSON.stringify(d));state.savedWave=state.wave;refreshSaveUi();if(manual)toast(`💾 Jogo salvo na horda ${state.wave}`,'r2');return true}
  catch(e){console.warn('save failed',e);if(manual)toast('Não foi possível salvar (armazenamento do navegador cheio ou bloqueado)','r0');return false}}
function readSave(){try{const s=localStorage.getItem(SAVE_KEY);return s?JSON.parse(s):null}catch(e){return null}}
// autosave once per wave, after the post-wave self-repair has finished
let saveAcc=0;function autosaveTick(dt){saveAcc+=dt;if(saveAcc<.5)return;saveAcc=0;if(state.savedWave===state.wave)return;if(canSave())saveGame(false)}
function loadGame(){const d=readSave();if(!d)return false;
  if(d.diff&&DIFFS[d.diff]){OPTS.diff=d.diff;saveOpts()}state.biome=d.biome;newGame();
  for(const m of minions)scene.remove(m.group);minions.length=0;for(const t of turrets)scene.remove(t.group);turrets.length=0;claimed.clear();
  const keep={running:true};Object.assign(state,revive(d.state),keep);state.heroes={};state.card=null;state.choosing=false;state.healQ=[];state.savedWave=d.wave;
  simTime=d.simTime||0;MAX_MINIONS_BONUS=(state.rank||0)*6;
  // world
  rleDec(d.vox,vox);if(d.looted)rleDec(d.looted,looted);if(d.rown)rleDec(d.rown,rown);buildBlueprint();
  fluids.clear();fluidSrc.clear();burning.clear();specials.clear();damaged.clear();pendingBooms.length=0;resetFluidSlots();resetVoxSlots();
  for(let i=0;i<N;i++){const m=vox[i];if(!m)continue;if(!MAT[m]){vox[i]=0;continue}if(FLUID(m)){hp[i]=4;fluids.add(i);fluidSrc.add(i)}else hp[i]=maxHpOf(m);if(m===15||m===19)specials.add(i)}
  if(state.vein&&Array.isArray(state.vein.cells))for(const i of state.vein.cells)if(vox[i]===19)hp[i]=MAT[19].hp*4;else if(state.vein&&!Array.isArray(state.vein.cells))state.vein=null;
  colS.fill(-1);colE.fill(-1);colT.fill(-1);for(let i=0;i<N;i++)if(vox[i])paint(i);initTufts();snapshotNature();voxDirty=true;fluidDirty=true;
  // army
  for(const T of d.turrets||[])if(TURRETS[T.type]&&vox[T.anchor])makeTurret(T.type,T.anchor,T.r||0);
  for(const s of d.minions||[]){let m;if(s.hero){const H=HEROES.find(h=>h.id===s.hero);if(!H)continue;spawnHero(H);m=state.heroes[H.id].m}else{if(!ROLES[s.role])continue;m=makeMinion(s.role,s.r||0,s.x,s.z);m.name=s.name||m.name;m.trait=s.trait||m.trait}
    m.lvl=s.lvl||1;m.xp=s.xp||0;m.kills=s.kills||0;const eq=revive(s.eq||{});for(const k in m.eq)m.eq[k]=eq[k]||null;recompute(m);m.hp=m.maxhp}
  // realm
  if(d.realm){const R=d.realm;REALM.facs.length=0;for(const f of R.facs)REALM.facs.push(f);REALM.cities.length=0;for(const c of R.cities)REALM.cities.push({...c,fac:REALM.facs[c.fac]||REALM.facs[0]});
    REALM.armies.length=0;REALM.pois.length=0;for(const p of revive(R.pois||[]))REALM.pois.push(p);REALM.t=R.t||0;REALM.spawnT=R.spawnT||100;REALM.poiT=R.poiT||45;REALM.nextId=R.nextId||REALM.cities.length+REALM.pois.length+5;REALM.log.length=0;for(const l of R.log||[])REALM.log.push(l);REALM.deco=null}
  if(state.merchant)$('bMerch').hidden=false;
  state.ups=state.ups||{};state.inv=state.inv||{blocks:{},turrets:[],armory:[]};
  renderGoals();refreshSaveUi();updateHud();cam.target.set(CX,GY+1.5,CZ);toast(`💾 Partida retomada na horda ${state.wave}`,'r4');showNews(+d.ver||0.41);setTimeout(()=>{for(const k in state.heroes||{})offerTalent(state.heroes[k].m)},2500);return true}
function refreshSaveUi(){const d=readSave();const b=$('continue');if(b){b.hidden=!d;if(d)b.textContent=`▶ Continuar · horda ${d.wave}`}const s=$('saveInfo');if(s)s.textContent=d?`Último save: horda ${d.wave} · ${new Date(d.at).toLocaleString('pt-BR',{hour:'2-digit',minute:'2-digit',day:'2-digit',month:'2-digit'})}`:'Nenhum save ainda'}
