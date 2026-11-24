(function game(){
"use strict";
const E=Paradox,$=id=>document.getElementById(id),labels={tutorial:"Initiation guidée",easy:"Facile",normal:"Intermédiaire",hard:"Expert"},symbols=["α","β","γ","δ","ε","ζ","✦"],colors=["#67e8f9","#c4b5fd","#f5d17c","#89e0ad","#f9a8d4","#a7b7e7"],objectIcons=["◉","▤","▣","❄","▧","▥","ϟ","▦"],zoneColors=["#193c46","#362d49","#234236","#483a29"];
let board,positions=[],marks=[],history=[],active=0,mode=false,signals=true,done=false,pendingHint=null;
const indexSymbol=i=>i===board.n?"✦":symbols[i],name=i=>i===board.n?"Anomalie":E.names[i],color=i=>i===board.n?"#f4f1e8":colors[i],coord=p=>E.coord(p,board.n);
function say(s,kind=""){const el=$("status");el.textContent=s;el.dataset.kind=kind}
function newSeed(){const a=new Uint32Array(2);crypto.getRandomValues(a);return Array.from(a,v=>v.toString(36)).join("-")}
function menu(open){$("mission-menu").hidden=!open;$("game").hidden=open;$("resume").hidden=!board;$("menu-error").textContent="";if(open){$("choice-"+(board?.level||"easy")).focus()}else{$("change-difficulty").focus()}}
let candidates=[], filed=new Set(), generation=0, worker=null;
const saveKey="paradox.mission.4";
function persist(){
 if(!board)return;
 try{localStorage.setItem(saveKey,JSON.stringify({board,positions,marks:marks.map(String),candidates,
   filed:[...filed],active,mode,signals,done}));}catch{}
}
function readSave(){
 try{
  const x=JSON.parse(localStorage.getItem(saveKey)), b=x?.board;
  if(!b||!["3","4"].includes(b.version)||!E.validate(b,b.solution))return null;
  const validPos=p=>Number.isInteger(p)&&(p===-1||(p>=0&&p<b.n*b.n&&b.objects[p]==null));
  if(x.positions.length!==b.n+1||!x.positions.every(validPos)||x.marks.length!==b.n+1||
    !x.marks.every(v=>/^\d+$/.test(v))||x.candidates.length!==b.n*b.n||!x.candidates.every(Number.isInteger)||
    !Array.isArray(x.filed)||!Number.isInteger(x.active)||x.active<0||x.active>b.n)return null;
  return x;
 }catch{return null}
}
function generateAsync(level,seed,version){
 if(location.protocol==="file:"||!window.Worker)return E.generate(seed,level,version);
 return new Promise((resolve,reject)=>{
   worker=new Worker("generator.js?v=4");
   worker.onmessage=({data})=>data.error?reject(Error(data.error)):resolve(data.board);
   worker.onerror=()=>reject(Error("Génération interrompue. Relance la mission."));
   worker.postMessage({level,seed,version});
 });
}
async function start(level,seed,version=E.VERSION,saved=null){
 const ticket=++generation;
 worker?.terminate();worker=null;
 const message=$("mission-menu").hidden?$("status"):$("menu-error");
 message.textContent="Préparation du plan de la station…";
 try{
  const p=saved?.board||(level==="tutorial"?E.tutorial():await generateAsync(level,seed,version));
  if(ticket!==generation)return;
  board=p;positions=saved?.positions||Array(p.n+1).fill(-1);marks=saved?saved.marks.map(BigInt):Array(p.n+1).fill(0n);
  candidates=saved?.candidates||Array(p.n*p.n).fill(0);filed=new Set(saved?.filed);
  history=[];active=saved?.active??0;mode=saved?.mode||false;signals=saved?.signals??true;
  done=!!saved?.done&&E.validate(p,positions);pendingHint=null;
  $("seed").value=p.seed;$("current-difficulty").textContent=labels[level];
  const url=new URL(location.href);url.searchParams.set("v",p.version);url.searchParams.set("level",p.level);url.searchParams.set("seed",p.seed);
  window.history.replaceState(null,"",url);render();menu(false);
  say(saved?"Mission reprise au dernier coup.":"Choisis une sonde, lis son rapport, puis touche une case libre.");
 }catch(e){if(ticket===generation)message.textContent=e.message}
 finally{if(ticket===generation){worker?.terminate();worker=null}}
}
function snapshot(){pendingHint=null;history.push({positions:positions.slice(),marks:marks.slice(),candidates:candidates.slice(),filed:[...filed],active});if(history.length>200)history.shift()}
function select(i){if(active!==i)pendingHint=null;active=i;render()}
function place(p){
 if(!board||done)return;if(board.objects[p]!=null){say(E.objectNames[board.objects[p]]+" : cette case est occupée par un équipement.");return}
 if(mode==="candidate"){
   if(positions.includes(p)){say("Choisis une case libre pour y noter une hypothèse.");return}
   snapshot();candidates[p]^=1<<active;render();say("Hypothèse mise à jour pour "+name(active)+" en "+coord(p)+".");return;
 }
 if(mode){snapshot();marks[active]^=1n<<BigInt(p);say("Annotation mise à jour.");render();return}
 const occupant=positions.indexOf(p);if(occupant>=0){select(occupant);say(name(occupant)+" sélectionnée. Touche une autre case pour la déplacer, ou Effacer.");return}
 snapshot();positions[active]=p;say(name(active)+" placée en "+coord(p)+" (non vérifiée).");render();
}
function render(){
 const n=board.n,N=n*n,grid=$("map");grid.replaceChildren();grid.style.setProperty("--n",n);
 const rays=[0,1].map(i=>signals&&positions[i]>=0?E.ray(positions[i],board.directions[i],board):[]);
 const selected=positions[active];
 for(let p=0;p<N;p++){
  const r=Math.floor(p/n),c=p%n,z=board.zones[p],o=board.objects[p],i=positions.indexOf(p),b=document.createElement("button");b.type="button";b.className="cell";b.dataset.cell=p;
  b.style.setProperty("--zone",zoneColors[z]);b.style.setProperty("--token",i>=0?color(i):color(active));
  if(c===0||board.zones[p-1]!==z)b.classList.add("wall-left");if(c===n-1||board.zones[p+1]!==z)b.classList.add("wall-right");if(r===0||board.zones[p-n]!==z)b.classList.add("wall-top");if(r===n-1||board.zones[p+n]!==z)b.classList.add("wall-bottom");
  if(i===active)b.classList.add("selected");if(selected>=0&&active<n&&i!==active&&(Math.floor(selected/n)===r||selected%n===c))b.classList.add("axis");
  if(rays[0].includes(p))b.classList.add("ray-a");if(rays[1].includes(p))b.classList.add("ray-b");if(rays[0].includes(p)&&rays[1].includes(p))b.classList.add("cross");
  if(o!=null)b.classList.add("obstacle");if((marks[active]&(1n<<BigInt(p)))!==0n)b.classList.add("excluded");
  const tag=document.createElement("span");tag.className="coordinate";tag.textContent=coord(p);b.append(tag);const zoneTag=document.createElement("span");zoneTag.className="zone-tag";zoneTag.textContent=["L","O","S","R"][z];b.append(zoneTag);
  const glyph=document.createElement("span");glyph.className="glyph";glyph.textContent=o!=null?objectIcons[o]:i>=0?indexSymbol(i):"";
  if(i<0&&o==null&&candidates[p]){
    const annotation=document.createElement("span");annotation.className="candidates";
    for(let k=0;k<=n;k++)if(candidates[p]&(1<<k)){
      const token=document.createElement("b");token.textContent=indexSymbol(k);token.style.color=color(k);annotation.append(token);
    }
    b.append(annotation);
  }
  if(o!=null){
    const icon=document.createElementNS("http://www.w3.org/2000/svg","svg");
    icon.setAttribute("viewBox","0 0 40 40");icon.setAttribute("aria-hidden","true");
    const use=document.createElementNS(icon.namespaceURI,"use");use.setAttribute("href","equipment.svg#unit-"+o);icon.append(use);
    glyph.replaceChildren(icon);
  }
  if(i>=0&&i<2){const arrow=document.createElement("sup");arrow.textContent=E.dirs[board.directions[i]][3];glyph.append(arrow)}b.append(glyph);
  const subtitle=document.createElement("span");subtitle.className="cell-label";subtitle.textContent=o!=null?E.objectNames[o]:i>=0?name(i):"";b.append(subtitle);
  b.setAttribute("aria-label",coord(p)+", "+E.zones[z]+(o!=null?", "+E.objectNames[o]:i>=0?", "+name(i)+", position proposée":", libre"));b.setAttribute("aria-pressed",String(i===active));
  if(candidates[p]&&i<0)b.setAttribute("aria-label",b.getAttribute("aria-label")+", hypothèses "+Array.from({length:n+1},(_,k)=>k).filter(k=>candidates[p]&(1<<k)).map(name).join(", "));
  if(o!=null)b.dataset.object=o;
  if(i>=0)b.classList.add("with-probe");
  b.onclick=()=>{place(p);grid.querySelector(`[data-cell="${p}"]`)?.focus({preventScroll:true})};grid.append(b);
 }
 const palette=$("palette");palette.replaceChildren();
 for(let i=0;i<=n;i++){const b=document.createElement("button");b.type="button";b.className="token";if(positions[i]>=0)b.classList.add("placed");b.style.setProperty("--token",color(i));b.setAttribute("aria-pressed",String(i===active));b.innerHTML=`<strong>${indexSymbol(i)}${i<2?`<sup>${E.dirs[board.directions[i]][3]}</sup>`:""}</strong><span>${name(i)}</span><small>${positions[i]<0?"À placer":coord(positions[i])}</small>`;b.onclick=()=>select(i);palette.append(b)}
 const reports=$("reports");reports.replaceChildren();
 const entries=board.clues.map(c=>({i:c.a,related:c.b,txt:E.clueText(c)}));
 entries.push({i:0,txt:"Le signal d’Alpha pointe vers le "+E.dirs[board.directions[0]][2]+" ("+E.dirs[board.directions[0]][3]+"), jusqu’à 3 cases."},{i:1,txt:"Le signal de Beta pointe vers le "+E.dirs[board.directions[1]][2]+" ("+E.dirs[board.directions[1]][3]+"), jusqu’à 3 cases."},{i:n,related:0,other:1,txt:"L’anomalie se trouve sur une case libre où les deux signaux se croisent."});
 entries.sort((a,b)=>a.i-b.i);
 const relevant=c=>c.i===active||c.related===active||c.other===active;
 for(const c of entries){const b=document.createElement("button");b.type="button";b.className="report";if(relevant(c))b.classList.add("report-active");b.style.setProperty("--token",color(c.i));const badge=document.createElement("span");badge.className="report-icon";badge.textContent=indexSymbol(c.i);const t=document.createElement("span");t.textContent=c.txt;b.append(badge,t);b.onclick=()=>{select(c.i);if(window.matchMedia?.("(max-width:760px)").matches)$("workbench").scrollIntoView({block:"start",behavior:"auto"})};const line=document.createElement("div");line.className="report-line";line.classList.toggle("filed",filed.has(c.txt));
 const tick=document.createElement("button");tick.className="file-report";tick.textContent="✓";tick.setAttribute("aria-pressed",String(filed.has(c.txt)));tick.setAttribute("aria-label","Marquer comme exploité : "+c.txt);
 tick.onclick=()=>{snapshot();if(filed.has(c.txt))filed.delete(c.txt);else filed.add(c.txt);render();$("reports").querySelectorAll(".file-report")[entries.indexOf(c)].focus({preventScroll:true})};
 line.append(b,tick);reports.append(line)}
 const focus=$("focus-reports");focus.replaceChildren();for(const c of entries.filter(relevant)){const li=document.createElement("li");li.textContent=c.txt;li.classList.toggle("filed",filed.has(c.txt));focus.append(li)}if(!focus.children.length){const li=document.createElement("li");li.textContent="Aucun rapport direct : recoupe les autres rapports et les lignes et colonnes.";focus.append(li)}
 $("focus-title").textContent="Rapports · "+name(active);$("focus-title").style.color=color(active);
 $("starter").hidden=board.level!=="tutorial";$("selection").textContent=name(active)+" · "+(positions[active]<0?"à placer":coord(positions[active]));$("selection").style.color=color(active);
 $("notes").setAttribute("aria-pressed",String(mode===true));$("rays").setAttribute("aria-pressed",String(signals));$("undo").disabled=!history.length;$("erase").disabled=positions[active]<0||done;
 const count=positions.filter(p=>p>=0).length;$("progress").max=n+1;$("progress").value=count;$("progressLabel").textContent=`${count}/${n+1} entités localisées`;$("metadata").textContent=`${labels[board.level]} · ${n} × ${n} · ${board.clues.length} rapports de position`;
 $("candidate").setAttribute("aria-pressed",String(mode==="candidate"));persist();
 $("validate").disabled=done;$("hint").disabled=done;$("check").disabled=done;$("win").hidden=!done;
}
$("daily").onclick=()=>start("normal","orbite-"+new Date().toISOString().slice(0,10));
for(const l of ["tutorial","easy","normal","hard"]){$("choice-"+l).onclick=()=>start(l,l==="tutorial"?"incident-001":newSeed())}
$("change-difficulty").onclick=()=>menu(true);
$("resume").onclick=()=>menu(false);
$("new").onclick=()=>start(board.level==="tutorial"?"easy":board.level,newSeed());
$("load").onclick=()=>{const seed=$("seed").value.trim();if(!seed){say("Saisis une graine.");return}start(seed==="incident-001"?"tutorial":board.level==="tutorial"?"easy":board.level,seed)};
$("share").onclick=async()=>{try{await navigator.clipboard.writeText(location.href);say("Lien de la mission copié.")}catch{say("Copie l’adresse de cette page pour partager la mission.")}};
$("notes").onclick=()=>{mode=mode!==true;render();say(mode?"Mode exclusion : marque les cases impossibles pour l’entité sélectionnée.":"Mode placement.")};
$("candidate").onclick=()=>{mode=mode==="candidate"?false:"candidate";render();say(mode?"Hypothèses : touche une case pour ajouter ou retirer "+name(active)+".":"Mode placement.")};
$("rays").onclick=()=>{signals=!signals;render()};
$("erase").onclick=()=>{if(done||positions[active]<0)return;snapshot();positions[active]=-1;say("");render()};
$("undo").onclick=()=>{const prev=history.pop();if(!prev)return;pendingHint=null;positions=prev.positions;marks=prev.marks;candidates=prev.candidates;filed=new Set(prev.filed);active=prev.active;done=false;render();say("Dernière action annulée.")};
$("reset").onclick=()=>{snapshot();positions=Array(board.n+1).fill(-1);marks.fill(0n);candidates.fill(0);filed.clear();active=0;mode=false;done=false;pendingHint=null;render();say("Mission réinitialisée.")};
$("check").onclick=()=>{const result=E.solve(board,positions);say(result.ok?"Aucune contradiction détectée par les règles de déduction.":"Au moins un placement est incompatible avec les rapports ou les règles.",result.ok?"":"error")};
$("hint").onclick=()=>{
 const s=E.solve(board,positions,true);if(!s.ok){pendingHint=null;say("Tes placements sont contradictoires. Vérifie les rapports et les lignes/colonnes.","error");return}
 if(pendingHint){const h=pendingHint;pendingHint=null;active=h.i;render();say(name(h.i)+" : "+coord(h.p)+". "+h.why);return}
 const hint=E.explain(board,positions);
 if(!hint){say("Toutes les entités sont déjà placées.");return}
 active=hint.i;pendingHint=hint;render();say("Observe "+name(hint.i)+". "+hint.why+" Touche encore Indice pour voir la case.");
};
$("validate").onclick=()=>{if(positions.includes(-1)){say("Localise toutes les sondes et l’anomalie avant de valider.");return}if(!E.validate(board,positions)){say("La configuration contredit au moins une règle ou un rapport.","error");return}done=true;render();say("MISSION ACCOMPLIE — Anomalie localisée !","win")};
$("next").onclick=()=>$("new").click();
document.addEventListener("keydown",e=>{if(!board||!$("mission-menu").hidden||e.ctrlKey||e.metaKey||e.altKey||["INPUT","SELECT","TEXTAREA"].includes(e.target.tagName))return;if(/^[1-7]$/.test(e.key)&&+e.key<=board.n+1){e.preventDefault();select(+e.key-1)}else if(e.key==="Delete"||e.key==="Backspace"){e.preventDefault();$("erase").click()}else if(e.key.toLowerCase()==="n")$("notes").click();else if(["ArrowUp","ArrowDown","ArrowLeft","ArrowRight"].includes(e.key)&&e.target.dataset.cell!=null){e.preventDefault();const p=+e.target.dataset.cell,n=board.n,dr=e.key==="ArrowUp"?-1:e.key==="ArrowDown"?1:0,dc=e.key==="ArrowLeft"?-1:e.key==="ArrowRight"?1:0,r=Math.floor(p/n)+dr,c=p%n+dc;if(r>=0&&r<n&&c>=0&&c<n)$("map").querySelector(`[data-cell="${r*n+c}"]`)?.focus()}});
const params=new URLSearchParams(location.search),level=params.get("level"),version=params.get("v"),seed=params.get("seed"),saved=readSave();
if(!level&&saved)start(saved.board.level,saved.board.seed,saved.board.version,saved);
else if((["3","4"].includes(version)||(version==="2"&&level==="tutorial"))&&(level==="tutorial"||Object.hasOwn(E.presets,level))){
 const matches=saved&&saved.board.level===level&&saved.board.seed===seed&&saved.board.version===version;
 start(level,seed||newSeed(),version,matches?saved:null);
}else{menu(true);if(level)$("menu-error").textContent="Cette version de mission est inconnue. Choisis une nouvelle mission."}
})();
