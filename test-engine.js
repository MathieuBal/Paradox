const assert = require("node:assert/strict");
const E = require("./engine.js");
// Independent enumeration: direct rules, no calls to the production solver.
function brute(B, convergence=true, limit=2) {
 const n=B.n, R=p=>Math.floor(p/n), C=p=>p%n, D=(p,q)=>Math.abs(R(p)-R(q))+Math.abs(C(p)-C(q)), all=Array.from({length:n*n},(_,i)=>i).filter(i=>B.objects[i]==null);
 const v=Array(n).fill(-1);let found=0;
 function clue(c){
  const p=v[c.a],q=c.b==null?-1:v[c.b],o=B.objects.indexOf(c.o);
  if(p<0||(c.b!=null&&q<0))return true;
  switch(c.type){case"zone":return B.zones[p]===c.z;case"edge":return (R(p)===0||R(p)===n-1||C(p)===0||C(p)===n-1)===c.y;case"near":return D(p,o)===1;case"distance":return D(p,o)===c.d;case"axis":return c.axis==="r"?R(p)===R(o):C(p)===C(o);case"offset":return R(p)-R(q)===c.dr&&C(p)-C(q)===c.dc;case"order":return Math.sign(c.axis==="r"?R(p)-R(q):C(p)-C(q))===c.sign;case"samezone":return (B.zones[p]===B.zones[q])===c.y;case"fixed":return p===c.p;default:throw Error(c.type)}
 }
 function signal(p,dir,t){const delta={N:[-1,0],S:[1,0],W:[0,-1],E:[0,1]}[dir];for(let k=1;k<=3;k++){const r=R(p)+delta[0]*k,c=C(p)+delta[1]*k;if(r<0||r>=n||c<0||c>=n||B.objects[r*n+c]!=null)return false;if(r*n+c===t)return true}return false}
 function visit(i,rows,cols){
  if(found>=limit)return;
  if(i===n){if(!convergence){found++;return}for(const t of all)if(!v.includes(t)&&signal(v[0],B.directions[0],t)&&signal(v[1],B.directions[1],t)){found++;if(found>=limit)return}return}
  for(const p of all){const r=1<<R(p),c=1<<C(p);if((r&rows)||(c&cols))continue;v[i]=p;if(B.clues.every(clue))visit(i+1,rows|r,cols|c);v[i]=-1;if(found>=limit)return}
 }
 visit(0,0,0);return found;
}
function verify(B){
 const s=E.solve(B,[],true);assert(s.ok&&s.complete);assert.deepEqual(s.values,B.solution);
 assert.equal(E.count(B),1);assert.equal(E.count(B,false),2);assert.equal(brute(B),1);assert.equal(brute(B,false),2);
 assert(E.validate(B,B.solution));assert(!E.validate(B,B.solution.map((p,i)=>i===0?B.solution[1]:p)));
 assert(!E.solve(B,[B.solution[1],B.solution[1]]).ok);
 for(let z=0;z<4;z++){const cells=B.zones.map((x,i)=>x===z?i:-1).filter(i=>i>=0),seen=new Set([cells[0]]);let changed=true;while(changed){changed=false;for(const p of cells)if(!seen.has(p)&&[...seen].some(q=>Math.abs(Math.floor(p/B.n)-Math.floor(q/B.n))+Math.abs(p%B.n-q%B.n)===1)){seen.add(p);changed=true}}assert.equal(seen.size,cells.length)}
}
verify(E.tutorial());
const intro=E.tutorial();assert.equal(intro.clues.filter(c=>c.type==="fixed").length,1);assert.equal(intro.clues.find(c=>c.type==="fixed").p,intro.solution[0]);assert(intro.clues.some(c=>c.type==="zone"&&c.a===4&&c.z===2));
for(const level of Object.keys(E.presets)){let min=100,max=0;for(let i=0;i<60;i++){const seed="test-"+i,B=E.generate(seed,level);verify(B);assert.deepEqual(E.generate(seed,level),B);min=Math.min(min,B.clues.length);max=Math.max(max,B.clues.length)}console.log(level+": 60 missions validées, "+min+"–"+max+" rapports")}
console.log("181 missions validées par deux solveurs.");
