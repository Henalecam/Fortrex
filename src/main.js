// ───────── main: waves, events, game flow, input, loop
const THEMES=[{k:'enxame',ico:'🐜',n:'Enxame',t:['crawler','imp','spider','slime'],w:1},{k:'matilha',ico:'🐺',n:'Matilha',t:['wolf','goblin','climber'],w:2},{k:'cerco',ico:'🪨',n:'Cerco',t:['ram','brute','sapper','cavador'],w:3},{k:'ceu',ico:'🦅',n:'Céu',t:['flyer','bombardeiro'],w:6},{k:'guarda',ico:'🛡️',n:'Guarda',t:['escudeiro','cavaleiro','beetle','cristal'],w:6}];
const T_UNLOCK={crawler:1,ram:1,imp:4,spider:4,slime:5,wolf:2,goblin:9,climber:3,brute:7,sapper:4,cavador:8,flyer:6,bombardeiro:9,escudeiro:6,cavaleiro:10,beetle:9,cristal:12};
// v10.7 (experimento, DESLIGADO — window.__thRot): tema principal e par não se repetem. Medido: deixa as hordas ~10% mais lentas em 12 sementes; causa não entendida
function pickThemes(w){const ok=THEMES.filter(T=>T.w<=w);const need=w>=5?2:1;
  if(!window.__thRot){const a=pick(ok);const rest=ok.filter(T=>T!==a);return need>1&&rest.length?[a,pick(rest)]:[a]}
  const prev=(state.thByW&&state.thByW[w-1])||[];let r;
  for(let t=0;t<12;t++){const mainOk=ok.filter(T=>T.k!==prev[0]);const a=pick(mainOk.length?mainOk:ok);const rest=ok.filter(T=>T!==a);r=need>1&&rest.length?[a,pick(rest)]:[a];
    const same=prev.length===r.length&&r.every(T=>prev.includes(T.k));if(!same)break}
  state.thByW=state.thByW||{};state.thByW[w]=r.map(T=>T.k);for(const k of Object.keys(state.thByW))if(+k<w-2)delete state.thByW[k];return r}
function applyThemes(list,w){const th=pickThemes(w);state.themes=th.map(T=>T.k);const pool=th.flatMap(T=>T.t.filter(t=>(T_UNLOCK[t]||1)<=w));if(!pool.length)return list;for(let i=0;i<list.length;i++)if(list[i]==='crawler'&&Math.random()<.55)list[i]=pick(pool);return list}
function waveSpec(w){const list=[];const extra=(t,from,k)=>{if(w>=from)for(let i=0;i<Math.floor((w-from+2)*k);i++)list.push(t)};extra('wolf',2,.5);extra('imp',4,.6);if((state.fieldTraps||[]).length>=6)extra('goblin',9,.25);extra('spider',4,.45);extra('slime',5,.35);extra('brute',7,.3);extra('beetle',9,.3);extra('escudeiro',6,.25);extra('cavador',8,.2);extra('bombardeiro',9,.18);extra('cavaleiro',10,.22);extra('cristal',12,.12);extra('portador',16,.25);if(w>=7&&Math.random()<.45)list.push('mimico');if(w>=15&&Math.random()<.4)list.push('mimico');const n=-Math.floor(list.length*.5)+6+Math.floor(w*2.6+(w>10?(w-10)*1.6:0)+(w>15?(w-15)*1.6:0)+(w>18?(w-18)*2:0)+(state.rank||0)*2);for(let i=0;i<n;i++)list.push('crawler');for(let i=0;i<Math.floor((w-1)/2+(w>12?(w-12)/2:0));i++)list.push('ram');
  if(w>=3)for(let i=0;i<Math.floor((w-1)/2);i++)list.push('climber');if(w>=4)for(let i=0;i<Math.floor(w/3);i++)list.push('sapper');
  if(w>=6)for(let i=0;i<Math.floor((w-3)/3);i++)list.push('flyer');if(w>=6)for(let i=0;i<Math.floor((w-3)/4);i++)list.push('shaman');
  if(w>12)for(let i=0;i<(w-12)*2;i++)list.push(pick(['crawler','climber','ram','sapper','flyer']));
  if(w>18)for(let i=0;i<(w-18)*3;i++)list.push(pick(['brute','beetle','spider','imp','wolf','knight']));
  {const k=DIFF().cnt;if(k<1){for(let i=list.length-1;i>=0;i--)if(Math.random()>k&&list[i]!=='boss')list.splice(i,1)}else{const extra=Math.round(list.length*(k-1));for(let i=0;i<extra;i++)list.push(list[(Math.random()*list.length)|0])}}
  if(w>=25)compactSwarm(list,w);applyThemes(list,w);shuffle(list);if(w%25===0){list.push('mistking');if(w>=50)list.push(bossOfWave(w))}else if(w%5===0){list.push(bossOfWave(w));if(w>=25)list.push(BOSS_ROT[(w/5+3)%BOSS_ROT.length])}return list}
const BOSS_ROT=['boss','golem','wyrm','colossus','necro','queen','titan'];function bossOfWave(w){return BOSS_ROT[(w/5-1)%BOSS_ROT.length]}
const EVENTS={
  elite:{n:'Horda de elite',d:'Devoradores mais fortes e rápidos. Recruta garantido.',css:'r1',w:3},
  mist:{n:'Noite de bruma',d:'Armas enxergam menos; Devoradores surgem perto. Material em dobro.',css:'r1',w:4},
  ambush:{n:'Emboscada',d:'Devoradores surgem dentro da ilha!',css:'r2',w:5},
  meteor:{n:'Chuva de meteoros',d:'Meteoros caem na ilha. Crateras, fogo e loot raro onde caem.',css:'r3',w:6},
  siege:{n:'Cerco',d:'Duas hordas seguidas sem descanso. Peça Épica garantida.',css:'r2',w:7},
  storm:{n:'Tempestade',d:'Raios caem na ilha e o vento espalha o fogo. Devoradores na água viram condutores.',css:'r2',w:5},
  pirates:{n:'Desembarque pirata',d:'Um navio encalha na borda da ilha e despeja piratas; seus canhões miram nas armas. Afunde-o para pegar o tesouro.',css:'r3',w:8},
  sandstorm:{n:'Tempestade de areia',d:'Areia no ar: as armas enxergam 35% menos e os inimigos correm mais.',css:'r2',w:4},
  blizzard:{n:'Nevasca',d:'Tudo fica lento e a água dos lagos congela em pontes de gelo.',css:'r2',w:6},
  quake:{n:'Terremoto',d:'O chão racha sob os pés: crateras, muralhas abaladas e inimigos derrubados.',css:'r3',w:7},
  eclipse:{n:'Eclipse',d:'A escuridão fortalece os inimigos (+1 raridade). Loot muito melhor.',css:'r3',w:9},
  cristal:{n:'Eclipse de cristal',d:'A lua cobre os Devoradores de cristal: são 20% mais duros, mas ao morrer se partem em cristais cheios de material.',css:'r3',w:10},
  aurora:{n:'Aurora boreal',d:'Cortinas de luz no céu: as armas atiram 15% mais rápido e alguns abates deixam fragmentos de aurora (itens raros).',css:'r3',w:12},
  bloodmoon:{n:'Lua de sangue',d:'A lua sangra: muitos inimigos de elite com afixos, mas cada abate rende +1 material e os soldados se curam ao matar.',css:'r3',w:10},
  rain:{n:'Chuva forte',d:'Chove sem parar: o fogo não pega, armas enxergam 10% menos e a horda escorrega na lama (10% mais lenta).',css:'r1',w:3},
  skies:{n:'Revoada',d:'O céu escurece de asas: boa parte da horda vem voando. Balistas e Tesla brilham.',css:'r2',w:9},
  golden:{n:'Horda dourada',d:'Todos os Devoradores são Raros ou acima. Curta e brutal.',css:'r3',w:8},
};
function rollEvent(w){const r=rollEvent0(w);if(r==='siege'&&w-(state.lastSiege||-99)<8)return null;return r}
function rollEvent0(w){if(hasMod('bruma')&&w>=2&&w%5!==0)return 'mist';if(w<3||w%5===0||Math.random()<.5)return null;const b=state.climate||'campo';const pool=[];for(const k of Object.keys(EVENTS)){if(EVENTS[k].w>w)continue;if(k==='ladrao'&&window.__noThief)continue;if(k==='barris'&&!window.__barrelsOn)continue;if(k==='sandstorm'&&b!=='deserto')continue;if(k==='rain'&&b==='deserto')continue;if(k==='blizzard'&&b==='deserto')continue;const n=(k==='blizzard'&&b==='neve')||(k==='sandstorm'&&b==='deserto')||(k==='mist'&&b==='pantano')?4:k==='ladrao'?2:1;for(let i=0;i<n;i++)pool.push(k)}return pick(pool)}
function startWave(){if(state.choosing||state.phase==='wave')return;state.wStart=simTime;if(window.__econOn){window.__chestDmg={};window.__turDmg={}}state.tailT=0;state.tailTy='';blessStart();state.bearerSpawned=false;state.phase='wave';state.wk=0;state.wwound=0;state.ev=window.__forceEv||(state.siege>0?'siege':rollEvent(state.wave));window.__forceEv=null;state.queue=(state.nextQ&&state.nextQ.w===state.wave)?state.nextQ.q.slice():waveSpec(state.wave);state.nextQ=null;if(state.ev==='skies'){const q=state.queue;for(let k=0;k<q.length;k++)if(!BIG(q[k])&&Math.random()<.4)q[k]='flyer';for(let k=0;k<Math.floor(state.wave/2);k++)q.push('flyer')}if(state.nextWaveMul){const n=Math.round(state.queue.length*(state.nextWaveMul-1));for(let k=0;k<n;k++)state.queue.push(state.queue[(Math.random()*state.queue.length)|0]);state.nextWaveMul=0}if(state.wave>=2)scatterTraps();state.meteorT=3;if(state.ev==='pirates'){const a=rnd(0,Math.PI*2);const s=makeEnemy('ship',2,clamp(CX+Math.cos(a)*44,6,W-7),clamp(CZ+Math.sin(a)*44,6,D-7));s.maxhp*=1+state.wave*.08;s.hp=s.maxhp;s.armor=0;if(!state.boss)showBoss(s)}if(isNight()){for(let k=0;k<Math.ceil(state.queue.length*.25);k++)state.queue.push(pick(['crawler','climber','flyer']));toast('É noite: a bruma vem mais forte','r2')}
  if(state.ev==='siege'&&state.siege===0){state.siege=2;state.lastSiege=state.wave}if(state.ev==='golden')state.queue=state.queue.slice(0,Math.ceil(state.queue.length*.5));
  state.spawnT=0;$('report').style.display='none';offerContract();state.champT=(state.wave>=8&&state.wave%5!==0&&!state.raid&&Math.random()<.12)?simTime+rnd(8,18):0;
  if(state.ev){const E=EVENTS[state.ev];toast(`${E.n}: ${E.d}`,E.css);$('event').style.display='inline-flex';$('event').textContent=E.n+(state.ev==='siege'?` ${3-state.siege}/2`:'');$('event').style.color=`var(--${E.css})`}else if(state.themes&&state.themes.length){const th=state.themes.map(k=>THEMES.find(T=>T.k===k)).filter(Boolean);$('event').style.display='inline-flex';$('event').textContent=th.map(T=>T.ico+' '+T.n).join(' · ');$('event').style.color=''}else $('event').style.display='none';
  const w=state.wave;if(w%25===0){toast(`Horda ${w}: 👑 O REI DA BRUMA invade! Ele se teleporta perto da cidadela e atordoa suas armas.`,'r4')}else if(w%5===0){const b=bossOfWave(w);const tip={boss:'cospe ácido',golem:'arremessa rochas nas armas',wyrm:'voa e solta bolas de fogo',colossus:'mire nas pernas',necro:'ergue mortos: mate os esqueletos para quebrar o escudo',queen:'invoca enxames',titan:'use água e gelo',runico:'fuja dos círculos azuis de runas; o raio rúnico abre a muralha',arauto:'o fim do abismo — junte tudo',mistking:'teleporta e trava as torres'}[b];toast(`Horda ${w}: ${ETYPES[b].n} nv ${1+Math.floor(w/5)} — ${tip}!`,'r4')}updateHud()}
function spawnFromQueue(dt){state.spawnT-=dt;if(state.spawnT>0||!state.queue.length)return;state.spawnT=rnd(.14,.4);const type=state.queue.shift();const side=rint(0,3),mg=state.ev==='mist'?6:1;let x,z;
  // waves come out of the mist on a ring around the citadel (the big map stays for battles, lairs and fortresses)
  {const a=rnd(0,Math.PI*2),r=rnd(54,72)*(state.ev==='mist'?.85:1);x=clamp(CX+Math.cos(a)*r,3,W-4);z=clamp(CZ+Math.sin(a)*r,3,D-4)}{const B=battle();if(B&&Math.abs(x-B.cx)<B.wr+6&&Math.abs(z-B.cz)<B.wr+6){x=W-x;z=D-z}}
  if(type==='wolf'){if(state.packN>0&&state.packPos){x=state.packPos.x+rnd(-2.5,2.5);z=state.packPos.z+rnd(-2.5,2.5);state.packN--}else{state.packPos={x,z};state.packN=rint(2,4)}}
  if(state.ev==='ambush'&&Math.random()<.5&&!BIG(type)){x=rnd(5,16);z=rnd(5,D-5);if(Math.random()<.5)x=W-x}
  let r=type==='titan'||type==='queen'?Math.max(3,rollRarity(.15)):type==='colossus'?Math.max(2,rollRarity(.1)):type==='boss'?Math.max(1,rollRarity(.05)):rollRarity(state.wave*.004);if(state.ev==='elite'||state.ev==='eclipse')r=Math.min(4,r+1);if(state.ev==='golden')r=Math.max(2,r);if(state.raid&&!BIG(type))r=Math.max(2,Math.min(4,r+1));
  const e=makeEnemy(type,r,x,z);if(type==='knight'&&state.wave>=12&&!state.bearerSpawned&&Math.random()<.5){state.bearerSpawned=true;makeBearer(e)}if(r>=4&&!BIG(type))label({x:e.pos.x,y:e.gy+2.4,z:e.pos.z},`✦ ${e.T.n} Lendário`,'#ff9b3d')}
function meteorTick(dt){state.meteorT-=dt;if(state.meteorT>0)return;state.meteorT=rnd(2,3.5);const near=Math.random()<.3;const x=near?rnd(WA-4,WB+4):rnd(2,W-2),z=near?rnd(WA-4,WB+4):rnd(2,D-2);
  const m=new THREE.Mesh(new THREE.DodecahedronGeometry(.8,0),lmat(0x5a3a2a,.6));m.position.set(x+12,GY+40,z-12);scene.add(m);bombs.push({mesh:m,x,z,vy:-30,vx:-9,vz:9,meteor:true})}
function endWave(){if(!state.raid)ECON.log.push({w:state.wave,th:(state.themes||[]).join('+'),mc:state.merch&&state.merch.w===state.wave?(state.merch.done||'?'):'',ev:state.ev||'',ch:state.climate||'',ws:Math.round(state.wStart||0),tail:Math.round(state.tailT||0),tt:state.tailTy||'',cd:window.__chestDmg?Object.entries(window.__chestDmg).sort((a,b)=>b[1]-a[1]).slice(0,3).map(([k,v])=>k+':'+Math.round(v)).join(' '):'',bq:(state.queue&&0)||'',t:Math.round(simTime),mat:Math.round(state.material),loot:ECON.matLoot,eq:Object.entries(ECON.dep).filter(([k])=>!k.startsWith('material')).map(([k,v])=>k+':'+v).join(' '),tu:state.inv.turrets.length+turrets.filter(t=>t.alive).length,mins:minions.length,ups:Object.values(state.ups).reduce((a,b)=>a+b,0),L:state.losses||0,U:state.unstuck||0,M:(()=>{let n=0;scene.traverse(o=>{if(o.isMesh)n++});return n})()});if(state.raid){raidStageEnd();return}const ev=state.ev;const fresh=state.wave>=(state.maxWave||1);state.wave++;state.maxWave=Math.max(state.maxWave||1,state.wave);diffBestSet(state.maxWave);blessOffer();econWaveEnd();try{recWaveEnd()}catch(e){}if(fresh&&(state.wave-1)%10===0)later(.9,()=>milestone(state.wave-1));chalRecord(state.wave);state.restStart=simTime;SFX.fanfare((state.wave-1)%5===0);state.morale=Math.min(100,(state.morale??60)+8);checkUnlocks();if(fresh)expansionTick();spawnVein();expeditionReturn();later(2.5,strangerVisit);climateWave();if(state.climate==='campo'){const g=Math.round(5+state.wave*1.5);state.material+=g;toast(`🌾 Colheita: +${g} material`,'r1')}{const A=REALM.cities.filter(c=>c.ally&&!c.fac.isMe);if(A.length){const g=A.reduce((s,c)=>s+4+c.lvl*2,0);state.material+=g;if(Math.random()<.5)toast(`🤝 Tributo dos aliados: +${g} material`,'r1')}}if(fresh&&BUILD_WAVES.includes(state.wave)&&!(state.buildings&&Object.keys(state.buildings).length>=BUILD_WAVES.indexOf(state.wave)+1))later(1.2,offerBuilding);if(state.merchant&&state.wave>state.merchant.until)merchantLeave();if(state.wave%3===1&&state.wave>1&&!state.merchant)merchantArrive();if(state.wave%7===0)startFestival();realmWaveIncome();startSelfRepair();addFame(fresh?4+state.wave*2:1);goalEvent('wave');if(!state.wwound)goalEvent('flawless');
  if(ev==='siege'&&state.siege>1){state.siege--;state.phase='rest';toast(`Cerco: horda ${3-state.siege} de 2. Sem descanso!`,'r2');startWave();return}
  if(ev==='siege'){state.siege=0;spawnLoot(CHEST.x+3,GY+3,CHEST.z+4,'treasure',3,{})}
  state.phase='rest';state.restT=15;$('event').style.display='none';
  if(ev==='mist'){const got=Math.floor(12+state.wave*1.5);state.material+=got;toast(`Noite de bruma: +${got} material`,'r1')}
  if(ev==='ambush')spawnLoot(CHEST.x-2,GY+3,CHEST.z+3,'treasure',2,{});
  if(ev==='elite')spawnLoot(CHEST.x-2,GY+3,CHEST.z+3,'recruit',Math.max(1,lootRarity(.1)),{role:pick(['sol','gun','med'])});
  $('report').style.display='block';$('report').innerHTML=resolveContract()+`Horda ${state.wave-1} vencida · melhor combo <b>×${state.comboBest}</b> · <b>${state.wk}</b> estilhaçados · <b>${state.wwound}</b> ferido${state.wwound===1?'':'s'} · <b>${loot.filter(L=>!L.carried).length}</b> itens no chão`;
  if(fresh&&(state.wave-1)%5===0)offerRewards();updateHud()}
function gameOver(){state.running=false;saveRecord();if(window.__chestLog)window.__chestLog.push('GAMEOVER '+new Error().stack.split('\n').slice(1,6).join(' < '));$('over').style.display='flex';$('overStat').textContent=`A Fortaleza caiu na horda ${state.wave} · ${state.kills} Devoradores estilhaçados`+(state.challenge?` · 🏆 recorde da semana: horda ${chalRecords()[state.challenge.week]||state.wave}`:'');refreshSaveUi();renderChal();{const b=$('continue'),d=readSave();if(b&&d)b.textContent=`↺ Voltar ao último save · horda ${d.wave}`}
  $('overTitle').textContent='A bruma venceu';$('overText').textContent='O baú foi devorado. Uma Fortaleza nunca morre de verdade: acorde de novo, com o que aprendeu.';$('start').textContent='Acordar de novo';showRecord();$('overAch').innerHTML=runStats()+achSummary()}

// ───────── bombardment + meteors
const bombs=[];
function dropBomb(x,z){state.material-=25;state.bombCd=15;state.bombMode=false;const m=new THREE.Mesh(new THREE.SphereGeometry(.6,10,10),lmat(0x2b2d4a,.5));const fst=!!window.__bombFast;m.position.set(x,GY+(fst?14:26),z);scene.add(m);bombs.push({mesh:m,x,z,vy:fst?-20:-14,vx:0,vz:0});SFX.pop();updateHud()}
function updateBombs(dt){for(let i=bombs.length-1;i>=0;i--){const b=bombs[i];b.vy-=30*dt;b.mesh.position.y+=b.vy*dt;b.mesh.position.x+=b.vx*dt;b.mesh.position.z+=b.vz*dt;b.mesh.rotation.x+=dt*4;
    if(b.meteor&&Math.random()<.7)spawnFlame(b.mesh.position.x,b.mesh.position.y,b.mesh.position.z,1.1);
    const p=b.mesh.position;if(p.y<=topY(p.x,p.z)+.3||p.y<GY-2){scene.remove(b.mesh);bombs.splice(i,1);const gy=Math.min(topY(p.x,p.z),GY);
      if(b.meteor){explode(p.x,gy+.2,p.z,3.4,85,{fire:true,src:'env'});spawnLoot(p.x,gy+1.5,p.z,'material',0,{amount:4});if(Math.random()<.35){const rr=Math.max(1,lootRarity(.1+state.luck));const [k,d]=lootPick('any',rr);spawnLoot(p.x,gy+1.5,p.z,k,rr,d)}}
      else if(b.enemy){explode(p.x,gy+.2,p.z,b.r,b.dmg,{fire:!!b.fire,src:'enemy'});shake=Math.max(shake,.35)}
      else {let nh=0;if(window.__bombRefund)for(const e of enemies)if(!e.dead&&!e.rival&&hyp(e.pos.x-p.x,e.pos.z-p.z)<state.bombR)nh++;explode(p.x,gy+.2,p.z,state.bombR,170*(window.__oldBomb?1:1+state.wave*.12),{fire:true,src:'player'});if(nh>=6){const cut=Math.min(9,nh-3);state.bombCd=Math.max(0,(state.bombCd||0)-cut);label({x:p.x,y:gy+3,z:p.z},`💣 ${nh} atingidos · recarga −${cut} s`,'#ffb13d');if(window.__bombLog)window.__bombLog.push(nh)}else if(window.__bombLog)window.__bombLog.push(nh)}}}}

