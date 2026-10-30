// ───────── ui: toasts, world labels, HUD, build mode, arsenal, unit card, hire, upgrades, rewards, tooltip
// only important messages (rare/epic events, or feedback to something the player just did) are shown
let lastInputT=-1e9;addEventListener('pointerdown',()=>lastInputT=performance.now(),true);addEventListener('keydown',()=>lastInputT=performance.now(),true);
function toast(txt,cls,force){if(!force&&cls!=='r3'&&cls!=='r4'&&performance.now()-lastInputT>1500)return;const box=$('toasts');const t=document.createElement('div');t.className='toast '+(cls||'');t.textContent=txt;box.appendChild(t);while(box.children.length>5)box.firstChild.remove();setTimeout(()=>t.remove(),2700)}
const labels=[];const _v=new THREE.Vector3();
function label(pos,txt,color){if(labels.length>40)return;const el=document.createElement('div');el.className='lab';el.textContent=txt;el.style.color=color||'#2b2d4a';$('labels').appendChild(el);labels.push({el,x:pos.x,y:(pos.y||GY)+2,z:pos.z,t:1.2})}
function updateLabels(dt){for(let i=labels.length-1;i>=0;i--){const L=labels[i];L.t-=dt;if(L.t<=0){L.el.remove();labels.splice(i,1);continue}_v.set(L.x,L.y,L.z).project(camera);L.el.style.left=((_v.x+1)/2*innerWidth)+'px';L.el.style.top=((1-_v.y)/2*innerHeight)+'px'}}
const esc=s=>String(s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'})[c]);

function updateHud(){$('wave').textContent=state.wave;$('mat').textContent=Math.floor(state.material);const w=minions.filter(m=>m.wounded>0).length;$('mcount').textContent=minions.length;$('wounded').textContent=w?`· ${w} ferido${w>1?'s':''}`:'';
  $('alive').textContent=enemies.filter(e=>!e.dead&&!(e.rival&&e.rmode==='guard')).length+(state.queue?state.queue.length:0);
  $('next').textContent=state.phase==='rest'?(state.choosing?'Escolha a recompensa':(state.auto?`Próxima em ${Math.ceil(state.restT)}s`:'Chamar horda')+(rushBonus()>0?` ⚡+${rushBonus()}`:'')):'Horda em andamento';
  $('next').disabled=state.phase!=='rest'||state.choosing;$('auto').classList.toggle('on',state.auto);
  $('focusCd').textContent=state.focusCd>0?Math.ceil(state.focusCd)+'s':'pronto';$('focus').classList.toggle('on',state.focusT>0);
  $('bombCd').textContent=state.bombCd>0?Math.ceil(state.bombCd)+'s':'25';$('bomb').classList.toggle('armed',state.bombMode);
  $('arsN').textContent=state.newItems?(state.newItems>99?'99+':String(state.newItems)):'';$('arsN').hidden=!state.newItems;
  $('bBuild').classList.toggle('on',state.build.on);$('abBtn').classList.toggle('on',state.autoBuild);$('auBtn').classList.toggle('on',state.autoUp);$('asBtn').classList.toggle('on',!!state.autoSell);$('arBtn').classList.toggle('on',!!state.autoReward);$('autoN').textContent=`${[state.autoBuild,state.autoUp,state.autoSell,state.autoReward].filter(Boolean).length}/4`;{const B=battle();$('raidBtn').hidden=!B;$('recallBtn').hidden=!minions.some(m=>m.raid)}
  {const rp=raidPower();const c=$('rivalChip');if(rp){const w=rp.us/(rp.us+rp.them+.01);c.textContent=`⚔️ ${rp.R.name}: ${rp.us.toFixed(0)} vs ${rp.them.toFixed(0)} · núcleo ${rp.core}/8 · ${w>.6?'vantagem':w>.4?'equilibrado':'perigo!'}`;c.style.color=w>.6?'#2f9a5e':w>.4?'#c99a1a':'#d9414f'}else{c.style.color='';const B=battle();const inc=REALM.armies.filter(A=>A.to.home).length;c.textContent=B?`⚔️ Guerra: ${B.name} nv ${B.lvl} · núcleo ${B.core.filter(i=>vox[i]===21).length}/8`:`🗺️ ${REALM.cities.length} fortalezas${inc?` · ⚠️ ${inc} exército${inc>1?'s':''} vindo`:''}`;if(!B&&inc)c.style.color='#d9414f'}}
  if(state.card)renderCard()}

// ── side panels
function openSide(id){for(const p of ['arsenal','shop'])if(p!==id&&id!=='buildPanel')$(p).style.display='none';const el=$(id);const open=el.style.display!=='flex';el.style.display=open?'flex':'none';
  if(id==='buildPanel'){state.build.on=open;if(!open)ghost.visible=false;if(open)renderBuild()}if(id==='arsenal'&&open){state.newItems=0;renderArsenal()}if(id==='shop'&&open)renderShop();updateHud()}
function closeSide(id){$(id).style.display='none';if(id==='buildPanel'){state.build.on=false;ghost.visible=false}updateHud()}
function refreshPanels(){if($('arsenal').style.display==='flex')renderArsenal();if(state.build.on)renderBuild();if($('shop').style.display==='flex')renderShop()}

// ── build mode
const ghost=new THREE.Mesh(new THREE.BoxGeometry(1.04,1.04,1.04),new THREE.MeshBasicMaterial({color:0x5cc08c,transparent:true,opacity:.35,depthWrite:false}));ghost.visible=false;scene.add(ghost);
const PLN=3500;const planMesh=new THREE.InstancedMesh(voxGeo,new THREE.MeshBasicMaterial({color:0x4f9cf2,transparent:true,opacity:.16,depthWrite:false}),PLN);planMesh.frustumCulled=false;planMesh.count=0;scene.add(planMesh);
let planAcc=0;function updatePlan(dt){planAcc+=dt;if(planAcc<.4)return;planAcc=0;let k=0;for(const i of blueList){if(k>=PLN)break;if(vox[i]===blue[i])continue;_m.makeScale(.92,.92,.92);_m.setPosition(ix(i)+.5,iy(i)+.5,iz(i)+.5);planMesh.setMatrixAt(k++,_m)}planMesh.count=k;planMesh.instanceMatrix.needsUpdate=true}
function palBlocks(){const o=[];for(const m of BASIC_BLOCKS)o.push({m,count:Infinity});for(const m of SPECIAL_BLOCKS)if(state.inv.blocks[m])o.push({m,count:state.inv.blocks[m]});return o}
function renderBuild(){const B=state.build,body=$('buildBody');for(const t of document.querySelectorAll('#buildPanel .tab'))t.classList.toggle('on',t.dataset.tab===B.tab);let h='';
  if(B.tab==='blocks'){h+='<div class="pal">';h+=`<button class="pi ${B.tool==='remove'?'sel':''}" data-rm="1"><span class="sw" style="background:repeating-linear-gradient(45deg,#ec5f6b 0 4px,#fff 4px 8px)"></span>Remover<span class="ct">blocos, armas, cavar</span></button>`;
    for(const p of palBlocks()){const M=MAT[p.m];h+=`<button class="pi ${B.tool==='place'&&B.sel===p.m?'sel':''}" data-m="${p.m}" title="${esc(M.special||'')}"><span class="sw" style="background:${hex(M.c)}"></span>${esc(M.n)}<span class="ct">${p.count===Infinity?`${M.cost} material`:'×'+p.count}</span></button>`}
    h+='</div>';const sm=MAT[B.sel];h+=`<div class="detail"><div class="nm">${B.tool==='remove'?'Remover':esc(sm.n)}</div><div class="ds">${B.tool==='remove'?'Bloco da planta: volta para você. Terreno: cava por 1 material. Arma: volta ao arsenal.':esc(sm.special||'Bloco básico. O reparador constrói gastando material do baú.')}</div></div>`}
  else{h+='<div class="pal">';h+=`<button class="pi ${B.tool==='remove'?'sel':''}" data-rm="1"><span class="sw" style="background:repeating-linear-gradient(45deg,#ec5f6b 0 4px,#fff 4px 8px)"></span>Recolher<span class="ct">volta ao arsenal</span></button>`;
    h+=`<div class="ds" style="grid-column:1/-1">Armas instaladas <b>${turretCount()}/${turretCap()}</b> · +2 vagas por 🧱 Plataformas de armas</div>`;
    state.inv.turrets.forEach((t,k)=>{const T=TURRETS[t.type];h+=`<button class="pi ${B.tool==='turret'&&B.tsel===k?'sel':''} rr${t.r}" data-t="${k}"><span class="sw ico">${T.ico}</span>${esc(T.n)}<span class="ct" style="color:var(--${RARITY[t.r].css})">${RARITY[t.r].n}</span></button>`});
    h+='</div>';h+=`<button class="btn wide" id="buyCannon" ${state.material<40?'disabled':''}>Comprar Canhão <span class="cost">40 material</span></button>`;
    const sel=B.tool==='turret'&&state.inv.turrets[B.tsel];h+=sel?`<div class="detail"><div class="nm">${esc(TURRETS[sel.type].n)} ${RARITY[sel.r].n}</div><div class="ds">${esc(TURRETS[sel.type].d)} Clique no topo de qualquer bloco para instalar. Com artilheiro, atira o dobro.</div></div>`:(state.inv.turrets.length?'':'<div class="ds">Nenhuma arma guardada. Elas caem de Devoradores, baús e recompensas.</div>')}
  body.innerHTML=h;
  for(const b of body.querySelectorAll('[data-m]'))b.onclick=()=>{B.tool='place';B.sel=+b.dataset.m;renderBuild()};
  for(const b of body.querySelectorAll('[data-t]'))b.onclick=()=>{B.tool='turret';B.tsel=+b.dataset.t;renderBuild()};
  for(const b of body.querySelectorAll('[data-rm]'))b.onclick=()=>{B.tool='remove';renderBuild()};
  const bc=$('buyCannon');if(bc)bc.onclick=()=>{if(state.material<40)return;state.material-=40;state.inv.turrets.push({type:'cannon',r:0});B.tool='turret';B.tsel=state.inv.turrets.length-1;SFX.coin();renderBuild();updateHud()}}
for(const t of document.querySelectorAll('#buildPanel .tab'))t.onclick=()=>{state.build.tab=t.dataset.tab;state.build.tool=t.dataset.tab==='blocks'?'place':(state.inv.turrets.length?'turret':'remove');if(state.build.tool==='turret')state.build.tsel=clamp(state.build.tsel,0,state.inv.turrets.length-1);renderBuild()};
const raycaster=new THREE.Raycaster(),ndc=new THREE.Vector2();
function rayFrom(cx,cy){ndc.set(cx/innerWidth*2-1,-(cy/innerHeight)*2+1);raycaster.setFromCamera(ndc,camera);return raycaster.ray}
function pickObj(cx,cy,list){rayFrom(cx,cy);const hits=raycaster.intersectObjects(list,true);if(!hits.length)return null;let o=hits[0].object;while(o&&!o.userData.loot&&!o.userData.minion&&!o.userData.enemy&&!o.userData.turret&&!o.userData.lantern)o=o.parent;return o?o.userData:null}
function buildTarget(cx,cy){const B=state.build,ray=rayFrom(cx,cy);
  if(B.tool==='remove'){const tu=pickObj(cx,cy,turrets.filter(t=>t.alive).map(t=>t.group));if(tu&&tu.turret)return{kind:'rmturret',t:tu.turret,ok:true};
    const h=voxRay(ray.origin,ray.direction,true);if(!h)return null;const m=vox[h.i];const ok=m!==1&&m!==5&&(blue[h.i]||FLUID(m)||state.material>=1);return{kind:'remove',i:h.i,ok}}
  const h=voxRay(ray.origin,ray.direction,false);if(!h)return null;
  if(B.tool==='turret'){const a=h.i,up=a+W*D;const ok=!!state.inv.turrets[B.tsel]&&iy(a)<H-2&&!vox[up]&&!turretAt(a)&&vox[a]!==5&&vox[a]!==10&&!blue[up];return{kind:'turret',i:a,ok}}
  const i=h.prev;if(i<0)return null;const m=B.sel;const ok=(vox[i]===0||(FLUID(vox[i])&&!fluidSrc.has(i)))&&!blue[i]&&iy(i)<H-1&&!turretAt(i-W*D)&&(BASIC_BLOCKS.includes(m)||(state.inv.blocks[m]||0)>0)&&!cellBusy(i);return{kind:'place',i,ok,m}}
function updateGhost(cx,cy){const T=buildTarget(cx,cy);if(!T){ghost.visible=false;$('tip').style.display='none';return}ghost.visible=true;
  if(T.kind==='rmturret'){ghost.position.set(T.t.pos.x,T.t.pos.y+.5,T.t.pos.z);ghost.scale.set(1.1,1.3,1.1)}
  else if(T.kind==='turret'){ghost.position.set(ix(T.i)+.5,iy(T.i)+1.5,iz(T.i)+.5);ghost.scale.set(.9,1,.9)}else{ghost.position.set(ix(T.i)+.5,iy(T.i)+.5,iz(T.i)+.5);ghost.scale.set(1,1,1)}
  ghost.material.color.setHex(!T.ok?0xec5f6b:T.kind.startsWith('rm')||T.kind==='remove'?0xff8a5c:0x5cc08c);
  let tip='';if(T.kind==='remove'){const m=vox[T.i];tip=blue[T.i]?`Remover ${MAT[m].n} da planta`:FLUID(m)?`Drenar ${MAT[m].n}`:`Cavar ${MAT[m].n} · 1 material`}else if(T.kind==='rmturret')tip=`Recolher ${T.t.T.n}`;else if(T.kind==='turret')tip=`Instalar ${TURRETS[state.inv.turrets[state.build.tsel]?.type||'cannon'].n}`;else tip=`Colocar ${MAT[T.m].n}`;
  showTip(cx,cy,tip,T.ok?'':'não dá aqui')}
function doBuild(cx,cy,forceRemove){const B=state.build;const tool=B.tool;if(forceRemove)B.tool='remove';const T=buildTarget(cx,cy);B.tool=tool;if(!T||!T.ok){if(T)SFX.hurt();return}
  if(T.kind==='rmturret'){killTurret(T.t,false);state.inv.turrets.push({type:T.t.type,r:T.t.r});toast(`${T.t.T.n} recolhida`,'r0');SFX.pop()}
  else if(T.kind==='remove'){const i=T.i,m=vox[i];
    if(blue[i]){const b=blue[i];const wasPre=state.prepaid.has(i);eraseBlue(i);if(m===b){removeVox(i,'dig');if(SPECIAL_BLOCKS.includes(b))addBlocks(b,1);else state.material+=1}else if(wasPre&&SPECIAL_BLOCKS.includes(b))addBlocks(b,1);toast(`${MAT[b].n} removido da planta`,'r0')}
    else if(FLUID(m)){if(fluidSrc.has(i)&&state.placed&&state.placed.has(i)){addBlocks(m,1);state.placed.delete(i)}setVox(i,0);settleDirty=true}
    else{state.material-=1;removeVox(i,'dig')}SFX.crunch(false)}
  else if(T.kind==='turret'){if(!canInstall())return;const it=state.inv.turrets.splice(B.tsel,1)[0];makeTurret(it.type,T.i,it.r);sparkle(ix(T.i)+.5,iy(T.i)+1.5,iz(T.i)+.5,RARITY[it.r].c,8);SFX.build();toast(`${TURRETS[it.type].n} instalada`,'r1');if(!state.inv.turrets.length)B.tool='remove';else B.tsel=clamp(B.tsel,0,state.inv.turrets.length-1)}
  else{const m=T.m;if(FLUID(m)){state.inv.blocks[m]--;setFluid(T.i,m,4,true);(state.placed=state.placed||new Set()).add(T.i)}
    else{placeBlue(T.i,m);if(!BASIC_BLOCKS.includes(m)){state.inv.blocks[m]--;state.prepaid.add(T.i)}}SFX.build();if(!BASIC_BLOCKS.includes(m)&&!state.inv.blocks[m])B.sel=3}
  renderBuild();updateHud()}

// ── arsenal
let arsSel=null;
function renderArsenal(){const A=state.inv,body=$('arsBody');let h='<div class="sec">Equipamentos <span class="ct">'+A.armory.length+'</span></div>';
  if(!A.armory.length)h+='<div class="ds">Equipamentos caem dos Devoradores e dos baús. Coletores trazem até aqui.</div>';
  h+='<div class="items">';const sorted=A.armory.slice().sort((a,b)=>b.r-a.r||a.slot.localeCompare(b.slot));for(const it of sorted)h+=`<button class="it r${it.r} ${arsSel===it?'sel':''}" data-id="${it.id}" title="${esc(it.n)}">${itemIco(it)}</button>`;h+='</div>';
  if(arsSel&&A.armory.includes(arsSel)){const it=arsSel;h+=`<div class="detail"><div class="nm" style="color:var(--${RARITY[it.r].css})">${itemIco(it)} ${esc(it.n)} · ${RARITY[it.r].n}</div><div class="ds">${SLOT_N[it.slot]}</div><ul>${itemLines(it).map(l=>`<li>${esc(l)}</li>`).join('')}</ul>`;
    const ms=minions.slice().sort((a,b)=>(itemScore(it,b.role)-itemScore(b.eq[it.slot],b.role))-(itemScore(it,a.role)-itemScore(a.eq[it.slot],a.role)));
    h+='<div class="ds">Equipar em:</div><div class="mlist">';for(const m of ms.slice(0,8)){const g=itemScore(it,m.role)-itemScore(m.eq[it.slot],m.role);const cur=m.eq[it.slot];h+=`<button class="mrow" data-eq="${minions.indexOf(m)}"><span>${m.R.ico} ${esc(m.name)}</span><span class="ct">${cur?itemIco(cur)+' → ':''}${g>0?'<b style="color:var(--good)">melhor</b>':'—'}</span></button>`}
    const same=A.armory.filter(o=>o.k===it.k&&o.r===it.r);if(it.r<4)h+=`</div><button class="btn wide" id="forgeIt" ${same.length<3?'disabled':''}>⚒️ Forjar 3 em 1 ${RARITY[it.r+1].n} <span class="cost">${same.length}/3</span></button><div>`;
    h+=`</div><button class="btn wide" id="sellIt">Vender <span class="cost">+${sellValue(it)} material</span></button></div>`}
  const commons=A.armory.filter(i=>i.r===0);if(commons.length)h+=`<button class="btn wide" id="sellCommon">Vender ${commons.length} comuns <span class="cost">+${commons.reduce((a,i)=>a+sellValue(i),0)}</span></button>`;
  const bl=Object.entries(A.blocks).filter(([,n])=>n>0);h+='<div class="sec">Blocos especiais</div>';h+=bl.length?'<div class="chips">'+bl.map(([m,n])=>`<span class="bchip"><i style="background:${hex(MAT[m].c)}"></i>${esc(MAT[m].n)} ×${n}</span>`).join('')+'</div>':'<div class="ds">Nenhum. Caem como loot.</div>';
  h+='<div class="sec">Armas guardadas</div>';h+=A.turrets.length?'<div class="chips">'+A.turrets.map(t=>`<span class="bchip" style="border-color:var(--${RARITY[t.r].css})">${TURRETS[t.type].ico} ${esc(TURRETS[t.type].n)}</span>`).join('')+'</div><div class="ds">Instale pelo botão Construir → Armas.</div>':'<div class="ds">Nenhuma guardada.</div>';
  const tg={};for(const t of A.turrets){const k=t.type+'|'+t.r;tg[k]=(tg[k]||0)+1}for(const k in tg)if(tg[k]>=3&&+k.split('|')[1]<4){const [ty,r]=k.split('|');h+=`<button class="btn wide" data-tf="${k}">⚒️ Forjar 3 ${esc(TURRETS[ty].n)} → ${RARITY[+r+1].n}</button>`}
  body.innerHTML=h;
  for(const b of body.querySelectorAll('[data-tf]'))b.onclick=()=>{const [ty,r]=b.dataset.tf.split('|');let n=0;for(let i=A.turrets.length-1;i>=0&&n<3;i--)if(A.turrets[i].type===ty&&A.turrets[i].r===+r){A.turrets.splice(i,1);n++}A.turrets.push({type:ty,r:+r+1});SFX.open();toast(`Forjado: ${TURRETS[ty].n} ${RARITY[+r+1].n}!`,RARITY[+r+1].css);renderArsenal()};
  for(const b of body.querySelectorAll('[data-id]'))b.onclick=()=>{arsSel=A.armory.find(i=>i.id===+b.dataset.id);renderArsenal()};
  for(const b of body.querySelectorAll('[data-eq]'))b.onclick=()=>{const m=minions[+b.dataset.eq];if(m&&arsSel){equipItem(m,arsSel);toast(`${m.name} equipou ${arsSel.n}`,RARITY[arsSel.r].css);arsSel=null;renderArsenal()}};
  const sc=$('sellCommon');if(sc)sc.onclick=()=>{let g=0;for(const it of A.armory.filter(i=>i.r===0)){A.armory.splice(A.armory.indexOf(it),1);g+=sellValue(it)}state.material+=g;SFX.coin();toast(`+${g} material`,'r1');renderArsenal();updateHud()};
  const fg=$('forgeIt');if(fg)fg.onclick=()=>{const it=arsSel;const same=A.armory.filter(o=>o.k===it.k&&o.r===it.r).slice(0,3);if(same.length<3)return;for(const o of same)A.armory.splice(A.armory.indexOf(o),1);const nw=makeEquip(it.r+1,it.k);A.armory.push(nw);arsSel=nw;SFX.open();SFX.loot(nw.r);toast(`Forjado: ${nw.n} ${RARITY[nw.r].n}!`,RARITY[nw.r].css);renderArsenal()};
  const s=$('sellIt');if(s)s.onclick=()=>{const k=A.armory.indexOf(arsSel);if(k>=0){A.armory.splice(k,1);state.material+=sellValue(arsSel);SFX.coin();arsSel=null;renderArsenal();updateHud()}}}

// ── unit card (minion or weapon), editable
function openCard(c){state.card=c;$('mcard').style.display='block';renderCard(true)}
function closeCard(){state.card=null;$('mcard').style.display='none'}
let cardSlot=null,cardAcc=0;
function renderCard(force){const c=state.card;if(!c)return;if(!force){cardAcc++;if(cardAcc%4)return}const el=$('mcard');let h='';
  if(c.m){const m=c.m;if(!minions.includes(m)){closeCard();return}
    h+=`<div class="ch"><b>${m.R.ico} ${esc(m.name)}</b><button class="btn x" id="cClose">✕</button></div><div class="ds"><span style="color:var(--${RARITY[m.rarity].css})">${RARITY[m.rarity].n}</span> · ${m.R.n}${m.trait?` · <b>${m.trait}</b>: ${TRAIT_DESC[m.trait]}`:''}</div><div class="ds"><b>Nível ${m.lvl}</b> · XP ${Math.floor(m.xp)}/${xpNeed(m.lvl)}</div>`;if(m.hero&&state.heroTal&&state.heroTal[m.hero]&&state.heroTal[m.hero].length)h+=`<div class="ds">Talentos: ${state.heroTal[m.hero].map(t=>TALENTS[t]?`${TALENTS[t].ico} ${TALENTS[t].n}`:'').join(' · ')}</div>`;
    if(m.hero){const H=HEROES.find(x=>x.id===m.hero),S=state.heroes&&state.heroes[m.hero];if(H)h+=`<div class="herobox"><div><b>${H.ico} ${H.ab}</b> · tecla ${H.key} · ${S&&S.cd>0?`recarga ${Math.ceil(S.cd)} s`:'pronto'}</div><div class="ds">${esc(H.d)}. Fica mais forte a cada nível (+7% de efeito, recarga menor).</div><div class="ds" style="font-style:italic">${esc(HERO_LORE[H.id]||'')}</div><button class="btn sm primary" id="cHeroAb">Usar ${H.ab}</button></div>`}
    h+=`<div class="hpbar"><i style="width:${m.wounded>0?0:Math.round(m.hp/m.maxhp*100)}%"></i></div><div class="ds">${m.wounded>0?`Ferido · volta em ${Math.ceil(m.wounded/state.healMul)}s`:`Vida ${Math.ceil(m.hp)}/${Math.ceil(m.maxhp)} · ${({idle:'à toa',go:'indo trabalhar',work:'trabalhando',fetch:'buscando loot',haul:'levando ao baú',man:'operando arma'})[m.state]||m.state}`}</div>`;
    h+='<div class="slots">';for(const sl of ['arma','armadura','acessorio']){const it=m.eq[sl];h+=`<button class="slot ${it?'r'+it.r:''} ${cardSlot===sl?'sel':''}" data-sl="${sl}">${it?`<span class="ico">${itemIco(it)}</span>${esc(it.n)}`:`<span class="ct">${SLOT_N[sl]}</span>vazio`}</button>`}h+='</div>';
    if(cardSlot){const opts=state.inv.armory.filter(i=>i.slot===cardSlot).sort((a,b)=>itemScore(b,m.role)-itemScore(a,m.role));h+='<div class="mlist">';if(m.eq[cardSlot])h+=`<button class="mrow" data-un="1"><span>Tirar ${esc(m.eq[cardSlot].n)}</span></button>`;
      for(const it of opts.slice(0,6))h+=`<button class="mrow" data-it="${it.id}"><span style="color:var(--${RARITY[it.r].css})">${itemIco(it)} ${esc(it.n)}</span><span class="ct">${esc(itemLines(it).slice(0,2).join(' · '))}</span></button>`;if(!opts.length)h+='<div class="ds">Nada no arsenal para este espaço.</div>';h+='</div>'}
    if(!m.hero){h+='<div class="ds" style="margin-top:6px">Função</div><div class="roles">';}for(const r in ROLES)if(!m.hero)h+=`<button class="btn sm ${m.role===r?'on':''}" data-role="${r}" title="${esc(ROLES[r].d)}">${ROLES[r].ico} ${ROLES[r].n}</button>`;if(!m.hero)h+='</div>';
    h+='<div class="ds" style="margin-top:6px">Posto</div><div class="roles">';for(const k in POSTS)h+=`<button class="btn sm ${(m.post||'auto')===k?'on':''}" data-mpost="${k}">${POSTS[k].ico} ${POSTS[k].n}</button>`;h+='</div>'}
  else if(c.t){const t=c.t;if(!t.alive){closeCard();return}h+=`<div class="ch"><b>${t.T.ico} ${esc(t.T.n)}</b><button class="btn x" id="cClose">✕</button></div><div class="ds"><span style="color:var(--${RARITY[t.r].css})">${RARITY[t.r].n}</span> · ${esc(t.T.d)}</div>`;
    h+=`<div class="hpbar"><i style="width:${Math.round(t.hp/t.maxhp*100)}%"></i></div><div class="ds">Integridade ${Math.ceil(t.hp)}/${Math.ceil(t.maxhp)} · Alcance ${turretRange(t).toFixed(0)} · ${t.gunner?(t.gunner.state==='man'?'Operada por '+esc(t.gunner.name):esc(t.gunner.name)+' a caminho'):'Sem artilheiro (metade da cadência)'}</div>`;
    h+=`<div class="roles"><button class="btn sm" id="tPick">Recolher ao arsenal</button></div>`}
  el.innerHTML=h;$('cClose').onclick=closeCard;
  for(const b of el.querySelectorAll('[data-sl]'))b.onclick=()=>{cardSlot=cardSlot===b.dataset.sl?null:b.dataset.sl;renderCard(true)};
  for(const b of el.querySelectorAll('[data-it]'))b.onclick=()=>{const it=state.inv.armory.find(i=>i.id===+b.dataset.it);if(it)equipItem(c.m,it);cardSlot=null;renderCard(true);refreshPanels()};
  for(const b of el.querySelectorAll('[data-un]'))b.onclick=()=>{unequip(c.m,cardSlot);cardSlot=null;renderCard(true);refreshPanels()};
  for(const b of el.querySelectorAll('[data-mpost]'))b.onclick=()=>{c.m.post=b.dataset.mpost;c.m.path=null;renderCard(true)};
  for(const b of el.querySelectorAll('[data-role]'))b.onclick=()=>{if(c.m.role!==b.dataset.role){const blk=roleBlock(b.dataset.role);if(blk){toast(blk,'r0');return}}setRole(c.m,b.dataset.role);toast(`${c.m.name} agora é ${ROLES[b.dataset.role].n}`,'r1');renderCard(true)};
  const ha=$('cHeroAb');if(ha)ha.onclick=()=>{heroAbility(c.m.hero);renderCard(true)};
  const tp=$('tPick');if(tp)tp.onclick=()=>{killTurret(c.t,false);state.inv.turrets.push({type:c.t.type,r:c.t.r});toast(`${c.t.T.n} recolhida`,'r0');closeCard();refreshPanels()}}

// ── hire
function renderHire(){const el=$('hire');let h=`<div class="ds" style="width:100%;text-align:center">${minions.length}/${MAX_MINIONS+MAX_MINIONS_BONUS} minions · vagas por função sobem com Quartel, Oficina e Escola</div>`;
  for(const r in ROLES){const R=ROLES[r];const lock=!isUnlocked('role',r);h+=`<button class="btn" data-h="${r}" ${state.material<R.cost||lock||!roleFree(r)?'disabled':''} title="${esc(roleBlock(r)||R.d)}">${R.ico} ${R.n} ${lock?`<span class="cost">🔒 h${unlockWave('role',r)}</span>`:`<span class="cost">${roleCount(r)}/${roleCap(r)} · ${R.cost}</span>`}</button>`}el.innerHTML=h;
  for(const b of el.querySelectorAll('[data-h]'))b.onclick=()=>{hire(b.dataset.h);renderHire()}}
function hire(role){const R=ROLES[role];const blk=roleBlock(role);if(blk){toast(blk,'r0');return false}if(minions.length>=MAX_MINIONS+MAX_MINIONS_BONUS){toast(`Limite de ${MAX_MINIONS+MAX_MINIONS_BONUS} minions: a cidadela está lotada`,'r0');return}if(state.material<R.cost)return;state.material-=R.cost;const r=rollRarity(-.1+state.luck);const m=makeMinion(role,r,CHEST.x+rnd(-1,1),CHEST.z+2.5);
  toast(`${m.name}, ${R.n} ${RARITY[r].n}${m.trait?' · '+m.trait:''}`,RARITY[r].css);SFX.pop();if(state.autoEquip)for(const it of state.inv.armory.slice())autoEquip(it);updateHud()}

// ── upgrades
const UPGRADES=[
  {id:'explosive',ico:'🎆',nm:'Balas explosivas',ds:'Balas de canhão explodem. Sem fogo amigo.',max:4,cost:l=>60+l*55,go(){state.explosive++}},
  {id:'greek',ico:'🔥',nm:'Fogo grego',ds:'Projéteis incendeiam Devoradores.',max:3,cost:l=>70+l*60,go(){state.greek++}},
  {id:'powder',ico:'💥',nm:'Pólvora',ds:'+12% de dano em todas as armas.',max:6,cost:l=>35+l*30,go(){state.dmgMul*=1.12}},
  {id:'gears',ico:'⚙️',nm:'Engrenagens',ds:'Armas recarregam 10% mais rápido.',max:5,cost:l=>40+l*35,go(){state.reloadMul*=.9}},
  {id:'plating',ico:'🔩',nm:'Blindagem',ds:'Armas aguentam +35%.',max:3,cost:l=>45+l*40,go(){state.turretHp*=1.35;for(const t of turrets){t.maxhp*=1.35;t.hp*=1.35}}},
  {id:'blades',ico:'⚔️',nm:'Treino de combate',ds:'Soldados causam +20% de dano.',max:5,cost:l=>30+l*25,go(){state.bladeMul*=1.2}},
  {id:'tools',ico:'🛠️',nm:'Ferramentas',ds:'Reparadores 20% mais rápidos.',max:5,cost:l=>30+l*25,go(){state.repMul*=1.2}},
  {id:'infirm',ico:'💊',nm:'Enfermaria',ds:'Feridos voltam 25% mais rápido.',max:4,cost:l=>30+l*30,go(){state.healMul*=1.25}},
  {id:'magnet',ico:'🧲',nm:'Ímã de loot',ds:'Coletores 15% mais rápidos e carregam +1.',max:3,cost:l=>35+l*35,go(){state.lootMag++;for(const m of minions)recompute(m)}},
  {id:'luck',ico:'🍀',nm:'Sorte do Guardião',ds:'Drops mais raros.',max:3,cost:l=>80+l*80,go(){state.luck+=.03}},
  {id:'wall',ico:'🏗️',nm:'Muralha alta',ds:'+1 fileira de metal na muralha.',max:2,cost:l=>90+l*70,go(){state.wallH++;buildBlueprint()}},
  {id:'door',ico:'🚪',nm:'Porta de metal',ds:'A porta resiste quase o dobro e não queima.',max:1,cost:()=>80,go(){state.metalDoor=true;for(const i of blueList)if(vox[i]===7){hp[i]=maxHpOf(7);paint(i)}}},
  {id:'bomb',ico:'💣',nm:'Bombas maiores',ds:'+0,6 de raio no Bombardeio.',max:4,cost:l=>50+l*45,go(){state.bombR+=.6}},
  {id:'portal',ico:'🌀',nm:'Portal de coleta',ds:'Loot esquecido no chão voa sozinho para o baú (30 s, depois 22 s, 14 s).',max:3,cost:l=>120+l*110,go(){state.portal=(state.portal||0)+1}},
  {id:'crit',ico:'🎯',nm:'Pontaria crítica',ds:'+5% de chance de crítico (dano dobrado).',max:4,cost:l=>50+l*50,go(){state.critBonus+=.05}},
  {id:'general',ico:'🎖️',nm:'General veterano',ds:'Fogo Concentrado dura 8 s e recarrega em 10 s.',max:1,cost:()=>120,go(){state.focusLong=true}},
];
const UP_CAT={explosive:'arm',greek:'arm',powder:'arm',gears:'arm',plating:'arm',crit:'arm',platform:'arm',escola:'arm',forge:'arm',bomb:'arm',oil:'arm',sappers:'arm',
  blades:'exe',tools:'exe',infirm:'exe',magnet:'exe',luck:'exe',general:'exe',quartel:'exe',oficina:'exe',bulwark:'exe',portal:'exe',
  wall:'cid',door:'cid',masonry:'cid',cathedral:'mar',observatory:'mar',greatwall:'mar',statue:'mar'};
const SHOP_TABS=[['now','✨ Pronto'],['arm','🎯 Armas'],['exe','👥 Exército'],['cid','🏰 Cidadela'],['mar','🏛️ Maravilhas']];let shopTab='now';
function renderShop(){const tb=$('shopTabs');if(tb){tb.innerHTML=SHOP_TABS.map(([k,n])=>`<button class="tab ${shopTab===k?'on':''}" data-st="${k}">${n}</button>`).join('');for(const b of tb.querySelectorAll('[data-st]'))b.onclick=()=>{shopTab=b.dataset.st;renderShop()}}
  const box=$('shopList');box.innerHTML='';let shown=0;for(const U of UPGRADES){const lv=state.ups[U.id]||0,cost=U.cost(lv),maxed=lv>=U.max;const lock=!upReady(U);
  if(shopTab==='now'){if(lock||maxed)continue}else if((UP_CAT[U.id]||'cid')!==shopTab)continue;shown++;const el=document.createElement('div');el.className='up';
  el.innerHTML=`<div class="ico">${U.ico}</div><div><div class="nm">${U.nm}</div><div class="ds">${U.ds}</div><div class="lv">${Array.from({length:U.max},(_,k)=>`<i class="${k<lv?'on':''}"></i>`).join('')} ${lv}/${U.max}</div></div><button class="btn buy" ${maxed||lock||state.material<cost?'disabled':''}>${lock?`🔒 h${upLockWave(U)}`:maxed?'máx':cost}</button>`;
  el.querySelector('button').onclick=()=>{if(maxed||lock||state.material<cost)return;state.material-=cost;state.ups[U.id]=lv+1;U.go();SFX.loot(1);toast(`${U.nm} nível ${lv+1}`,'r1');renderShop();updateHud()};box.appendChild(el)}if(!shown)box.innerHTML='<div class="ds" style="text-align:center;padding:16px">Nada disponível agora nesta aba. Veja as outras abas para o que vem pela frente.</div>'}

// ── rewards: pick 1 of 3
function rewardPool(){const w=state.wave,rr=()=>rollRarity(w*.006+state.luck),P=[];
  P.push(()=>{const r=Math.max(1,rr());const role=pick(['rep','col','gun','sol','med','sol']);return{r,ico:ROLES[role].ico,nm:`Recruta: ${ROLES[role].n}`,ds:ROLES[role].d+'.',go(){const m=makeMinion(role,r,CHEST.x,CHEST.z+2.5);toast(`${m.name} chegou!`,RARITY[r].css)}}});
  P.push(()=>{const r=Math.max(1,rr());const type=randTurretType();return{r,ico:TURRETS[type].ico,nm:TURRETS[type].n,ds:TURRETS[type].d+' Instale onde quiser.',go(){state.inv.turrets.push({type,r});state.newItems++}}});
  P.push(()=>{const r=Math.max(1,rr());const it=makeEquip(r);return{r,ico:itemIco(it),nm:it.n,ds:itemLines(it).join(' · '),go(){state.inv.armory.push(it);state.newItems++;if(state.autoEquip)autoEquip(it)}}});
  P.push(()=>{const r=rr();const pk=randBlockPack(r);return{r,ico:'🧱',nm:`${pk.n}× ${MAT[pk.m].n}`,ds:MAT[pk.m].special||'Bloco especial.',go(){addBlocks(pk.m,pk.n);state.newItems++}}});
  P.push(()=>{const r=Math.max(1,rr());return{r,ico:'🎁',nm:'Baú do tesouro',ds:'Cai no pátio. Clique nele para abrir.',go(){spawnLoot(CHEST.x+rnd(-2,2),GY+4,CHEST.z+3,'treasure',r,{})}}});
  P.push(()=>{const r=rr();const n=25+r*15+w*3;return{r,ico:'📦',nm:'Carga de material',ds:`+${n} material no baú.`,go(){state.material+=n}}});
  if(minions.some(m=>m.wounded>0))P.push(()=>({r:1,ico:'💊',nm:'Enfermaria cheia',ds:'Todos os feridos voltam agora.',go(){for(const m of minions)if(m.wounded>0)m.wounded=.01}}));
  return P}
function offerRewards(){const pool=rewardPool();const picks=[];while(picks.length<3&&pool.length){const i=Math.floor(Math.random()*pool.length);const R=pool.splice(i,1)[0]();R.r=Math.min(4,R.r+(Math.random()<.5?1:0));picks.push(R)}
  if(state.autoReward&&picks.length){const R=picks.sort((a,b)=>b.r-a.r)[0];R.go();SFX.loot(R.r);toast(`🎁 Recompensa automática: ${R.nm} (${RARITY[R.r].n})`,RARITY[R.r].css,true);refreshPanels();updateHud();return}state.choosing=true;
  const box=$('rewardCards');box.innerHTML='';$('rewardTitle').textContent=`Horda ${state.wave-1} vencida!`;$('reward').querySelector('.sub').textContent='Escolha uma recompensa.';
  for(const R of picks){const el=document.createElement('button');el.className='rcard '+RARITY[R.r].css;el.innerHTML=`<div class="ico">${R.ico}</div><div class="nm">${esc(R.nm)}</div><div class="ds">${esc(R.ds)}</div><div class="rr">${RARITY[R.r].n}</div>`;
    el.onclick=()=>{R.go();SFX.loot(R.r);$('reward').style.display='none';state.choosing=false;refreshPanels();updateHud()};box.appendChild(el)}
  {const a=document.createElement('button');a.className='btn';a.style.cssText='margin-top:10px';a.textContent='🎁 Escolher automaticamente daqui pra frente';a.onclick=()=>{state.autoReward=true;const R=picks.slice().sort((x,y)=>y.r-x.r)[0];R.go();SFX.loot(R.r);$('reward').style.display='none';state.choosing=false;refreshPanels();updateHud()};box.appendChild(a)}
  $('reward').style.display='flex';SFX.loot(1)}

// ── boss bar, tooltip
function showBoss(e){state.boss=e;$('bossbar').style.display='block';$('bossName').textContent=`${e.T.n} ${RARITY[e.rarity].n}${e.blvl?` · nv ${e.blvl}`:''}${e.bossAff==='furioso'?' · 😡 Furioso':e.bossAff==='escudo'?' · 🔷 Escudo':''}`;$('bossName').style.color=`var(--${RARITY[e.rarity].css})`}
function hideBoss(){state.boss=null;$('bossbar').style.display='none'}
function showTip(cx,cy,t,s){const el=$('tip');el.innerHTML=esc(t)+(s?`<small>${esc(s)}</small>`:'');el.style.left=cx+'px';el.style.top=cy+'px';el.style.display='block'}
function hoverAt(cx,cy){if(state.build.on){updateGhost(cx,cy);return}
  const u=pickObj(cx,cy,[...loot.filter(L=>!L.carried).map(L=>L.g),...minions.map(m=>m.group),...enemies.filter(e=>!e.dead).map(e=>e.group),...turrets.filter(t=>t.alive).map(t=>t.group)]);
  if(!u){$('tip').style.display='none';canvas.style.cursor='';return}canvas.style.cursor='pointer';
  if(u.loot){const L=u.loot;showTip(cx,cy,`${lootName(L)} · ${RARITY[L.r].n}`,L.kind==='treasure'?'Clique para abrir':L.prio?'Prioridade dos coletores':'Clique: coletores buscam primeiro')}
  else if(u.minion){const m=u.minion;showTip(cx,cy,`${m.name} · ${m.R.n} · nv ${m.lvl}`,m.wounded>0?'Ferido':'Clique para ver e equipar')}
  else if(u.enemy){const e=u.enemy;showTip(cx,cy,`${e.T.n} ${RARITY[e.rarity].n}${e.aff?' · '+AFFIX[e.aff].n:''}`,`${Math.ceil(e.hp)}/${Math.ceil(e.maxhp)} · clique: Fogo Concentrado`)}
  else if(u.turret){const t=u.turret;showTip(cx,cy,`${t.T.n} ${RARITY[t.r].n}`,t.gunner?'Operada':'Sem artilheiro')}}
