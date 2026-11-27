const PilotBoards = [
 {
  "version": "5",
  "n": 5,
  "seed": "premier-echo",
  "level": "normal",
  "zones": [
   0,
   0,
   0,
   1,
   1,
   0,
   0,
   0,
   3,
   1,
   0,
   2,
   3,
   3,
   3,
   2,
   2,
   3,
   3,
   3,
   2,
   2,
   3,
   3,
   3
  ],
  "objects": [
   2,
   null,
   null,
   null,
   null,
   null,
   null,
   null,
   null,
   1,
   null,
   null,
   null,
   null,
   null,
   null,
   3,
   null,
   null,
   null,
   null,
   null,
   4,
   0,
   null
  ],
  "directions": [
   "N",
   "W",
   "E",
   "S"
  ],
  "clues": [
   {
    "type": "closer",
    "a": 0,
    "o": 1,
    "other": 2
   },
   {
    "type": "edge",
    "a": 1,
    "y": false
   },
   {
    "type": "axis",
    "a": 2,
    "o": 1,
    "axis": "r"
   }
  ],
  "solution": [
   17,
   13,
   5,
   1,
   24,
   12,
   6
  ],
  "twin": true
 },
 {
  "version": "5",
  "n": 5,
  "seed": "miroirs",
  "level": "normal",
  "zones": [
   0,
   0,
   1,
   1,
   1,
   0,
   0,
   1,
   1,
   1,
   1,
   1,
   1,
   1,
   1,
   1,
   1,
   1,
   1,
   1,
   2,
   1,
   1,
   1,
   3
  ],
  "objects": [
   null,
   null,
   null,
   1,
   null,
   null,
   null,
   null,
   4,
   null,
   null,
   null,
   null,
   null,
   null,
   null,
   null,
   null,
   2,
   null,
   null,
   0,
   3,
   null,
   null
  ],
  "directions": [
   "S",
   "W",
   "S",
   "W"
  ],
  "clues": [
   {
    "type": "axis",
    "a": 0,
    "o": 1,
    "axis": "r"
   },
   {
    "type": "gap",
    "a": 3,
    "b": 2,
    "axis": "c",
    "delta": 2
   },
   {
    "type": "distance",
    "a": 3,
    "o": 1,
    "d": 2
   }
  ],
  "solution": [
   0,
   17,
   6,
   13,
   24,
   15,
   11
  ],
  "twin": true
 },
 {
  "version": "5",
  "n": 5,
  "seed": "dernier-quai",
  "level": "normal",
  "zones": [
   0,
   0,
   1,
   1,
   1,
   0,
   0,
   1,
   1,
   1,
   2,
   2,
   3,
   3,
   3,
   2,
   2,
   3,
   3,
   3,
   2,
   2,
   3,
   3,
   3
  ],
  "objects": [
   null,
   null,
   null,
   null,
   null,
   null,
   null,
   2,
   null,
   null,
   null,
   null,
   null,
   null,
   null,
   1,
   4,
   null,
   null,
   null,
   3,
   null,
   null,
   0,
   null
  ],
  "directions": [
   "N",
   "E",
   "E",
   "S"
  ],
  "clues": [
   {
    "type": "distance",
    "a": 3,
    "o": 0,
    "d": 2
   },
   {
    "type": "gap",
    "a": 4,
    "b": 2,
    "axis": "c",
    "delta": 3
   },
   {
    "type": "zonePair",
    "a": 4,
    "z": 0,
    "alt": 3
   }
  ],
  "solution": [
   8,
   0,
   21,
   17,
   14,
   3,
   22
  ],
  "twin": true
 }
];
if(typeof module!=="undefined")module.exports=PilotBoards;

const TrainingBoard={
 version:"5",n:4,level:"easy",seed:"prise-en-main",twin:true,
 zones:[0,0,1,1,0,0,1,1,2,2,3,3,2,2,3,3],
 objects:[null,0,null,null,null,null,1,null,null,null,null,null,4,null,null,null],
 directions:["S","W","S","E"],
 clues:[
  {type:"objectOffset",a:0,o:0,dr:0,dc:-1},
  {type:"objectOffset",a:1,o:1,dr:1,dc:0},
  {type:"objectOffset",a:2,o:1,dr:0,dc:1},
  {type:"objectOffset",a:3,o:4,dr:0,dc:1}
 ],
 solution:[0,10,7,13,8,15]
};