// ───────── new game
function newGame(){_later.length=0;for(const e of enemies)scene.remove(e.group);enemies.length=0;for(const m of minions)scene.remove(m.group);minions.length=0;for(const L of loot)scene.remove(L.g);loot.length=0;
  for(const t of turrets)scene.remove(t.group);turrets.length=0;for(const p of projectiles)scene.remove(p.mesh);projectiles.length=0;for(const b of bombs)scene.remove(b.mesh);bombs.length=0;for(const s of shots)scene.remove(s.mesh);shots.length=0;for(const r of rings)scene.remove(r.m);rings.length=0;claimed.clear();fuses.length=0;
  Object.assign(state,freshState());state.running=true;setCenter(96,96);rivals.length=0;initRealm();closeRealm();initGoals();merchantLeave();for(const L of lanterns.slice())popLantern(L,true);state.heroes={};state.volleys=[];for(const H of HEROES)$('bHero_'+H.id).hidden=true;cam.target.set(CX,GY+1.5,CZ);hideBoss();closeCard();for(const id of ['reward','report'])$(id).style.display='none';$('event').style.display='none';for(const id of ['buildPanel','arsenal','shop'])$(id).style.display='none';
  genWorld();snapshotNature();toast(`${BIOME.ico} Bioma: ${BIOME.n}`,'r4');makeTurret('cannon',TOWER_ANCHORS[0],0);makeTurret('cannon',TOWER_ANCHORS[3],0);makeTurret('ballista',KEEP_ANCHORS[2],0);spawnRivalForces();updateModeUi();
  for(const [r,dx,dz] of [['rep',-3,4],['rep',3,4],['rep',0,-4],['col',-4,5],['col',4,5],['col',-5,3],['col',5,3],['gun',-5,-5],['gun',5,5],['sol',-2,6],['sol',2,6],['sol',0,7]])makeMinion(r,0,CX+dx,CZ+dz);
  state.inv.blocks={16:12,17:6,18:8,15:4,10:6,9:2,19:2};state.inv.turrets=[{type:'ballista',r:1},{type:'cannon',r:0}];
  state.inv.armory=[makeEquip(1,'espada'),makeEquip(0,'couro'),makeEquip(1,'luvas'),makeEquip(0,'botas')];for(const it of state.inv.armory.slice())autoEquip(it);
  toast('Fortaleza acordada. Abra Construir para editar a base.','r1');updateHud()}

// ───────── input
let dragging=false,moved=0,lx=0,ly=0,pinch=0,downBtn=0,lastHover=0,mtouch=false,mtEnd=0,tmx=0,tmy=0;
canvas.addEventListener('pointerdown',e=>{dragging=true;moved=0;downBtn=e.button;lx=e.clientX;ly=e.clientY;canvas.setPointerCapture(e.pointerId);if(state.build.on&&e.button===0&&!e.shiftKey&&(state.build.tool==='place'))craftDown(e.clientX,e.clientY)});
canvas.addEventListener('pointermove',e=>{const now=performance.now();if(now-lastHover>45&&state.running){lastHover=now;hoverAt(e.clientX,e.clientY)}
  if(!dragging||mtouch)return;const dx=e.clientX-lx,dy=e.clientY-ly;lx=e.clientX;ly=e.clientY;moved+=Math.abs(dx)+Math.abs(dy);if(moved<6)return;if(CRAFT.a!==null){craftMove(e.clientX,e.clientY);return}
  if(e.buttons===2||e.buttons===4||e.shiftKey){const s=cam.dist*.0016,sy=Math.sin(cam.yaw),cy=Math.cos(cam.yaw);cam.target.x=clamp(cam.target.x-(dx*cy-dy*sy)*s,0,W);cam.target.z=clamp(cam.target.z-(-dx*sy-dy*cy)*s,0,D)}
  else{cam.yaw-=dx*.006;cam.pitch=clamp(cam.pitch+dy*.005,.35,1.4)}});
canvas.addEventListener('pointerup',e=>{dragging=false;if(mtouch||mtEnd>performance.now()){CRAFT.a=null;CRAFT.cells=[];gInst.count=0;return}if(CRAFT.a!==null){const was=moved>=6;craftUp(was);if(was)return}if(moved<6)clickAt(e.clientX,e.clientY,downBtn===2)});
canvas.addEventListener('pointerleave',()=>{$('tip').style.display='none'});
canvas.addEventListener('contextmenu',e=>e.preventDefault());
canvas.addEventListener('wheel',e=>{e.preventDefault();cam.dist=clamp(cam.dist*(1+Math.sign(e.deltaY)*.08),14,200)},{passive:false});
canvas.addEventListener('touchstart',e=>{if(e.touches.length>=2){mtouch=true;CRAFT.a=null;CRAFT.cells=[];gInst.count=0;pinch=hyp(e.touches[0].clientX-e.touches[1].clientX,e.touches[0].clientY-e.touches[1].clientY);tmx=(e.touches[0].clientX+e.touches[1].clientX)/2;tmy=(e.touches[0].clientY+e.touches[1].clientY)/2}},{passive:true});
canvas.addEventListener('touchend',e=>{if(mtouch&&e.touches.length<2){mtouch=false;mtEnd=performance.now()+250;dragging=false}},{passive:true});
canvas.addEventListener('touchmove',e=>{if(e.touches.length===2){const p=hyp(e.touches[0].clientX-e.touches[1].clientX,e.touches[0].clientY-e.touches[1].clientY);cam.dist=clamp(cam.dist*(pinch/p),14,130);pinch=p;moved=99;const mx=(e.touches[0].clientX+e.touches[1].clientX)/2,my=(e.touches[0].clientY+e.touches[1].clientY)/2,dx=mx-tmx,dy=my-tmy;tmx=mx;tmy=my;const s=cam.dist*.0022,sy=Math.sin(cam.yaw),cy=Math.cos(cam.yaw);cam.target.x=clamp(cam.target.x-(dx*cy-dy*sy)*s,0,W);cam.target.z=clamp(cam.target.z-(-dx*sy-dy*cy)*s,0,D)}},{passive:true});
function clickAt(cx,cy,right){if(!state.running)return;
  if(state.rallyMode){const ray=rayFrom(cx,cy);const h=voxRay(ray.origin,ray.direction,true);if(h){setRally(ix(h.i)+.5,iz(h.i)+.5)}state.rallyMode=false;$('bRally').classList.remove('armed');return}
  if(state.bombMode){const ray=rayFrom(cx,cy);const h=voxRay(ray.origin,ray.direction,true);let px,pz;if(h){px=ix(h.i)+.5;pz=iz(h.i)+.5}else if(ray.direction.y<-1e-4){const t=(GY-ray.origin.y)/ray.direction.y;px=ray.origin.x+ray.direction.x*t;pz=ray.origin.z+ray.direction.z*t}
    if(px!==undefined&&px>0&&pz>0&&px<W&&pz<D)dropBomb(px,pz);else toast('Mire na ilha','r0');return}
  if(state.build.on){doBuild(cx,cy,right);return}
  const u=pickObj(cx,cy,[...lanterns.map(L=>L.g),...enemies.filter(e=>!e.dead).map(e=>e.group),...loot.filter(L=>!L.carried).map(L=>L.g),...minions.filter(m=>!m.away).map(m=>m.group),...turrets.filter(t=>t.alive).map(t=>t.group)]);
  if(!u){closeCard();return}
  if(u.lantern){popLantern(u.lantern,false);return}
  if(u.enemy){const e=u.enemy;if(state.focusCd<=0){state.focus=e;state.focusT=state.focusLong?8:5;state.focusCd=state.focusLong?10:14;toast(`Fogo Concentrado no ${e.T.n}!`,'r2');label({x:e.pos.x,y:e.gy,z:e.pos.z},'🔥 ALVO','#ec5f6b');updateHud()}else toast('Fogo Concentrado recarregando','r0');return}
  if(u.loot){const L=u.loot;if(L.kind==='treasure')openTreasure(L);else{L.prio=!L.prio;if(L.prio){label({x:L.x,y:L.y-1,z:L.z},'📌','#ff8a5c');if(L.claimed){L.claimed.task=null;L.claimed.state=L.claimed.bag.length?'haul':'idle';L.claimed=null}}}SFX.pop();return}
  if(u.minion){cardSlot=null;openCard({m:u.minion});return}
  if(u.turret){if(u.turret.webT>simTime){u.turret.webT=0;label({x:u.turret.pos.x,y:u.turret.pos.y+2,z:u.turret.pos.z},'teia rasgada!','#e8e0ff');SFX.pop();state.webFreed=(state.webFreed||0)+1;return}openCard({t:u.turret})}}
window.addEventListener('keydown',e=>{{const H=HEROES.find(h=>h.key===e.key.toUpperCase());if(H&&!state.build.on){heroAbility(H.id);return}}if(e.key==='h'||e.key==='H'){cam.target.set(CX,GY+1.5,CZ);return}if((e.key==='c'||e.key==='C')&&!state.build.on&&!e.ctrlKey&&!e.metaKey){openSide('codex');return}if(e.key==='m'||e.key==='M'){REALM.open?closeRealm():openRealm();return}if(e.key==='Escape'&&REALM.open){closeRealm();return}if(e.target.tagName==='INPUT')return;const k=e.key.toLowerCase();
  if(k===' '&&state.running&&state.phase==='rest'&&!state.choosing){e.preventDefault();startWave()}
  else if(k==='b'&&state.running)openSide('buildPanel');else if(k==='i'&&state.running)openSide('arsenal');else if(k==='u'&&state.running)openSide('shop');
  else if(k==='escape'){state.bombMode=false;closeCard();$('hire').style.display='none';if(state.build.on)closeSide('buildPanel');updateHud()}
  else if(k==='f'&&state.running)cycleSpeed();
  else if(k==='r'&&state.build.on&&state.build.tool==='prefab'){state.build.rot=((state.build.rot||0)+1)%4;renderBuild()}
  else if(k==='r'&&state.build.on){state.build.tool=state.build.tool==='remove'?'place':'remove';renderBuild()}
  else if((k==='='||k==='+')&&state.build.on){craftH(1)}else if((k==='-'||k==='_')&&state.build.on){craftH(-1)}
  keys[k]=true});
const keys={};window.addEventListener('keyup',e=>{keys[e.key.toLowerCase()]=false});
$('bBuild').onclick=()=>openSide('buildPanel');$('buildClose').onclick=()=>closeSide('buildPanel');
$('bArs').onclick=()=>openSide('arsenal');$('bCodex').onclick=()=>openSide('codex');$('codexClose').onclick=()=>closeSide('codex');$('arsClose').onclick=()=>closeSide('arsenal');
$('bShop').onclick=()=>openSide('shop');$('shopClose').onclick=()=>closeSide('shop');
for(const H of HEROES)$('bHero_'+H.id).onclick=()=>heroAbility(H.id);
$('optShake').onclick=()=>{OPTS.noShake=!OPTS.noShake;saveOpts();$('optShake').classList.toggle('on',!OPTS.noShake)};$('optShake').classList.toggle('on',!OPTS.noShake);$('optCine').onclick=()=>{OPTS.noCine=!OPTS.noCine;saveOpts();$('optCine').classList.toggle('on',!OPTS.noCine)};$('optCine').classList.toggle('on',!OPTS.noCine);
$('bMerch').onclick=()=>{const h=$('merch');const open=h.style.display!=='flex';h.style.display=open?'flex':'none';$('hire').style.display='none';if(open)renderMerch()};
$('bHire').onclick=()=>{const h=$('hire');const open=h.style.display!=='flex';if(open)for(const p of ['buildPanel','arsenal','shop','codex'])if($(p)&&$(p).style.display==='flex')closeSide(p);h.style.display=open?'flex':'none';if(open){renderHire();const t=$('ftip');if(t)t.style.display='none'}};
$('autoEq').onchange=e=>{state.autoEquip=e.target.checked;if(state.autoEquip)for(const it of state.inv.armory.slice())autoEquip(it);renderArsenal()};
$('abBtn').onclick=()=>{state.autoBuild=!state.autoBuild;updateHud()};
$('asBtn').onclick=()=>{state.autoSell=!state.autoSell;updateHud()};$('agBtn').onclick=()=>{state.autoGate=!state.autoGate;updateHud()};
$('arBtn').onclick=()=>{state.autoReward=!state.autoReward;updateHud()};
$('auBtn').onclick=()=>{state.autoUp=!state.autoUp;state.autoEquip=state.autoUp||state.autoEquip;updateHud()};
function cycleSpeed(){gameSpeed=SPEEDS[(SPEEDS.indexOf(gameSpeed)+1)%SPEEDS.length];$('speed').textContent=`⏩ ${gameSpeed}×`;$('speed').classList.toggle('on',gameSpeed>1);toast(`Velocidade ${gameSpeed}×`,'r0')}
$('speed').onclick=cycleSpeed;
$('next').onclick=()=>{if(state.phase==='rest'&&!state.choosing){const g=rushBonus();if(g>0){state.material+=g;toast(`⚡ Ímpeto: horda chamada cedo, +${g} material`,'r3');SFX.coin()}startWave()}};
$('raidBtn').onclick=sendRaid;$('recallBtn').onclick=recallRaid;
$('camHome').onclick=()=>{cam.target.set(CX,GY+1.5,CZ)};$('camRival').onclick=()=>{const R=battle();if(R)cam.target.set(R.cx,GY+1.5,R.cz)};
function updateModeUi(){$('raidBtn').hidden=!battle()}
$('bRealm').onclick=()=>REALM.open?closeRealm():openRealm();$('rivalChip').onclick=()=>{const B=battle();if(B&&!REALM.open){cam.target.set(B.cx,GY+1.5,B.cz)}else openRealm()};
$('autoMenu').onclick=e=>{e.stopPropagation();$('autoPop').classList.toggle('open')};addEventListener('pointerdown',e=>{const p=$('autoPop');if(p.classList.contains('open')&&!p.contains(e.target)&&e.target.id!=='autoMenu'&&!$('autoMenu').contains(e.target))p.classList.remove('open')});$('realmClose').onclick=closeRealm;$('realmCanvas').addEventListener('click',realmClick);
setInterval(()=>{if(REALM.open){drawRealm();if(Math.random()<.2)renderRealmInfo()}},120);
$('auto').onclick=()=>{state.auto=!state.auto;state.holdT=0;autoHoldUi(false);updateHud()};
$('snd').onclick=()=>{soundOn=!soundOn;if(soundOn)ac();$('snd').textContent=soundOn?'🔊':'🔇'};
$('focus').onclick=()=>toast('Clique num Devorador para concentrar o fogo de todas as armas','r0');
$('bWard').onclick=()=>{if(!wardUp())toast(state.phase!=='wave'?'A Égide só funciona durante a horda':'Égide recarregando','r0')};$('bGate').onclick=toggleGate;$('bRally').onclick=()=>{if(state.rally){state.rally=null;removeFlag();toast('Soldados voltam aos postos','r1',true);return}state.rallyMode=!state.rallyMode;$('bRally').classList.toggle('armed',state.rallyMode);if(state.rallyMode)toast('Clique onde os soldados devem se reunir','r2',true)};
$('bomb').onclick=()=>{if(state.bombCd>0){toast('Bombardeio recarregando','r0');return}if(state.material<25){toast('Precisa de 25 material','r0');return}state.bombMode=!state.bombMode;if(state.bombMode){if(state.build.on)closeSide('buildPanel');toast('Clique onde a bomba deve cair','r2')}updateHud()};
$('continue').onclick=()=>{$('over').style.display='none';if(!loadGame())newGame();if(!soundOn){soundOn=true;ac();$('snd').textContent='🔊'}};qualUi();$('optLow').onclick=()=>{const L=['leve','normal','alta'];const q=L[(L.indexOf(qual())+1)%3];OPTS.q=q;OPTS.lowGfx=q==='leve';saveOpts();applyQual();qualUi();toast(q==='leve'?'⚡ Qualidade leve: sem sombras, menos detalhes de longe (suavização volta ao reabrir)':q==='alta'?'✨ Qualidade alta: resolução cheia e detalhes até mais longe':'⚖️ Qualidade normal','r2',true)};$('optSave').onclick=()=>saveGame(true);refreshSaveUi();addEventListener('beforeunload',()=>{if(canSave()&&state.savedWave!==state.wave)saveGame(false)});
function renderChal(){const b=$('chalBtn');if(!b)return;const C=weeklyChallenge();const rec=chalRecords()[C.week];b.innerHTML=`🏆 Desafio da semana: ${C.mods.map(k=>CH_MODS[k].ico+' '+CH_MODS[k].n).join(' + ')} · ${BIOMES[C.biome].ico}${rec?` · recorde: horda ${rec}`:''}`;b.title=C.mods.map(k=>CH_MODS[k].n+': '+CH_MODS[k].d).join(' · ');
  b.onclick=()=>{$('over').style.display='none';state.biome=C.biome;newGame();state.challenge={week:C.week,mods:C.mods};if(hasMod('pobre')){state.material=10;state.inv.turrets=[]}toast(`🏆 Desafio da semana: ${C.mods.map(k=>CH_MODS[k].n+' ('+CH_MODS[k].d+')').join(' · ')}`,'r4',true);if(!soundOn){soundOn=true;ac();$('snd').textContent='🔊'}}}
renderChal();
$('start').onclick=()=>{state.biome='campo';state.climate=null;$('over').style.display='none';newGame();if(!soundOn){soundOn=true;ac();$('snd').textContent='🔊'}};

// ───────── loop
let last=performance.now(),hudAcc=0;
function resize(){renderer.setSize(innerWidth,innerHeight,false);camera.aspect=innerWidth/innerHeight;camera.fov=camera.aspect<1?42*Math.min(1.7,Math.pow(1/camera.aspect,.55)):42;camera.updateProjectionMatrix()}
window.addEventListener('resize',resize);resize();
function simulate(dt){simTime+=dt;
  if(state.running&&dt>0){
    if(state.phase==='wave'){spawnFromQueue(dt);if(state.ev==='meteor')meteorTick(dt);if(state.ev==='storm')stormTick(dt);if(!state.queue.length&&enemies.every(e=>e.dead||e.rival||e.thief||e.totem))endWave()}
    else if(state.auto&&!state.choosing){state.restT-=dt;if(state.restT<=0){if(choicePending()&&(state.holdT=(state.holdT||0)+dt)<20){autoHoldUi(true)}else{if(choicePending())choiceAutoResolve();state.holdT=0;autoHoldUi(false);startWave()}}}
    const _p=window.__simProf;let _t=_p?performance.now():0;const _mk=k=>{if(_p){const t=performance.now();_p[k]=(_p[k]||0)+t-_t;_t=t}};for(const e of enemies)updateEnemy(e,dt);_mk('enemies');for(let i=enemies.length-1;i>=0;i--)if(enemies[i].dead)enemies.splice(i,1);
    _mk('pre');for(const m of minions)if(!m.away)updateMinion(m,dt);_mk('minions');for(const t of turrets)updateTurret(t,dt);_mk('turrets');for(let i=turrets.length-1;i>=0;i--)if(!turrets[i].alive)turrets.splice(i,1);
    _mk('misc0');rivalTick(dt);heatTick(dt);lifeTick(dt);if(state.phase==='wave')weatherTick(dt);else if(hemi.color.getHex()!==0xfff6e8){hemi.color.setHex(0xfff6e8);hemi.groundColor.setHex(0x9fc5a8)}{const bv=$('bloodVig'),on=state.phase==='wave'&&state.ev==='bloodmoon';if(bv.hidden===on)bv.hidden=!on;const af=$('auroraFx'),ao=state.phase==='wave'&&state.ev==='aurora';if(af&&af.hidden===ao)af.hidden=!ao;const cf=$('crystalFx'),co=state.phase==='wave'&&state.ev==='cristal';if(cf&&cf.hidden===co)cf.hidden=!co;const rf=$('rainFx'),ro=state.phase==='wave'&&state.ev==='rain'&&!OPTS.lowGfx;if(rf.hidden===ro)rf.hidden=!ro}musicTick(dt);if(state.phase!=='wave')selfRepairTick(dt);autoSellTick(dt);heroTick(dt);moraleTick(dt);achTick(dt);festivalTick(dt);tipTick(dt);rallyTick(dt);trapTick(dt);oilTick(dt);veinTick(dt);districtTick(dt);huntTick(dt);allyTick(dt);bearerTick(dt);wardTick(dt);chestTick(dt);bossAffTick(dt);volcanoTick(dt);biomeTick(dt);dogTick(dt);buffTick(dt);gateTick(dt);lightTick(dt);crossbowTick(dt);dragonTick(dt);uniqueTick(dt);stuckTick(dt);champTick(dt);champAffTick(dt);markTick(dt);edgeTick(dt);blessTick(dt);laterTick();runicTick(dt);chestOilTick(dt);runeHeartTick(dt);_mk('ticks');cheerTick(dt);tailTick(dt);alchTick(dt);ghostTick(dt);faceLodTick(dt);enemyLodTick(dt);if(state.phase==='wave'&&state.ev&&state.cxW!==state.wave+state.ev){state.cxW=state.wave+state.ev;codexEv(state.ev)}contractTick(dt);raidTick(dt);navTick(dt);reformTick(dt);autosaveTick(dt);updateProjectiles(dt);updateShots(dt);updateRings(dt);updateBombs(dt);processBooms(dt);tickFire(dt);tickFluids(dt);tickSpecials(dt);if(settleDirty)settle();
    if(state.focusT>0)state.focusT-=dt;if(state.focusCd>0)state.focusCd-=dt;if(state.bombCd>0)state.bombCd-=dt;
    if(state.boss&&!state.boss.dead){const b=state.boss;$('bossFill').style.width=(Math.max(0,b.hp)/b.maxhp*100)+'%';$('bossShield').style.width=(b.shield>0?b.shield/b.maxhp*100:0)+'%';if(b.type==='colossus'){const n=b.legs.filter(L=>L.alive).length;$('bossName').textContent=`Colosso ${RARITY[b.rarity].n} · ${n} pernas`}}
    if(state.combo>=5&&simTime-state.comboT>1.6){const g=Math.floor(state.combo*.3);state.material+=g;label({x:CHEST.x,y:GY+4,z:CHEST.z},`Combo ×${state.combo} · +${g}`,'#ff8a5c');state.combo=0}
    $('combo').hidden=!(state.combo>=3&&simTime-state.comboT<1.6);if(!$('combo').hidden)$('combo').textContent=`×${state.combo}`;
    if(state.autoBuild||state.autoUp){state.mgAcc+=dt;if(state.mgAcc>2.5){state.mgAcc=0;if(state.autoBuild)autoBuildTick();if(state.autoUp)autoUpgradeTick()}}
    hudAcc+=dt;if(hudAcc>.25){hudAcc=0;updateHud()}}
  for(const k of fuses)k.material.emissiveIntensity=.4+Math.sin(simTime*20)*.4;
  updateDebris(dt);updateLoot(dt);updateFlames(dt);updateBeams(dt);updatePlan(dt)}
