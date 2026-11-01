const { chromium } = require('playwright');
(async()=>{const b=await chromium.launch();const p=await b.newPage({viewport:{width:900,height:220}});
await p.setContent(`<style>body{margin:0}.a{position:absolute;top:60px;width:120px;height:120px;display:grid;place-items:center;border:1px dashed #999}.a i{position:absolute;width:0;height:0;border-left:52px solid #e5484d;border-top:32px solid transparent;border-bottom:32px solid transparent}</style>`+[0,1.57,1.89,2.36,0.47,-0.87].map((r,k)=>`<div class="a" style="left:${20+k*145}px"><i style="transform:rotate(${(r*57.2958).toFixed(1)}deg)"></i><span style="position:absolute;top:-24px;font:14px sans-serif">${r}</span></div>`).join(''));
await p.screenshot({path:'tri2.png'});await b.close()})();
