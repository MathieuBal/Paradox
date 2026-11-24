/* PARADOX — moteur pur, indépendant de l’interface. */
const Paradox = (function engine(){
  const VERSION="1", symbols=["◇","○","△","□","✦","⬡"];
  const presets={easy:{n:4,blank:.58,links:.75},normal:{n:5,blank:.67,links:.65},hard:{n:6,blank:.76,links:.55}};
  function rng(seed){let h=2166136261;for(const c of seed){h^=c.charCodeAt(0);h=Math.imul(h,16777619)}return()=>{h=(h+0x6D2B79F5)|0;let t=Math.imul(h^(h>>>15),1|h);t^=t+Math.imul(t^(t>>>7),61|t);return((t^(t>>>14))>>>0)/4294967296}}
  function shuffle(a,r){a=a.slice();for(let i=a.length-1;i>0;i--){let j=Math.floor(r()*(i+1));[a[i],a[j]]=[a[j],a[i]]}return a}
  const range=n=>Array.from({length:n},(_,i)=>i);
  const bits=m=>{const a=[];for(let i=0;m;i++,m>>>=1)if(m&1)a.push(i);return a};
  const single=m=>m!==0&&(m&(m-1))===0;
  function latin(n,r){const x=shuffle(range(n),r),y=shuffle(range(n),r),s=shuffle(range(n),r);return range(n*n).map(i=>s[(x[Math.floor(i/n)]+y[i%n])%n])}
  function units(n,layers){const a=[];for(let t=0;t<layers;t++)for(let i=0;i<n;i++){a.push(range(n).map(j=>t*n*n+i*n+j));a.push(range(n).map(j=>t*n*n+j*n+i))}return a}
  const relation=(a,b)=>a===b?"=":a<b?"<":">";
  function solve(n,givens,links,trace=false){
    const total=givens.length, N=n*n, all=(1<<n)-1, u=units(n,total/N), d=givens.map(v=>v<0?all:1<<v), steps=[];let changed=true, rounds=0, temporal=0;
    function narrow(i,m,why){const old=d[i];d[i]&=m;if(old!==d[i]){changed=true;if(why.startsWith("Liaison"))temporal++;if(trace&&single(d[i])&&!single(old))steps.push({i,v:bits(d[i])[0],why})}}
    while(changed){changed=false;rounds++;
      for(const group of u){
        let used=0;for(const i of group)if(single(d[i])){if(used&d[i])return{ok:false,d,steps,rounds,temporal};used|=d[i]}
        for(const i of group)if(!single(d[i]))narrow(i,all^used,"Élimination dans la ligne ou la colonne");
        for(let v=0;v<n;v++){const bit=1<<v, places=group.filter(i=>d[i]&bit);if(!places.length)return{ok:false,d,steps,rounds,temporal};if(places.length===1)narrow(places[0],bit,"Seul emplacement possible dans la ligne ou la colonne")}
      }
      for(let i=0;i<links.length;i++){const rel=links[i];if(!rel)continue;let a=0,b=0;for(const x of bits(d[i]))for(const y of bits(d[i+N]))if(relation(x,y)===rel){a|=1<<x;b|=1<<y}narrow(i,a,"Liaison temporelle "+rel);narrow(i+N,b,"Liaison temporelle "+rel)}
      if(d.some(m=>m===0))return{ok:false,d,steps,rounds,temporal};
    }
    return{ok:true,complete:d.every(single),d,steps,rounds,temporal,values:d.map(m=>single(m)?bits(m)[0]:-1)};
  }
  function count(n,givens,links=[],limit=2){let found=0;function visit(g){if(found>=limit)return;const s=solve(n,g,links);if(!s.ok)return;if(s.complete){found++;return}let idx=-1,best=n+1;for(let i=0;i<s.d.length;i++){const k=bits(s.d[i]).length;if(k>1&&k<best){idx=i;best=k}}for(const v of bits(s.d[idx])){const next=s.values.slice();next[idx]=v;visit(next);if(found>=limit)return}}visit(givens);return found}
  function generate(seed,level="easy"){
    if(!presets[level])throw Error("Difficulté inconnue");const p=presets[level],n=p.n,N=n*n,r=rng(VERSION+":"+level+":"+seed);
    for(let attempt=0;attempt<40;attempt++){
      const a=latin(n,r),b=latin(n,r),solution=a.concat(b),givens=solution.slice(),links=a.map((v,i)=>relation(v,b[i]));let blanks=0;
      const order=shuffle(range(2*N),r);
      for(const i of order){const old=givens[i];givens[i]=-1;if(solve(n,givens,links).complete)blanks++;else givens[i]=old;
        if(blanks>=Math.round(2*N*p.blank)&&!solve(n,givens.slice(0,N),[]).complete&&!solve(n,givens.slice(N),[]).complete)break}
      if(count(n,givens.slice(0,N))<2||count(n,givens.slice(N))<2)continue;
      let left=N;for(const i of shuffle(range(N),r)){if(left<=Math.ceil(N*p.links))break;const old=links[i];links[i]=null;if(solve(n,givens,links).complete)left--;else links[i]=old}
      const s=solve(n,givens,links);
      if(s.ok&&s.complete&&s.temporal>0&&s.values.every((v,i)=>v===solution[i]))return{n,seed,level,givens,links,solution,rounds:s.rounds,blanks,linkCount:left};
    }throw Error("Génération impossible pour cette graine. Réessayez avec une autre graine.");
  }
  return{VERSION,symbols,presets,solve,count,generate,relation,bits};
})();
if(typeof module!=="undefined")module.exports=Paradox;
