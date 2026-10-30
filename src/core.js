'use strict';
// ───────── core: grid, helpers, materials, rarity, shared state, sound
const W=192,D=192,H=32,N=W*D*H,GY=5;
// fortress layout (grid units, set per game mode) and unit scale: units are bigger than voxels so destruction is finer
let CX=96,CZ=96,WA=80,WB=112;const WR=16,WT=3,TS=5,TOWER_H=12,US=1.6,KR=5,KH=15;
function setCenter(cx,cz){CX=cx;CZ=cz;WA=cx-WR;WB=cx+WR}
const idx=(x,y,z)=>x+W*(z+D*y);
const inb=(x,y,z)=>x>=0&&x<W&&y>=0&&y<H&&z>=0&&z<D;
const ix=i=>i%W,iz=i=>((i/W)|0)%D,iy=i=>(i/(W*D))|0;
const rnd=(a,b)=>a+Math.random()*(b-a);
const rint=(a,b)=>Math.floor(rnd(a,b+1));
const pick=a=>a[Math.floor(Math.random()*a.length)];
const clamp=(v,a,b)=>v<a?a:v>b?b:v;
const shuffle=a=>{for(let i=a.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));const t=a[i];a[i]=a[j];a[j]=t}return a};
const $=id=>document.getElementById(id);
const hex=c=>'#'+c.toString(16).padStart(6,'0');
const hd=(a,b)=>Math.hypot(a.x-b.x,a.z-b.z);

// materials. cost = material the repairer spends to (re)build it
const MAT={
  1:{n:'Rocha-mãe',hp:250,c:0x5a5f78},
  2:{n:'Madeira',hp:28,c:0xd9a06f,flam:1,cost:1},
  3:{n:'Pedra',hp:55,c:0xbdb6d6,cost:1},
  4:{n:'Metal',hp:100,c:0x8ea9c6,cost:3},
  5:{n:'Baú',hp:220,c:0xf0bd5a},
  6:{n:'Torre',hp:70,c:0xa89fcf,cost:1},
  7:{n:'Porta',hp:90,c:0xb5733f,flam:1,cost:2},
  8:{n:'Coração de lava',hp:4,c:0xe04a10,fluid:1,special:'Fonte de lava: queima o que passa'},
  9:{n:'Fonte de água',hp:4,c:0x4fa8e8,fluid:1,special:'Fonte de água: apaga fogo, eletrifica com Tesla'},
  10:{n:'Barril',hp:18,c:0xc9413b,flam:1,cost:2,special:'Explode em cadeia'},
  11:{n:'Folhas',hp:12,c:0x6fbf6a,flam:1},
  12:{n:'Terra',hp:30,c:0x9c7a55},
  13:{n:'Grama',hp:30,c:0x8fd08a},
  14:{n:'Obsidiana',hp:170,c:0x3a3150,cost:4,special:'Muito resistente, não queima'},
  21:{n:'Núcleo rival',hp:400,c:0xff3d5a},22:{n:'Telhado',hp:40,c:0xd0574a,cost:1},23:{n:'Estandarte',hp:16,c:0x4f7cf2,flam:1,cost:1},24:{n:'Pedra negra',hp:60,c:0x5e5670},27:{n:'Bronze',hp:70,c:0xd9a640},25:{n:'Telhado rival',hp:40,c:0x3b3450},26:{n:'Estandarte inimigo',hp:16,c:0xd9414f,flam:1},
  31:{n:'Poço de piche',hp:45,c:0x2a2422,flam:1,cost:2,special:'Gruda: inimigos em cima andam 60% mais devagar; se pegar fogo, queima por muito tempo'},
  15:{n:'Cristal',hp:120,c:0x8fe3ff,cost:3,special:'Se regenera sozinho'},
  16:{n:'Espinhos',hp:70,c:0x6b8f4e,cost:3,special:'Fere quem o ataca'},
  17:{n:'Mina',hp:20,c:0xff5a3c,cost:2,special:'Explode nos Devoradores ao quebrar'},
  18:{n:'Gelo',hp:60,c:0xd8f3ff,cost:2,special:'Congela Devoradores encostados'},
  19:{n:'Ouro',hp:80,c:0xffcf3d,cost:5,special:'Gera material enquanto estiver de pé'},
  20:{n:'Aço rúnico',hp:220,c:0x5b6fae,cost:6,special:'Quase indestrutível'},
};
const FLUID=m=>m===8||m===9;
const SOLIDM=m=>m!==0&&m!==8&&m!==9;
const BASIC_BLOCKS=[3,2,4];
const SPECIAL_BLOCKS=[16,17,18,31,15,10,14,19,20,9,8];
function maxHpOf(m){return (state.blueHp||1)*(m===7&&state.gateClosed?2.5:1)*(m===7&&state.metalDoor?170:m===6?MAT[6].hp*(1+.45*(state.blockTier||0)):MAT[m].hp)}
function isFlam(m){return !!m&&MAT[m].flam===1&&!(m===7&&state.metalDoor)}

