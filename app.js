(function app(){
  "use strict";
  const E=Paradox,$=id=>document.getElementById(id), names={easy:"Initiation",normal:"Intermédiaire",hard:"Expert"};
  let puzzle,values=[],notes=[],history=[],selected=0,noteMode=false,showErrors=false;
  const seedNew=()=>{const a=new Uint32Array(2);crypto.getRandomValues(a);return Array.from(a,x=>x.toString(36)).join("-")};
  const coord=i=>{const n=puzzle.n,j=i%(n*n);return String.fromCharCode(65+j%n)+(Math.floor(j/n)+1)};
  function say(msg,kind=""){const el=$("status");el.textContent=msg;el.dataset.kind=kind}
  function start(seed,level){
    try{const next=E.generate(seed,level);puzzle=next;values=next.givens.slice();notes=values.map(()=>0);history=[];selected=values.findIndex(v=>v<0);noteMode=false;showErrors=false;
      $("difficulty").value=level;$("seed").value=seed;const url=new URL(location.href);url.searchParams.set("seed",seed);url.searchParams.set("level",level);window.history.replaceState(null,"",url);render();say("Anomalie initialisée. À toi de rétablir la chronologie.");
    }catch(e){say(e.message,"error")}
  }
  function violations(){
    const n=puzzle.n,N=n*n,bad=new Set();
    for(let t=0;t<2;t++)for(let i=0;i<n;i++)for(let axis=0;axis<2;axis++){
      const seen=new Map();for(let j=0;j<n;j++){const k=t*N+(axis?j*n+i:i*n+j),v=values[k];if(v<0)continue;if(seen.has(v)){bad.add(k);bad.add(seen.get(v))}else seen.set(v,k)}
    }
    puzzle.links.forEach((r,i)=>{if(r&&values[i]>=0&&values[i+N]>=0&&E.relation(values[i],values[i+N])!==r){bad.add(i);bad.add(i+N)}});
    return bad;
  }
  function render(){
    const n=puzzle.n,N=n*n,bad=showErrors?violations():new Set();
    for(let t=0;t<2;t++){
      const grid=$(t?"future":"past");grid.replaceChildren();grid.style.setProperty("--n",n);
      for(let j=0;j<N;j++){
        const i=t*N+j,v=values[i],fixed=puzzle.givens[i]>=0,active=i===selected,linked=selected>=0&&selected%N===j&&!active,b=document.createElement("button");
        b.className=["cell",fixed?"fixed":"",active?"active":"",linked?"linked":"",bad.has(i)?"bad":""].join(" ");
        b.type="button";b.dataset.index=i;b.setAttribute("aria-pressed",String(active));b.setAttribute("aria-label",`${t?"Futur":"Passé"} ${coord(i)}, ${v<0?"vide":E.symbols[v]+", rang "+(v+1)}${fixed?", indice fixe":""}, liaison ${puzzle.links[j]||"absente"}`);
        const main=document.createElement("span");main.className="glyph";main.textContent=v<0?"":E.symbols[v];b.append(main);
        if(v<0&&notes[i]){const p=document.createElement("span");p.className="pencil";p.textContent=E.bits(notes[i]).map(k=>E.symbols[k]).join(" ");b.append(p)}
        if(puzzle.links[j]){const l=document.createElement("span");l.className="link";l.textContent=puzzle.links[j];l.title="Relation passé "+puzzle.links[j]+" futur";b.append(l)}
        b.onclick=()=>{selected=i;render();$(t?"future":"past").querySelector(`[data-index="${i}"]`)?.focus({preventScroll:true})};grid.append(b);
      }
    }
    const palette=$("palette");palette.replaceChildren();
    for(let v=0;v<n;v++){const b=document.createElement("button");b.type="button";b.className="symbol";b.innerHTML=`<strong>${E.symbols[v]}</strong><small>${v+1}</small>`;b.setAttribute("aria-label","Placer "+E.symbols[v]+", rang "+(v+1));b.onclick=()=>place(v);palette.append(b)}
    $("notes").setAttribute("aria-pressed",String(noteMode));$("undo").disabled=!history.length;
    const filled=values.filter(v=>v>=0).length,percent=Math.round(100*filled/values.length);
    $("progress").value=filled;$("progress").max=values.length;$("progressLabel").textContent=`${filled} / ${values.length} cases · ${percent} %`;
    $("metadata").textContent=`${names[puzzle.level]} · ${n} × ${n} · ${puzzle.linkCount} liaisons`;
    $("selection").textContent=selected<0?"Sélectionne une case":`${selected<N?"PASSÉ":"FUTUR"} / ${coord(selected)}${puzzle.givens[selected]>=0?" · indice fixe":""}`;
    const rel=selected<0?null:puzzle.links[selected%N];
    $("relation").textContent=rel?`Passé ${rel} Futur — ${rel==="="?"même rang":rel==="<"?"rang croissant":"rang décroissant"}`:"Aucune contrainte temporelle à cette position.";
    if(filled===values.length&&violations().size===0)say("CHRONOLOGIE STABILISÉE — Niveau résolu !","win");
  }
  function snapshot(){history.push({values:values.slice(),notes:notes.slice(),selected})}
  function place(v){
    if(!puzzle||selected<0||puzzle.givens[selected]>=0){say("Sélectionne une case modifiable.");return}
    snapshot();
    if(noteMode&&v>=0){if(values[selected]>=0){values[selected]=-1;notes[selected]=0}notes[selected]^=1<<v}
    else{values[selected]=v;notes[selected]=0}
    showErrors=false;say("");render();
  }
  $("notes").onclick=()=>{noteMode=!noteMode;render();say(noteMode?"Mode annotations : ajoute ou retire des candidats.":"Mode placement.")};
  $("erase").onclick=()=>place(-1);
  $("undo").onclick=()=>{const old=history.pop();if(!old)return;values=old.values;notes=old.notes;selected=old.selected;showErrors=false;say("Dernière action annulée.");render()};
  $("check").onclick=()=>{if(!puzzle)return;showErrors=true;const bad=violations();say(bad.size?`${bad.size} cases en contradiction avec les règles.`:"Aucune contradiction directe détectée. Cela ne garantit pas encore la solution.",bad.size?"error":"");render()};
  $("hint").onclick=()=>{
    if(!puzzle)return;const s=E.solve(puzzle.n,values,puzzle.links,true);if(!s.ok){showErrors=true;render();say("Tes placements entraînent une contradiction. Vérifie-les ou annule une action.","error");return}
    const step=s.steps.find(x=>values[x.i]<0);if(!step){say(values.every(x=>x>=0)?"Grille complète.":"Aucun indice direct avec les placements actuels.");return}
    selected=step.i;render();say(`${coord(step.i)} · ${step.i<puzzle.n*puzzle.n?"Passé":"Futur"} : ${E.symbols[step.v]} — ${step.why}.`);document.querySelector(`[data-index="${selected}"]`)?.focus({preventScroll:true});
  };
  $("new").onclick=()=>start(seedNew(),$("difficulty").value);
  $("load").onclick=()=>{const seed=$("seed").value.trim();if(seed)start(seed,$("difficulty").value);else say("Indique une graine.")};
  $("reset").onclick=()=>{if(!puzzle)return;values=puzzle.givens.slice();notes=values.map(()=>0);history=[];selected=values.findIndex(v=>v<0);showErrors=false;say("Grille réinitialisée.");render()};
  $("share").onclick=async()=>{try{await navigator.clipboard.writeText(location.href);say("Lien du niveau copié.")}catch{say("Copie l’adresse de cette page pour partager le niveau.")}};
  document.addEventListener("keydown",e=>{
    if(!puzzle||["INPUT","SELECT","TEXTAREA"].includes(e.target.tagName)||e.ctrlKey||e.metaKey||e.altKey)return;
    if(/^[1-6]$/.test(e.key)&&Number(e.key)<=puzzle.n){e.preventDefault();place(Number(e.key)-1)}
    else if(e.key==="Delete"||e.key==="Backspace"){e.preventDefault();place(-1)}
    else if(e.key.toLowerCase()==="n"){$("notes").click()}
    else if(["ArrowUp","ArrowDown","ArrowLeft","ArrowRight","Tab"].includes(e.key)&&selected>=0&&e.key!=="Tab"){
      e.preventDefault();const n=puzzle.n,N=n*n,t=Math.floor(selected/N),j=selected%N,row=Math.floor(j/n),col=j%n,dr=e.key==="ArrowUp"?-1:e.key==="ArrowDown"?1:0,dc=e.key==="ArrowLeft"?-1:e.key==="ArrowRight"?1:0;selected=t*N+((row+dr+n)%n)*n+(col+dc+n)%n;render();document.querySelector(`[data-index="${selected}"]`)?.focus({preventScroll:true});
    }
  });
  const params=new URLSearchParams(location.search);start(params.get("seed")||seedNew(),E.presets[params.get("level")]?params.get("level"):"easy");
})();
