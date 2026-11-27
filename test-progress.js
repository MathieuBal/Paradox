const assert=require("node:assert/strict");
const fs=require("node:fs");
const vm=require("node:vm");
const storage=new Map();
class Element{
 constructor(){this.children=[];this.attrs={};this.dataset={};this.style={setProperty(){}};this.classes=new Set();this.classList={add:c=>this.classes.add(c),toggle(){}}}
 append(...nodes){this.children.push(...nodes)}
 replaceChildren(...nodes){this.children=nodes}
 focus(){}
 querySelector(){return null}
 setAttribute(k,v){this.attrs[k]=v}
 getAttribute(k){return this.attrs[k]}
 click(){return this.onclick?.()}
}
function boot(url="https://example.test/"){
 const html=fs.readFileSync("index.html","utf8");
 const ui=Object.fromEntries([...html.matchAll(/id="([^"]+)"/g)].map(m=>[m[1],new Element()]));
 const ctx=vm.createContext({window:{addEventListener(){},history:{replaceState(_,__,url){ctx.location=url}}},
 document:{addEventListener(){},getElementById:id=>ui[id],createElement:()=>new Element(),createElementNS:()=>new Element()},
 location:new URL(url),URL,URLSearchParams,performance,crypto:require("node:crypto").webcrypto,
 localStorage:{getItem:k=>storage.get(k),setItem:(k,v)=>storage.set(k,v)}});
 for(const path of ["engine.js","missions.js","pilots.js","app.js"])vm.runInContext(fs.readFileSync(path,"utf8"),ctx);
 return ui;
}
const saved=()=>JSON.parse(storage.get("paradox.mission.4"));
function win(ui){
 saved().board.solution.forEach((p,i)=>{ui.palette.children[i].click();ui.map.children[p].click()});
 ui.validate.click();assert.equal(ui.win.hidden,false);
}
async function test(){
 let ui=boot();
 await ui.campaign.click();ui.map.children[7].click();await ui.daily.click();
 ui=boot();await ui.campaign.click();assert.equal(saved().positions[0],7);
 for(let stage=0;stage<8;stage++){assert.equal(saved().run.stage,stage);win(ui);await ui.next.click()}
 assert.match(ui["chapter-summary"].textContent,/terminée/);
 await ui.twin.click();const board=saved().board;await ui.load.click();
 assert.equal(saved().run.kind,"twin");assert.deepEqual(saved().board,board);
 await ui.investigate.click();
 assert.equal(saved().active,0);
 assert.ok(ui.map.children[10].classes.has("contact-cell"));
 ui.map.children[10].click();assert.match(ui["contact-note"].textContent,/refroidisseur/);
 for(const [i,p] of [[0,17],[1,13],[5,12],[2,5],[3,1],[6,6],[4,24]]){
  assert.equal(saved().active,i);ui.map.children[p].click();
 }
 assert.equal(ui.win.hidden,false);assert.equal(saved().hints,0);
 await ui.pilot.click();
 for(const pilot of require("./pilots")){assert.equal(saved().board.seed,pilot.seed);win(ui);await ui.next.click()}
 ui=boot("https://example.test/?v=5&level=normal&seed=miroirs&kind=pilot");
 assert.equal(saved().board.seed,"miroirs");assert.equal(saved().run.kind,"pilot");
 await ui.training.click();
 assert.deepEqual(saved().positions,Array(6).fill(-1));
 assert.ok(ui.map.children[0].classes.has("lesson-landing"));
 assert.ok(ui.map.children[1].classes.has("lesson-anchor"));
 ui.map.children[1].click();assert.match(ui["lesson-feedback"].textContent,/B1/);
 for(const p of [0,10,8,7,13,15]){
  ui.map.children[p].click();ui=boot();
  if(p===0){
   assert.ok(!ui.map.children[10].classes.has("lesson-landing"));ui["lesson-help"].click();
   assert.ok(ui.map.children[10].classes.has("lesson-landing"));
  }
 }
 assert.equal(ui.validate.hidden,true);assert.equal(ui.win.hidden,false);
 await ui.next.click();assert.equal(saved().board.seed,"premier-echo");
 ui=boot("https://example.test/?mission=premier-echo");
 assert.deepEqual(saved().positions,Array(7).fill(-1));
 await ui["choice-easy"].click();
 for(let move=0;move<saved().positions.length;move++){
  const state=saved(),p=state.board.solution[state.active];
  if(state.active<state.board.n)assert.ok(ui.map.children[p].classes.has("contact-cell"));
  ui.map.children[p].click();
 }
 assert.equal(ui.win.hidden,false);assert.equal(saved().hints,0);
 console.log("Campagne, reprise, graine double et trois pilotes validés.");
}
test().catch(error=>{console.error(error);process.exitCode=1});
