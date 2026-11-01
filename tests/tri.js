const { chromium } = require('playwright');
(async()=>{const b=await chromium.launch();const p=await b.newPage({viewport:{width:400,height:120,deviceScaleFactor:4}});
await p.setContent(`<style>.edgeA{position:absolute;left:0;top:0;width:30px;height:30px;display:grid;place-items:center}.edgeA i{position:absolute;width:0;height:0;border-left:13px solid #e5484d;border-top:8px solid transparent;border-bottom:8px solid transparent}</style>`+[1.89,2.36,0.47,-0.87].map((r,k)=>`<div class="edgeA" style="transform:translate(${40+k*80}px,40px)"><i style="transform:rotate(${r}rad)"></i></div>`).join(''));
await p.screenshot({path:'tri.png'});await b.close()})();