function frame(now){requestAnimationFrame(frame);if(window.__freeze){last=now;return}let dt=Math.min(.05,(now-last)/1000);last=now;const rdt=dt;if(hitstop>0){hitstop-=dt;dt*=.08}if(slowmo>0){slowmo-=rdt;dt*=.3}
  const pan=24*rdt*(cam.dist/70);const sy=Math.sin(cam.yaw),cy=Math.cos(cam.yaw);
  if(keys.w||keys.arrowup){cam.target.x-=sy*pan;cam.target.z-=cy*pan}if(keys.s||keys.arrowdown){cam.target.x+=sy*pan;cam.target.z+=cy*pan}
  if(keys.a||keys.arrowleft){cam.target.x-=cy*pan;cam.target.z+=sy*pan}if(keys.d||keys.arrowright){cam.target.x+=cy*pan;cam.target.z-=sy*pan}
  cam.target.x=clamp(cam.target.x,0,W);cam.target.z=clamp(cam.target.z,0,D);
  {const fm=state.ev==='mist'&&state.phase==='wave';const tn=fm?cam.dist*.95:cam.dist+30,tf=fm?cam.dist*2.1:cam.dist+150;scene.fog.near+=(tn-scene.fog.near)*Math.min(1,rdt*2);scene.fog.far+=(tf-scene.fog.far)*Math.min(1,rdt*2)}
  {const n=gameSpeed;for(let k=0;k<n;k++)simulate(dt)}updateLabels(rdt);placeCamera();if(state.cine&&state.cine.t>0){const C=state.cine;C.t-=rdt;cam.target.x+=(C.x-cam.target.x)*Math.min(1,rdt*3);cam.target.z+=(C.z-cam.target.z)*Math.min(1,rdt*3);cam.dist+=(26-cam.dist)*Math.min(1,rdt*2);cam.yaw+=rdt*.5;if(C.t<=0){cam.dist=C.d0;state.cine=null}}
  if(shake>0){shake-=rdt*2;if(!OPTS.noShake){camera.position.x+=rnd(-1,1)*shake*.25;camera.position.y+=rnd(-1,1)*shake*.25}}
  flushVox();if(!window.__headless)renderer.render(scene,camera)}
// test hooks
window.__step=s=>{const n=Math.round(s*60);for(let i=0;i<n;i++){hitstop=0;simulate(1/60);if(state.choosing){const c=$('rewardCards').children;if(c.length)c[Math.floor(Math.random()*c.length)].click()}}updateHud()};
window.__bomb=(x,z)=>{state.material+=25;dropBomb(x,z)};
window.__pdbg=()=>({proj:projectiles.length,kinds:projectiles.slice(0,5).map(p=>p.kind+'@'+p.mesh.position.x.toFixed(1)+','+p.mesh.position.y.toFixed(1)+','+p.mesh.position.z.toFixed(1)),guns:minions.filter(m=>m.role==='gun').slice(0,4).map(m=>`bow${(m.bowT||0).toFixed(1)} @${m.pos.x.toFixed(1)},${m.group.position.y.toFixed(1)},${m.pos.z.toFixed(1)}`),fl:enemies.filter(e=>e.fly&&!e.dead).map(e=>`${e.pos.x.toFixed(1)},${e.group.position.y.toFixed(1)},${e.pos.z.toFixed(1)} hp${Math.round(e.hp)} dive${e.diveY}`)});
window.__edbg=()=>enemies.filter(e=>!e.dead).map(e=>`${e.type} ${e.state} @${e.pos.x.toFixed(1)},${e.pos.z.toFixed(1)} gy${e.gy.toFixed(1)} surfE${surfE(e.pos.x,e.pos.z)} tgt${e.target>=0?ix(e.target)+','+iy(e.target)+','+iz(e.target)+' v'+vox[e.target]:'-'} hp${Math.round(e.hp)} stun${e.stun.toFixed(1)} fuse${e.fuse.toFixed(1)}`);
window.__vdbg=()=>({vcount,cnt:voxMesh.count,top:vslot[idx(5,GY-1,5)],exp:exposed(idx(5,GY-1,5)),m:vox[idx(5,GY-1,5)],sample:Array.from(voxMesh.instanceMatrix.array.slice(vslot[idx(5,GY-1,5)]*16,vslot[idx(5,GY-1,5)]*16+16)).map(v=>+v.toFixed(2)).join(','),cam:[camera.position.x,camera.position.y,camera.position.z].map(v=>v.toFixed(1)).join(','),fog:[scene.fog.near,scene.fog.far].map(v=>v.toFixed(0)).join(',')});
window.__dbg=()=>({wave:state.wave,mat:Math.floor(state.material),chest:chestAlive(),minions:minions.map(m=>`${m.role}:${m.state}${m.wounded>0?'W':''}`),enemies:enemies.length,queue:state.queue.length,loot:loot.length,lootFree:loot.filter(L=>!L.carried&&!L.claimed).length,
  turrets:turrets.map(t=>`${t.type}${t.gunner&&t.gunner.state==='man'?'*':''}:${Math.round(t.hp)}`),fluids:fluids.size,burning:burning.size,armory:state.inv.armory.length,inv:JSON.stringify(state.inv.blocks),ev:state.ev,plan:blueList.filter(i=>vox[i]!==blue[i]).length,planS:blueList.filter(i=>vox[i]!==blue[i]).slice(0,8).map(i=>`${ix(i)},${iy(i)},${iz(i)} v${vox[i]} b${blue[i]} s${+supported(i)} busy${+cellBusy(i)}`).join(' | '),kills:state.kills,cols:minions.filter(m=>m.role==='col').map(m=>`${m.state} t${m.timer.toFixed(1)} @${m.pos.x.toFixed(0)},${m.pos.z.toFixed(0)} y${m.group.position.y.toFixed(1)} wc${walkCell(Math.floor(m.pos.x),Math.floor(m.pos.z))} task${m.task&&m.task.L?Math.round(m.task.L.x)+','+Math.round(m.task.L.z):'-'} bag${m.bag.length}`),lootS:loot.filter(L=>!L.carried&&!L.claimed).slice(0,6).map(L=>`${L.kind}@${L.x.toFixed(0)},${L.y.toFixed(1)},${L.z.toFixed(0)} ok${+lootOK(L)} un${+(L.unreach>simTime)} rest${+L.rest}`)});
genWorld();placeCamera();requestAnimationFrame(frame);
// bot used by the headless test to exercise build/arsenal paths like a player would
window.__bot=()=>{const out=[];if(typeof forgeOpen==='function'&&forgeOpen()&&state.material>forgeCost()*2)forgeBuy(pick(['arma','armadura','acessorio']));if(state.blessOffer&&state.phase!=='wave')blessPick(state.blessOffer[0]);{const B=enemies.find(e=>e.bearer&&!e.dead);if(B&&state.focus!==B){state.focus=B;state.focusT=8;out.push('focus-bearer')}}if(state.phase==='wave'&&state.wave>=8&&(state.wardCd||0)<=0&&chestAlive()<(window.__botPlus?24:18)){wardUp();out.push('ward')}for(const H of HEROES){const S=state.heroes&&state.heroes[H.id];if(S&&S.cd<=0&&enemies.filter(e=>!e.dead&&hyp(e.pos.x-S.m.pos.x,e.pos.z-S.m.pos.z)<(H.id==='archer'?40:8)).length>=4){heroAbility(H.id);out.push('hero')}}state.autoBuild=true;state.autoUp=true;state.autoSell=true;if(state.merchant){renderMerch();const k=state.merchant.offers.findIndex(o=>!o.sold&&o.price<state.material*.5);if(k>=0){const b=document.querySelector(`[data-buy="${k}"]`);if(b){b.click();out.push('buy')}}}{const B=battle();if(B&&!minions.some(m=>m.raid)&&battleOdds(B.lvl).p>.45){sendRaid();out.push('raid')}if(!state.quest&&REALM.pois.length){const P=REALM.pois.find(q=>questOdds(q).p>.6);if(P&&acceptPoi(P))out.push('poi')}}
  if(state.phase==='wave'&&state.bombCd<=0&&state.material>60){const al=enemies.filter(e=>!e.dead&&!e.fly&&!e.rival);let best=null,bs=0;for(const e of al){const dC=hyp(e.pos.x-CX,e.pos.z-CZ);if(dC>WR+14)continue;let s=0;for(const o of al)if(Math.abs(o.pos.x-e.pos.x)<3.5&&Math.abs(o.pos.z-e.pos.z)<3.5)s+=BIG(o.type)?4:1;s*=dC<WR+3?1.5:1;if(s>bs){bs=s;best=e}}if(!best)best=al.find(e=>!inside(e.pos.x,e.pos.z));if(best&&!best.thief&&!best.totem&&(bs>=3||!inside(best.pos.x,best.pos.z))){{const T=window.__bombLead?(window.__bombFast?.5:.93):0,v=best.vel||{x:0,z:0};dropBomb(best.pos.x+v.x*T,best.pos.z+v.z*T)}out.push('bomb')}}
  if(state.phase!=='wave'&&typeof cheer==='function'&&cheerLeft()>0){for(const m of minions.filter(m=>m.role==='sol'&&!m.wounded&&m.cheerW!==state.wave).slice(0,cheerLeft()))cheer(m)}
  for(const L of loot)if(L.kind==='treasure'&&!L.carried){openTreasure(L);out.push('open');break}
  return out.join(' ')};
// ───────── auto-management: the fortress spends its own material sensibly (player can switch it off)
const wallTop=()=>GY+state.wallH-1;
const TURRET_SPOTS=()=>{const y=wallTop(),o=[...TOWER_ANCHORS,...KEEP_ANCHORS,...MID_ANCHORS(),...OUTPOST_ANCHORS,...(state.extraAnchors||[])];for(const k of [CX-6,CX+6]){o.push(idx(k,y,WA+1),idx(WA+1,y,k),idx(WB-1,y,k))}for(const k of [CX-7,CX+7])o.push(idx(k,y,WB-1));for(const k of [CX-11,CX+11])o.push(idx(k,y,WA+1),idx(k,y,WB-1));return o};
const TRAP_SPOTS=()=>{const o=[];for(let k=WA;k<=WB;k+=1){o.push(idx(k,GY,WA-2),idx(k,GY,WB+2),idx(WA-2,GY,k),idx(WB+2,GY,k))}for(let k=CX-4;k<=CX+3;k++)o.unshift(idx(k,GY,WB+3),idx(k,GY,WB+4));return o.filter(i=>surf(ix(i),iz(i))===GY)};
const MID_TOWERS=()=>[[CX-2,CZ-WR],[WA,CZ-2],[WB-3,CZ-2]];
const MID_ANCHORS=()=>MID_TOWERS().map(([x,z])=>idx(x+1,GY+TOWER_H-1,z+1));
const reserveMat=()=>40+state.wave*4;
// construction: decide where turrets, traps and new towers go, hire who is missing
function autoBuildTick(){const reserve=reserveMat();let acted=false;
  if(state.inv.turrets.length){state.inv.turrets.sort((a,b)=>TURRETS[b.type].v+b.r-(TURRETS[a.type].v+a.r));const spot=turretCount()<turretCap()?[...TURRET_SPOTS(),...MID_ANCHORS()].find(a=>vox[a]&&blue[a]&&!turretAt(a)&&!vox[a+W*D]):undefined;if(spot!==undefined){const t=state.inv.turrets.shift();makeTurret(t.type,spot,t.r,t.u);sparkle(ix(spot)+.5,iy(spot)+1.5,iz(spot)+.5,RARITY[t.r].c,8);toast(`Construção auto: ${TURRETS[t.type].n} instalada`,'r1');acted=true}}
  for(const m of [17,16,18,31,10]){if(!(state.inv.blocks[m]>0))continue;let sp=smartTrapSpot(m);if(sp<0&&m!==10)sp=TRAP_SPOTS().find(i=>!vox[i]&&!blue[i]&&!cellBusy(i));if(sp===undefined||sp<0)continue;placeBlue(sp,m);state.inv.blocks[m]--;state.prepaid.add(sp);acted=true;if(Math.random()<.15)toast(`Construção auto: ${MAT[m].n} no caminho dos Devoradores`,'r1');break}
  if(state.inv.blocks[19]>0){const sp=[idx(WA+5,GY,WA+5),idx(WB-5,GY,WA+5),idx(WA+5,GY,WB-5),idx(WB-5,GY,WB-5),idx(WA+6,GY,WA+5),idx(WB-6,GY,WB-5)].find(i=>!vox[i]&&!blue[i]&&!cellBusy(i));if(sp!==undefined){placeBlue(sp,19);state.inv.blocks[19]--;state.prepaid.add(sp);acted=true}}
  for(const m of [9]){if(!(state.inv.blocks[m]>0))continue;const sp=[idx(CX-6,GY-1,CZ+5),idx(CX+6,GY-1,CZ+5),idx(CX-6,GY-1,CZ-5),idx(CX+6,GY-1,CZ-5)].find(i=>vox[i]===13);if(sp!==undefined){setVox(sp,0);setFluid(sp,9,4,true);state.inv.blocks[m]--;acted=true}}
  // new towers on the walls once the economy allows (more places for weapons)
  if(state.material>reserve+70&&state.wave>=3){for(const [x,z] of MID_TOWERS()){const top=idx(x+1,GY+TOWER_H-1,z+1);if(blue[top])continue;for(let dx=0;dx<4;dx++)for(let dz=0;dz<4;dz++)for(let y=0;y<TOWER_H;y++){const i=idx(x+dx,GY+y,z+dz);if(!blue[i]||blue[i]===3)placeBlue(i,6)}toast('Construção auto: nova torre na muralha','r1');acted=true;break}}
  const want=Math.min(60,10+Math.floor(state.wave*1.3));if(minions.length<want){const n={};for(const m of minions)n[m.role]=(n[m.role]||0)+1;const guns=turrets.filter(t=>t.alive).length;
    const need=[['gun',guns-(n.gun||0)],['sol',Math.ceil(minions.length*.3)-(n.sol||0)],['rep',Math.ceil(minions.length*.2)-(n.rep||0)],['col',Math.max(4,Math.ceil(minions.length*.25))+Math.floor(loot.filter(L=>!L.carried&&!L.claimed).length/25)-(n.col||0)],['med',Math.floor(minions.length/8)-(n.med||0)]].sort((a,b)=>b[1]-a[1]);
    const nf=need.filter(([r])=>roleFree(r));const role=nf.length&&nf[0][1]>0?nf[0][0]:roleFree('sol')?'sol':null;if(role&&state.material>=hireCost(role)+reserve){hire(role);acted=true}}
  if(acted)refreshPanels()}
// upgrades: always replace the worst piece with a better one
const TIER=[3,4,14,20];
function autoUpgradeTick(){{const res=reserveMat();if(state.material>res*2){const pr=x=>x.c*(x.U.id==='masonry'?.5:x.U.id==='sappers'?.8:1);const o=UPGRADES.filter(U=>upReady(U)&&(state.ups[U.id]||0)<U.max).map(U=>({U,c:U.cost(state.ups[U.id]||0)})).sort((a,b)=>pr(a)-pr(b))[0];if(o&&state.material-o.c>res){state.material-=o.c;state.ups[o.U.id]=(state.ups[o.U.id]||0)+1;o.U.go();label({x:CHEST.x,y:GY+3,z:CHEST.z},`${o.U.ico} ${o.U.nm}`,'#4f9cf2')}}}const reserve=reserveMat();let acted=false;
  // walls: worst material first, closest to the gate first
  const walls=blueList.filter(i=>TIER.includes(blue[i])&&(baseBlue[i]===3||baseBlue[i]===4||state.custom.has(i))&&iy(i)>=GY).sort((a,b)=>TIER.indexOf(blue[a])-TIER.indexOf(blue[b])||hd({x:ix(a),z:iz(a)},GATE)-hd({x:ix(b),z:iz(b)},GATE));
  let n=0;for(const i of walls){if(n>=6)break;const t=TIER.indexOf(blue[i]);const next=TIER[t+1];if(!next)continue;
    if(next===4){if(state.material<reserve+30)break;state.material-=2;placeBlue(i,4);n++}
    else if((state.inv.blocks[next]||0)>0){state.inv.blocks[next]--;placeBlue(i,next);state.prepaid.add(i);n++}}
  if(n){acted=true;if(Math.random()<.3)toast(`Upgrade auto: ${n} bloco${n>1?'s':''} melhorado${n>1?'s':''}`,'r2')}
  // installed weapons: swap the weakest for a better one from the arsenal
  if(state.inv.turrets.length){const best=state.inv.turrets.slice().sort((a,b)=>TURRETS[b.type].v+b.r-(TURRETS[a.type].v+a.r))[0];const worst=turrets.filter(t=>t.alive).sort((a,b)=>TV(a)-TV(b))[0];
    if(worst&&TURRETS[best.type].v+best.r>TV(worst)+.4&&!TURRET_SPOTS().concat(MID_ANCHORS()).some(a=>vox[a]&&blue[a]&&!turretAt(a)&&!vox[a+W*D])){const anchor=worst.anchor;killTurret(worst,false);state.inv.turrets.push({type:worst.type,r:worst.r,u:worst.u});state.inv.turrets.splice(state.inv.turrets.indexOf(best),1);makeTurret(best.type,anchor,best.r,best.u);toast(`Upgrade auto: ${TURRETS[worst.type].n} → ${TURRETS[best.type].n} ${RARITY[best.r].n}`,RARITY[best.r].css);acted=true}}
  // equipment: everything goes to whoever gains most; forge triples
  for(const it of state.inv.armory.slice())if(autoEquip(it))acted=true;
  const g={};for(const it of state.inv.armory){const k=it.k+'|'+it.r;(g[k]=g[k]||[]).push(it)}for(const k in g)if(g[k].length>=3&&g[k][0].r<4){for(const o of g[k].slice(0,3))state.inv.armory.splice(state.inv.armory.indexOf(o),1);const nw=makeEquip(g[k][0].r+1,g[k][0].k);state.inv.armory.push(nw);toast(`Upgrade auto forjou ${nw.n} ${RARITY[nw.r].n}`,RARITY[nw.r].css);autoEquip(nw);acted=true;break}
  // fortress upgrades with spare material
  if(state.material>reserve+180){const U=[...(loot.length>60?['portal','magnet']:[]),'powder','gears','plating','tools','blades','infirm','explosive','magnet','portal','door','crit','greek','luck','bomb','general'].map(id=>UPGRADES.find(u=>u.id===id)).find(U=>(state.ups[U.id]||0)<U.max&&state.material>U.cost(state.ups[U.id]||0)+reserve+60);
    if(U){const lv=state.ups[U.id]||0;state.material-=U.cost(lv);state.ups[U.id]=lv+1;U.go();toast(`Upgrade auto: ${U.nm} ${lv+1}`,'r2');acted=true}}
  if(acted)refreshPanels()}

// ───────── storm: lightning strikes, wind feeds fires
let stormT=0;
function stormTick(dt){stormT-=dt;if(stormT>0)return;stormT=rnd(1.2,2.6);let x,z;const live=enemies.filter(e=>!e.dead);
  if(live.length&&Math.random()<.45){const e=pick(live);x=e.pos.x;z=e.pos.z}else{x=rnd(2,W-2);z=rnd(2,D-2)}
  const gy=topY(x,z);beam({x,y:gy+40,z},{x,y:gy,z});beam({x:x+rnd(-1,1),y:gy+25,z:z+rnd(-1,1)},{x,y:gy,z});
  explode(x,gy+.2,z,1.8,60,{fire:true,src:'env'});for(const e of live)if(e.inWater&&!e.dead&&hyp(e.pos.x-x,e.pos.z-z)<14)hurtEnemy(e,35,null);
  SFX.zap();SFX.boom(true);shake=Math.max(shake,.5);if(Math.random()<.12)spawnLoot(x,gy+1.5,z,'block',1,{m:15,n:2})}

// ───────── record (per viewer, browser storage)
function loadRec(){try{return JSON.parse(localStorage.getItem('fortrex-rec')||'{}')}catch(e){return{}}}
function saveRecord(){const r=loadRec();const n={wave:Math.max(r.wave||0,state.wave),kills:Math.max(r.kills||0,state.kills),combo:Math.max(r.combo||0,state.comboBest)};try{localStorage.setItem('fortrex-rec',JSON.stringify(n))}catch(e){}}
function showRecord(){const r=loadRec();$('overRec').textContent=r.wave?`Recorde: horda ${r.wave} · ${r.kills} estilhaçados · combo ×${r.combo}`:''}
setInterval(()=>{if(state.running)saveRecord()},15000);showRecord();
window.__rdbg=(t)=>{if(t==='win'){conquer(battle());return 'won'}if(t===60)sendRaid();if(t==='next'){const c=REALM.cities.find(o=>!o.fac.isMe);startBattle(c,'attack');return rivals.map(R=>R.cx+','+R.cz+':'+R.core.length+'/'+R.core.filter(i=>vox[i]===21).length+(R.alive?'A':'x')).join(' ')}return ' R:'+rivals.map(r=>(r.alive?'A':'x')+r.core.filter(i=>vox[i]===21).length).join('|')+' raid:'+minions.filter(m=>m.raid).length+' rv:'+enemies.filter(e=>e.rival&&!e.dead).map(e=>e.rmode[0]).join('')+' rt:'+turrets.filter(t=>t.team==='r'&&t.alive).length+' clk:'+$('clock').textContent+' nl:'+natLost.length/2+' rest:'+minions.filter(m=>m.resting).length+'/'+minions.length+' ph:'+state.phase};
window.__rpos=()=>({raiders:enemies.filter(e=>e.rival&&!e.dead&&e.rmode!=='guard').map(e=>e.type+'@'+e.pos.x.toFixed(0)+','+e.pos.z.toFixed(0)+' st'+e.state+(e.path?' p'+e.path.length:'')),sols:minions.filter(m=>m.role==='sol').map(m=>m.state+'@'+m.pos.x.toFixed(0)+','+m.pos.z.toFixed(0)+' w'+(m.wounded|0)+(m.raid?' R':'')),center:[CX,CZ]});
window.__realm=()=>({cities:REALM.cities.map(c=>c.name.slice(0,6)+':'+c.lvl+(c.fac.isMe?'*':'')+':'+Math.round(c.garrison)).join(' '),armies:REALM.armies.length,facs:new Set(REALM.cities.map(c=>c.fac.id)).size,log:REALM.log.slice(0,3).map(l=>l.txt),battle:battle()?battle().name:null,chunks:enemies.filter(e=>!e.dead&&e.chunks).slice(0,3).map(e=>e.type+':'+e.lost+'/'+e.chunks.length+' hp'+Math.round(e.hp/e.maxhp*100))});
window.__boss=(t,f)=>{const e=makeEnemy(t||'boss',2,CX+14,CZ+30);dmgEnemy(e,e.maxhp*(f||.55),true);cam.target.set(e.pos.x,GY+2,e.pos.z);cam.dist=42;return e.lost+'/'+e.chunks.length};
window.__matTrace=()=>{let v=state.material;const big={};Object.defineProperty(state,'material',{configurable:true,get(){return v},set(n){const d=n-v;if(d>0){const k=(new Error().stack.split('\n')[2]||'').trim().split(' (')[0];big[k]=(big[k]||0)+d}v=n}});window.__matBig=()=>Object.entries(big).sort((a,b)=>b[1]-a[1]).slice(0,6)};
window.__lootTrace=()=>{const big={};const orig=spawnLoot;window.__lt=big;spawnLootHook=(x,y,z,kind,r,data)=>{if(kind==='material'){const k=(new Error().stack.split('\n')[3]||'').trim().split(' (')[0];big[k]=(big[k]||0)+data.amount}}};
window.__fame=()=>({rel:state.relics,heroes:Object.keys(state.heroes||{}).join(','),exp:state.expStage||0,fame:state.fame,rank:RANKS[rankIdx()].n,c:state.contracts.map(c=>c.k+':'+Math.floor(c.p)+'/'+c.n)});
window.__matTrace2=()=>{window.__matTrace()};
window.__zoo=()=>{const ts=['goblin','crawler','wolf','spider','slime','imp','brute','beetle','climber','ram','shaman','sapper'];ts.forEach((t,k)=>{const e=makeEnemy(t,k%3,CX-14+k*2.8,WB+14);e.speed=0;e.T={...e.T,speed:0}});cam.target.set(CX,GY+1,WB+14);cam.dist=24;cam.pitch=.75};