const RARITY=[
  {n:'Comum',c:0x9aa0b2,css:'r0'},{n:'Incomum',c:0x5cc08c,css:'r1'},{n:'Raro',c:0x4f9cf2,css:'r2'},
  {n:'Épico',c:0xb56cf2,css:'r3'},{n:'Lendário',c:0xffb13d,css:'r4'}];
function rollRarity(b=0){const r=Math.random()+b;if(r>1.02)return 4;if(r>.965)return 3;if(r>.87)return 2;if(r>.66)return 1;return 0}
const NAMES=['Bolota','Tijolo','Pipoca','Faísca','Migalha','Biscoito','Torresmo','Pudim','Cocada','Paçoca','Chiclete','Pirulito','Rabisco','Trovão','Tampinha','Bigode','Farofa','Quindim','Jujuba','Feijão','Pitoco','Zica','Brigadeiro','Caju','Moranga','Bacuri','Pequi','Graveto','Cascalho','Fuligem','Pamonha','Canjica','Mandioca','Tapioca','Sirigado','Xodó','Fubá','Gengibre','Dendê','Jabuti'];

const OPTS=(()=>{try{return JSON.parse(localStorage.getItem('fortrex_opts')||'{}')}catch(e){return{}}})();function saveOpts(){try{localStorage.setItem('fortrex_opts',JSON.stringify(OPTS))}catch(e){}}
const DIFFS={calmo:{n:'Tranquilo',ico:'🌱',hp:.72,cnt:.75,dmg:.7,sp:.95,d:'Para relaxar e construir.'},normal:{n:'Normal',ico:'⚔️',hp:1.35,cnt:1.2,dmg:1.2,sp:1,arm:0,d:'O desafio pensado para o jogo.'},brutal:{n:'Brutal',ico:'💀',hp:2.3,cnt:1.6,dmg:1.6,sp:1.12,arm:.15,d:'A bruma não perdoa: pressão desde a horda 10.'}};
// brutal ramps in from normal over the first waves, so the run is decided by waves 8–10, not by an unlucky wave 3
let _dfK='',_dfV=null;const DIFF=()=>{const d=DIFFS[OPTS.diff]||DIFFS.normal;if(d!==DIFFS.brutal)return d;const w=Math.min(9,Math.max(1,state.wave|0));if(w>=9)return d;const k=OPTS.diff+w;if(_dfK===k)return _dfV;const n=DIFFS.normal,f=(w-1)/8,L=(a,b)=>a+(b-a)*f;_dfK=k;_dfV={...d,hp:L(n.hp,d.hp),cnt:L(n.cnt,d.cnt),dmg:L(n.dmg,d.dmg),sp:L(n.sp,d.sp),arm:L(0,d.arm)};return _dfV};
let simTime=0,shake=0,hitstop=0,gameSpeed=1,slowmo=0;const SPEEDS=[1,2,3,5];const MAX_MINIONS=60;
function freshState(){return{running:false,wave:1,phase:'rest',queue:[],spawnT:0,material:60,kills:0,restT:15,auto:false,
  challenge:null,fieldTraps:[],fieldTrapM:new Map(),blockTier:0,focus:null,focusT:0,focusCd:0,focusLong:false,bombCd:0,bombMode:false,bombR:4.6,
  ev:null,siege:0,boss:null,wk:0,wwound:0,choosing:false,meteorT:0,
  wallH:7,mode:'reino',morale:60,custom:new Map(),erased:new Set(),prepaid:new Set(),metalDoor:false,
  dmgMul:1,reloadMul:1,explosive:0,greek:0,repMul:1,healMul:1,bladeMul:1,turretHp:1,lootMag:0,luck:0,ups:{},
  inv:{blocks:{},turrets:[],armory:[]},autoEquip:true,newItems:0,
  autoBuild:false,autoUp:false,mgAcc:0,combo:0,comboT:-9,comboBest:0,critBonus:0,build:{on:false,tab:'blocks',sel:3,tool:'place',tsel:0},card:null,goldAcc:0}}
const state=freshState();

