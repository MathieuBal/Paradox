const assert=require("node:assert/strict");
const fs=require("node:fs");
const vm=require("node:vm");
const storage=new Map();
class Element{
 constructor(){this.children=[];this.attrs={};this.dataset={};this.style={setProperty(){}};this.classList={add(){},toggle(){}}}
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
 await ui.pilot.click();
 for(const pilot of require("./pilots")){assert.equal(saved().board.seed,pilot.seed);win(ui);await ui.next.click()}
 ui=boot("https://example.test/?v=5&level=normal&seed=miroirs&kind=pilot");
 assert.equal(saved().board.seed,"miroirs");assert.equal(saved().run.kind,"pilot");
 await ui.training.click();
 assert.deepEqual(saved().positions,Array(6).fill(-1));
 ui.map.children[1].click();assert.match(ui["lesson-feedback"].textContent,/B1/);
 for(const p of [0,10,8,7,13,15]){
  ui.map.children[p].click();ui=boot();
 }
 assert.equal(ui.validate.hidden,false);ui.validate.click();assert.equal(ui.win.hidden,false);
 await ui.next.click();assert.equal(saved().board.seed,"premier-echo");
 console.log("Campagne, reprise, graine double et trois pilotes validés.");
}
test().catch(error=>{console.error(error);process.exitCode=1});