// ───────── weather events: blizzard, earthquake, eclipse
let wxT=0;const _snow=new THREE.Color(0xe8f2fa),_dark=new THREE.Color(0x1d1e33),_blood=new THREE.Color(0x6a1622),_rain=new THREE.Color(0x8a97a8),_aur=new THREE.Color(0x1a3a48),_cry=new THREE.Color(0x2a2a5a);
const _sand=new THREE.Color(0xe8c98a);function weatherTick(dt){const ev=state.ev;if(ev==='sandstorm'){scene.background.lerp(_sand,.6);scene.fog.color.copy(scene.background);for(let k=0;k<4;k++)spawnDebris(cam.target.x+rnd(-30,30),GY+rnd(2,10),cam.target.z+rnd(-30,30),0xd9b56a,1,.1);return}if(ev!=='blizzard'&&ev!=='quake'&&ev!=='eclipse')return;wxT-=dt;
  if(ev==='blizzard'){scene.background.lerp(_snow,.55);scene.fog.color.copy(scene.background);for(let k=0;k<3;k++)spawnDebris(cam.target.x+rnd(-30,30),GY+rnd(12,20),cam.target.z+rnd(-30,30),0xffffff,1,.12);
    if(wxT<=0){wxT=.35;for(let k=0;k<6;k++){const x=rint(2,W-3),z=rint(2,D-3);const i=idx(x,GY-1,z);if(vox[i]===9){setVox(i,18);fluids.delete(i);fluidSrc.delete(i)}}}}
  if(ev==='rain'){scene.background.lerp(_rain,.5);scene.fog.color.copy(scene.background);sun.intensity*=.6;if(burning.size&&Math.random()<dt*3){for(const [i] of burning){burning.delete(i);paint(i)}}for(let k=0;k<6;k++)spawnDebris(cam.target.x+rnd(-35,35),GY+rnd(8,18),cam.target.z+rnd(-35,35),0x9fc6e8,1,.08)}
  if(ev==='bloodmoon'){scene.background.lerp(_blood,.55);scene.fog.color.copy(scene.background);sun.intensity*=.75;sun.color.setHex(0xff6a5a);hemi.color.setHex(0xff8a7a);hemi.groundColor.setHex(0x7a2a2a)}else if(ev!=='aurora'&&ev!=='cristal'&&hemi.color.getHex()!==0xfff6e8){hemi.color.setHex(0xfff6e8);hemi.groundColor.setHex(0x9fc5a8)}
  if(ev==='cristal'){scene.background.lerp(_cry,.5);scene.fog.color.copy(scene.background);sun.intensity*=.5;sun.color.setHex(0xb8e8ff);hemi.color.setHex(0xa8d8ff);hemi.groundColor.setHex(0x4a3a7a);if(Math.random()<dt*6)spawnDebris(cam.target.x+rnd(-35,35),GY+rnd(14,24),cam.target.z+rnd(-35,35),pick([0xc8f6ff,0x9fe8ff,0xd8b8ff]),1,.18)}
  if(ev==='aurora'){scene.background.lerp(_aur,.45);scene.fog.color.copy(scene.background);sun.intensity*=.55;hemi.color.setHex(0x9ff0d8);hemi.groundColor.setHex(0x3a4a7a);if(Math.random()<dt*10)spawnDebris(cam.target.x+rnd(-40,40),GY+rnd(22,32),cam.target.z+rnd(-40,40),pick([0x7dffc8,0x9fb8ff,0xd89fff]),1,.14)}
  if(ev==='eclipse'){scene.background.lerp(_dark,.7);scene.fog.color.copy(scene.background);sun.intensity*=.3;hemi.intensity*=.45}
  if(ev==='quake'&&wxT<=0){wxT=rnd(6,9);shake=Math.max(shake,1.3);SFX.boom(true);for(let k=0;k<3;k++){const a=rnd(0,Math.PI*2),r=rnd(12,50);const x=CX+Math.cos(a)*r,z=CZ+Math.sin(a)*r;explode(x,GY,z,2.2,35,{src:'env'})}
    for(const e of enemies)if(!e.dead&&!e.fly&&hyp(e.pos.x-CX,e.pos.z-CZ)<60)e.stun=Math.max(e.stun||0,1.2)}}
window.__ev=(k)=>{state.ev=k;$('event').style.display='inline-flex';$('event').textContent=EVENTS[k].n;state.phase='wave';state.queue=waveSpec(state.wave+3)};

window.__relic=t=>grantRelic(t);
window.__heroCard=()=>{grantRelic('boss');const S=Object.values(state.heroes||{})[0];if(S)openCard({m:S.m});return !!S};

window.__biome=b=>{state.biome=b};

function renderBiomes(){const el=$('biomes');if(!el)return;const cur=OPTS.biome||'rand';el.innerHTML=[['rand','🎲 Aleatório'],...Object.entries(BIOMES).map(([k,B])=>[k,`${B.ico} ${B.n.split(' ').slice(-1)[0]}`])].map(([k,n])=>`<button class="btn ${k===cur?'on':''}" data-bio="${k}" title="${k==='rand'?'Bioma sorteado':BIOMES[k].n}">${n}</button>`).join('');$('bioD').textContent=cur==='rand'?'Um bioma sorteado, cada um com sua regra.':`${BIOMES[cur].ico} ${BIOMES[cur].rule}`;for(const b of el.querySelectorAll('[data-bio]'))b.onclick=()=>{OPTS.biome=b.dataset.bio;saveOpts();renderBiomes()}}
function renderDiffs(){const el=$('diffs');if(!el)return;const cur=OPTS.diff||'normal';el.innerHTML=Object.entries(DIFFS).map(([k,D])=>`<button class="btn ${k===cur?'on':''}" data-diff="${k}">${D.ico} ${D.n}${diffBest(k)?`<small class="db">recorde h${diffBest(k)}</small>`:''}</button>`).join('');$('diffD').textContent=DIFF().d;for(const b of el.querySelectorAll('[data-diff]'))b.onclick=()=>{OPTS.diff=b.dataset.diff;saveOpts();renderDiffs()}}
renderDiffs();renderBiomes();$('overAch').innerHTML=achSummary();window.__diff=k=>{OPTS.diff=k};
window.__gameOver=()=>gameOver();
window.__king=()=>{const e=makeEnemy('mistking',3,CX+20,CZ+30);return e.blvl};
window.__fest=()=>startFestival();
window.__caravan=()=>{const P={id:999,kind:'caravan',lvl:2,x:150,y:480,ttl:100,n:10,E:9,name:'Caravana teste'};REALM.pois.push(P);return acceptPoi(P)};window.__q=()=>({q:!!state.quest,c:state.caravan?Math.round(state.caravan.hp)+'@'+state.caravan.x.toFixed(0)+','+state.caravan.z.toFixed(0):null,mat:Math.round(state.material)});
window.__rally=(x,z)=>setRally(x,z);
window.__aff=()=>{const c={};for(const e of enemies)if(!e.dead&&e.aff)c[e.aff]=(c[e.aff]||0)+1;return c};
window.__traps=()=>({dis:state.trapsDisarmed||0,oil:state.oilHits||0,hits:Math.round(state.trapHits||0),pl:state.trapPlaced||0,gone:state.trapGone||0,q:(state.healQ||[]).length,ph:state.phase,n:(state.fieldTraps||[]).filter(i=>vox[i]).length,tier:state.blockTier,mats:(()=>{const c={};for(const i of blueList)if(vox[i])c[vox[i]]=(c[vox[i]]||0)+1;return c})()});window.__mason=()=>{state.wave=Math.max(state.wave,20);for(let k=0;k<4;k++){state.ups.masonry=(state.ups.masonry||0)+1;upgradeMasonry()}};
window.__sap=n=>{state.ups.sappers=n;startWave();if(state.wave<2)scatterTraps()};window.__killAll=()=>{for(const e of enemies)e.dead=true};
window.__minCard=()=>{const m=minions.find(m=>!m.hero)||minions[0];openCard({m})};
window.__tier=n=>{for(let k=0;k<n;k++){const old=blue.slice();state.blockTier=(state.blockTier||0)+1;buildBlueprint();reformFrom(old)}};
window.__camSet=(d,x,z,yaw,pitch)=>{if(pitch!==undefined)cam.pitch=pitch;if(yaw!==undefined)cam.yaw=yaw;const i=(state.fieldTraps||[])[0];if(x!==undefined){cam.target.x=x;cam.target.z=z}else if(i!==undefined){cam.target.x=ix(i);cam.target.z=iz(i)}cam.dist=d||40};
window.__oil=n=>{state.ups.oil=n};
window.__save=()=>saveGame(true);window.__load=()=>loadGame();window.__saveSize=()=>(localStorage.getItem('fortrex_save_v1')||'').length;window.__sig=()=>({w:state.wave,mat:state.material,mins:minions.length,tur:turrets.length,vox:vox.reduce((a,b)=>a+(b?1:0),0),ups:JSON.stringify(state.ups),cities:REALM.cities.length,tier:state.blockTier,heroes:Object.keys(state.heroes||{}).join()});
window.__why=()=>({run:state.running,ph:state.phase,ch:state.choosing,b:!!battle(),q:!!state.quest,c:!!state.caravan,e:enemies.filter(e=>!e.dead).length,hq:(state.healQ||[]).length,sw:state.savedWave,w:state.wave});
window.__vein=()=>{state.wave=Math.max(6,state.wave);while(state.wave%4!==2)state.wave++;spawnVein();return state.vein&&{x:state.vein.x,z:state.vein.z,n:veinCells().length}};window.__veinN=()=>({n:veinCells().length,raid:enemies.filter(e=>!e.dead&&e.veinRaid).length,mat:state.material});
window.__bld=id=>{raiseBuilding(id);return JSON.stringify(state.buildings)};
window.__offer=()=>offerBuilding();
window.__hunt=()=>{simTime=(Math.ceil(simTime/DAY_LEN)+.6)*DAY_LEN;state.wave=Math.max(5,state.wave);for(let k=0;k<20&&!enemies.some(e=>e.alpha&&!e.dead);k++){state.huntNight=-1;huntTick(0)}return enemies.filter(e=>e.alpha&&!e.dead).length};
window.__dbgTal=()=>({tal:state.heroTal,hp:Object.keys(state.heroes||{}).map(k=>{const m=state.heroes[k].m;return k+':'+m.lvl+':'+Math.round(m.maxhp)})});
window.__aid=()=>{let P=null;for(let k=0;k<200&&!P;k++){const n=REALM.pois.length;const r=Math.random;Math.random=()=>0.01;try{spawnPoi()}finally{Math.random=r}P=REALM.pois.find(p=>p.kind==='aid')}if(!P)return 'nopoi';const ok=acceptPoi(P);return P.name+' ok='+ok};
window.__allies=()=>REALM.cities.filter(c=>c.ally).map(c=>c.name);
window.__siege=()=>{const c=REALM.cities.find(x=>!x.fac.isMe&&!x.ally);if(!c)return 'none';const A=REALM.cities.find(x=>!x.fac.isMe&&x!==c);if(A)A.ally=true;startBattle(c,'defend',30);return c.name+' ally='+(A&&A.name)};
window.__helpers=()=>minions.filter(m=>m.allyHelp).length;
window.__bearer=()=>{const e=makeEnemy('knight',1,CX+30,CZ);makeBearer(e);for(let k=0;k<5;k++)makeEnemy('crawler',0,CX+30+rnd(-2,2),CZ+rnd(-2,2));return e.maxhp};
window.__ward=()=>{state.wave=Math.max(8,state.wave);startWave();return wardUp()};
window.__chestHit=n=>{let k=0;for(const i of _chestVox)if(vox[i]===5&&k<n){removeVox(i,'enemy');k++}return chestAlive()};
window.__wind=()=>{const a=TOWER_ANCHORS[1];const t=makeTurret("wind",a,2);state.wave=Math.max(8,state.wave);startWave();return {x:t.pos.x,z:t.pos.z}};
window.__bossAff=k=>{state.wave=Math.max(15,state.wave);startWave();const e=makeEnemy('golem',2,CX+34,CZ);e.bossAff=k;if(k==='escudo'){e.shieldMax=e.maxhp*.3;e.shield=e.shieldMax}return {x:e.pos.x,z:e.pos.z,hp:Math.round(e.maxhp)}};
window.__dogs=n=>{state.ups.kennel=n;state.wave=Math.max(5,state.wave);startWave();return n};window.__bites=()=>state.dogBites||0;
window.__exp=()=>({x:state.expedition,away:minions.filter(m=>m.away).length});
window.__stranger=()=>{state.wave=Math.max(6,state.wave);state.lastStranger=-1;const h=window.__headless;window.__headless=false;const r=Math.random;Math.random=()=>0;try{strangerVisit()}finally{Math.random=r;window.__headless=h}return state.choosing};
window.__hero=id=>{const H=HEROES.find(h=>h.id===id);spawnHero(H);return !!state.heroes[id]};window.__useHero=id=>{heroAbility(id);return state.heroes[id].cd};
window.__gate=()=>{toggleGate();return state.gateClosed};
window.__mod=k=>{state.challenge={week:0,mods:[k]};return hasMod(k)};
window.__farol=()=>{state.ups.farol=1;raiseLighthouse();simTime=(Math.ceil(simTime/DAY_LEN)+.6)*DAY_LEN;return 1};
window.__xbow=n=>{state.ups.crossbow=n;startWave();return n};
window.__pathN=()=>{const p=findPath(CX-6.5,CZ-13.5,CX+6.5,CZ-13.5);const q=findPath(CX+.5,CZ-14.5,CX+4.5,CZ-8.5);const r=findPath(CX+.5,CZ-14.5,CX+.5,CZ-30);return (p?p.length:"none")+"/"+(q?q.length:"none")+"/"+(r?r.length:"none")+" w"+walkCell(CX,CZ-15)+","+walkCell(CX,CZ-14);return (p?p.length:'none')+'/'+(q?q.length:'none')};
window.__dragon=()=>{state.ups.dragon=1;state.wave=Math.max(8,state.wave);startWave();return 1};
window.__vetTop=()=>minions.filter(m=>m.role==="sol").map(m=>m.kills||0).sort((a,b)=>b-a).slice(0,4);
window.__vet=()=>{const m=minions.find(m=>m.role==="sol"&&!m.hero);for(let i=0;i<60;i++)vetKill(m);return [m.name,m.rank,m.kills,Math.round(m.maxhp),m.pos.x,m.pos.z]};
window.__dpos=()=>dragon?{x:dragon.g.position.x,z:dragon.g.position.z}:null;

// v1.0 sem game over: perder uma horda recua uma horda; navegação livre entre hordas já alcançadas
function waveLost(){if(state.retreating)return;if(state.raid){raidFail();return}state.retreating=true;const lost=state.wave;
  for(const e of enemies)if(!e.dead&&!e.rival){e.dead=true;scene.remove(e.group)}state.queue=[];state.contract=null;state.conStreak=0;state.siege=0;state.boss=null;state.ev=null;$('event').style.display='none';
  const pen=Math.floor(state.material*.15);state.material-=pen;state.maxWave=Math.max(state.maxWave||1,lost);state.wave=Math.max(1,lost-1);state.losses=(state.losses||0)+1;
  for(const i of _chestVox){setVox(i,5);hp[i]=maxHpOf(5)}for(const m of minions)if(m.wounded>0)m.wounded=Math.min(m.wounded,3);
  state.phase='rest';state.restStart=simTime;state.restT=25;state.wwound=0;startSelfRepair();
  $('report').style.display='block';$('report').innerHTML=`<b>A horda ${lost} rompeu o baú.</b> A cidadela recuou para a horda ${state.wave}${pen?` · −${pen} material`:''}. Fortaleça-se e tente de novo.<div class="rpb"><button class="btn sm" id="rpRetry">⚔️ Tentar a horda ${lost} agora</button>${state.wave>1?`<button class="btn sm" id="rpCalm">🌱 Jogar a ${state.wave} antes</button>`:''}</div>`;{const r=$('rpRetry'),c=$('rpCalm');if(r)r.onclick=()=>{waveNav(lost-state.wave);$('report').style.display='none';startWave()};if(c)c.onclick=()=>{$('report').style.display='none';startWave()}}
  toast(`↩️ Recuo: horda ${lost} perdida, de volta à ${state.wave}`,'r3',true);SFX.fanfare&&0;setTimeout(()=>{state.retreating=false},500);state.savedWave=-1;updateHud()}
function waveNav(d){if(state.phase==='wave'||state.choosing)return;const mx=state.maxWave||state.wave;const w=Math.max(1,Math.min(mx,state.wave+d));if(w===state.wave)return;state.wave=w;state.restT=Math.max(state.restT||0,12);state.savedWave=-1;updateHud();navUi()}
function navUi(){const p=$('wPrev'),n=$('wNext');if(!p)return;const mx=Math.max(state.maxWave||1,state.wave);const show=state.phase!=='wave'&&mx>1&&state.running;p.hidden=n.hidden=!show;if(show){p.disabled=state.wave<=1;n.disabled=state.wave>=mx;n.title=`Até a horda ${mx}`}}
$('wPrev').onclick=()=>waveNav(-1);$('wNext').onclick=()=>waveNav(1);
let _navT=0;function navTick(dt){_navT-=dt;if(_navT>0)return;_navT=.3;navUi()}
window.__lose=()=>{for(const i of _chestVox)if(vox[i]===5)removeVox(i,'enemy');checkChest();return [state.wave,state.maxWave,state.phase]};
window.__nav=d=>{waveNav(d);return [state.wave,state.maxWave]};

window.__spawnLook=(ts,n,x0,z0)=>{const out=[];for(let k=0;k<n;k++){const e=makeEnemy(ts[k%ts.length],0,(x0??CX+12)+(k%15)*2.2,(z0??CZ-14)+Math.floor(k/15)*2.6);e.stun=999;e.lineup=true;out.push(e)}enemyLodTick(1);return out};window.__killLook=(es)=>{for(const e of es){e.dead=true;scene.remove(e.group)}for(let i=enemies.length-1;i>=0;i--)if(enemies[i].lineup)enemies.splice(i,1);enemyLodTick(1)};
window.__clearArea=(x0,x1,z0,z1)=>{let n=0;for(let x=x0;x<=x1;x++)for(let z=z0;z<=z1;z++)for(let y=GY;y<GY+24;y++){if(!inb(x,y,z))continue;const i=idx(x,y,z);if(vox[i]){setVox(i,0);n++}}return n};
window.__lineup=()=>{const ts=(window.__lineupTypes||['crawler','wolf','spider','slime','imp','brute','beetle','climber','sapper','ram','flyer','shaman','goblin','crawler']);const out=[];ts.forEach((t,k)=>{const e=makeEnemy(t,0,CX+30+(k%7)*(window.__lineupGap||4.2),CZ-2+Math.floor(k/7)*6);e.stun=999;e.group.rotation.y=0;e.group.rotation.z=0;e.lineup=true;if(e.fly&&window.__lineupGround){e.group.position.y=GY+1.2}out.push(t+(e.fly?'@'+e.group.position.y.toFixed(1):''))});return out};
window.__lineupB=()=>{const ts=window.__lineupTypes||['boss','golem','wyrm','colossus','necro','queen','titan','mistking','arauto'];ts.forEach((t,k)=>{const e=makeEnemy(t,1,CX+22+(k%3)*13,CZ-14+Math.floor(k/3)*14);e.stun=999;e.group.rotation.y=0;e.group.rotation.z=0;e.lineup=true});return ts};
window.__hitAll=f=>{for(const e of enemies)if(!e.dead)dmgEnemy(e,e.maxhp*f,true);return enemies.filter(e=>!e.dead).length};
window.__einfo=t=>{const e=enemies.find(o=>!o.dead&&o.type===t);if(!e)return null;const im=e.vmeshes[0];const c=new THREE.Color();im.getColorAt(0,c);return {em:im.material.emissive.getHexString(),ei:im.material.emissiveIntensity,c0:c.getHexString(),hit:e.hit,afire:e.afire,n:im.count}};
window.__st=()=>state;
window.__natCnt=()=>{let n=0;for(let x=CX+24;x<=CX+36;x++)for(let z=CZ+24;z<=CZ+36;z++)for(let y=GY-4;y<GY+3;y++)if(vox[idx(x,y,z)])n++;return [n,natLost.length/2]};
window.__boom=()=>{explode(CX+30,GY,CZ+30,4,400,{src:'player'});return 1};
window.__spawnNew=()=>{const ts=['escudeiro','cavador','bombardeiro','mimico','cristal','cavaleiro'];ts.forEach((t,k)=>{const a=k/6*Math.PI*2;makeEnemy(t,0,CX+Math.cos(a)*50,CZ+Math.sin(a)*50)});return ts.length};
window.__newSt=()=>enemies.filter(e=>!e.dead&&['escudeiro','cavador','bombardeiro','mimico','cristal','cavaleiro','shard'].includes(e.type)).map(e=>e.type[0]+e.type[1]+':'+Math.round(hyp(e.pos.x-CX,e.pos.z-CZ))+(e.under?'u':'')+(e.surfaced?'S':'')+(e.dormant>0?'z':'')+(e.chg?'C':'')+(e.mounted===false?'d':'')).join(' ');

