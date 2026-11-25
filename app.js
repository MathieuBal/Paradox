(function game(){
"use strict";
const E=Paradox,$=id=>document.getElementById(id),labels={tutorial:"Initiation guidée",easy:"Facile",normal:"Intermédiaire",hard:"Expert"},symbols=["α","β","γ","δ","ε","ζ","✦"],colors=["#67e8f9","#c4b5fd","#f5d17c","#89e0ad","#f9a8d4","#a7b7e7"],objectIcons=["◉","▤","▣","❄","▧","▥","ϟ","▦"],zoneColors=["#193c46","#362d49","#234236","#483a29"];
let board,positions=[],marks=[],history=[],active=0,mode=false,signals=true,done=false,pendingHint=null;
const indexSymbol=i=>i===board.n?"✦":symbols[i],name=i=>i===board.n?"Anomalie":E.names[i],color=i=>i===board.n?"#f4f1e8":colors[i],coord=p=>E.coord(p,board.n);
function say(s,kind=""){const el=$("status");el.textContent=s;el.dataset.kind=kind}
function newSeed(){const a=new Uint32Array(2);crypto.getRandomValues(a);return Array.from(a,v=>v.toString(36)).join("-")}
const modeNames={classic:"Classique",daily:"Anomalie du jour",campaign:"Campagne",marathon:"Marathon",custom:"Personnalisée",absolute:"Expert absolu"};
let run=Missions.route(), elapsed=0, clock=null, hints=0, recorded=false;
const journalKey="paradox.journal.1";
let audioEnabled=false,audioContext;
try{audioEnabled=localStorage.getItem("paradox.audio")==="1"}catch{}
function tone(win=false){
 if(!audioEnabled)return;
 try{
  audioContext??=new (window.AudioContext||window.webkitAudioContext)();
  if(audioContext.state==="suspended")audioContext.resume().catch(()=>{});
  const t=audioContext.currentTime;
  for(const [i,hz] of (win?[440,554,659]:[330]).entries()){
   const oscillator=audioContext.createOscillator(),gain=audioContext.createGain(),start=t+i*.1;
   oscillator.frequency.value=hz;gain.gain.setValueAtTime(.035,start);gain.gain.exponentialRampToValueAtTime(.001,start+.10);
   oscillator.connect(gain);gain.connect(audioContext.destination);oscillator.start(start);oscillator.stop(start+.12);
  }
 }catch{}
}
$("audio").setAttribute("aria-pressed",String(audioEnabled));
$("audio").onclick=()=>{audioEnabled=!audioEnabled;$("audio").setAttribute("aria-pressed",String(audioEnabled));try{localStorage.setItem("paradox.audio",audioEnabled?"1":"0")}catch{}tone()};
function journal(){
 try{const data=JSON.parse(localStorage.getItem(journalKey));if(Array.isArray(data))return data.filter(x=>x&&typeof x.id==="string"&&Number.isFinite(x.ms))}catch{}
 return [];
}
function updateClock(){
 if(clock!==null){elapsed+=performance.now()-clock;clock=null}
 if(board&&!done&&!document.hidden&&$("mission-menu").hidden)clock=performance.now();
}
function playTime(){return Math.round(elapsed+(clock===null?0:performance.now()-clock))}
function chapterIndex(){
 const cleared=new Set(journal().filter(x=>x.kind==="campaign").map(x=>x.stage));
 const next=Missions.chapters.findIndex((_,i)=>!cleared.has(i));
 return next<0?0:next;
}
function renderJournal(){
 const entries=journal(),stage=chapterIndex();
 $("chapter-summary").textContent="Chapitre "+(stage+1)+" / "+Missions.chapters.length+" · "+Missions.chapters[stage].title;
 const recovered=new Set(entries.filter(e=>e.kind==="campaign").map(e=>e.stage));
 const archive=$("nacre-archive");archive.replaceChildren();
 $("archive-count").textContent="Archives de Nacre · "+recovered.size+" / "+Missions.chapters.length;
 Missions.chapters.forEach((chapter,i)=>{
  if(!recovered.has(i))return;
  const entry=document.createElement("details"),title=document.createElement("summary"),fragment=document.createElement("p");
  title.textContent=(i+1)+". "+chapter.title;fragment.textContent=chapter.fragment;
  entry.append(title,fragment);archive.append(entry);
 });
 const days=new Set(entries.filter(x=>Number.isInteger(x.day)).map(x=>x.day));
 let day=Math.floor(Date.now()/86400000),streak=0;
 if(!days.has(day))day--;
 while(days.has(day--))streak++;
 const clean=entries.filter(x=>x.hints===0).length;
 $("stats-summary").textContent=entries.length?entries.length+" missions distinctes terminées · "+clean+" sans indice · série de "+streak+" jour(s).":"Tes missions terminées apparaîtront ici.";
 const list=$("flight-log");list.replaceChildren();
 for(const flight of entries.slice(-8).reverse()){
  const item=document.createElement("li");
  item.textContent=(modeNames[flight.kind]||"Classique")+" · "+labels[flight.level]+" · "+Missions.duration(flight.ms)+" · "+flight.hints+" indice(s)";
  list.append(item);
 }
}
function recordWin(){
 if(recorded)return;
 const entries=journal(),id=Missions.identity(board,run);
 if(!entries.some(x=>x.id===id)){
  entries.push({id,kind:run.kind,stage:run.stage,level:board.level,day:Math.floor(Date.now()/86400000),ms:playTime(),hints});
  try{localStorage.setItem(journalKey,JSON.stringify(entries))}catch{}
 }
 recorded=true;
}
function launch([level,seed,options]){return start(level,seed,E.VERSION,null,options)}
document.addEventListener("visibilitychange",()=>{updateClock();persist()});
window.addEventListener("pagehide",()=>{updateClock();persist()});
function menu(open){$("mission-menu").hidden=!open;$("game").hidden=open;$("resume").hidden=!board;$("menu-error").textContent="";updateClock();if(open){renderJournal();$("choice-"+(board?.level||"easy")).focus()}else{$("change-difficulty").focus()}}
let pinnedText=null, cluePage=0, trial=null;
let candidates=[], filed=new Set(), generation=0, worker=null;
const saveKey="paradox.mission.4";
function persist(){
 if(!board)return;
 try{localStorage.setItem(saveKey,JSON.stringify({board,positions,marks:marks.map(String),candidates,
   filed:[...filed],active,mode,signals,done,run,elapsed:playTime(),hints,recorded,pinnedText,trial}));}catch{}
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
function generateAsync(level,seed,version,signal){
 if(location.protocol==="file:"||!window.Worker)return E.generate(seed,level,version,signal);
 return new Promise((resolve,reject)=>{
   worker=new Worker("generator.js?v=5");
   worker.onmessage=({data})=>data.error?reject(Error(data.error)):resolve(data.board);
   worker.onerror=()=>reject(Error("Génération interrompue. Relance la mission."));
   worker.postMessage({level,seed,version,signal});
 });
}
async function start(level,seed,version=E.VERSION,saved=null,options={}){
 const nextRun=Missions.route(saved?.run||options);
 const ticket=++generation;
 worker?.terminate();worker=null;
 const message=$("mission-menu").hidden?$("status"):$("menu-error");
 message.textContent="Préparation du plan de la station…";
 try{
  const p=saved?.board||(level==="tutorial"?E.tutorial():await generateAsync(level,seed,version,nextRun.signal));
  if(ticket!==generation)return;
  cluePage=0;trial=saved?.trial||null;$("recovered-file").open=false;
  pinnedText=typeof saved?.pinnedText==="string"?saved.pinnedText:null;run=nextRun;elapsed=Number(saved?.elapsed)||0;clock=null;hints=Number(saved?.hints)||0;recorded=!!saved?.recorded;
  $("nacre-log").open=false;board=p;positions=saved?.positions||Array(p.n+1).fill(-1);marks=saved?saved.marks.map(BigInt):Array(p.n+1).fill(0n);
  candidates=saved?.candidates||Array(p.n*p.n).fill(0);filed=new Set(saved?.filed);
  history=[];active=saved?.active??0;mode=saved?.mode||false;signals=run.kind==="absolute"?false:(saved?.signals??true);
  done=!!saved?.done&&E.validate(p,positions);pendingHint=null;
  $("seed").value=p.seed;$("current-difficulty").textContent=labels[level];
  const url=new URL(location.href);url.searchParams.set("v",p.version);url.searchParams.set("level",p.level);url.searchParams.set("seed",p.seed);
  for(const key of ["kind","stage","signal"])url.searchParams.delete(key);
  if(run.kind!=="classic")url.searchParams.set("kind",run.kind);
  if(run.stage)url.searchParams.set("stage",run.stage);
  if(run.signal!=="standard")url.searchParams.set("signal",run.signal);
  window.history.replaceState(null,"",url);render();menu(false);
  say(saved?"Mission reprise au dernier coup.":"Choisis une sonde, lis son rapport, puis touche une case libre.");
 }catch(e){if(ticket===generation)message.textContent=e.message}
 finally{if(ticket===generation){worker?.terminate();worker=null}}
}
function snapshot(){pendingHint=null;history.push({positions:positions.slice(),marks:marks.slice(),candidates:candidates.slice(),filed:[...filed],active});if(history.length>200)history.shift()}
$("trial").onclick=()=>{
 if(done||trial)return;
 trial={positions:positions.slice(),marks:marks.map(String),candidates:candidates.slice(),filed:[...filed],active,pinnedText,mode,signals};
 render();say("Essaie tes placements. Tu pourras revenir à cette grille.");
};
$("keep-trial").onclick=()=>{trial=null;render();say("Placements et notes conservés.")};
$("drop-trial").onclick=()=>{
 if(!trial)return;
 snapshot();positions=trial.positions;marks=trial.marks.map(BigInt);candidates=trial.candidates;filed=new Set(trial.filed);
 active=trial.active;pinnedText=trial.pinnedText;mode=trial.mode;signals=trial.signals;trial=null;cluePage=0;
 render();say("Grille et notes restaurées.");
};
$("cycle-clue").onclick=()=>{cluePage++;render();$("cycle-clue").focus({preventScroll:true})};
function select(i){if(active!==i){cluePage=0;pendingHint=null;pinnedText=null;}active=i;render()}
function place(p){
 if(!board||done)return;if(board.objects[p]!=null){say(E.objectNames[board.objects[p]]+" : cette case est occupée par un équipement.");return}
 if(mode==="candidate"){
   if(positions.includes(p)){say("Choisis une case libre pour y noter une hypothèse.");return}
   snapshot();candidates[p]^=1<<active;render();say("Hypothèse mise à jour pour "+name(active)+" en "+coord(p)+".");return;
 }
 if(mode){snapshot();marks[active]^=1n<<BigInt(p);say("Annotation mise à jour.");render();return}
 const occupant=positions.indexOf(p);if(occupant>=0){select(occupant);say(name(occupant)+" sélectionnée. Touche une autre case pour la déplacer, ou Effacer.");return}
 snapshot();positions[active]=p;tone();say(name(active)+" placée en "+coord(p)+" (non vérifiée).");render();
}
function reportReferences(entry){
 const refs=new Map(),c=entry.clue;
 for(const z of [c?.z,c?.alt].filter(Number.isInteger)){
   board.zones.forEach((zone,p)=>{if(zone===z)refs.set(p,E.zones[z])});
 }
 for(const o of [c?.o,c?.other].filter(Number.isInteger)){
   const p=board.objects.indexOf(o);
   if(p>=0)refs.set(p,E.objectNames[o]+" "+coord(p));
 }
 for(const i of [entry.i,entry.related,entry.other].filter(Number.isInteger)){
   const p=positions[i];if(p>=0)refs.set(p,name(i)+" "+coord(p));
 }
 return refs;
}
function pin(entry,fromJournal){
 pinnedText=entry.txt;pendingHint=null;
 if(fromJournal)active=entry.i;
 render();$("unpin").focus({preventScroll:true});
 $("pinned").scrollIntoView({block:"nearest"});
}
$("unpin").onclick=()=>{pinnedText=null;render();$("focus-reports").querySelector("button")?.focus({preventScroll:true})};
function render(){
 const n=board.n,N=n*n,grid=$("map");grid.replaceChildren();grid.style.setProperty("--n",n);
 const entries=board.clues.map(c=>({clue:c,i:c.a,related:c.b,txt:E.clueText(c)}));
 entries.push({i:0,txt:E.beamLabel(board,0).text},{i:1,txt:E.beamLabel(board,1).text},{i:n,related:0,other:1,txt:"L’anomalie se trouve sur une case libre où les deux signaux se croisent."});
 entries.sort((a,b)=>a.i-b.i);
 const relevant=c=>c.i===active||c.related===active||c.other===active;
 const pinned=entries.find(e=>e.txt===pinnedText);
 const references=pinned?reportReferences(pinned):new Map();
 $("pinned").hidden=!pinned;
 $("pinned-text").textContent=pinned?.txt||"";
 $("pinned-refs").textContent=[...new Set(references.values())].join(" · ");
 const switches=$("related-probes");switches.replaceChildren();
 if(pinned)for(const i of [pinned.i,pinned.related,pinned.other].filter(Number.isInteger)){
   const button=document.createElement("button");button.type="button";
   button.textContent=name(i)+" · "+(positions[i]>=0?coord(positions[i]):"à placer");
   button.setAttribute("aria-pressed",String(i===active));button.style.setProperty("--token",color(i));
   button.onclick=()=>{active=i;pendingHint=null;render();$("unpin").focus({preventScroll:true})};switches.append(button);
 }
 const rays=[0,1].map(i=>signals&&positions[i]>=0?E.beam(board,i,positions[i]):[]);
 const selected=positions[active];
 for(let p=0;p<N;p++){
  const r=Math.floor(p/n),c=p%n,z=board.zones[p],o=board.objects[p],i=positions.indexOf(p),b=document.createElement("button");b.type="button";b.className="cell";b.dataset.cell=p;b.dataset.zone=z;
  b.style.setProperty("--zone",zoneColors[z]);b.style.setProperty("--token",i>=0?color(i):color(active));
  if(c===0||board.zones[p-1]!==z)b.classList.add("wall-left");if(c===n-1||board.zones[p+1]!==z)b.classList.add("wall-right");if(r===0||board.zones[p-n]!==z)b.classList.add("wall-top");if(r===n-1||board.zones[p+n]!==z)b.classList.add("wall-bottom");
  if(i===active)b.classList.add("selected");if(selected>=0&&active<n&&i!==active&&(Math.floor(selected/n)===r||selected%n===c))b.classList.add("axis");
  if(rays[0].includes(p)){
   b.classList.add("ray-a");const origin=positions[0],dr=r-Math.floor(origin/n),dc=c-origin%n;
   b.style.setProperty("--bearing",!dr?"0deg":!dc?"90deg":dr*dc>0?"45deg":"-45deg");
  }if(rays[1].includes(p))b.classList.add("ray-b");if(rays[0].includes(p)&&rays[1].includes(p))b.classList.add("cross");
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
  if(i>=0&&i<2){const arrow=document.createElement("sup");arrow.textContent=E.beamLabel(board,i).arrow;glyph.append(arrow)}b.append(glyph);
  const subtitle=document.createElement("span");subtitle.className="cell-label";subtitle.textContent=o!=null?E.objectNames[o]:i>=0?name(i):"";b.append(subtitle);
  b.setAttribute("aria-label",coord(p)+", "+E.zones[z]+(o!=null?", "+E.objectNames[o]:i>=0?", "+name(i)+", position proposée":", libre"));b.setAttribute("aria-pressed",String(i===active));
  if(candidates[p]&&i<0)b.setAttribute("aria-label",b.getAttribute("aria-label")+", hypothèses "+Array.from({length:n+1},(_,k)=>k).filter(k=>candidates[p]&(1<<k)).map(name).join(", "));
  if(o!=null)b.dataset.object=o;
  if(i>=0){b.dataset.probe=i===n?"anomaly":i;b.classList.add("with-probe")}
  if(references.has(p)){b.classList.add("referenced");b.setAttribute("aria-label",b.getAttribute("aria-label")+", repère du rapport")}
  b.onclick=()=>{place(p);grid.querySelector(`[data-cell="${p}"]`)?.focus({preventScroll:true})};grid.append(b);
 }
 const palette=$("palette");palette.replaceChildren();
 for(let i=0;i<=n;i++){const b=document.createElement("button");b.type="button";b.className="token";if(positions[i]>=0)b.classList.add("placed");b.style.setProperty("--token",color(i));b.setAttribute("aria-pressed",String(i===active));b.innerHTML=`<strong>${indexSymbol(i)}${i<2?`<sup>${E.beamLabel(board,i).arrow}</sup>`:""}</strong><span>${name(i)}</span><small>${positions[i]<0?"À placer":coord(positions[i])}</small>`;b.onclick=()=>select(i);palette.append(b)}
 const reports=$("reports");reports.replaceChildren();
 for(const c of entries){const b=document.createElement("button");b.type="button";b.className="report";if(relevant(c))b.classList.add("report-active");b.style.setProperty("--token",color(c.i));const badge=document.createElement("span");badge.className="report-icon";badge.textContent=indexSymbol(c.i);const t=document.createElement("span");t.textContent=c.txt;b.append(badge,t);b.onclick=()=>pin(c,true);const line=document.createElement("div");line.className="report-line";line.classList.toggle("filed",filed.has(c.txt));
 const tick=document.createElement("button");tick.className="file-report";tick.textContent="✓";tick.setAttribute("aria-pressed",String(filed.has(c.txt)));tick.setAttribute("aria-label","Marquer comme exploité : "+c.txt);
 tick.onclick=()=>{snapshot();if(filed.has(c.txt))filed.delete(c.txt);else filed.add(c.txt);render();$("reports").querySelectorAll(".file-report")[entries.indexOf(c)].focus({preventScroll:true})};
 line.append(b,tick);reports.append(line)}
 const focus=$("focus-reports");focus.replaceChildren();const availableClues=entries.filter(relevant);
 const page=cluePage%Math.max(1,availableClues.length);
 $("cycle-clue").hidden=availableClues.length<2;
 $("cycle-clue").textContent="Suivant · "+(page+1)+"/"+availableClues.length;
 $("focus-panel").hidden=!!pinned;
 for(const c of availableClues.slice(page,page+1)){const li=document.createElement("li");const link=document.createElement("button");link.type="button";link.className="focus-clue";link.textContent=c.txt;link.onclick=()=>pin(c,false);li.append(link);li.classList.toggle("filed",filed.has(c.txt));focus.append(li)}if(!focus.children.length){const li=document.createElement("li");li.textContent="Aucun rapport direct : recoupe les autres rapports et les lignes et colonnes.";focus.append(li)}
 $("focus-title").textContent="Rapports · "+name(active);$("focus-title").style.color=color(active);
 $("starter").hidden=board.level!=="tutorial";$("selection").textContent=name(active)+" · "+(positions[active]<0?"à placer":coord(positions[active]));$("selection").style.color=color(active);
 $("notes").setAttribute("aria-pressed",String(mode===true));$("rays").setAttribute("aria-pressed",String(signals));$("undo").disabled=!history.length;$("erase").disabled=positions[active]<0||done;
 const count=positions.filter(p=>p>=0).length;$("progress").max=n+1;$("progress").value=count;$("progressLabel").textContent=`${count}/${n+1} entités localisées`;$("metadata").textContent=`${labels[board.level]} · ${n} × ${n} · ${board.clues.length} rapports de position`;
 $("candidate").setAttribute("aria-pressed",String(mode==="candidate"));persist();
 $("trial").hidden=!!trial||done;$("trial-actions").hidden=!trial||done;
 const absolute=run.kind==="absolute";
 for(const id of ["hint","check","rays"])$(id).hidden=absolute;
 const chapter=run.kind==="campaign"?Missions.chapters[run.stage]:null;
 $("nacre-log").hidden=!chapter;
 $("arrival").textContent=chapter?.arrival||"";
 $("recovered-file").hidden=!(chapter&&done);
 $("evidence-title").textContent=chapter?"Ouvrir · "+chapter.evidence:"";
 $("recovery").textContent=chapter&&done?"Archive récupérée en "+coord(positions[n])+" au croisement des émissions d’Alpha et de Beta.":"";
 $("fragment").hidden=!(chapter&&done);
 $("fragment").textContent=chapter&&done?chapter.fragment:"";
 const marathon=run.kind==="marathon";
 $("brief").hidden=run.kind==="classic";
 $("brief").textContent=chapter?"Chapitre "+(run.stage+1)+" · "+chapter.title+". "+chapter.brief:
   marathon?"Marathon · Mission "+(run.stage+1)+" sur 3":modeNames[run.kind];
 $("result-details").textContent=done?Missions.duration(playTime())+" de jeu · "+hints+" indice(s) demandé(s).":"";
 $("next").textContent=chapter?(run.stage===Missions.chapters.length-1?"Terminer la campagne":"Chapitre suivant"):
   marathon?(run.stage===2?"Terminer le marathon":"Étape suivante"):"Mission suivante";
 $("validate").disabled=done;$("hint").disabled=done;$("check").disabled=done;$("win").hidden=!done;
}
$("campaign").onclick=()=>launch(Missions.chapter(chapterIndex()));
$("marathon").onclick=()=>launch(Missions.marathon(0,newSeed()));
$("absolute").onclick=()=>launch(["hard",newSeed(),{kind:"absolute"}]);
$("custom").onclick=()=>launch([$("custom-level").value,newSeed(),{kind:"custom",signal:$("custom-signal").value}]);
$("daily").onclick=()=>launch(["normal","orbite-"+new Date().toISOString().slice(0,10),{kind:"daily"}]);
for(const l of ["tutorial","easy","normal","hard"]){$("choice-"+l).onclick=()=>start(l,l==="tutorial"?"incident-001":newSeed())}
$("change-difficulty").onclick=()=>menu(true);
$("resume").onclick=()=>menu(false);
$("new").onclick=()=>{
 if(run.kind==="campaign")return launch(Missions.chapter(run.stage));
 if(run.kind==="marathon")return launch(Missions.marathon(0,newSeed()));
 const level=board.level==="tutorial"?"easy":board.level;
 return launch([level,newSeed(),["custom","absolute"].includes(run.kind)?run:{}]);
};
$("load").onclick=()=>{const seed=$("seed").value.trim();if(!seed){say("Saisis une graine.");return}start(seed==="incident-001"?"tutorial":board.level==="tutorial"?"easy":board.level,seed)};
$("share").onclick=async()=>{try{await navigator.clipboard.writeText(location.href);say("Lien de la mission copié.")}catch{say("Copie l’adresse de cette page pour partager la mission.")}};
$("notes").onclick=()=>{mode=mode!==true;render();say(mode?"Mode exclusion : marque les cases impossibles pour l’entité sélectionnée.":"Mode placement.")};
$("candidate").onclick=()=>{mode=mode==="candidate"?false:"candidate";render();say(mode?"Hypothèses : touche une case pour ajouter ou retirer "+name(active)+".":"Mode placement.")};
$("rays").onclick=()=>{signals=!signals;render()};
$("erase").onclick=()=>{if(done||positions[active]<0)return;snapshot();positions[active]=-1;say("");render()};
$("undo").onclick=()=>{const prev=history.pop();if(!prev)return;pendingHint=null;positions=prev.positions;marks=prev.marks;candidates=prev.candidates;filed=new Set(prev.filed);active=prev.active;done=false;updateClock();render();say("Dernière action annulée.")};
$("reset").onclick=()=>{snapshot();pinnedText=null;positions=Array(board.n+1).fill(-1);marks.fill(0n);candidates.fill(0);filed.clear();active=0;mode=false;done=false;pendingHint=null;updateClock();render();say("Mission réinitialisée.")};
$("check").onclick=()=>{const issue=E.conflict(board,positions);if(issue){say(issue,"error");return}const result=E.solve(board,positions);say(result.ok?"Aucune contradiction détectée par les règles de déduction.":"Au moins un placement est incompatible avec les rapports ou les règles.",result.ok?"":"error")};
$("hint").onclick=()=>{
 const s=E.solve(board,positions,true);if(!s.ok){pendingHint=null;say("Tes placements sont contradictoires. Vérifie les rapports et les lignes/colonnes.","error");return}
 if(pendingHint){const h=pendingHint;pendingHint=null;active=h.i;render();say(name(h.i)+" : "+coord(h.p)+". "+h.why);return}
 const hint=E.explain(board,positions);
 if(!hint){say("Toutes les entités sont déjà placées.");return}
 hints++;active=hint.i;pendingHint=hint;render();say("Observe "+name(hint.i)+". "+hint.why+" Touche encore Indice pour voir la case.");
};
$("validate").onclick=()=>{if(positions.includes(-1)){say("Localise toutes les sondes et l’anomalie avant de valider.");return}if(!E.validate(board,positions)){say("La configuration contredit au moins une règle ou un rapport.","error");return}trial=null;done=true;updateClock();recordWin();tone(true);render();say("MISSION ACCOMPLIE — Anomalie localisée !","win")};
$("next").onclick=()=>{
 if(run.kind==="campaign")return run.stage+1<Missions.chapters.length?launch(Missions.chapter(run.stage+1)):menu(true);
 if(run.kind==="marathon")return run.stage<2?launch(Missions.marathon(run.stage+1,board.seed)):menu(true);
 return $("new").click();
};
document.addEventListener("keydown",e=>{if(!board||!$("mission-menu").hidden||e.ctrlKey||e.metaKey||e.altKey||["INPUT","SELECT","TEXTAREA"].includes(e.target.tagName))return;if(/^[1-7]$/.test(e.key)&&+e.key<=board.n+1){e.preventDefault();select(+e.key-1)}else if(e.key==="Delete"||e.key==="Backspace"){e.preventDefault();$("erase").click()}else if(e.key.toLowerCase()==="n")$("notes").click();else if(["ArrowUp","ArrowDown","ArrowLeft","ArrowRight"].includes(e.key)&&e.target.dataset.cell!=null){e.preventDefault();const p=+e.target.dataset.cell,n=board.n,dr=e.key==="ArrowUp"?-1:e.key==="ArrowDown"?1:0,dc=e.key==="ArrowLeft"?-1:e.key==="ArrowRight"?1:0,r=Math.floor(p/n)+dr,c=p%n+dc;if(r>=0&&r<n&&c>=0&&c<n)$("map").querySelector(`[data-cell="${r*n+c}"]`)?.focus()}});
const params=new URLSearchParams(location.search),level=params.get("level"),version=params.get("v"),seed=params.get("seed"),saved=readSave();
if(!level&&saved)start(saved.board.level,saved.board.seed,saved.board.version,saved);
else if((["3","4"].includes(version)||(version==="2"&&level==="tutorial"))&&(level==="tutorial"||Object.hasOwn(E.presets,level))){
 const options=Missions.route(Object.fromEntries(params));
 const matches=saved&&JSON.stringify(Missions.route(saved.run))===JSON.stringify(options)&&saved.board.level===level&&saved.board.seed===seed&&saved.board.version===version;
 start(level,seed||newSeed(),version,matches?saved:null,options);
}else{menu(true);if(level)$("menu-error").textContent="Cette version de mission est inconnue. Choisis une nouvelle mission."}
})();
