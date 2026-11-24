(function game(){
"use strict";
const E=Paradox,$=id=>document.getElementById(id),labels={tutorial:"Initiation guidée",easy:"Facile",normal:"Intermédiaire",hard:"Expert"},symbols=["α","β","γ","δ","ε","ζ","✦"],colors=["#67e8f9","#c4b5fd","#f5d17c","#89e0ad","#f9a8d4","#a7b7e7"],objectIcons=["◉","▤","▣","❄","▧","▥","ϟ","▦"],zoneColors=["#193c46","#362d49","#234236","#483a29"];
let board,positions=[],marks=[],history=[],active=0,mode=false,signals=true,done=false,pendingHint=null;
const indexSymbol=i=>i===board.n?"✦":symbols[i],name=i=>i===board.n?"Anomalie":E.names[i],color=i=>i===board.n?"#f4f1e8":colors[i],coord=p=>E.coord(p,board.n);
function say(s,kind=""){const el=$("status");el.textContent=s;el.dataset.kind=kind}
function newSeed(){const a=new Uint32Array(2);crypto.getRandomValues(a);return Array.from(a,v=>v.toString(36)).join("-")}
function menu(open){$("mission-menu").hidden=!open;$("game").hidden=open;$("resume").hidden=!board;$("menu-error").textContent="";if(open){$("choice-"+(board?.level||"easy")).focus()}else{$("change-difficulty").focus()}}
function start(level,seed){
 try{const p=level==="tutorial"?E.tutorial():E.generate(seed,level);board=p;positions=Array(p.n+1).fill(-1);marks=Array(p.n+1).fill(0n);history=[];active=0;mode=false;signals=true;done=false;pendingHint=null;
 $("seed").value=p.seed;$("current-difficulty").textContent=labels[level];const url=new URL(location.href);url.searchParams.set("v",E.VERSION);url.searchParams.set("level",p.level);url.searchParams.set("seed",p.seed);window.history.replaceState(null,"",url);render();menu(false);say("Choisis une sonde, lis son rapport, puis touche une case libre.");}
 catch(e){if(!$("mission-menu").hidden)$("menu-error").textContent=e.message;else say(e.message,"error")}
}
function snapshot(){pendingHint=null;history.push({positions:positions.slice(),marks:marks.slice(),active});if(history.length>200)history.shift()}
function select(i){if(active!==i)pendingHint=null;active=i;render()}
function place(p){
 if(!board||done)return;if(board.objects[p]!=null){say(E.objectNames[board.objects[p]]+" : cette case est occupée par un équipement.");return}
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
  if(i>=0&&i<2){const arrow=document.createElement("sup");arrow.textContent=E.dirs[board.directions[i]][3];glyph.append(arrow)}b.append(glyph);
  const subtitle=document.createElement("span");subtitle.className="cell-label";subtitle.textContent=o!=null?E.objectNames[o]:i>=0?name(i):"";b.append(subtitle);
  b.setAttribute("aria-label",coord(p)+", "+E.zones[z]+(o!=null?", "+E.objectNames[o]:i>=0?", "+name(i)+", position proposée":", libre"));b.setAttribute("aria-pressed",String(i===active));
  b.onclick=()=>{place(p);grid.querySelector(`[data-cell="${p}"]`)?.focus({preventScroll:true})};grid.append(b);
 }
 const palette=$("palette");palette.replaceChildren();
 for(let i=0;i<=n;i++){const b=document.createElement("button");b.type="button";b.className="token";if(positions[i]>=0)b.classList.add("placed");b.style.setProperty("--token",color(i));b.setAttribute("aria-pressed",String(i===active));b.innerHTML=`<strong>${indexSymbol(i)}${i<2?`<sup>${E.dirs[board.directions[i]][3]}</sup>`:""}</strong><span>${name(i)}</span><small>${positions[i]<0?"À placer":coord(positions[i])}</small>`;b.onclick=()=>select(i);palette.append(b)}
 const reports=$("reports");reports.replaceChildren();
 const entries=board.clues.map(c=>({i:c.a,related:c.b,txt:E.clueText(c)}));
 entries.push({i:0,txt:"Le signal d’Alpha pointe vers le "+E.dirs[board.directions[0]][2]+" ("+E.dirs[board.directions[0]][3]+"), jusqu’à 3 cases."},{i:1,txt:"Le signal de Beta pointe vers le "+E.dirs[board.directions[1]][2]+" ("+E.dirs[board.directions[1]][3]+"), jusqu’à 3 cases."},{i:n,related:0,other:1,txt:"L’anomalie se trouve sur une case libre où les deux signaux se croisent."});
 entries.sort((a,b)=>a.i-b.i);
 const relevant=c=>c.i===active||c.related===active||c.other===active;
 for(const c of entries){const b=document.createElement("button");b.type="button";b.className="report";if(relevant(c))b.classList.add("report-active");b.style.setProperty("--token",color(c.i));const badge=document.createElement("span");badge.className="report-icon";badge.textContent=indexSymbol(c.i);const t=document.createElement("span");t.textContent=c.txt;b.append(badge,t);b.onclick=()=>{select(c.i);if(window.matchMedia?.("(max-width:760px)").matches)$("workbench").scrollIntoView({block:"start",behavior:"auto"})};reports.append(b)}
 const focus=$("focus-reports");focus.replaceChildren();for(const c of entries.filter(relevant)){const li=document.createElement("li");li.textContent=c.txt;focus.append(li)}if(!focus.children.length){const li=document.createElement("li");li.textContent="Aucun rapport direct : recoupe les autres rapports et les lignes et colonnes.";focus.append(li)}
 $("focus-title").textContent="Rapports · "+name(active);$("focus-title").style.color=color(active);
 $("starter").hidden=board.level!=="tutorial";$("selection").textContent=name(active)+" · "+(positions[active]<0?"à placer":coord(positions[active]));$("selection").style.color=color(active);
 $("notes").setAttribute("aria-pressed",String(mode));$("rays").setAttribute("aria-pressed",String(signals));$("undo").disabled=!history.length;$("erase").disabled=positions[active]<0||done;
 const count=positions.filter(p=>p>=0).length;$("progress").max=n+1;$("progress").value=count;$("progressLabel").textContent=`${count}/${n+1} entités localisées`;$("metadata").textContent=`${labels[board.level]} · ${n} × ${n} · ${board.clues.length} rapports de position`;
 $("validate").disabled=done;$("hint").disabled=done;$("check").disabled=done;$("win").hidden=!done;
}
for(const l of ["tutorial","easy","normal","hard"]){$("choice-"+l).onclick=()=>start(l,l==="tutorial"?"incident-001":newSeed())}
$("change-difficulty").onclick=()=>menu(true);
$("resume").onclick=()=>menu(false);
$("new").onclick=()=>start(board.level==="tutorial"?"easy":board.level,newSeed());
$("load").onclick=()=>{const seed=$("seed").value.trim();if(!seed){say("Saisis une graine.");return}start(seed==="incident-001"?"tutorial":board.level==="tutorial"?"easy":board.level,seed)};
$("share").onclick=async()=>{try{await navigator.clipboard.writeText(location.href);say("Lien de la mission copié.")}catch{say("Copie l’adresse de cette page pour partager la mission.")}};
$("notes").onclick=()=>{mode=!mode;render();say(mode?"Mode exclusion : marque les cases impossibles pour l’entité sélectionnée.":"Mode placement.")};
$("rays").onclick=()=>{signals=!signals;render()};
$("erase").onclick=()=>{if(done||positions[active]<0)return;snapshot();positions[active]=-1;say("");render()};
$("undo").onclick=()=>{const prev=history.pop();if(!prev)return;pendingHint=null;positions=prev.positions;marks=prev.marks;active=prev.active;done=false;render();say("Dernière action annulée.")};
$("reset").onclick=()=>{positions=Array(board.n+1).fill(-1);marks.fill(0n);history=[];active=0;mode=false;done=false;pendingHint=null;render();say("Mission réinitialisée.")};
$("check").onclick=()=>{const result=E.solve(board,positions);say(result.ok?"Aucune contradiction détectée par les règles de déduction.":"Au moins un placement est incompatible avec les rapports ou les règles.",result.ok?"":"error")};
$("hint").onclick=()=>{
 const s=E.solve(board,positions,true);if(!s.ok){pendingHint=null;say("Tes placements sont contradictoires. Vérifie les rapports et les lignes/colonnes.","error");return}
 if(pendingHint){const h=pendingHint;pendingHint=null;active=h.i;render();say(name(h.i)+" : "+coord(h.p)+". "+h.why);return}
 const direct=E.basic(board,positions).domains;
 let i=direct.findIndex((d,i)=>positions[i]<0&&d.length===1),why="Relis ses rapports, puis élimine les cases incompatibles avec les sondes déjà placées.";
 if(i<0){const step=s.steps.find(x=>positions[x.i]<0&&x.remaining.length===1);if(step){i=step.i;why=step.why+"."}}
 if(i<0)i=s.values.findIndex((p,i)=>p>=0&&positions[i]<0);
 if(i<0){say("Toutes les entités sont déjà placées.");return}
 active=i;pendingHint={i,p:s.values[i],why};render();say("Observe "+name(i)+". "+why+" Appuie de nouveau sur Indice pour voir la case.");
};
$("validate").onclick=()=>{if(positions.includes(-1)){say("Localise toutes les sondes et l’anomalie avant de valider.");return}if(!E.validate(board,positions)){say("La configuration contredit au moins une règle ou un rapport.","error");return}done=true;render();say("MISSION ACCOMPLIE — Anomalie localisée !","win")};
$("next").onclick=()=>$("new").click();
document.addEventListener("keydown",e=>{if(!board||!$("mission-menu").hidden||e.ctrlKey||e.metaKey||e.altKey||["INPUT","SELECT","TEXTAREA"].includes(e.target.tagName))return;if(/^[1-7]$/.test(e.key)&&+e.key<=board.n+1){e.preventDefault();select(+e.key-1)}else if(e.key==="Delete"||e.key==="Backspace"){e.preventDefault();$("erase").click()}else if(e.key.toLowerCase()==="n")$("notes").click();else if(["ArrowUp","ArrowDown","ArrowLeft","ArrowRight"].includes(e.key)&&e.target.dataset.cell!=null){e.preventDefault();const p=+e.target.dataset.cell,n=board.n,dr=e.key==="ArrowUp"?-1:e.key==="ArrowDown"?1:0,dc=e.key==="ArrowLeft"?-1:e.key==="ArrowRight"?1:0,r=Math.floor(p/n)+dr,c=p%n+dc;if(r>=0&&r<n&&c>=0&&c<n)$("map").querySelector(`[data-cell="${r*n+c}"]`)?.focus()}});
const p=new URLSearchParams(location.search),l=p.get("level");if((p.get("v")===E.VERSION||(p.get("v")==="2"&&l==="tutorial"))&&(l==="tutorial"||E.presets[l]))start(l,p.get("seed")||newSeed());else{menu(true);if(p.get("v")==="2"&&E.presets[l])$("menu-error").textContent="Cette ancienne mission utilise le moteur V2. Choisis un niveau pour lancer une mission V3."}
})();