window.__econ=()=>ECON;
window.__dropFx=()=>{const ks=[['equip',2,{item:makeEquip(2)}],['turret',3,{type:'ballista'}],['equip',4,{item:makeEquip(4)}],['treasure',3,{}]];ks.forEach(([k,r,d],n)=>spawnLoot(CX+6+n*3,GY+1.5,CZ+24,k,r,d));const L=spawnLoot(CHEST.x,GY+2,CHEST.z+2,'equip',4,{item:makeEquip(4)});deposit(L,null);const L3=spawnLoot(CHEST.x,GY+2,CHEST.z+2,'equip',3,{item:makeEquip(3)});deposit(L3,null);return 1};
window.__ramChest=(type,W,n)=>{window.__etest(type,W,0);for(let k=0;k<n;k++){const a=k/n*Math.PI*2;const e=makeEnemy(type,0,CHEST.x+Math.cos(a)*2.4,CHEST.z+Math.sin(a)*2.4);e.gy=GY;}window.__rc={t0:simTime};return chestAlive()};window.__rcStat=()=>({t:Math.round(simTime-window.__rc.t0),chest:chestAlive(),hp:_chestVox.map(i=>Math.round(hp[i])).join('/'),alive:enemies.filter(e=>!e.dead&&!e.rival).length,st:enemies.filter(e=>!e.dead).map(e=>e.state+(e.target>=0?vox[e.target]:'')).join(' ')});
window.__enDbg=()=>({en:enemies.filter(e=>!e.dead).slice(0,4).map(e=>`${e.type}@${(e.pos.x-CHEST.x).toFixed(1)},${(e.gy-GY).toFixed(1)},${(e.pos.z-CHEST.z).toFixed(1)} ${e.state}${e.target>=0?':'+vox[e.target]:''} hp${Math.round(e.hp)}/${Math.round(e.maxhp)} in${inside(e.pos.x,e.pos.z)?1:0}`),sol:minions.filter(m=>m.role==='sol').slice(0,5).map(m=>`${m.state}@${(m.pos.x-CHEST.x).toFixed(0)},${(m.pos.z-CHEST.z).toFixed(0)}${m.wounded>0?'W':''}`),tur:turrets.filter(t=>t.alive&&t.team!=='r').map(t=>t.type+(t.tgt?'*':'')).join(',')});
window.__mem=()=>{let n=0;const G=new Set(),M=new Set();scene.traverse(o=>{n++;if(o.geometry)G.add(o.geometry);if(o.material)(Array.isArray(o.material)?o.material:[o.material]).forEach(m=>M.add(m))});return {blue:blueList.length,objs:n,boxc:_boxGeo.size,ugeo:G.size,umat:M.size,geo:renderer.info.memory.geometries,tex:renderer.info.memory.textures,scene:scene.children.length,marks:marks.length,later:_later.length,en:enemies.length,tur:turrets.length,lab:document.querySelectorAll('.lab').length,toast:(document.getElementById('toasts')||{children:[]}).children.length,dom:document.getElementsByTagName('*').length}};window.__dmg=()=>DMG_ACC;window.__bossDbg=()=>{const e=window.__runE;if(!e)return '';const tg=turrets.filter(t=>t.alive&&t.team!=='r'&&hd(t.pos,e.pos)<=turretRange(t)).length;const al=turrets.filter(t=>t.alive&&t.team!=='r');const nt=al.reduce((b,t)=>Math.min(b,hd(t.pos,e.pos)-turretRange(t)),999);return `tur${al.length} gap${Math.round(nt)} d${Math.round(hd(e.pos,CHEST))} sh${Math.round(e.shield||0)} ${e.state}${e.mv?':'+e.mv.k:''} inR${tg} gy${Math.round(e.gy-GY)} hp${Math.round(e.hp)}`};window.__lateGame=(W,mat)=>{state.wave=W;state.maxWave=Math.max(state.maxWave||1,W);state.material+=mat;window.__bossLog=[];return {w:state.wave,mat:Math.round(state.material),tur:turrets.filter(t=>t.alive&&t.team!=='r').length,min:minions.length}};
window.__etest=(type,W,n)=>{state.wave=W;state.maxWave=W;document.getElementById('next').click();state.queue=[];for(const e of enemies)if(!e.dead){e.dead=true;scene.remove(e.group)}
  window.__et={t0:simTime,miss0:blueList.filter(i=>blue[i]&&vox[i]!==blue[i]).length,chest0:chestAlive(),hurt:0,type};for(let k=0;k<n;k++){const a=k/n*Math.PI*2+.3;makeEnemy(type,0,CX+Math.cos(a)*52,CZ+Math.sin(a)*52)}return enemies.filter(e=>!e.dead).length};
window.__etStat=()=>{const T=window.__et;const al=enemies.filter(e=>!e.dead&&!e.rival);return {alive:al.length,t:Math.round(simTime-T.t0),blk:blueList.filter(i=>blue[i]&&vox[i]!==blue[i]).length-T.miss0,chest:T.chest0-chestAlive(),wounded:minions.filter(m=>m.wounded>0).length,turLost:turrets.filter(t=>!t.alive).length}};

window.__wtest=(type,r)=>{for(const t of turrets.slice())if(t.alive)killTurret(t,false);for(const m of minions.slice()){scene.remove(m.group)}minions.length=0;
  state.wave=8;document.getElementById('next').click();state.queue=[];for(const e of enemies)if(!e.dead){e.dead=true;scene.remove(e.group)}
  const an=TOWER_ANCHORS[2];const t=makeTurret(type,an,r||0);window.__wt={t,x:ix(an),z:iz(an),d0:DMG_ACC,t0:simTime,k0:state.kills};return t.T.n};
window.__wtick=()=>{const W=window.__wt;const alive=enemies.filter(e=>!e.dead).length;for(let k=alive;k<8;k++){const a=rnd(2.2,4.1),r=rnd(14,22);makeEnemy('crawler',0,W.x+Math.cos(a)*r,W.z+Math.sin(a)*r)}return {dps:+((DMG_ACC-W.d0)/Math.max(1,simTime-W.t0)).toFixed(1),kills:state.kills-W.k0}};

window.__noRole=r=>{state.banRole=r;for(const m of minions.slice())if(m.role===r&&!m.hero){releaseTask&&releaseTask(m);scene.remove(m.group);minions.splice(minions.indexOf(m),1)}return minions.length};
window.__rsum=()=>({w:state.wave,mat:Math.round(state.material),mins:minions.length,miss:blueList.filter(i=>blue[i]&&vox[i]!==blue[i]).length,kills:state.kills,losses:state.losses||0});
window.__cardTest=()=>{const m=minions.find(m=>m.role==='sol'&&!m.hero);m.lvl=6;for(const [r,sl] of [[4,'arma'],[3,'armadura'],[2,'acessorio']]){let it;for(let k=0;k<30;k++){it=makeEquip(r);if(it.slot===sl)break}state.inv.armory.push(it);equipItem(m,it)}recompute(m);openCard({m});return m.name};

window.__tlog=()=>TLOG;
window.__groundTest=()=>{const c=()=>{let n=0;for(let x=CX-20;x<=CX+20;x++)for(let z=CZ+18;z<=CZ+26;z++)for(let y=1;y<GY;y++)if(vox[idx(x,y,z)])n++;return n};const a=c();for(let k=0;k<6;k++)explode(CX-15+k*6,GY,CZ+22,4,500,{src:'enemy'});const b=c();explode(CX,GY,CZ+22,4,500,{src:'env'});return [a,b,c()]};
window.__minLineup=()=>{const out=[];['rep','col','gun','sol','med','rep','col','sol'].forEach((r,k)=>{const m=makeMinion(r,k%3,CX+36+k*2,CZ+4);m.state='idle';m.lineup=true;out.push(m)});for(const H of HEROES){spawnHero(H);const m=state.heroes[H.id].m;const k=HEROES.indexOf(H);m.pos.set(CX+37+k*2.4,standY(CX+37+k*2.4,CZ+8),CZ+8)}for(const m of minions.filter(m=>m.lineup||m.hero)){m.group.rotation.y=0;m.task=null;m.frozen=true}return out.length};
window.__alive=()=>enemies.filter(e=>!e.dead&&!e.rival).map(e=>e.type+'@'+Math.round(hyp(e.pos.x-CX,e.pos.z-CZ))+(e.under?'u':'')+(e.stun>0?'s':'')+'y'+Math.round(e.group.position.y-GY)+':'+e.state+(e.target>=0?'T':'')+(e.path?'P':'')+(e.fly?'F':'')).join(' ');
window.__battlePos=()=>{const B=battle();if(!B)return null;for(let k=0;k<3;k++){const e=spawnRivalUnit(B,'guard');}const g=makeEnemy('rammer',0,B.cx+3,B.cz+B.wr+6);g.rival=B;g.rmode='guard';g.home={x:g.pos.x,z:g.pos.z};B.guards.push(g);return {x:B.cx,z:B.cz,style:B.style,name:B.name}};
window.__champPos=()=>{const e=enemies.find(e=>e.champ&&!e.dead);return e?{x:e.pos.x,z:e.pos.z,n:e.champ,hp:Math.round(e.hp)}:null};
newsOnOpen();
window.__cam=()=>({x:+cam.target.x.toFixed(2),z:+cam.target.z.toFixed(2),d:+cam.dist.toFixed(2),yaw:+cam.yaw.toFixed(3),p:+cam.pitch.toFixed(3),cy:+camera.position.y.toFixed(1),ty:+cam.target.y.toFixed(1)});
window.__renderMs=(n)=>{n=n||5;const t0=performance.now();for(let i=0;i<n;i++)renderer.render(scene,camera);const g=renderer.getContext();g.finish&&g.finish();return +((performance.now()-t0)/n).toFixed(2)};
window.__setQual=q=>{OPTS.q=q;applyQual();return qual()};
window.__renderInfo=()=>({calls:renderer.info.render.calls,tris:renderer.info.render.triangles});
window.__drawBreak=()=>{const vis=o=>{for(let p=o;p;p=p.parent)if(!p.visible)return false;return true};const cnt=(roots)=>{let m=0,sh=0;for(const r of roots)r.traverse(o=>{if((o.isMesh||o.isInstancedMesh)&&vis(o)){m++;if(o.castShadow)sh++}});return [m,sh]};const enG=enemies.filter(e=>!e.dead).map(e=>e.group);const mG=minions.map(m=>m.group);const tG=turrets.filter(t=>t.alive).map(t=>t.group);const all=cnt([scene]);const en=cnt(enG),mi=cnt(mG),tu=cnt(tG);const perType={};for(const e of enemies){if(e.dead)continue;const c=cnt([e.group]);const k=e.type+(e._far?':far':':near');(perType[k]=perType[k]||[0,0]);perType[k][0]++;perType[k][1]+=c[0]}return {all,en,mi,tu,other:[all[0]-en[0]-mi[0]-tu[0],all[1]-en[1]-mi[1]-tu[1]],perType:Object.entries(perType).sort((a,b)=>b[1][1]-a[1][1]).slice(0,8).map(([k,v])=>k+' n'+v[0]+' meshes'+v[1])}};
window.__bpStats=()=>{let pend=0,uns=0,cost=0,hi=0;const ys={};for(const i of blueList){const b=blue[i];if(!b||vox[i]===b)continue;pend++;const y=iy(i)-GY;ys[y]=(ys[y]||0)+1;if(!supported(i))uns++;if(SPECIAL_BLOCKS.includes(b))cost++;if(y>12)hi++}const F={w:0,l:0,wIn:0,lIn:0,wSrc:0,lSrc:0,wMaxY:0};for(let i=0;i<vox.length;i++){const v=vox[i];if(v!==8&&v!==9)continue;const inC=Math.max(Math.abs(ix(i)-CX),Math.abs(iz(i)-CZ))<=WR+2;const yy=iy(i)-GY;F['y'+yy]=(F['y'+yy]||0)+1;if(v===9){F.w++;if(inC)F.wIn++;if(yy>F.wMaxY)F.wMaxY=yy}else{F.l++;if(inC)F.lIn++}}F.src=fluidSrc.size;F.srcIn=[...fluidSrc].filter(i=>Math.max(Math.abs(ix(i)-CX),Math.abs(iz(i)-CZ))<=WR+2).length;let fm=0;try{fm=fluidMesh.count}catch(e){}return {pend,uns,cost,hi,ys:Object.entries(ys).sort((a,b)=>b[1]-a[1]).slice(0,6),F,fluidMeshCount:fm,bud:state.rebBud,mat:Math.round(state.material)}};
window.__pickAt=(cx,cy)=>{const r=rayFrom(cx,cy);const h=voxRay(r.origin,r.direction,true);if(!h)return null;const i=h.i;return {i,m:vox[i],n:MAT[vox[i]]&&MAT[vox[i]].n,blue:blue[i],y:iy(i)-GY,hp:hp[i]}};
window.__pickObj=(cx,cy)=>{const r=new THREE.Raycaster();const v=new THREE.Vector2(cx/innerWidth*2-1,-(cy/innerHeight)*2+1);r.setFromCamera(v,camera);const hs=r.intersectObjects(scene.children,true).slice(0,5);return hs.map(h=>{const o=h.object;const mt=o.material||{};return {d:+h.distance.toFixed(1),type:o.type,inst:!!o.isInstancedMesh,geo:o.geometry&&o.geometry.type,op:mt.opacity,tr:mt.transparent,col:mt.color&&mt.color.getHexString(),y:+h.point.y.toFixed(1),vis:o.visible,cnt:o.count}})};
window.__hiStats=()=>{const o={n:0,sup:0,gapY:{},minY:99,maxY:0,cells:0};for(const i of blueList){const b=blue[i];if(!b||vox[i]===b)continue;const y=iy(i)-GY;if(y<=12)continue;o.n++;if(supported(i))o.sup++;o.minY=Math.min(o.minY,y);o.maxY=Math.max(o.maxY,y);const x=ix(i),z=iz(i);let k=iy(i)-1;while(k>0&&!SOLIDM(vox[idx(x,k,z)]))k--;const g=(iy(i)-k);const key=g>8?'>8':String(g);o.gapY[key]=(o.gapY[key]||0)+1}
 let lv={};for(const i of blueList){const b=blue[i];if(!b)continue;const y=iy(i)-GY;if(y<6||y>14)continue;if(Math.max(Math.abs(ix(i)-CX),Math.abs(iz(i)-CZ))>6)continue;lv[y]=lv[y]||[0,0];lv[y][0]++;if(vox[i]===b)lv[y][1]++}o.keepLevels=lv;return o};

// v10.7 EVENTO "Ladrão de tesouro": um duende com um saco de ouro dá a volta na ilha FORA do alcance da maioria das armas.
// Decisão do jogador: gastar a bomba, um poder de herói ou deixar uma arma de longo alcance cuidar dele — se cair, o saco rompe em material e um item raro; se não, foge em 30 s.
EVENTS.ladrao={n:'Ladrão de tesouro',d:'Um duende com um saco de ouro corre em volta da ilha por 30 s, longe das armas. Derrube-o com a bomba ou um herói e o saco se rompe.',css:'r3',w:5};
ETYPES.ladrao={hp:160,speed:3.2,dmg:0,rate:9,color:0x3a3f55,radius:.6,n:'Ladrão de tesouro'};SCX.ladrao=1.1;NEWLOOK.ladrao=1;
CREATURES.ladrao=function(sc,col,g){const {B,K,G,LG}=_mk(sc,g);const cloak=0x2b2d4a,skin=0x8fae5a,gold=0xffcf3d;
  const body=B(.46,.44,.36,cloak,0,.5,0);B(.5,.08,.4,0x5a3a22,0,.34,0);B(.1,.08,.04,gold,0,.34,.21);
  const head=B(.62,.54,.52,skin,0,.98,.04);B(.68,.2,.58,cloak,0,1.22,0);B(.66,.18,.1,cloak,0,1.0,-.26);for(const s of[-1,1])B(.24,.1,.08,skin,s*.42,1.02,0).rotation.z=s*.35;
  face(head,sc,.62,.54,.52,{sclera:0xffe25a,es:.14,ex:.14,ey:.08,brow:0x1d1f33,mood:.25,mouth:false},[[.64,.16,.05,0,-.12,.27,0,0,0x7a2d3a],[.16,.1,.05,0,-.04,.3,0,0,shadeHex(skin,-.15)]]);
  const sack=gear(g,sc,[[.62,.62,.56,0,0,0,0,0,0xb98d5a],[.2,.16,.2,0,.38,0,0,0,0x8a6a45],[.08,.08,.04,-.14,.1,.29,0,0,gold],[.08,.08,.04,.12,-.08,.29,0,0,gold],[.08,.08,.04,0,.2,.29,0,0,gold],[.06,.4,.06,-.2,.1,.2,0,.7,0x5a3a22]]);sack.position.set(0,.78*sc,-.42*sc);g.userData.sack=sack;
  G(.1,.1,.1,gold,.2,1.15,-.6,null,.9);G(.08,.08,.08,gold,-.18,1.18,-.55,null,.9);
  return{body,head,legs:LG([[-.12,.15,0,.14,.3],[.12,.15,0,.14,.3]],0x2b2d4a)}};
CX_DESC.ladrao='não ataca: corre em volta da ilha e foge em 30 s; derrubado, larga material e um item raro';
NEW_BRAINS.ladrao=function(e,dt){const R=WR+(window.__thR??21);if(e.ang===undefined){e.ang=Math.atan2(e.pos.z-CZ,e.pos.x-CX);e.life=window.__thL??18;e.dir=Math.random()<.5?1:-1}
  e.life-=dt;if(e.life<=0){if(window.__thLog)window.__thLog.push({w:state.wave,r:'fled'});e.dead=true;scene.remove(e.group);label({x:e.pos.x,y:e.gy+2,z:e.pos.z},'o ladrão fugiu!','#9aa0b2');toast('💨 O ladrão de tesouro fugiu com o saco.','r0');return true}
  e.ang+=e.dir*dt*e.speed/R;const x=CX+Math.cos(e.ang)*R,z=CZ+Math.sin(e.ang)*R;e.group.rotation.y=Math.atan2(x-e.pos.x,z-e.pos.z);e.pos.x=x;e.pos.z=z;e.gy=standY(x,z);
  e.group.position.set(x,e.gy+Math.abs(Math.sin(simTime*12))*.12,z);e.bob+=dt*9;const ud=e.group.userData;if(ud.sack)ud.sack.rotation.z=Math.sin(simTime*12)*.15;
  if(Math.random()<dt*2)spawnDebris(x,e.gy+1.2,z,0xffcf3d,1,.12);return true};
NEW_DEATH.ladrao=function(e){const amt=12+state.wave*2;spawnLoot(e.pos.x,e.gy+1.5,e.pos.z,'material',0,{amount:amt});const rr=Math.max(2,lootRarity(.15+state.luck));const [k,d]=lootPick('any',rr);spawnLoot(e.pos.x+.8,e.gy+1.5,e.pos.z,k,rr,d);
  for(let i=0;i<16;i++)spawnDebris(e.pos.x+rnd(-1,1),e.gy+rnd(.5,1.8),e.pos.z+rnd(-1,1),0xffcf3d,1,.18);label({x:e.pos.x,y:e.gy+2.4,z:e.pos.z},'o saco rompeu! +'+amt,'#ffcf3d');toast('💰 Ladrão derrubado: material e um item raro caíram fora das muralhas.','r3');state.thiefKills=(state.thiefKills||0)+1;if(window.__thLog)window.__thLog.push({w:state.wave,r:'kill',left:Math.round(e.life||0),hp:Math.round(e.maxhp)})};
const _sw107=startWave;startWave=function(){_sw107.apply(this,arguments);if(state.phase==='wave'&&state.ev==='ladrao'){const a=Math.random()*Math.PI*2,R=WR+(window.__thR??21);const e=makeEnemy('ladrao',2,CX+Math.cos(a)*R,CZ+Math.sin(a)*R);e.thief=1;e.maxhp=e.hp=150+state.wave*8;label({x:e.pos.x,y:e.gy+2.6,z:e.pos.z},'💰 ladrão!','#ffcf3d');state.thiefSeen=(state.thiefSeen||0)+1;if(window.__thLog)window.__thLog.push({w:state.wave,r:'spawn'})}};
const _ew107=endWave;endWave=function(){for(const e of enemies)if(e.thief&&!e.dead){e.dead=true;scene.remove(e.group);toast('💨 O ladrão de tesouro fugiu com o saco.','r0')}return _ew107.apply(this,arguments)};
window.__thiefPos=()=>{const e=enemies.find(o=>o.thief&&!o.dead);return e?[e.pos.x,e.pos.z]:null};
// o ladrão é escorregadio: tiros automáticos (armas, soldados, distritos) causam só 2,5%; a vida dele é baixa (150 + 8 por horda), então 1–2 bombas o derrubam — a bomba e os poderes de herói acertam em cheio
{const _de=dmgEnemy;dmgEnemy=function(e,d){if(e&&e.thief&&!window.__thFull){const st=new Error().stack||'';if(/updateTurret|updSol|updateProjectiles|crossbowTick|districtTick|updateShots|processBooms|dogTick|updateEnemy/.test(st)&&!/updateBombs|heroTick|heroAbility/.test(st))d*=(window.__thF??.025);if(window.__thSrc){const k=st.split('\n').slice(2,5).map(x=>(x.match(/at (\S+)/)||[])[1]).join('<');window.__thSrc[k]=(window.__thSrc[k]||0)+d}arguments[1]=d}return _de.apply(this,arguments)}}
window.__thiefLead=(t)=>{const e=enemies.find(o=>o.thief&&!o.dead);if(!e||e.ang===undefined)return null;const R=WR+(window.__thR??21);const a=e.ang+e.dir*t*e.speed/R;return [CX+Math.cos(a)*R,CZ+Math.sin(a)*R,e.hp]};
// v11.0: placar do Ladrão de tesouro no Códex e no aviso de abate (só exibição — não muda a simulação)
{const _rc=renderCodex;renderCodex=function(){_rc.apply(this,arguments);const s=state.thiefSeen||0;if(!s)return;const k=state.thiefKills||0;const el=$('codexSub');if(el)el.insertAdjacentHTML('beforeend',`<div class="cxr" style="margin-top:6px">💰 <b>Caçada ao ladrão:</b> ${k} derrubado${k===1?'':'s'} de ${s} visto${s===1?'':'s'}${k>=10?' · 🏆 Terror dos ladrões':k>=5?' · 🥇 Caçador de tesouros':k>=1?' · primeira captura':''}</div>`)}}
{const _nd=NEW_DEATH.ladrao;NEW_DEATH.ladrao=function(e){_nd(e);const k=state.thiefKills||0;if(k===1||k===5||k===10)toast(k===1?'🏅 Primeiro ladrão derrubado! (Códex)':k===5?'🥇 Caçador de tesouros: 5 ladrões derrubados':'🏆 Terror dos ladrões: 10 ladrões derrubados','r4',true)}}
// v11.1 (experimento DESLIGADO — window.__blessBias): oferta sempre com a bênção 'do tema'. Medido: hordas 39 s mais lentas (as bênçãos 'temáticas' limpam mais devagar que a média)
const BLESS_MATCH={ceu:'alcance',cerco:'muralha',guarda:'furia',enxame:'colheita',matilha:'vigor'};
function blessBias(){state.blessMatch=null;if(window.__fixBless&&state.blessOffer){state.blessOffer[0]=window.__fixBless;return}if(!window.__blessBias||!state.blessOffer)return;try{nextPreview()}catch(e){}const k=state.themes&&state.themes[0];const m=BLESS_MATCH[k];if(!m)return;const O=state.blessOffer;if(!O.includes(m))O[1]=O[0],O[0]=m;else if(O[1]===m){O[1]=O[0];O[0]=m}state.blessMatch={k:m,th:k}}
{const _rb=renderBless;renderBless=function(){_rb.apply(this,arguments);const M=state.blessMatch,el=$('bless');if(!M||!el||!state.blessOffer)return;const T=THEMES.find(t=>t.k===M.th);const b=el.querySelector(`button[data-k="${M.k}"]`);if(b&&T&&!b.querySelector('.bm'))b.insertAdjacentHTML('beforeend',`<span class="bm" style="grid-column:2;font-size:11px;color:#2e7d4f;font-weight:700">🎯 boa contra ${T.ico} ${T.n}</span>`)}}

