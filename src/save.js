// ───────── save / continue: a snapshot taken between waves (localStorage). It stores meaning, not internals:
// world voxels (run-length), state fields, minions, turrets, heroes and the realm — so saves survive game updates.
const SAVE_KEY='fortrex_save_v1';
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
    const d={v:1,at:Date.now(),wave:state.wave,diff:OPTS.diff||'normal',biome:state.biomeKey,simTime,state:st,
      vox:rleEnc(vox),looted:rleEnc(looted),rown:rleEnc(rown),
      minions:minions.map(m=>({role:m.role,r:m.rarity,name:m.name,lvl:m.lvl,xp:m.xp,trait:m.trait,kills:m.kills,hero:m.hero||null,x:m.pos.x,z:m.pos.z,eq:plain(m.eq)})),
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
    m.lvl=s.lvl||1;m.xp=s.xp||0;m.kills=s.kills||0;const eq=revive(s.eq||{});for(const k in m.eq)m.eq[k]=eq[k]||null;recompute(m);if(s.hero)m.maxhp*=2.5;m.hp=m.maxhp}
  // realm
  if(d.realm){const R=d.realm;REALM.facs.length=0;for(const f of R.facs)REALM.facs.push(f);REALM.cities.length=0;for(const c of R.cities)REALM.cities.push({...c,fac:REALM.facs[c.fac]||REALM.facs[0]});
    REALM.armies.length=0;REALM.pois.length=0;for(const p of revive(R.pois||[]))REALM.pois.push(p);REALM.t=R.t||0;REALM.spawnT=R.spawnT||100;REALM.poiT=R.poiT||45;REALM.nextId=R.nextId||REALM.cities.length+REALM.pois.length+5;REALM.log.length=0;for(const l of R.log||[])REALM.log.push(l);REALM.deco=null}
  if(state.merchant)$('bMerch').hidden=false;
  state.ups=state.ups||{};state.inv=state.inv||{blocks:{},turrets:[],armory:[]};
  renderGoals();refreshSaveUi();updateHud();cam.target.set(CX,GY+1.5,CZ);toast(`💾 Partida retomada na horda ${state.wave}`,'r4');return true}
function refreshSaveUi(){const d=readSave();const b=$('continue');if(b){b.hidden=!d;if(d)b.textContent=`▶ Continuar · horda ${d.wave}`}const s=$('saveInfo');if(s)s.textContent=d?`Último save: horda ${d.wave} · ${new Date(d.at).toLocaleString('pt-BR',{hour:'2-digit',minute:'2-digit',day:'2-digit',month:'2-digit'})}`:'Nenhum save ainda'}