// ───────── sound (procedural Web Audio)
let AC=null,soundOn=false;const sfxLast={};
function ac(){if(!AC)AC=new (window.AudioContext||window.webkitAudioContext)();if(AC.state==='suspended')AC.resume();return AC}
function throttle(k,ms){const t=performance.now();if(sfxLast[k]&&t-sfxLast[k]<ms)return true;sfxLast[k]=t;return false}
function envl(g,t,a,d,p){g.gain.setValueAtTime(0,t);g.gain.linearRampToValueAtTime(p,t+a);g.gain.exponentialRampToValueAtTime(.0001,t+a+d)}
let _noise=null;
function noiseBuf(c){if(!_noise){_noise=c.createBuffer(1,(c.sampleRate*.8)|0,c.sampleRate);const d=_noise.getChannelData(0);for(let i=0;i<d.length;i++)d[i]=Math.random()*2-1}return _noise}
function nz(dur,type,freq,q,peak,att=.004){const c=ac(),s=c.createBufferSource();s.buffer=noiseBuf(c);const f=c.createBiquadFilter();f.type=type;f.frequency.value=freq;if(q)f.Q.value=q;const g=c.createGain();envl(g,c.currentTime,att,dur,peak);s.connect(f).connect(g).connect(c.destination);s.start(c.currentTime,Math.random()*.2,dur+.1)}
function tone(type,f0,f1,dur,peak,t0=0){const c=ac(),o=c.createOscillator(),g=c.createGain();o.type=type;const t=c.currentTime+t0;o.frequency.setValueAtTime(f0,t);if(f1)o.frequency.exponentialRampToValueAtTime(f1,t+dur);envl(g,t,.004,dur,peak);o.connect(g).connect(c.destination);o.start(t);o.stop(t+dur+.05)}
const SFX={
  crunch(h){if(!soundOn||throttle('cr',45))return;nz(h?.2:.12,'lowpass',h?500:1200,0,h?.3:.18)},
  pop(){if(!soundOn||throttle('pop',30))return;tone('sine',rnd(520,640),260,.1,.16)},
  boom(big){if(!soundOn||throttle('boom',60))return;nz(big?.6:.35,'lowpass',big?600:900,0,big?.5:.38,.005);tone('sine',big?90:110,35,big?.45:.25,big?.45:.32)},
  shatter(big){if(!soundOn||throttle('sh',40))return;nz(big?.4:.22,'bandpass',big?700:1800,1.2,big?.42:.24)},
  loot(r){if(!soundOn)return;const b=[523,659,784,988,1175];for(let i=0;i<=r;i++)tone(r>=3?'triangle':'sine',b[i]*(r>=2?1:.75),0,r>=3?.6:.25,.15,i*.07)},
  hurt(){if(!soundOn||throttle('hu',70))return;tone('square',300,140,.12,.06)},
  coin(){if(!soundOn||throttle('co',50))return;tone('sine',880,1320,.18,.11)},
  zap(){if(!soundOn||throttle('zap',80))return;nz(.15,'highpass',2500,0,.2);tone('sawtooth',900,200,.12,.06)},
  whoosh(){if(!soundOn||throttle('wh',160))return;nz(.25,'bandpass',500,.8,.1,.03)},
  twang(){if(!soundOn||throttle('tw',70))return;tone('triangle',420,180,.18,.14)},
  thud(){if(!soundOn||throttle('th',90))return;tone('sine',160,60,.2,.3)},
  open(){if(!soundOn)return;tone('triangle',392,0,.15,.15);tone('triangle',523,0,.15,.15,.1);tone('triangle',784,0,.5,.18,.2);nz(.6,'highpass',3000,0,.08,.05)},
  freeze(){if(!soundOn||throttle('fr',100))return;nz(.3,'highpass',4000,0,.12);tone('sine',1600,2400,.2,.05)},
  build(){if(!soundOn||throttle('bu',60))return;tone('square',220,330,.06,.05)},
  fanfare(big){if(!soundOn)return;const n=big?[523,659,784,1047,784,1047]:[523,659,784];n.forEach((f,i)=>tone('triangle',f,0,big&&i===n.length-1?.7:.22,.13,i*.11));if(big)nz(.8,'highpass',3500,0,.06,.4)},
};

// ───────── weekly challenge: the same two modifiers and biome for everyone this week, with a local best-wave record
const CH_MODS={veloz:{ico:'💨',n:'Horda veloz',d:'Inimigos 20% mais rápidos'},blindados:{ico:'🛡️',n:'Couraças',d:'Todos os inimigos com +15% de armadura'},semherois:{ico:'🚫',n:'Sem heróis',d:'Nenhum herói aparece'},bruma:{ico:'🌫️',n:'Bruma eterna',d:'Toda horda (exceto chefes) é Noite de bruma'},semegide:{ico:'💔',n:'Sem Égide',d:'A Égide do Guardião não funciona'},pobre:{ico:'🪙',n:'Cofre vazio',d:'Começa com 10 material e sem armas extras no arsenal'}};
function hasMod(k){return !!(state.challenge&&state.challenge.mods&&state.challenge.mods.includes(k))}
function weekNo(){return Math.floor((Date.now()/864e5+3)/7)}
function weeklyChallenge(){const w=weekNo();let s=w*2654435761>>>0;const rnd2=()=>{s=(s*1664525+1013904223)>>>0;return s/4294967296};const ks=Object.keys(CH_MODS);const a=ks.splice(Math.floor(rnd2()*ks.length),1)[0],b=ks[Math.floor(rnd2()*ks.length)];
  const bs=['campo','deserto','neve','vulcao','pantano'];return{week:w,mods:[a,b],biome:bs[Math.floor(rnd2()*bs.length)]}}
function chalRecords(){try{return JSON.parse(localStorage.getItem('fortrex_chal')||'{}')}catch(e){return{}}}
function chalRecord(wave){if(!state.challenge)return;const r=chalRecords();const k=state.challenge.week;if(!(r[k]>=wave)){r[k]=wave;try{localStorage.setItem('fortrex_chal',JSON.stringify(r))}catch(e){}}}