// v11.4 EVENTO "Totem de guerra": um totem inimigo finca-se perto da muralha; enquanto estiver de pé, os tambores aceleram a horda em volta (+25% de velocidade num raio de 12).
// Decisão: derrubar o totem (armas, bomba, heróis) ou segurar a horda acelerada. Derrubado, larga material.
if(window.__totemOn)EVENTS.totem={n:'Totem de guerra',d:'Um totem inimigo surge perto da muralha e seus tambores aceleram a horda em volta (+25%). Derrube-o e ele larga material.',css:'r2',w:7};
ETYPES.totem={hp:300,speed:0,dmg:0,rate:9,color:0x6b3a2a,radius:1.1,n:'Totem de guerra'};SCX.totem=1.2;NEWLOOK.totem=1;
CREATURES.totem=function(sc,col,g){const {B,K,G,LG}=_mk(sc,g);const wood=0x6b3a2a,dk=0x3e2418,red=0xd9414f,bone=0xeae2cf;
  const body=B(.7,1.0,.7,wood,0,.5,0);B(.9,.18,.9,dk,0,.08,0);
  const head=B(.8,.7,.76,shadeHex(wood,.12),0,1.38,0);B(.84,.62,.72,shadeHex(wood,-.05),0,2.05,0);
  face(head,sc,.8,.7,.76,{noEyes:1,brow:null,mouth:false},[[.2,.12,.04,-.18,.08,.39,0,0,0x1d1f33],[.2,.12,.04,.18,.08,.39,0,0,0x1d1f33],[.3,.08,.05,-.18,.2,.4,0,-.35,dk],[.3,.08,.05,.18,.2,.4,0,.35,dk],[.5,.12,.05,0,-.2,.39,0,0,0x2a1410],...[-2,-1,0,1,2].map(k=>[.06,.1,.04,k*.1,-.17,.42,0,0,bone]),
    [.18,.1,.04,-.18,.75,.37,0,0,0x1d1f33],[.18,.1,.04,.18,.75,.37,0,0,0x1d1f33],[.4,.08,.05,0,.56,.38,0,0,0x2a1410],[.12,.5,.12,-.5,1.05,0,0,.5,bone],[.12,.5,.12,.5,1.05,0,0,-.5,bone],[.5,.06,.5,0,1.02,0,0,0,red]]);
  g.userData.eyes=_eyes(G,0xff5a3a,[[.12,.08,-.18,1.46,.4],[.12,.08,.18,1.46,.4]]);
  const drum=gear(g,sc,[[.5,.4,.5,0,0,0,0,0,red],[.54,.06,.54,0,.2,0,0,0,bone],[.54,.06,.54,0,-.2,0,0,0,bone]]);drum.position.set(.7*sc,.6*sc,.2*sc);g.userData.drum=drum;
  K(.05,.9,.05,dk,-.55,1.9,-.2);K(.04,.3,.4,red,-.55,2.2,0);
  return{body,head,legs:[]}};
CX_DESC.totem='não anda nem ataca: acelera em 25% os inimigos num raio de 12 enquanto estiver de pé';
NEW_BRAINS.totem=function(e,dt){e.vel&&e.vel.set(0,0,0);e.group.position.set(e.pos.x,e.gy,e.pos.z);e.pulse=(e.pulse||0)-dt;const ud=e.group.userData;if(ud.drum)ud.drum.scale.y=1+Math.max(0,Math.sin(simTime*9))*.15;
  if(e.pulse<=0){e.pulse=.5;if(!window.__oldTotem)for(const o of enemies){if(o.dead||o===e||o.rival||o.fly)continue;if(Math.abs(o.pos.x-e.pos.x)<12&&Math.abs(o.pos.z-e.pos.z)<12&&hyp(o.pos.x-e.pos.x,o.pos.z-e.pos.z)<12)o.totemBuff=simTime+.7}
    if(!e.mk||simTime-e.mk>3){e.mk=simTime;markGround(e.pos.x,e.pos.z,12,0xd9414f,3)}}return true};
NEW_DEATH.totem=function(e){const amt=10+state.wave;spawnLoot(e.pos.x,e.gy+1.5,e.pos.z,'material',0,{amount:amt});for(let i=0;i<18;i++)spawnDebris(e.pos.x+rnd(-1,1),e.gy+rnd(.5,2.5),e.pos.z+rnd(-1,1),0x6b3a2a,1,.25);label({x:e.pos.x,y:e.gy+3,z:e.pos.z},'o totem caiu! +'+amt,'#ffcf3d');toast('🪵 Totem de guerra derrubado: os tambores silenciaram.','r2');state.totemKills=(state.totemKills||0)+1;if(window.__toLog)window.__toLog.push({w:state.wave,r:'kill',t:Math.round(simTime-e.born0),mx:Math.round(e.maxhp),hp:Math.round(e.hp)})};
{const _sw=startWave;startWave=function(){_sw.apply(this,arguments);if(state.phase==='wave'&&state.ev==='totem'){const a=Math.atan2(GATE.z-CZ,GATE.x-CX)+(Math.random()-.5)*1.2,R=WR+(window.__toR??10);const x=CX+Math.cos(a)*R,z=CZ+Math.sin(a)*R;const e=makeEnemy('totem',1,x,z);e.totem=1;e.maxhp=e.hp=(window.__toHp??4000)+state.wave*(window.__toHpW??900);e.born0=simTime;e.pos.x=x;e.pos.z=z;e.gy=standY(x,z);label({x,y:e.gy+3.4,z},'🥁 totem de guerra!','#d9414f');if(window.__toLog)window.__toLog.push({w:state.wave,r:'spawn'})}}}
{const _ew=endWave;endWave=function(){for(const e of enemies)if(e.totem&&!e.dead){e.dead=true;scene.remove(e.group);if(window.__toLog)window.__toLog.push({w:state.wave,r:'left'})}return _ew.apply(this,arguments)}}
{const _de2=dmgEnemy;dmgEnemy=function(e,d){if(e&&e.totem&&window.__toSrc){const k=(new Error().stack||'').split('\n').slice(2,5).map(x=>(x.match(/at (\S+)/)||[])[1]).join('<');window.__toSrc[k]=(window.__toSrc[k]||0)+d}return _de2.apply(this,arguments)}}
{const _de3=dmgEnemy;dmgEnemy=function(e,d){if(window.__allSrc&&e&&!e.dead){const st=new Error().stack||'';const k=/updateBombs/.test(st)?'bomba':/heroTick|heroAbility/.test(st)?'heroi':/updSol/.test(st)?'soldado':/updateTurret|updateProjectiles|processBooms|crossbowTick/.test(st)?'armas':'outro';window.__allSrc[k]=(window.__allSrc[k]||0)+Math.min(d,e.hp)}return _de3.apply(this,arguments)}}

// v11.6 ASAS ARTICULADAS: cada asa tem ombro → braço → mão (2 segmentos com pivô), ossos/dedos e membrana em faixas que afinam;
// o bater de asas tem atraso entre os segmentos (a ponta "chicoteia"), a asa varre para trás na subida e o corpo balança no ritmo.
const _mgT=new THREE.MeshLambertMaterial({vertexColors:true,transparent:true,opacity:.55,depthWrite:false,side:THREE.DoubleSide});
function wingMesh(parent,sc,parts,glass){const P=parts.map(p=>[p[0]*sc,p[1]*sc,p[2]*sc,p[3]*sc,p[4]*sc,p[5]*sc,p[6]||0,p[7]||0,p[8]||0,p[9]]);const m=mcache(P,parent);if(glass&&m)m.material=_mgT;return m}
const WING_STYLE={
  flyer:{L1:.55,L2:.75,C:.55,mem:null,bone:null,kind:'bat',f:13,a:.75},
  imp:{L1:.3,L2:.4,C:.32,mem:null,bone:0x2b2d4a,kind:'bat',f:16,a:.7},
  bombardeiro:{L1:.65,L2:.7,C:.55,mem:0xd8cfae,bone:0x8a5a33,kind:'canvas',f:9,a:.4},
  wyrm:{L1:.85,L2:1.05,C:.85,mem:null,bone:null,kind:'bat',f:5,a:.6},
};
function buildWing(sc,st,side,mem,bone){const piv=new THREE.Group(),out=new THREE.Group();const{L1,L2,C}=st;const P=[],Q=[];
  // braço: osso da borda de ataque + membrana em 3 faixas
  P.push([L1,.08,.08,L1/2,0,C*.45,0,0,0,bone]);for(let i=0;i<3;i++){const ch=C*(1-.1*i);P.push([L1/3+.02,.03,ch,(i+.5)*L1/3,-.06,C*.45-ch/2,.28,0,0,mem])}
  P.push([.12,.12,.12,L1,0,C*.45,0,0,0,bone]);// "pulso"
  if(st.kind==='bat'){Q.push([L2,.06,.06,L2/2,0,C*.42,0,0,0,bone]);for(const [a,len] of[[.45,.95],[.9,.85],[1.3,.7]]){const l=L2*len;Q.push([l,.04,.04,Math.cos(a)*l/2,0,C*.42-Math.sin(a)*l/2,0,a,0,bone])}
    for(let i=0;i<4;i++){const ch=C*(.85-.17*i);Q.push([L2/4+.02,.025,ch,(i+.5)*L2/4,-.06,C*.42-ch/2,.28,0,0,mem])}Q.push([.08,.1,.08,L2,.02,C*.42,0,0,.5,0xe8e0cc])}
  else{Q.push([L2,.06,.06,L2/2,0,C*.42,0,0,0,bone]);for(let i=0;i<4;i++){const ch=C*(.9-.14*i);Q.push([L2/4+.02,.03,ch,(i+.5)*L2/4,-.06,C*.42-ch/2,.28,0,0,mem])}for(let k=0;k<3;k++)Q.push([.04,.05,C*.7,L2*(.25+k*.3),.03,C*.42-C*.35,0,0,0,bone])}
  wingMesh(piv,sc,P);wingMesh(out,sc,Q);out.position.set(L1*sc,0,0);piv.add(out);piv.scale.x=side;return{piv,out}}
function upgradeWings(e){if(window.__oldWings)return;const g=e.group,ud=g.userData;const st=WING_STYLE[e.type];
  if(st&&ud.wings&&ud.wings.length===2){const col=new THREE.Color(ud.wings[0].material.color.getHex()).getHex();const mem=st.mem??col,bone=st.bone??shadeHex(col,-.35);const F=[];
    ud.wings.forEach((w,k)=>{const side=w.position.x<0?-1:1;const half=(w.geometry.parameters.width||1)/2;const wg=buildWing(e.sc,st,side,mem,bone);wg.piv.position.set(w.position.x-side*half,w.position.y,w.position.z);g.remove(w);g.add(wg.piv);F.push({...wg,side})});
    ud.wingF={F,f:st.f,a:st.a};delete ud.wings}
  if(ud.wings4&&!window.__oldWings){const F=[];ud.wings4.forEach((w,k)=>{const side=w.position.x<0?-1:1;const half=(w.geometry.parameters.width||1)/2;const piv=new THREE.Group();const L=half*2/e.sc,C=(w.geometry.parameters.depth||.5)/e.sc;
      wingMesh(piv,e.sc,[[L*.5,.02,C*.7,L*.25,0,0,0,0,0,0xe8d8ff],[L*.4,.02,C,L*.65,0,-.02,0,0,0,0xe8d8ff],[L*.15,.02,C*.6,L*.95,0,-.04,0,0,0,0xd9c8ff],[L,.03,.03,L/2,.01,C*.45,0,0,0,0x9a7ad8],[L*.8,.025,.025,L*.45,.01,0,0,-.15,0,0xb59ae8]],true);
      piv.scale.x=side;piv.position.set(w.position.x-side*half,w.position.y,w.position.z);g.remove(w);g.add(piv);F.push({piv,side,k})});ud.wing4F=F;delete ud.wings4}}
{const _mk116=makeEnemy;makeEnemy=function(type,...a){const e=_mk116(type,...a);{const _r=Math.random;Math.random=_artRnd;try{upgradeWings(e)}catch(err){}finally{Math.random=_r}}return e}}
{const _an116=enemyAnim;enemyAnim=function(e,dt){_an116(e,dt);const ud=e.group.userData;const t=simTime+e.bob*.1;
  if(ud.wingF){const W=ud.wingF;const ph=t*W.f;const s=Math.sin(ph),c=Math.cos(ph);for(const w of W.F){w.piv.rotation.z=w.side*(W.a*s+.1);w.out.rotation.z=w.side*(W.a*.9*Math.sin(ph-1.0)-.05);w.piv.rotation.y=-w.side*(.18*c);w.out.rotation.y=-w.side*Math.max(0,-s)*.35}
    if(e.fly){const o=Math.sin(ph+.6)*.12*e.sc*.4;e.group.position.y+=o-(e.wingO||0);e.wingO=o}}
  if(ud.wing4F)for(const w of ud.wing4F){const ph=t*22+w.k*1.6;w.piv.rotation.z=w.side*(.35*Math.sin(ph)+.15);w.piv.rotation.y=-w.side*(w.k%2?.35:-.1)}}}

// v11.6 INIMIGO "Tecelão" (tema Enxame, horda ≥ 10): aranha tecelã que para, ergue o abdômen e lança teia numa arma a até 22 blocos.
// Arma enredada atira a 35% por 8 s. Decisão: tocar/clicar na arma rasga a teia na hora; ou matar o tecelão primeiro (Fogo Concentrado).
ETYPES.tecelao={hp:240,speed:1.7,dmg:8,rate:2,color:0x6a4a9a,radius:.7,n:'Tecelão'};SCX.tecelao=1.15;NEWLOOK.tecelao=1;T_UNLOCK.tecelao=window.__noWeaver?999:10;
{const T=THEMES.find(t=>t.k==='enxame');if(T&&!T.t.includes('tecelao'))T.t.push('tecelao')}
CREATURES.tecelao=function(sc,col,g){const {B,K,G,LG}=_mk(sc,g);col=ctone(col);const dk=shadeHex(col,-.35),silk=0xeee8ff;
  const body=B(.6,.42,.6,col,0,.55,.1);const abd=K(.85,.75,.9,shadeHex(col,.08),0,.85,-.55);gear(abd,sc,[[.5,.04,.03,0,.25,.46,0,0,silk],[.5,.04,.03,0,-.15,.46,0,0,silk],[.04,.44,.03,.25,.05,.46,0,0,silk],[.04,.44,.03,-.25,.05,.46,0,0,silk],[.6,.03,.03,0,.05,.465,0,.785,silk],[.6,.03,.03,0,.05,.465,0,-.785,silk],[.12,.12,.12,0,-.1,-.5,0,0,silk]]);g.userData.abd=abd;
  const head=B(.62,.48,.5,shadeHex(col,.18),0,.62,.52);
  face(head,sc,.62,.48,.5,{sclera:0xd7c2ff,pupil:0x2a1440,es:.14,ex:.14,ey:.04,brow:0x2a1440,mood:.45,mouth:false},[[.07,.07,.03,-.25,.17,.25,0,0,0xd7c2ff],[.07,.07,.03,.25,.17,.25,0,0,0xd7c2ff],[.08,.2,.08,-.1,-.24,.22,0,.3,silk],[.08,.2,.08,.1,-.24,.22,0,-.3,silk]]);
  const legs=[];for(const s of[-1,1])for(let k=0;k<4;k++){const m=B(.9,.08,.08,dk,s*.72,.55,(k-1.5)*.24+.1);m.rotation.z=s*.6;m.rotation.y=s*(k-1.5)*.28;legs.push({mesh:m,alive:true,ox:s*.72*sc,oz:((k-1.5)*.24)*sc})}
  return{body,head,legs}};
CX_DESC.tecelao='lança teia numa arma (35% de cadência por 8 s); toque na arma para rasgar a teia — soldados perto da arma também cortam';
const _webL=[];
function webCocoon(t,on){if(on&&!t.webM){const r=Math.random;Math.random=_artRnd;try{t.webM=mcache(window.__oldWeb?[[1.1,.9,1.1,0,1.1,0,0,0,0,0xeee8ff],[1.3,.08,.08,0,1.4,0,0,.6,0,0xffffff],[1.3,.08,.08,0,1.0,0,0,-.6,0,0xffffff],[.08,1.2,.08,.5,1.1,.5,0,0,0,0xffffff],[.08,1.2,.08,-.5,1.1,-.5,0,0,0,0xffffff]]:[[1.15,.95,1.15,0,1.1,0,0,0,0,0xc8b4ff],[1.45,.11,.11,0,1.45,0,0,.6,0,0x6a3fc0],[1.45,.11,.11,0,.95,0,0,-.6,0,0x6a3fc0],[.11,1.3,.11,.55,1.1,.55,0,0,0,0x6a3fc0],[.11,1.3,.11,-.55,1.1,-.55,0,0,0,0x6a3fc0],[.11,1.3,.11,.55,1.1,-.55,0,0,0,0x6a3fc0],[.11,1.3,.11,-.55,1.1,.55,0,0,0,0x6a3fc0]],t.group);t.webM.material=_mgT}finally{Math.random=r}}if(t.webM)t.webM.visible=!!on}
NEW_BRAINS.tecelao=function(e,dt){const ud=e.group.userData;if(e.cast>0){e.cast-=dt;if(ud.abd)ud.abd.rotation.x=-.6*Math.min(1,e.cast/.4);e.vel&&e.vel.set(0,0,0);return true}if(ud.abd)ud.abd.rotation.x=Math.sin(simTime*3+e.bob)*.08;
  e.webCd=(e.webCd??(2+Math.random()*2))-dt;if(e.webCd>0)return false;let best=null,bd=22;for(const t of turrets){if(!t.alive||t.team==='r'||t.webT>simTime)continue;const d=hd(t.pos,e.pos);if(d<bd){bd=d;best=t}}
  if(!best){e.webCd=1;return false}e.webCd=5.5;e.cast=.8;best.webT=simTime+8;webCocoon(best,true);state.webs=(state.webs||0)+1;if(window.__webLog)window.__webLog.push(state.wave);
  {const r=Math.random;Math.random=_artRnd;try{for(let k=0;k<10;k++){const f=k/10;spawnDebris(e.pos.x+(best.pos.x-e.pos.x)*f,e.gy+1.2+(best.pos.y+1-e.gy-1.2)*f+Math.sin(f*3.14)*1.5,e.pos.z+(best.pos.z-e.pos.z)*f,0xeee8ff,1,.14)}}finally{Math.random=r}}
  label({x:best.pos.x,y:best.pos.y+2.2,z:best.pos.z},'🕸 arma enredada! toque para soltar','#d7c2ff');return true};
{const _tt=updateTurret;updateTurret=function(t,dt){if(t.webM&&!(t.webT>simTime))webCocoon(t,false);else if(t.webM&&!window.__oldWeb){const k=1+.06*Math.sin(performance.now()*.006);t.webM.scale.set(k,1,k)}return _tt.apply(this,arguments)}}
window.__webbed=()=>turrets.filter(t=>t.alive&&t.webT>simTime).map(t=>[t.pos.x,t.pos.z]);
window.__webbedScr=()=>turrets.filter(t=>t.alive&&t.webT>simTime).map(t=>{const v=new THREE.Vector3(t.pos.x,t.pos.y+1,t.pos.z).project(camera);const c=renderer.domElement.getBoundingClientRect();return [c.left+(v.x+1)/2*c.width,c.top+(1-v.y)/2*c.height]});
// v11.7 golpe corpo a corpo: inclina para trás antes do golpe e avança no impacto; braços articulados acompanham (só arte)
{const NOP={ram:1,rammer:1,ship:1,sapper:1};const _ea=enemyAnim;enemyAnim=function(e,dt){_ea.apply(this,arguments);if(window.__oldStrike||e.dead||NOP[e.type])return;const ud=e.group.userData,G=e.group;
  if(e.lunge>0)e._atkL=simTime;const R=e.T.rate||1;const atk=e.stun<=0&&((simTime-(e.atkT??-99)<.3)||(simTime-(e._atkL??-99)<R+.15));
  if(!atk){if(e._sw){e._sw=0;G.rotation.x=0}return}
  if(G.rotation.order!=='YXZ')G.rotation.order='YXZ';
  const since=Math.max(0,R-(e.timer||0)),left=Math.max(0,e.timer||0);let p,a;
  if(since<.2){const k=since/.2;p=.4*(1-k)*(1-k);a=-2.5+k*k*2.3}else if(left<.45){const k=1-left/.45,s=k*(2-k);p=-.25*s;a=-.2-2.3*s}else{p=0;a=-.2}
  G.rotation.x=p*(BIG(e.type)?.5:1);e._sw=1;
  if(ud.arms&&e.type!=='brute'){ud.arms[0].rotation.x=a;ud.arms[1].rotation.x=a*.85-.05}
  if(!window.__oldWeap){const w=ud.sabre||ud.weap;if(w)w.rotation.x=since<.2?-2.2+(since/.2)*2.9:a*.9;if(ud.shield)ud.shield.position.z=(.44+(since<.2?.35*(1-since/.2):left<.45?-.12*(1-left/.45):0))*e.sc}}}
