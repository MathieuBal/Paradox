"use strict";
const Missions = (() => {
 const chapters = [
  {title:"Premier contact",level:"tutorial",seed:"incident-001",brief:"Repère l’antenne. Deux rapports permettent de poser les premières sondes."},
  {title:"Le secteur muet",level:"easy",seed:"secteur-muet",brief:"Suis les deux faisceaux depuis leurs émetteurs et retrouve leur point de rencontre."},
  {title:"Écho double",level:"normal",signal:"double",seed:"echo-double",brief:"Alpha émet des deux côtés de sa colonne. Un obstacle coupe uniquement le côté qu’il occupe."},
  {title:"Orbite lointaine",level:"normal",signal:"long",seed:"orbite-lointaine",brief:"Alpha porte jusqu’au bord de la carte. Beta reste limitée à trois cases."},
  {title:"Contact rapproché",level:"normal",signal:"radial",seed:"contact-rapproche",brief:"Le capteur radial d’Alpha détecte uniquement les quatre cases voisines."},
  {title:"Visée oblique",level:"normal",signal:"diagonal",seed:"visee-oblique",brief:"Suis chaque diagonale d’Alpha jusqu’au premier obstacle."},
  {title:"L’antenne relais",level:"hard",signal:"relay",seed:"antenne-relais",brief:"Cherche les positions où Alpha peut atteindre l’antenne et prolonger son faisceau."},
  {title:"Dernière transmission",level:"hard",signal:"double",seed:"derniere-transmission",brief:"Aucune position directe. Note plusieurs candidates, puis croise les rapports avec le balayage d’Alpha."}
 ];
 const formats=["classic","daily","campaign","marathon","custom","absolute"];
 const levels=["easy","normal","hard"];
 function route(raw={}){
  const kind=formats.includes(raw.kind)?raw.kind:"classic";
  const limit=kind==="campaign"?chapters.length:kind==="marathon"?3:1;
  const stage=Math.min(limit-1,Math.max(0,Number(raw.stage)||0));
  const signal=["long","double","radial","diagonal","relay"].includes(raw.signal)?raw.signal:"standard";
  return {kind,stage:Math.floor(stage),signal};
 }
 function chapter(stage){
  const c=chapters[stage];
  return [c.level,c.seed,route({kind:"campaign",stage,signal:c.signal})];
 }
 function marathon(stage,seed){
  return [levels[stage],seed,route({kind:"marathon",stage})];
 }
 function identity(board,run){
  return JSON.stringify([board.version,board.level,board.seed,board.signal||"standard",run.kind,run.stage]);
 }
 function duration(ms){
  const seconds=Math.floor(Math.max(0,ms)/1000);
  return Math.floor(seconds/60)+" min "+String(seconds%60).padStart(2,"0")+" s";
 }
 return {chapters,route,chapter,marathon,identity,duration};
})();
