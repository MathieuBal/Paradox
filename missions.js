"use strict";
const Missions = (() => {
 const chapters = [
  {evidence:"Deux clichés de la tasse",title:"Premier contact",level:"tutorial",seed:"incident-001",brief:"Repère l’antenne. Deux rapports permettent de poser les premières sondes.",arrival:"Une tasse flotte devant la caméra du laboratoire. L’image porte deux heures de prise de vue, distantes de onze minutes.",fragment:"La tasse a un éclat bleu sur l’anse. On le retrouve sur les deux images, mais sur la seconde, la tasse est recollée. Onze minutes se sont bien écoulées à bord."},
  {evidence:"Registre du sas",title:"Le secteur muet",level:"easy",seed:"secteur-muet",brief:"Suis les deux faisceaux depuis leurs émetteurs et retrouve leur point de rencontre.",arrival:"Toutes les portes du pont de service ont enregistré leur fermeture. Une seule n’a jamais reçu l’ordre de se rouvrir.",fragment:"Le sas donnait sur l’embarcadère. Il a été fermé à la main, côté station. Quelqu’un est resté après le départ des navettes."},
  {evidence:"Bande du micro de la serre",title:"Écho double",level:"normal",signal:"double",seed:"echo-double",brief:"Alpha émet des deux côtés de sa colonne. Un obstacle coupe uniquement le côté qu’il occupe.",arrival:"Dans la serre, chaque appel d’Alpha revient deux fois. Entre les deux échos, on entend trois coups sur une canalisation.",fragment:"La jardinière Alma Sen communiquait ainsi avec son frère de l’autre côté de la serre. Trois coups voulaient dire « attends-moi ». Le second écho vient d’un enregistrement."},
  {evidence:"Journal du Tilleul",title:"Orbite lointaine",level:"normal",signal:"long",seed:"orbite-lointaine",brief:"Alpha porte jusqu’au bord de la carte. Beta reste limitée à trois cases.",arrival:"Une balise continue d’appeler bien au-delà du dernier quai. Le registre des départs indique pourtant que toutes les navettes sont rentrées.",fragment:"La balise appartient au remorqueur Tilleul. Il est resté en orbite pour servir d’horloge indépendante. Son journal contient onze minutes que Nacre a perdues."},
  {evidence:"Note sous le couvercle",title:"Contact rapproché",level:"normal",signal:"radial",seed:"contact-rapproche",brief:"Le capteur radial d’Alpha détecte uniquement les quatre cases voisines.",arrival:"Le micro du réacteur a capté un déclic, puis le froissement d’une manche. Le son est trop faible pour venir du couloir.",fragment:"Alma a ouvert le boîtier de synchronisation. Dans le couvercle, elle a glissé une note au crayon. « Quand les deux heures se croisent, garde les deux. »"},
  {evidence:"Plaque de l’observatoire",title:"Visée oblique",level:"normal",signal:"diagonal",seed:"visee-oblique",brief:"Suis chaque diagonale d’Alpha jusqu’au premier obstacle.",arrival:"L’observatoire a photographié deux fois la même étoile pendant une seule exposition. Les deux traces sont nettes.",fragment:"La seconde trace vient du miroir du Tilleul. Alma lui envoyait les relevés de la station par éclats lumineux. Une copie a survécu à la panne."},
  {evidence:"Message vocal d’Alma",title:"L’antenne relais",level:"hard",signal:"relay",seed:"antenne-relais",brief:"Cherche les positions où Alpha peut atteindre l’antenne et prolonger son faisceau.",arrival:"L’antenne du quai renvoie un paquet vieux de trente ans. Son destinataire est le poste que tu occupes aujourd’hui.",fragment:"Le paquet contient la voix d’Alma. « Si vous effacez le doublon, vous effacez aussi notre départ. J’ai laissé les sondes en marche. Vous pourrez refaire le trajet. »"},
  {evidence:"Photographie du départ",title:"Dernière transmission",level:"hard",signal:"double",seed:"derniere-transmission",brief:"Aucune position directe. Note plusieurs candidates, puis croise les rapports avec le balayage d’Alpha.",arrival:"Il reste deux versions du dernier appel. Dans l’une, Alma est encore au quai. Dans l’autre, sa place à bord du Tilleul est occupée.",fragment:"Les onze minutes s’emboîtent enfin. Sur le dernier cliché du Tilleul, Alma tient la tasse à l’anse bleue. Son frère a écrit au dos « Je t’ai attendue ». Le registre de Nacre peut enfin porter leurs deux noms."}
 ];
 const formats=["classic","daily","campaign","marathon","custom","absolute","twin"];
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