// v11.8 arma em repouso: sabre/lança param de girar sem parar quando o inimigo só anda
{const _eb=enemyAnim;enemyAnim=function(e,dt){_eb.apply(this,arguments);if(window.__oldWeap||e._sw)return;const ud=e.group.userData,w=ud.sabre||ud.weap;if(w)w.rotation.x=-.25+Math.sin(e.bob*1.4)*.18}}
// v11.9 soldados cortam teia: soldado a ≤3 blocos de uma arma enredada rasga a teia em 1,5 s
{const _tw=updateTurret;updateTurret=function(t,dt){if(!window.__noWebAuto&&t.alive&&t.webT>simTime){let near=false;for(const m of minions){if(m.away||m.state==='wounded'||m.wounded>0)continue;const dx=m.pos.x-t.pos.x,dz=m.pos.z-t.pos.z,dy=(m.pos.y??t.pos.y)-t.pos.y;if(dx*dx+dz*dz<9&&Math.abs(dy)<4){near=true;break}}
  if(near){t.webCut=(t.webCut||0)+dt;if(t.webCut>=1.5){t.webT=0;t.webCut=0;state.webCut=(state.webCut||0)+1;label({x:t.pos.x,y:t.pos.y+2,z:t.pos.z},'✂ teia cortada','#e8e0ff')}}else t.webCut=0}return _tw.apply(this,arguments)}}
window.__webStats=()=>[state.webs||0,state.webCut||0,state.webFreed||0];
// v12.0 medição de bomba: inimigos no raio ao soltar vs no impacto (só com window.__bombAim)
{const _db=dropBomb;dropBomb=function(x,z){if(window.__bombAim){let n=0;for(const e of enemies)if(!e.dead&&!e.rival&&hyp(e.pos.x-x,e.pos.z-z)<state.bombR)n++;window.__bombAim.push([n])}return _db.apply(this,arguments)};
 const _ex=explode;explode=function(x,y,z,r,d,o){if(window.__bombAim&&o&&o.src==='player'&&o.fire&&r===state.bombR){let n=0;for(const e of enemies)if(!e.dead&&!e.rival&&hyp(e.pos.x-x,e.pos.z-z)<r)n++;const L=window.__bombAim;for(let i=L.length-1;i>=0;i--)if(L[i].length===1){L[i].push(n);break}}return _ex.apply(this,arguments)}}
// v12.0 mira da bomba: no modo bomba, anel no chão sob o cursor com quantos inimigos estão no raio, e anel dourado no maior grupo (só interface)
{let R1=null,R2=null,L1=null,L2=null,hx=null,hz=null;const mk=c=>{const r=Math.random;Math.random=_artRnd;try{const m=new THREE.Mesh(new THREE.RingGeometry(.86,1,48),new THREE.MeshBasicMaterial({color:c,transparent:true,opacity:.85,depthTest:false,side:THREE.DoubleSide}));m.rotation.x=-Math.PI/2;m.renderOrder=999;m.visible=false;scene.add(m);return m}finally{Math.random=r}};
 const lab=cls=>{const e=document.createElement('div');e.className='bombAim '+cls;e.style.display='none';document.body.appendChild(e);return e};
 const cnt=(x,z)=>{let n=0;for(const e of enemies)if(!e.dead&&!e.rival&&!e.fly&&hyp(e.pos.x-x,e.pos.z-z)<state.bombR)n++;return n};
 const ground=(cx,cy)=>{const ray=rayFrom(cx,cy);const h=voxRay(ray.origin,ray.direction,true);if(h)return[ix(h.i)+.5,iz(h.i)+.5];if(ray.direction.y<-1e-4){const t=(GY-ray.origin.y)/ray.direction.y;return[ray.origin.x+ray.direction.x*t,ray.origin.z+ray.direction.z*t]}return null};
 const place=(R,L,x,z,n,txt)=>{const y=Math.min(topY(x,z),GY)+.35;R.position.set(x,y,z);R.scale.set(state.bombR,state.bombR,1);R.visible=true;const v=new THREE.Vector3(x,y+1.2,z).project(camera);if(v.z>1){L.style.display='none';return}L.textContent=txt;L.style.display='';L.style.left=((v.x+1)/2*innerWidth)+'px';L.style.top=((1-v.y)/2*innerHeight)+'px'};
 canvas.addEventListener('pointermove',e=>{if(e.pointerType==='mouse'&&state.bombMode){const g=ground(e.clientX,e.clientY);if(g){hx=g[0];hz=g[1]}}});
 let tAcc=0,best=null;const tick=()=>{requestAnimationFrame(tick);const on=state.bombMode&&!window.__oldAim&&state.phase==='wave';if(!R1){if(!on)return;R1=mk(window.__oldAimCol?0xffb13d:0xffffff);R2=mk(0xffe27a);L1=lab('hov');L2=lab('best')}
  if(!on){R1.visible=R2.visible=false;L1.style.display=L2.style.display='none';hx=null;return}
  if(performance.now()-tAcc>250){tAcc=performance.now();best=null;let bs=0;for(const e of enemies){if(e.dead||e.rival||e.fly)continue;const n=cnt(e.pos.x,e.pos.z);if(n>bs){bs=n;best=[e.pos.x,e.pos.z,n]}}}
  if(best&&best[2]>=2){place(R2,L2,best[0],best[1],best[2],'💣 '+best[2]);const k=1+.06*Math.sin(performance.now()*.008);R2.scale.multiplyScalar(k)}else{R2.visible=false;L2.style.display='none'}
  if(hx!==null){const n=cnt(hx,hz);place(R1,L1,hx,hz,n,n?'💣 '+n:'—')}else{R1.visible=false;L1.style.display='none'}};requestAnimationFrame(tick);
 window.__bombAimHud=()=>({best,hov:hx===null?null:[hx,hz]});}
// v12.1 setas de borda clicáveis: tocar numa seta leva a câmera até aquele grupo (só câmera)
let _ejA=null;function edgeJump(d){if(window.__oldEdge||!d._tgt)return;const [x,z]=d._tgt;const x0=cam.target.x,z0=cam.target.z,t0=performance.now(),T=380;_ejA={x,z};const step=()=>{if(_ejA&&(_ejA.x!==x||_ejA.z!==z))return;const k=Math.min(1,(performance.now()-t0)/T),q=k*k*(3-2*k);cam.target.x=clamp(x0+(x-x0)*q,0,W);cam.target.z=clamp(z0+(z-z0)*q,0,D);if(k<1)requestAnimationFrame(step);else _ejA=null};requestAnimationFrame(step);SFX.pop&&SFX.pop()}
{const _et=edgeTick;edgeTick=function(dt){_et.apply(this,arguments);if(window.__oldEdge)return;for(const d of _edge)if(!d.classList.contains('tap'))d.classList.add('tap')}}
window.__edgeTgts=()=>_edge.filter(d=>d.style.display!=='none').map(d=>{const r=d.getBoundingClientRect();return [r.left+r.width/2,r.top+r.height/2,d._tgt,d.lastChild.textContent]});
// v12.2 HUD: barra do chefe e chip de bênção ficam sempre logo abaixo da barra superior (que muda de altura com os chips)
setInterval(()=>{if(window.__oldTopFit)return;const T=$('top');if(!T)return;const b=Math.round(T.getBoundingClientRect().bottom);window.__topB=b;{const bl2=$('bless');let tt=b+10;if(bl2){const r=bl2.getBoundingClientRect();const vis=r.height>0&&getComputedStyle(bl2).display!=='none'&&!bl2.hidden;if(vis&&r.height<60)tt=Math.max(tt,Math.round(r.bottom)+8);document.body.classList.toggle('tipHold',!window.__oldTipHold&&vis&&r.height>=60&&innerWidth<=760)}const bb2=$('bossbar');if(bb2&&bb2.style.display==='block'){const r=bb2.getBoundingClientRect();tt=Math.max(tt,Math.round(r.bottom)+8)}document.documentElement.style.setProperty('--tipTop',tt+'px');document.body.classList.toggle('oldTip',!!window.__oldTip)}const bb=$('bossbar'),bl=$('bless');const bossOn=bb&&bb.style.display==='block';
  if(bb)bb.style.setProperty('top',(b+8)+'px','important');{const g=$('goals');if(g&&!window.__oldGoalsFit)g.style.setProperty('top',(b+8)+'px','important')}if(bl)bl.style.setProperty('top',(b+(bossOn?(bb.getBoundingClientRect().height||30)+16:8))+'px','important')},300);
// v12.2 dicas de iniciante não aparecem para quem carrega um save já avançado (horda ≥ 6)
{const _lg=loadGame;loadGame=function(){const r=_lg.apply(this,arguments);if(r&&!window.__oldVetTips&&state.wave>=6){let ch=0;for(const k of ['start','wave','auto','shop','build','save','rush','bomb'])if(!TIPS_SEEN[k]){TIPS_SEEN[k]=1;ch=1}if(ch)try{localStorage.setItem('fortrex_tips',JSON.stringify(TIPS_SEEN))}catch(e){}}return r}}
// v12.4 medição: moral no fim de cada horda (só com window.__morLog)
{const _mt=moraleTick;let _ph=null,_mn=100;moraleTick=function(dt){_mt.apply(this,arguments);if(!window.__morLog)return;if(state.phase==='wave')_mn=Math.min(_mn,state.morale);if(_ph==='wave'&&state.phase!=='wave'){window.__morLog.push([state.wave,Math.round(state.morale),Math.round(_mn),Math.round(state.waveT||0)]);_mn=100}_ph=state.phase}}
// v12.4 (rejeitado) combo ×25 → +4 de moral: só com window.__comboMor
{const _ac=addCombo;addCombo=function(e){_ac.apply(this,arguments);if(!window.__comboMor||!e||state.combo<25||state.combo%25)return;const m0=state.morale??60;if(m0>=100)return;state.morale=Math.min(100,m0+4);state.comboMor=(state.comboMor||0)+1}}
// v12.4 Banquete: no descanso, toque no moral para trocar material por +25 de moral (1× por descanso, custo cresce com a horda)
function feastCost(){return 20+state.wave*4}
function feastOk(){return !window.__noFeast&&state.running&&state.phase!=='wave'&&!state.feastUsed&&(state.morale??60)<95&&state.material>=feastCost()}
function feast(){if(!feastOk())return false;const c=feastCost();state.material-=c;state.morale=Math.min(100,(state.morale??60)+25);state.feastUsed=1;state.feasts=(state.feasts||0)+1;label({x:CHEST.x,y:GY+4,z:CHEST.z},`🍖 Banquete! moral +25 · −${c}`,'#3fae6a');SFX.loot&&SFX.loot(1);updateHud();return true}
{const el=$('morale');if(el){el.style.cursor='pointer';el.addEventListener('click',()=>{if(window.__noFeast)return;if(state.phase==='wave'){toast('Banquete só no descanso','r0');return}if(state.feastUsed){toast('Já houve banquete neste descanso','r0');return}if(state.material<feastCost()){toast(`Banquete custa ${feastCost()} material`,'r0');return}feast()})}}
{const _mt=moraleTick;moraleTick=function(dt){_mt.apply(this,arguments);if(state.phase==='wave')state.feastUsed=0;const el=$('morale');if(!el||window.__noFeast)return;const ok=feastOk()&&(state.morale??60)<(window.__oldFeastHi?70:50);el.classList.toggle('feast',ok);if(ok)el.title+=` · Toque para um Banquete: +25 de moral por ${feastCost()} material.`}}
{const _b=window.__bot;window.__bot=function(){const r=_b.apply(this,arguments);if(!window.__noFeast&&state.phase!=='wave'&&(state.morale??60)<50&&state.material>=feastCost()+60&&feast()&&Array.isArray(r))r.push('feast');return r}}
TIPS.push({id:'feast',c:()=>typeof feastOk==='function'&&feastOk()&&(state.morale??60)<40,t:'🍖 Moral baixo deixa os minions lentos. No descanso, toque no moral (🙂 lá em cima) para um Banquete: +25 de moral por um pouco de material.'});
// v12.5 câmera volta ao castelo quando a horda começa, se estiver longe (> 40 blocos) e o jogador não mexeu nela há 15 s (só câmera)
let _camUserT=-1e9;{const mark=()=>{_camUserT=performance.now()};canvas.addEventListener('wheel',mark,{passive:true});canvas.addEventListener('touchmove',mark,{passive:true});canvas.addEventListener('pointermove',e=>{if(e.buttons)mark()});window.addEventListener('keydown',e=>{if(/^(w|a|s|d|q|e|arrow)/i.test(e.key))mark()})}
function camHomeSmooth(){const x=CX,z=CZ;const x0=cam.target.x,z0=cam.target.z,t0=performance.now(),T=600;_ejA={x,z};const step=()=>{if(_ejA&&(_ejA.x!==x||_ejA.z!==z))return;const k=Math.min(1,(performance.now()-t0)/T),q=k*k*(3-2*k);cam.target.x=x0+(x-x0)*q;cam.target.z=z0+(z-z0)*q;if(k<1)requestAnimationFrame(step);else _ejA=null};requestAnimationFrame(step)}
{const _sw=startWave;startWave=function(){const was=state.phase;_sw.apply(this,arguments);if(window.__oldCamWave||window.__headless||was==='wave'||state.phase!=='wave')return;const far=hyp(cam.target.x-CX,cam.target.z-CZ)>40;if(far&&performance.now()-_camUserT>15000){camHomeSmooth();state.camBack=(state.camBack||0)+1}}}
window.__camBackN=()=>state.camBack||0;
// v12.6 Evento "Barris de pólvora": barris no caminho da horda; toque num barril para explodir (em cadeia) quando os inimigos passarem
EVENTS.barris={n:'Barris de pólvora',d:'Barris de pólvora espalhados no caminho da horda. Toque num barril para explodir — e os vizinhos explodem em cadeia. Espere o grupo passar!',css:'r2',w:4};
const barrels=[];let _brlQ=[];
function barrelMesh(x,y,z){const r=Math.random;Math.random=_artRnd;try{const g=new THREE.Group();const c=new THREE.Mesh(new THREE.CylinderGeometry(.55,.55,1.2,12),new THREE.MeshLambertMaterial({color:0x9b3522,emissive:0x2a0a05}));c.position.y=.6;g.add(c);
  for(const h of[.2,1.0]){const b=new THREE.Mesh(new THREE.CylinderGeometry(.58,.58,.1,12),new THREE.MeshLambertMaterial({color:0x3b3f55}));b.position.y=h;g.add(b)}
  const s=new THREE.Mesh(new THREE.BoxGeometry(.5,.18,.04),new THREE.MeshLambertMaterial({color:0xffcf3d,emissive:0x5a4a10}));s.position.set(0,.65,.56);g.add(s);
  const ring=new THREE.Mesh(new THREE.RingGeometry(1.1,1.3,28),new THREE.MeshBasicMaterial({color:0xff6a3a,transparent:true,opacity:.7,depthWrite:false,side:THREE.DoubleSide}));ring.rotation.x=-Math.PI/2;ring.position.y=.05;g.add(ring);g.userData.ring=ring;
  g.position.set(x,y,z);scene.add(g);return g}finally{Math.random=r}}
function spawnBarrels(){const n=6;for(let k=0;k<n;k++){const a=Math.random()*Math.PI*2,R=WR+(window.__brlR0??2)+Math.random()*(window.__brlR1??4);let x=CX+Math.cos(a)*R,z=CZ+Math.sin(a)*R;x=clamp(x,4,W-4);z=clamp(z,4,D-4);const y=standY(x,z);const b={x,z,y,alive:true};b.g=barrelMesh(x,y,z);barrels.push(b)}state.barrelsSpawned=(state.barrelsSpawned||0)+n}
function barrelBoom(b,chain){if(!b.alive)return;b.alive=false;scene.remove(b.g);let n=0;for(const e of enemies)if(!e.dead&&!e.rival&&hyp(e.pos.x-b.x,e.pos.z-b.z)<5)n++;
  explode(b.x,b.y+.5,b.z,4.6,110*(1+state.wave*.12),{fire:true,src:'player'});shake=Math.max(shake,.3);state.barrelBooms=(state.barrelBooms||0)+1;state.barrelHits=(state.barrelHits||0)+n;
  if(n>=3)label({x:b.x,y:b.y+3,z:b.z},`💥 ×${n}`,'#ff8a5c');if(window.__brlLog)window.__brlLog.push([state.wave,n,chain?1:0]);
  for(const o of barrels)if(o.alive&&hyp(o.x-b.x,o.z-b.z)<7)_brlQ.push({b:o,t:simTime+.3})}
function barrelTick(){if(_brlQ.length){const now=simTime;const go=_brlQ.filter(q=>q.t<=now);_brlQ=_brlQ.filter(q=>q.t>now);for(const q of go)barrelBoom(q.b,true)}
  for(const b of barrels)if(b.alive&&b.g.userData.ring){b.g.userData.ring.material.opacity=.45+.3*Math.sin(simTime*5);}
  for(let i=barrels.length-1;i>=0;i--)if(!barrels[i].alive)barrels.splice(i,1)}
function clearBarrels(){for(const b of barrels)if(b.alive){b.alive=false;scene.remove(b.g)}barrels.length=0;_brlQ=[]}
{const _sw=startWave;startWave=function(){const was=state.phase;_sw.apply(this,arguments);if(was!=='wave'&&state.phase==='wave'&&state.ev==='barris')spawnBarrels()}}
{const _ew=endWave;endWave=function(){clearBarrels();return _ew.apply(this,arguments)}}
{const _et=edgeTick;edgeTick=function(dt){barrelTick();return _et.apply(this,arguments)}}
{const _ca=clickAt;clickAt=function(cx,cy,right){if(state.running&&barrels.length&&!state.bombMode&&!state.build.on){rayFrom(cx,cy);const hs=raycaster.intersectObjects(barrels.filter(b=>b.alive).map(b=>b.g),true);if(hs.length){let o=hs[0].object;while(o&&o.parent&&!barrels.some(b=>b.g===o))o=o.parent;const b=barrels.find(b=>b.g===o);if(b){barrelBoom(b,false);return}}}return _ca.apply(this,arguments)}}
{const _b=window.__bot;window.__bot=function(){const r=_b.apply(this,arguments);if(state.phase==='wave'&&barrels.length&&!window.__brlNoBot){for(const b of barrels){if(!b.alive)continue;let n=0;for(const e of enemies)if(!e.dead&&!e.rival&&!e.fly&&hyp(e.pos.x-b.x,e.pos.z-b.z)<4.6)n++;if(n>=4){barrelBoom(b,false);if(Array.isArray(r))r.push('barrel')}}}return r}}
window.__barrels=()=>barrels.filter(b=>b.alive).map(b=>[b.x,b.z]);
{const _bt=barrelTick;barrelTick=function(){_bt.apply(this,arguments);if(!window.__brlMax)return;for(const b of barrels){if(!b.alive)continue;let n=0;for(const e of enemies)if(!e.dead&&!e.rival&&!e.fly&&hyp(e.pos.x-b.x,e.pos.z-b.z)<4.6)n++;b.mx=Math.max(b.mx||0,n);if(window.__brlAuto&&n>=window.__brlAuto)barrelBoom(b,false)}}}
{const _cb=clearBarrels;clearBarrels=function(){if(window.__brlMax)for(const b of barrels)window.__brlMax.push(b.alive?b.mx||0:-1);return _cb.apply(this,arguments)}}
// v12.6 Isca: toque no chão e, por 6 s, os inimigos terrestres num raio de 22 correm até ela e se amontoam (funil para bomba/morteiro). 15 material, recarga 30 s
const LURE={on:null,cd:0};
function lureOk(){return !window.__noLure&&state.running&&state.phase==='wave'&&LURE.cd<=0&&state.material>=15}
function placeLure(x,z,bot){if(!lureOk())return false;state.material-=15;LURE.cd=30;state.lureMode=false;const y=standY(x,z);const L={x,z,y,t:6,id:(state.lures=(state.lures||0)+1),bot};let n=0;
  for(const e of enemies){if(e.dead||e.rival||e.fly||e.thief||BIG(e.type)||e.type==='ship'||e.type==='farejador')continue;if(hyp(e.pos.x-x,e.pos.z-z)<22){e.lured=L.id;e.lureK=n++}}
  const r=Math.random;Math.random=_artRnd;try{const g=new THREE.Group();const pole=new THREE.Mesh(new THREE.BoxGeometry(.15,2.6,.15),new THREE.MeshLambertMaterial({color:0x6b4a2a}));pole.position.y=1.3;g.add(pole);const fl=new THREE.Mesh(new THREE.BoxGeometry(1.1,.7,.06),new THREE.MeshLambertMaterial({color:0xd9414f,emissive:0x4a0a10}));fl.position.set(.6,2.2,0);g.add(fl);
    const meat=new THREE.Mesh(new THREE.BoxGeometry(.6,.4,.5),new THREE.MeshLambertMaterial({color:0xc0603a}));meat.position.y=.2;g.add(meat);const ring=new THREE.Mesh(new THREE.RingGeometry(2.6,2.9,36),new THREE.MeshBasicMaterial({color:0xd9414f,transparent:true,opacity:.6,depthWrite:false,side:THREE.DoubleSide}));ring.rotation.x=-Math.PI/2;ring.position.y=.06;g.add(ring);g.userData.fl=fl;g.userData.ring=ring;g.position.set(x,y,z);scene.add(g);L.g=g}finally{Math.random=r}
  LURE.on=L;label({x,y:y+3.2,z},`📯 isca! ${n} vêm`,'#d9414f');SFX.pop&&SFX.pop();updateHud();if(window.__lureLog)window.__lureLog.push([state.wave,n]);return true}
function endLure(){const L=LURE.on;if(!L)return;scene.remove(L.g);for(const e of enemies)if(e.lured===L.id)e.lured=0;LURE.on=null}
function lureTick(dt){if(LURE.cd>0)LURE.cd-=dt;const L=LURE.on;if(!L)return;L.t-=dt;if(L.g){L.g.userData.fl.rotation.y=Math.sin(simTime*6)*.3;L.g.userData.ring.material.opacity=.4+.25*Math.sin(simTime*8)}
  if(L.bot&&!L.bombed&&L.t<=(window.__lureBT??1.6)&&state.bombCd<=0&&state.material>=25){L.bombed=1;let n=0;for(const e of enemies)if(!e.dead&&hyp(e.pos.x-L.x,e.pos.z-L.z)<state.bombR)n++;(window.__lureBombs=window.__lureBombs||[]).push(n);dropBomb(L.x,L.z)}
  if(L.t<=0||state.phase!=='wave')endLure()}
{const _ue=updateEnemy;updateEnemy=function(e,dt){const L=LURE.on;if(!L||e.dead||e.lured!==L.id||e.stun>0)return _ue.apply(this,arguments);
  const dx=L.x-e.pos.x,dz=L.z-e.pos.z,d=Math.hypot(dx,dz);const stopR=1+((e.lureK||0)%6)*.35;e.bob+=dt*8;enemyAnim(e,dt);
  if(d>stopR){const sp=(e.T.speed||2)*(window.__lureSp??2.2)*(e.slowT>simTime?.5:1)*dt;const k=Math.min(1,sp/d);const nx=e.pos.x+dx*k,nz=e.pos.z+dz*k;if(standY(nx,nz)<=e.gy+1.1){e.pos.x=nx;e.pos.z=nz}e.group.rotation.y=Math.atan2(dx,dz)}
  e.gy=standY(e.pos.x,e.pos.z);e.group.position.set(e.pos.x,e.gy,e.pos.z);if(e.vel)e.vel.set(0,0,0)}}
{const _et=edgeTick;edgeTick=function(dt){lureTick(dt);return _et.apply(this,arguments)}}
{const _ew=endWave;endWave=function(){endLure();return _ew.apply(this,arguments)}}
{const _ca=clickAt;clickAt=function(cx,cy,right){if(state.running&&state.lureMode){const ray=rayFrom(cx,cy);const h=voxRay(ray.origin,ray.direction,true);let px,pz;if(h){px=ix(h.i)+.5;pz=iz(h.i)+.5}else if(ray.direction.y<-1e-4){const t=(GY-ray.origin.y)/ray.direction.y;px=ray.origin.x+ray.direction.x*t;pz=ray.origin.z+ray.direction.z*t}
  state.lureMode=false;$('lure').classList.remove('armed');if(px!==undefined&&px>0&&pz>0&&px<W&&pz<D)placeLure(px,pz,false);else toast('Mire na ilha','r0');return}return _ca.apply(this,arguments)}}
