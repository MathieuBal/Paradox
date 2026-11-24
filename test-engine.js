const assert = require('node:assert/strict');
const E = require('./engine.js');
for (const level of Object.keys(E.presets)) {
  for (let i=0;i<60;i++) {
    const seed='test-'+i;
    const p=E.generate(seed,level), N=p.n*p.n;
    const s=E.solve(p.n,p.givens,p.links,true);
    assert(s.ok && s.complete && s.temporal>0);
    assert.deepEqual(s.values,p.solution);
    assert.equal(E.count(p.n,p.givens,p.links),1);
    assert.equal(E.count(p.n,p.givens.slice(0,N)),2);
    assert.equal(E.count(p.n,p.givens.slice(N)),2);
    assert.deepEqual(E.generate(seed,level),p);
    for(const step of s.steps) assert.equal(step.v,p.solution[step.i]);
    const bad=p.givens.slice();bad[0]=0;bad[1]=0;
    assert.equal(E.solve(p.n,bad,p.links).ok,false);
  }
  console.log(level+': 60 puzzles validés');
}
console.log('180 puzzles validés.');
