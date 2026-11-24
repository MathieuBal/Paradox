/* PARADOX V2 — moteur de déduction spatiale */
const Paradox = (function makeEngine(){
const VERSION="3",names=["Alpha","Beta","Gamma","Delta","Epsilon","Zeta"],zones=["Laboratoire","Observatoire","Serre","Réacteur"],objectNames=["Antenne","Paillasse","Réservoir","Refroidisseur","Caisse","Console","Générateur","Archive"],presets={easy:{n:4,objects:4,keep:2},normal:{n:5,objects:5,keep:1},hard:{n:6,objects:7,keep:0}};
const range=n=>Array.from({length:n},(_,i)=>i), row=(p,n)=>Math.floor(p/n),col=(p,n)=>p%n, dist=(a,b,n)=>Math.abs(row(a,n)-row(b,n))+Math.abs(col(a,n)-col(b,n)), coord=(p,n)=>p<0?"—":String.fromCharCode(65+col(p,n))+(row(p,n)+1);
const dirs={N:[-1,0,"nord","↑"],S:[1,0,"sud","↓"],W:[0,-1,"ouest","←"],E:[0,1,"est","→"]};
function rng(seed){let h=2166136261;for(const c of seed){h^=c.charCodeAt(0);h=Math.imul(h,16777619)}return()=>{h=(h+0x6D2B79F5)|0;let t=Math.imul(h^(h>>>15),1|h);t^=t+Math.imul(t^(t>>>7),61|t);return((t^(t>>>14))>>>0)/4294967296}}
function shuffle(a,r){a=a.slice();for(let i=a.length-1;i>0;i--){let j=Math.floor(r()*(i+1));[a[i],a[j]]=[a[j],a[i]]}return a}
function ray(p,dir,board){const {n,objects}=board,[dr,dc]=dirs[dir],a=[];for(let k=1;k<=3;k++){const rr=row(p,n)+dr*k,cc=col(p,n)+dc*k,q=rr*n+cc;if(rr<0||rr>=n||cc<0||cc>=n||objects[q]!=null)break;a.push(q)}return a}
function offsetText(dr,dc){const part=(v,negative,positive)=>Math.abs(v)+(Math.abs(v)===1?" case ":" cases ")+(v<0?negative:positive);return [dr?part(dr,"au-dessus","en dessous"):null,dc?part(dc,"à gauche","à droite"):null].filter(Boolean).join(" et ")}
function clueText(c){const a=names[c.a],b=names[c.b];switch(c.type){case"zone":return a+" se trouvait dans la zone « "+zones[c.z]+" ».";case"objectOffset":return a+" se trouvait "+offsetText(c.dr,c.dc)+" de l’équipement « "+objectNames[c.o]+" ».";case"near":return a+" occupait une case directement voisine de l’équipement « "+objectNames[c.o]+" » (haut, bas, gauche ou droite).";case"distance":return a+" était à "+c.d+" cases de « "+objectNames[c.o]+" » (distance horizontale + verticale).";case"axis":return a+" était sur la même "+(c.axis==="r"?"ligne":"colonne")+" que « "+objectNames[c.o]+" ».";case"edge":return a+(c.y?" se trouvait sur le bord de la carte.":" ne se trouvait sur aucun bord de la carte.");case"offset":return a+" se trouvait "+offsetText(c.dr,c.dc)+(b==="Epsilon"?" d’":" de ")+b+".";case"order":return a+" se trouvait "+(c.axis==="r"?(c.sign>0?"au sud":"au nord"):(c.sign>0?"à l’est":"à l’ouest"))+(b==="Epsilon"?" d’":" de ")+b+".";case"samezone":return a+" et "+b+" étaient dans "+(c.y?"la même zone":"des zones différentes")+".";case"fixed":return a+" se trouvait en "+coord(c.p,c.n)+"."}}
function unary(c,p,B){const n=B.n,o=B.objects.indexOf(c.o);switch(c.type){case"zone":return B.zones[p]===c.z;case"objectOffset":return row(p,n)-row(o,n)===c.dr&&col(p,n)-col(o,n)===c.dc;case"near":return dist(p,o,n)===1;case"distance":return dist(p,o,n)===c.d;case"axis":return c.axis==="r"?row(p,n)===row(o,n):col(p,n)===col(o,n);case"edge":return (row(p,n)===0||row(p,n)===n-1||col(p,n)===0||col(p,n)===n-1)===c.y;case"fixed":return p===c.p;default:return true}}
function binary(c,p,q,B){const n=B.n;switch(c.type){case"offset":return row(p,n)-row(q,n)===c.dr&&col(p,n)-col(q,n)===c.dc;case"order":return Math.sign(c.axis==="r"?row(p,n)-row(q,n):col(p,n)-col(q,n))===c.sign;case"samezone":return (B.zones[p]===B.zones[q])===c.y;default:return true}}
function context(B,convergence=true){
 const n=B.n,M=n+(convergence?1:0),free=range(n*n).filter(p=>B.objects[p]==null),unaryClues=range(M).map(i=>B.clues.filter(c=>c.a===i&&c.b==null)),pairs=range(M).map(()=>range(M).map(()=>[])),rays=convergence?[range(n*n).map(p=>new Set(ray(p,B.directions[0],B))),range(n*n).map(p=>new Set(ray(p,B.directions[1],B)))]:[];
 for(const c of B.clues)if(c.b!=null){pairs[c.a][c.b].push([c,false]);pairs[c.b][c.a].push([c,true])}
 function compatible(i,p,j,q){if(p===q)return false;if(i<n&&j<n){if(row(p,n)===row(q,n)||col(p,n)===col(q,n))return false;for(const [c,rev] of pairs[i][j])if(!binary(c,rev?q:p,rev?p:q,B))return false}else if(convergence){const k=i===n?j:i,from=i===n?q:p,to=i===n?p:q;if(k<2&&!rays[k][from].has(to))return false}return true}
 const initial=range(M).map(i=>free.filter(p=>unaryClues[i].every(c=>unary(c,p,B))));
 return{n,M,initial,compatible,pairs,unaryClues,convergence};
}
function propagate(C,domains,trace=false){
 const {n,M,compatible}=C,d=domains.map(a=>a.slice()),steps=[];let change=true,rounds=0;
 function reduce(i,next,why){if(next.length===d[i].length)return;const old=d[i];d[i]=next;change=true;if(trace)steps.push({i,removed:old.filter(p=>!next.includes(p)),remaining:next.slice(),why})}
 while(change){change=false;rounds++;
  if(d.some(a=>a.length===0))return{ok:false,domains:d,steps,rounds};
  for(let i=0;i<M;i++)for(let j=0;j<M;j++)if(i!==j){const why=i===n||j===n?((i===0||i===1||j===0||j===1)?"Convergence des signaux ou case occupée":"L’anomalie doit être sur une case libre"):C.pairs[i][j].length?"Rapport de "+names[i]+" / "+names[j]+" et lignes-colonnes":"Une seule sonde par ligne et colonne ("+names[j]+")";reduce(i,d[i].filter(p=>d[j].some(q=>compatible(i,p,j,q))),why);if(!d[i].length)return{ok:false,domains:d,steps,rounds}}
  for(const axis of [row,col])for(let k=0;k<n;k++){const who=range(n).filter(i=>d[i].some(p=>axis(p,n)===k));if(!who.length)return{ok:false,domains:d,steps,rounds};if(who.length===1){const i=who[0];reduce(i,d[i].filter(p=>axis(p,n)===k),"Seule sonde possible pour "+(axis===row?"la ligne ":"la colonne ")+(k+1))}}
 }
 return{ok:true,complete:d.every(a=>a.length===1),domains:d,values:d.map(a=>a.length===1?a[0]:-1),steps,rounds};
}
function basic(B,placements=[]){
 const C=context(B),{n,M}=C,d=C.initial.map((a,i)=>placements[i]>=0?a.filter(p=>p===placements[i]):a.slice());
 const direct=d.slice(0,n).filter(a=>a.length===1).length;let changed=true,rounds=0;
 while(changed){changed=false;rounds++;if(d.some(a=>!a.length))break;
  const narrow=(i,next)=>{if(next.length<d[i].length){d[i]=next;changed=true}};
  for(let i=0;i<M;i++)for(let j=0;j<M;j++)if(i!==j&&d[j].length===1)narrow(i,d[i].filter(p=>C.compatible(i,p,j,d[j][0])));
  for(const axis of [row,col])for(let k=0;k<n;k++){const who=range(n).filter(i=>d[i].some(p=>axis(p,n)===k));if(who.length===1){const i=who[0];narrow(i,d[i].filter(p=>axis(p,n)===k))}}
 }
 return{direct,complete:d.every(a=>a.length===1),placed:d.filter(a=>a.length===1).length,rounds,domains:d};
}
function profile(B){const b=basic(B),proof=solve(B,[],true);return{direct:b.direct,basicComplete:b.complete,basicPlaced:b.placed,rounds:proof.rounds,steps:proof.steps.length}}
function anchored(B){const reachable=new Set(B.clues.filter(c=>c.b==null).map(c=>c.a));let changed=true;while(changed){changed=false;for(const c of B.clues)if(c.b!=null&&(reachable.has(c.a)||reachable.has(c.b))){for(const i of [c.a,c.b])if(!reachable.has(i)){reachable.add(i);changed=true}}}return B.clues.every(c=>c.b==null||reachable.has(c.a))}
function solve(B,placements=[],trace=false,convergence=true){const C=context(B,convergence),d=C.initial.map((a,i)=>placements[i]>=0?a.filter(p=>p===placements[i]):a);return propagate(C,d,trace)}
function count(B,convergence=true,limit=2){const C=context(B,convergence);let total=0;function visit(d){if(total>=limit)return;const s=propagate(C,d);if(!s.ok)return;if(s.complete){total++;return}let i=-1;for(let j=0;j<C.M;j++)if(s.domains[j].length>1&&(i<0||s.domains[j].length<s.domains[i].length))i=j;for(const p of s.domains[i]){const a=s.domains.slice();a[i]=[p];visit(a);if(total>=limit)return}}visit(C.initial);return total}
function validate(B,p){if(p.length!==B.n+1||p.some(x=>!Number.isInteger(x)||x<0||x>=B.n*B.n))return false;const C=context(B);return p.every((q,i)=>C.initial[i].includes(q)&&p.every((v,j)=>i===j||C.compatible(i,q,j,v)))}
function mapZones(n,r){const z=Array(n*n).fill(-1),corners=[0,n-1,n*(n-1),n*n-1],front=[];for(let k=0;k<4;k++){z[corners[k]]=k;front.push(corners[k])}while(front.length){const i=Math.floor(r()*front.length),p=front.splice(i,1)[0];for(const q of shuffle(range(n*n).filter(q=>dist(p,q,n)===1),r))if(z[q]<0){z[q]=z[p];front.push(q)}}return z}
function generate(seed,level="normal"){
 const P=presets[level];if(!P)throw Error("Difficulté inconnue");const n=P.n,r=rng(VERSION+":"+level+":"+seed);
 for(let attempt=0;attempt<200;attempt++){
  const rs=shuffle(range(n),r),cs=shuffle(range(n),r),s=rs.map((v,i)=>v*n+cs[i]),a=s[0],b=s[1],target=row(b,n)*n+col(a,n);
  if(Math.abs(row(b,n)-row(a,n))>3||Math.abs(col(b,n)-col(a,n))>3)continue;
  const directions=[row(b,n)>row(a,n)?"S":"N",col(a,n)>col(b,n)?"E":"W"],B={version:VERSION,n,seed,level,zones:mapZones(n,r),objects:Array(n*n).fill(null),directions,clues:[],solution:s.concat(target)};
  const protectedCells=new Set(s.concat(target,ray(a,directions[0],B),ray(b,directions[1],B)));
  const available=shuffle(range(n*n).filter(p=>!protectedCells.has(p)),r);if(available.length<P.objects)continue;
  for(let i=0;i<P.objects;i++)B.objects[available[i]]=i;
  let pool=[];for(let i=0;i<n;i++){
    const p=s[i];pool.push({type:"zone",a:i,z:B.zones[p]},{type:"edge",a:i,y:row(p,n)===0||row(p,n)===n-1||col(p,n)===0||col(p,n)===n-1});
    for(let o=0;o<P.objects;o++){const q=available[o],d=dist(p,q,n),dr=row(p,n)-row(q,n),dc=col(p,n)-col(q,n);if(level==="easy"&&d<=3&&Math.abs(dr)<=2&&Math.abs(dc)<=2)pool.push({type:"objectOffset",a:i,o,dr,dc});if(d===1)pool.push({type:"near",a:i,o});else if(d<=3)pool.push({type:"distance",a:i,o,d});if(row(p,n)===row(q,n))pool.push({type:"axis",a:i,o,axis:"r"});if(col(p,n)===col(q,n))pool.push({type:"axis",a:i,o,axis:"c"})}
    for(let j=0;j<i;j++){const dr=row(p,n)-row(s[j],n),dc=col(p,n)-col(s[j],n);pool.push({type:"order",a:i,b:j,axis:"r",sign:Math.sign(dr)},{type:"order",a:i,b:j,axis:"c",sign:Math.sign(dc)},{type:"samezone",a:i,b:j,y:B.zones[p]===B.zones[s[j]]});if(Math.abs(dr)<=2&&Math.abs(dc)<=2)pool.push({type:"offset",a:i,b:j,dr,dc})}
  }
  // Prefer a compact set of clues, starting with all of them and removing redundant ones.
  B.clues=shuffle(pool,r);
  if(!solve(B).complete)continue;
  for(let i=B.clues.length-1;i>=0;i--){const old=B.clues.splice(i,1)[0];if(!solve(B).complete)B.clues.splice(i,0,old)}
  if(count(B,false)<2)continue;
  if(!B.clues.some(c=>c.b!=null)||!B.clues.some(c=>c.b==null))continue;
  // Optional easier reports: add only facts that do not make convergence redundant.
  const extras=shuffle(pool.filter(c=>!B.clues.includes(c)),r);let kept=0;
  const directGoal=level==="easy"?2:level==="normal"?1:0;
  if(level==="easy"||level==="normal"){
    // Prefer additions that create a direct starting position, without removing the need for signals.
    for(const c of extras.filter(c=>c.b==null)){if(basic(B).direct>=directGoal)break;const before=basic(B).direct;B.clues.push(c);if(basic(B).direct<=before||basic(B).direct>directGoal||count(B,false)<2)B.clues.pop()}
  }
  if(level==="easy"){for(const c of extras){if(kept>=P.keep&&anchored(B)&&basic(B).complete)break;if(B.clues.includes(c))continue;B.clues.push(c);if(count(B,false)<2||basic(B).direct>directGoal+1)B.clues.pop();else kept++}}
  // Trim the easy report set again after adding teaching anchors, without losing its profile.
  if(level==="easy"&&basic(B).complete&&basic(B).direct>=2&&anchored(B)){
    for(let i=B.clues.length-1;i>=0;i--){const old=B.clues.splice(i,1)[0];const q=basic(B);if(q.direct<2||!q.complete||!anchored(B)||!solve(B).complete)B.clues.splice(i,0,old)}
  }
  const rating=profile(B);
  if(level==="easy"&&(rating.direct<2||!rating.basicComplete||!anchored(B)||B.clues.length>9))continue;
  if(level==="normal"&&(rating.direct!==1||rating.basicComplete||!anchored(B)))continue;
  if(level==="hard"&&(rating.direct!==0||rating.basicComplete||!anchored(B)))continue;
  B.clues.sort((a,b)=>a.a-b.a);const proof=solve(B,[],true);if(!proof.ok||!proof.complete||!validate(B,B.solution)||proof.values.some((p,i)=>p!==B.solution[i]))continue;
  B.rounds=proof.rounds;B.rating=rating;return B;
 }
 throw Error("Cette graine n’a pas produit de niveau validé. Essaie une autre graine.");
}
function tutorial(){return{version:VERSION,n:5,seed:"incident-001",level:"tutorial",zones:[0,0,0,1,1,0,0,0,1,1,2,2,3,3,1,2,2,3,3,3,2,2,3,3,3],objects:range(25).map(i=>({0:1,3:0,11:2,19:3,22:4})[i]??null),directions:["S","W"],clues:[{type:"objectOffset",a:0,o:0,dr:1,dc:-1},{type:"zone",a:1,z:3},{type:"objectOffset",a:2,o:0,dr:0,dc:1},{type:"offset",a:3,b:4,dr:1,dc:1},{type:"zone",a:4,z:2},{type:"near",a:3,o:4}],solution:[7,13,4,21,15,12]}}
return{VERSION,names,zones,objectNames,presets,dirs,coord,ray,clueText,solve,count,validate,generate,tutorial,basic,profile,anchored};
})();
if(typeof module!=="undefined")module.exports=Paradox;