$('lure').onclick=()=>{if(window.__noLure)return;if(state.phase!=='wave'){toast('A isca só funciona durante a horda','r0');return}if(LURE.cd>0){toast('Isca recarregando','r0');return}if(state.material<15){toast('Precisa de 15 material','r0');return}state.lureMode=!state.lureMode;state.bombMode=false;$('lure').classList.toggle('armed',state.lureMode);if(state.lureMode)toast('Toque onde a isca deve ficar','r2')};
{const _uh=updateHud;updateHud=function(){_uh.apply(this,arguments);const b=$('lure');if(!b)return;b.hidden=!!window.__noLure||state.wave<3;$('lureCd').textContent=LURE.cd>0?Math.ceil(LURE.cd)+'s':'15'}}
{const _b=window.__bot;window.__bot=function(){let placed=false;if(!window.__noLure&&lureOk()&&state.bombCd<=0&&state.material>=15+25+40){const al=enemies.filter(e=>!e.dead&&!e.fly&&!e.rival&&!e.thief&&!BIG(e.type));let best=null,bs=0;for(const e of al){const dC=hyp(e.pos.x-CX,e.pos.z-CZ);if(dC>WR+14)continue;let s=0;for(const o of al)if(hyp(o.pos.x-e.pos.x,o.pos.z-e.pos.z)<22)s++;if(s>bs){bs=s;best=e}}
  if(best&&bs>=6){const dC=hyp(best.pos.x-CX,best.pos.z-CZ)||1;const f=(WR+6)/Math.max(dC,WR+6);placed=placeLure(CX+(best.pos.x-CX)*f,CZ+(best.pos.z-CZ)*f,true)}}
  if(placed)state.bombCd=.01;const r=_b.apply(this,arguments);if(placed){if(state.bombCd===.01)state.bombCd=0;if(Array.isArray(r))r.push('lure')}return r}}
window.__lureN=()=>state.lures||0;
window.__placeLure=(x,z)=>placeLure(x,z,false);window.__lureBest=()=>{const al=enemies.filter(e=>!e.dead&&!e.fly&&!e.rival&&!BIG(e.type));let best=null,bs=0;for(const e of al){let s=0;for(const o of al)if(hyp(o.pos.x-e.pos.x,o.pos.z-e.pos.z)<22)s++;if(s>bs){bs=s;best=e}}return best?[best.pos.x,best.pos.z,bs]:null};
TIPS.push({id:'lure',c:()=>state.wave>=3&&state.phase==='wave'&&enemies.length>15&&!window.__noLure,t:'📯 Inimigos espalhados? Use a Isca (15 material): toque nela e depois no chão — a horda por perto corre até lá e se amontoa por 6 s. Aí é só soltar a bomba em cima (morteiros e catapultas também miram lá).'});
// v12.7 armas de arco (morteiro/catapulta) miram no amontoado da isca: depois de 1,5 s de isca, se ela estiver no alcance, atiram no inimigo atraído mais perto dela
{const _ut=updateTurret;updateTurret=function(t,dt){const L=LURE.on;if(!L||window.__noLureLob||!t.alive||t.team==='r'||!LOB(t.type)||L.t>4.5||(state.focus&&!state.focus.dead&&state.focusT>0))return _ut.apply(this,arguments);
  if(hyp(L.x-t.pos.x,L.z-t.pos.z)>turretRange(t))return _ut.apply(this,arguments);let best=null,bd=1e9;for(const e of enemies){if(e.dead||e.lured!==L.id)continue;const d=hyp(e.pos.x-L.x,e.pos.z-L.z);if(d<bd){bd=d;best=e}}
  if(!best||bd>3)return _ut.apply(this,arguments);const f=state.focus,ft=state.focusT;state.focus=best;state.focusT=1;try{return _ut.apply(this,arguments)}finally{state.focus=f;state.focusT=ft}}}
// medição: explosões no ponto da isca
{const _ex=explode;explode=function(x,y,z,r,d,o){const L=LURE.on;if(window.__lureEx&&L&&hyp(x-L.x,z-L.z)<4){let n=0;for(const e of enemies)if(!e.dead&&!e.rival&&hyp(e.pos.x-x,e.pos.z-z)<r)n++;window.__lureEx.push([r>=state.bombR-.01&&o&&o.fire?1:0,n])}return _ex.apply(this,arguments)}}
// v12.9 Desabamento esmaga: quando uma estrutura sem apoio desaba, os blocos que caem ferem os inimigos logo embaixo/ao lado (destruição vira arma — e risco)
{let _fallC=null;const _ck=checkTurretAnchor;checkTurretAnchor=function(i){if(_fallC)_fallC.push(i);return _ck.apply(this,arguments)};
 const _st=settle;settle=function(){if(window.__noCrush)return _st.apply(this,arguments);_fallC=[];let r;try{r=_st.apply(this,arguments)}finally{const F=_fallC;_fallC=null;if(F&&F.length>=4&&state.phase==='wave')crushFrom(F)}return r}}
function crushFrom(F){const col=new Map();for(const i of F){const k=ix(i)+','+iz(i);const c=col.get(k);const y=iy(i);if(!c)col.set(k,{x:ix(i)+.5,z:iz(i)+.5,n:1,ymin:y});else{c.n++;c.ymin=Math.min(c.ymin,y)}}
  let hit=0,tot=0;const base=(window.__crushB??6)*(1+state.wave*.12);for(const e of enemies){if(e.dead||e.rival||e.fly||e.thief)continue;let n=0;for(const c of col.values()){if(Math.abs(c.x-e.pos.x)<1.6&&Math.abs(c.z-e.pos.z)<1.6&&c.ymin>=e.gy-.5)n+=c.n}if(!n)continue;const d=base*Math.min(n,8)*(BIG(e.type)?.5:1);dmgEnemy(e,d);hit++;tot+=d}
  if(hit){state.crushHits=(state.crushHits||0)+hit;const c0=[...col.values()][0];if(hit>=2)label({x:c0.x,y:GY+4,z:c0.z},`🧱 esmagados ×${hit}`,'#c0802a');if(window.__crushLog)window.__crushLog.push([state.wave,F.length,hit,Math.round(tot),Math.round(c0.x),Math.round(c0.z),(typeof FELL!=='undefined'&&simTime-(FELL.t??-99)<1.5)?1:0])}}
// v13.0 conquistas das mecânicas novas (só leitura de estado; nada muda na simulação)
{const _cf=crushFrom;crushFrom=function(F){const h0=state.crushHits||0;const r=_cf.apply(this,arguments);const d=(state.crushHits||0)-h0;if(d>(state.crushBest||0))state.crushBest=d;return r}}
{const _ex=explode;explode=function(x,y,z,r,d,o){const L=LURE.on;if(L&&o&&o.src==='player'&&o.fire&&Math.abs(r-state.bombR)<.01&&hyp(x-L.x,z-L.z)<3){let n=0;for(const e of enemies)if(!e.dead&&!e.rival&&hyp(e.pos.x-x,e.pos.z-z)<r)n++;if(n>(state.lureBombBest||0))state.lureBombBest=n}return _ex.apply(this,arguments)}}
ACH.push({id:'crush3',ico:'🧱',n:'Soterrados',d:'Esmague 3 inimigos num só desabamento',c:()=>(state.crushBest||0)>=3},
 {id:'lurebomb',ico:'📯',n:'Isca perfeita',d:'Acerte 6 inimigos com uma bomba na Isca',c:()=>(state.lureBombBest||0)>=6},
 {id:'feast5',ico:'🍖',n:'Anfitrião',d:'Dê 5 banquetes numa partida',c:()=>(state.feasts||0)>=5},
 {id:'webcut',ico:'✂️',n:'Tesoura afiada',d:'Seus soldados cortam 10 teias de Tecelão',c:()=>(state.webCut||0)>=10});
// v13.1 menos avisos: mensagens rotineiras (minion ferido/voltou, recruta chegou, arma caiu/pronta, construção/upgrade automáticos) aparecem só na 1ª vez da partida
{const QUIET=[[/ ferido$/,'hurt'],[/ voltou!$/,'back'],[/pronta para instalar/,'ready'],[/caiu! Um coletor/,'fell'],[/, [^,]+ [A-Zá-ú][a-zá-ú]+, chegou!$|chegou!$/,'arrive'],[/^Construção auto/,'abuild'],[/^Upgrade auto/,'aup']];const seen=new Set();
 const _t=toast;toast=function(txt,cls,force){if(!window.__oldToasts&&!force){const s=String(txt);for(const [re,k] of QUIET)if(re.test(s)){if(seen.has(k)){window.__quietN=(window.__quietN||0)+1;return}seen.add(k);break}}return _t.apply(this,arguments)}}
// v13.2 Inimigo novo: Farejador (Matilha, h ≥ 8) — não cai na Isca; se houver isca a ≤ 25, corre até ela e a destrói
ETYPES.farejador={hp:150,speed:2.6,dmg:7,rate:1.2,color:0x6b4a2e,radius:.6,n:'Farejador'};SCX.farejador=1.05;NEWLOOK.farejador=1;T_UNLOCK.farejador=window.__snifferOn?8:999;
{const T=THEMES.find(t=>t.k==='matilha');if(T&&!T.t.includes('farejador'))T.t.push('farejador')}
CREATURES.farejador=function(sc,col,g){const {B,K,G,LG}=_mk(sc,g);col=ctone(col);const dk=shadeHex(col,-.3),lt=shadeHex(col,.22);
  const body=B(.6,.5,1.05,col,0,.6,0);B(.62,.16,.7,lt,0,.88,-.05);B(.5,.12,.5,0xd9414f,0,.78,.42);
  const head=B(.56,.5,.56,lt,0,.86,.7);B(.34,.26,.36,lt,0,.74,1.06);B(.16,.12,.08,0x1d1f33,0,.82,1.25);
  for(const s of[-1,1]){const ear=B(.14,.34,.1,dk,s*.22,1.2,.62);ear.rotation.z=s*.35}
  face(head,sc,.56,.5,.56,{sclera:0xfff2d0,pupil:0x2b1a0e,es:.12,ex:.13,ey:.08,brow:0x3a2414,mood:.3,mouth:false},[[.1,.1,.04,0,-.18,.3,0,0,0xffcf3d]]);
  const tail=K(.12,.12,.55,dk,0,.85,-.62);tail.rotation.x=-.6;g.userData.tail=tail;
  return{body,head,legs:LG([[-.2,.18,-.35,.18,.36],[.2,.18,-.35,.18,.36],[-.2,.18,.35,.18,.36],[.2,.18,.35,.18,.36]],dk)}};
CX_DESC.farejador='não cai na Isca: se houver uma isca por perto, corre até ela e a destrói';
NEW_BRAINS.farejador=function(e,dt){const L=LURE.on;if(!L||window.__noSnifferBrain)return false;const dx=L.x-e.pos.x,dz=L.z-e.pos.z,d=Math.hypot(dx,dz);if(d>25)return false;
  if(d<1.4){endLure();state.lureEaten=(state.lureEaten||0)+1;label({x:e.pos.x,y:e.gy+2.2,z:e.pos.z},'🐕 a isca foi destruída!','#d9414f');return false}
  const sp=(e.speed||e.T.speed||2.6)*1.3*dt;const k=Math.min(1,sp/d);const nx=e.pos.x+dx*k,nz=e.pos.z+dz*k;if(standY(nx,nz)<=e.gy+1.1){e.pos.x=nx;e.pos.z=nz}e.group.rotation.y=Math.atan2(dx,dz);e.gy=standY(e.pos.x,e.pos.z);e.group.position.set(e.pos.x,e.gy,e.pos.z);if(e.vel)e.vel.set(0,0,0);return true};
// v13.2 avisos, 2ª passada: mais categorias rotineiras só na 1ª vez; no máximo 2 avisos a cada 15 s — o excesso vai para o registro 🔔 (toque para ler)
const TLOGQ=[];let _tRecent=[];
function bellUi(){let b=$('bell');if(!b){b=document.createElement('button');b.id='bell';b.className='chip';b.onclick=()=>{const c=$('bellList');if(c&&!c.hidden){c.hidden=true;return}openBell()};document.body.appendChild(b)}const n=TLOGQ.filter(x=>!x.read).length;b.hidden=!n||!!window.__oldToasts2;b.textContent='🔔 '+n}
function openBell(){let c=$('bellList');if(!c){c=document.createElement('div');c.id='bellList';c.onclick=()=>{c.hidden=true};document.body.appendChild(c)}c.innerHTML='<b>Avisos recentes</b>'+TLOGQ.slice(-20).reverse().map(x=>`<div class="bl">${esc(x.t)} <small>h${x.w}</small></div>`).join('')+'<small>toque para fechar</small>';c.hidden=false;for(const x of TLOGQ)x.read=true;bellUi()}
{const QUIET2=[[/ ferido$/,'hurt'],[/ voltou!$/,'back'],[/pronta para instalar/,'ready'],[/caiu! Um coletor/,'fell'],[/chegou!$/,'arrive'],[/^Construção auto/,'abuild'],[/^Upgrade auto/,'aup'],[/se enfurece — fase|entra em fúria final/,'bossph'],[/^\+\d+ .+ para construir$/,'loot+'],[/^[^ ]+, [A-Zá-ú][a-zá-ú]+ (Comum|Incomum|Raro|Épico|Lendário) · /,'trait'],[/reconstrói sozinha/,'rebuild'],[/^🔧 [^:]+: /,'heroab'],[/minions marcham contra/,'march'],[/aliados mandaram/,'allysend'],[/^🏆 Recorde:/,'record']];const seen=new Set();
 const _t=toast;toast=function(txt,cls,force){if(window.__oldToasts2||(force&&cls==='r3'))return _t.apply(this,arguments);const s=String(txt);
  if(!force)for(const [re,k] of QUIET2)if(re.test(s)){if(seen.has(k)){window.__quietN=(window.__quietN||0)+1;return}seen.add(k);break}
  if(!force&&cls!=='r3'&&cls!=='r4'&&performance.now()-lastInputT>1500)return _t.apply(this,arguments);
  if(/^📜 Contrato da horda|^Horda \d+: /.test(s)||Object.values(EVENTS).some(E=>s.startsWith(E.n+':')))return _t.apply(this,arguments);const now=window.__freeze?simTime*1000:performance.now();_tRecent=_tRecent.filter(t=>now-t<(window.__tWin??15000));if(_tRecent.length>=2){TLOGQ.push({t:s,w:state.wave});if(TLOGQ.length>60)TLOGQ.shift();window.__bellN=(window.__bellN||0)+1;bellUi();return}
  _tRecent.push(now);return _t.apply(this,arguments)}}
// v13.3 Derrubar: no meio da horda, toque num bloco da sua muralha/torre → some uma fatia 3×3 naquela altura e o que estava em cima desaba (o "desabamento esmaga" vira arma do jogador). 15 material, recarga 30 s, a partir da horda 5
const FELL={cd:0};
function fellOk(){return !window.__noFell&&state.running&&state.phase==='wave'&&FELL.cd<=0&&state.material>=15}
function fellAt(i,bot){if(!fellOk()||!vox[i]||!SOLIDM(vox[i]))return false;const x=ix(i),y=iy(i),z=iz(i);if(y<=GY-1){return false}let n=0;const chest=new Set(_chestVox);
  for(let dx=-1;dx<=1;dx++)for(let dz=-1;dz<=1;dz++){if(!inb(x+dx,y,z+dz))continue;const j=idx(x+dx,y,z+dz);if(!vox[j]||!SOLIDM(vox[j])||chest.has(j))continue;removeVox(j,'player');n++}
  if(!n)return false;state.material-=15;FELL.cd=30;state.fells=(state.fells||0)+1;FELL.t=simTime;FELL.p=[x+.5,z+.5];spawnDebris(x+.5,y+.5,z+.5,0x8a7a6a,8,.6);SFX.crunch&&SFX.crunch(true);label({x:x+.5,y:y+2,z:z+.5},'⛏️ derrubado!','#c0802a');if(window.__fellLog)window.__fellLog.push([state.wave,n,bot?1:0,y-GY]);updateHud();return true}
{const _et=edgeTick;edgeTick=function(dt){if(FELL.cd>0)FELL.cd-=dt;return _et.apply(this,arguments)}}
{const _ca=clickAt;clickAt=function(cx,cy,right){if(state.running&&state.fellMode){state.fellMode=false;$('fell').classList.remove('armed');const ray=rayFrom(cx,cy);const h=voxRay(ray.origin,ray.direction,false);if(h&&h.i!==undefined){let i=h.i;if(!window.__oldFellTap){const x0=ix(h.i),z0=iz(h.i),y0=iy(h.i);let by=y0;for(let r=0;r<=2&&by===y0;r++)for(let dx=-r;dx<=r;dx++)for(let dz=-r;dz<=r;dz++){if(Math.max(Math.abs(dx),Math.abs(dz))!==r)continue;const x=x0+dx,z=z0+dz;for(let y=GY+1;y<by;y++){if(!inb(x,y,z))break;const j=idx(x,y,z);if(vox[j]&&SOLIDM(vox[j])){by=y;i=j;break}}}}if(fellAt(i,false))return}toast('Toque num bloco da muralha ou torre','r0');return}return _ca.apply(this,arguments)}}
$('fell').onclick=()=>{if(window.__noFell)return;if(state.phase!=='wave'){toast('Derrubar só durante a horda','r0');return}if(FELL.cd>0){toast('Derrubar recarregando','r0');return}if(state.material<10){toast('Precisa de 15 material','r0');return}state.fellMode=!state.fellMode;state.bombMode=false;state.lureMode=false;$('fell').classList.toggle('armed',state.fellMode);if(state.fellMode)toast('Toque num bloco: o que está em cima desaba','r2')};
{const _uh=updateHud;updateHud=function(){_uh.apply(this,arguments);const b=$('fell');if(!b)return;b.hidden=!!window.__noFell||state.wave<5;$('fellCd').textContent=FELL.cd>0?Math.ceil(FELL.cd)+'s':'15'}}
// bot: se ≥ 4 inimigos terrestres estão ao pé de uma coluna sua com ≥ 4 blocos acima, derruba a 2ª camada dessa coluna
{const _b=window.__bot;window.__bot=function(){const r=_b.apply(this,arguments);if(window.__noFell||!fellOk()||state.material<15+40)return r;const al=enemies.filter(e=>!e.dead&&!e.fly&&!e.rival);let best=null,bs=0;
  for(const e of al){let s=0;for(const o of al)if(hyp(o.pos.x-e.pos.x,o.pos.z-e.pos.z)<2.5)s++;if(s<4||s<=bs)continue;for(let dx=-2;dx<=2;dx++)for(let dz=-2;dz<=2;dz++){const x=Math.floor(e.pos.x)+dx,z=Math.floor(e.pos.z)+dz;if(x<1||z<1||x>=W-1||z>=D-1)continue;const t=topY(x,z);if(t-GY>=5){const j=idx(x,GY+1,z);if(vox[j]&&SOLIDM(vox[j])){best=j;bs=s}}}}
  if(best!==null&&fellAt(best,true)&&Array.isArray(r))r.push('fell');return r}}
window.__fellN=()=>state.fells||0;
window.__fellPos=()=>FELL.t!==undefined?(FELL.p||null):null;
TIPS.push({id:'fell',c:()=>state.wave>=5&&state.phase==='wave'&&!window.__noFell&&enemies.filter(e=>!e.dead).length>20,t:'⛏️ Inimigos amontoados ao pé da muralha? Use Derrubar: toque numa torre ou muralha e a base dela some — tudo em cima desaba sobre eles. Os reparadores reconstroem depois.'});

// v13.4 com o painel de bênçãos aberto no celular, a dica espera (não cobre o painel nem os botões)
{const _tt=tipTick;tipTick=function(dt){if(document.body.classList.contains('tipHold'))return;return _tt.apply(this,arguments)}}
// v13.5 Parede de escudos: inimigos a ≤ 3 de um Escudeiro vivo levam metade do dano de explosões do jogador (bomba, morteiro, catapulta, barril, desabamento não conta). Derrube o Escudeiro primeiro (Fogo Concentrado) para o combo funcionar
let _blastP=0,_swT=0;
{const _ex=explode;explode=function(x,y,z,r,d,o){const p=o&&o.src==='player';if(p)_blastP++;try{return _ex.apply(this,arguments)}finally{if(p)_blastP--}}}
{const _de=dmgEnemy;dmgEnemy=function(e,d){if(_blastP>0&&window.__shieldWallOn&&e&&!e.dead&&e.type!=='escudeiro'&&!BIG(e.type)){for(const o of enemies){if(o.type!=='escudeiro'||o.dead||o.rival)continue;if(Math.abs(o.pos.x-e.pos.x)<3&&Math.abs(o.pos.z-e.pos.z)<3&&hyp(o.pos.x-e.pos.x,o.pos.z-e.pos.z)<3){arguments[1]=d*.5;state.shieldSaves=(state.shieldSaves||0)+1;if(simTime-_swT>4){_swT=simTime;label({x:o.pos.x,y:o.gy+2.4,z:o.pos.z},'🛡 parede de escudos','#4f6aa8')}break}}}return _de.apply(this,arguments)}}
if(window.__shieldWallOn)CX_DESC.escudeiro=(CX_DESC.escudeiro?CX_DESC.escudeiro+'; ':'')+'protege quem está a até 3 blocos: metade do dano de explosões';
