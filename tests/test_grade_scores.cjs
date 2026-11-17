const {test}=require('node:test'),assert=require('node:assert/strict'),vm=require('node:vm'),fs=require('node:fs'),path=require('node:path');
function harness(){const c=vm.createContext({});vm.runInContext(fs.readFileSync(path.join(__dirname,'../frontend/grade-scores.js'),'utf8'),c);return s=>vm.runInContext(s,c)}
test('published example, endpoints and degenerate interval',()=>{
 const run=harness();assert.equal(run('gradeScoreLinear(75,64,80,71,85)'),81);
 assert.equal(run('gradeScoreLinear(64,64,80,71,85)'),71);assert.equal(run('gradeScoreLinear(80,64,80,71,85)'),85);assert.equal(run('gradeScoreLinear(70,70,70,56,70)'),63);
});
test('100 distinct scores follow 15/35/35/13/2 bands and preserve order',()=>{
 const run=harness();run('const raw=Array.from({length:100},(_,i)=>100-i);const result=gradeScoreCohort(raw)');
 const counts=run('JSON.stringify(Object.fromEntries(GRADE_SCORE_RULES.bands.map(b=>[b.grade,[...result.values()].filter(v=>v.grade===b.grade).length])))');
 assert.deepEqual(JSON.parse(counts),{A:15,B:35,C:35,D:13,E:2});
 assert.equal(run('raw.every((s,i)=>{const g=result.get(s);return Number.isInteger(g.score)&&g.score>=30&&g.score<=100&&(!i||result.get(raw[i-1]).score>=g.score)})'),true);
});
test('ties, input ordering and singleton cohorts are deterministic and finite',()=>{
 const run=harness();assert.equal(run('gradeScoreCohort([50]).get(50).score'),63);
 assert.equal(run('gradeScoreCohort([60,60,60]).size'),1);
 assert.equal(run('JSON.stringify([...gradeScoreCohort([80,20,80,50])])===JSON.stringify([...gradeScoreCohort([50,80,20,80])])'),true);
});
test('only two reselected subjects change, totals match, and assignment cannot repeat',()=>{
 const run=harness();run(`const rows=Array.from({length:100},(_,i)=>({subjects:{chinese:100,math:110,english:120,physics:80,chemistry:100-i,biology:100-i},total:0}));assignGaokaoGrades(rows);const saved=JSON.stringify(rows);assignGaokaoGrades(rows)`);
 assert.equal(run('saved===JSON.stringify(rows)'),true);
 assert.equal(run("rows.every(r=>r.subjects.chinese===100&&r.subjects.math===110&&r.subjects.english===120&&r.subjects.physics===80&&Object.keys(r.gradeDetails).length===2&&r.total===Object.values(r.subjects).reduce((a,b)=>a+b,0))"),true);
 assert.equal(run('rows[0].rawSubjects.chemistry'),100);
 run("const historyRows=[{subjects:{chinese:100,math:100,english:100,history:75.5,politics:65,geography:60}}];assignGaokaoGrades(historyRows)");assert.equal(run('historyRows[0].subjects.history'),75.5);
});

