const {test}=require('node:test');
const assert=require('node:assert/strict');
const vm=require('node:vm');
const fs=require('node:fs');
const path=require('node:path');
function harness(){
 const c=vm.createContext({document:{addEventListener(){}},Math:Object.create(Math)});
 vm.runInContext(fs.readFileSync(path.join(__dirname,'../frontend/roster.js'),'utf8'),c);
 const run=s=>vm.runInContext(s,c);
 run(`function fixture(){return {day:993,class_id:2,subjects:{chinese:110,math:110,english:110,physics:75,chemistry:75,biology:75},attrs:{insight:70,mindset:70,stamina:70},energy:75,stress:25,mood:70}};globalThis.g=fixture();learningState(g);g.learning.seed=123`);
 return {run};
}
test('study can improve, plateau or regress; reviews are recorded for every outcome',()=>{
 const h=harness();
 assert.ok(h.run("learningStudy(g,'chinese',()=>0)")>0);
 assert.equal(h.run("learningStudy(g,'math',()=>.82)"),0);
 assert.ok(h.run("learningStudy(g,'english',()=>.999)")<0);
 assert.equal(h.run('Object.keys(g.learning.current.study).length'),3);
 h.run("g.subjects.chinese=149.99;learningStudy(g,'chinese',()=>0);g.subjects.english=0;learningStudy(g,'english',()=>.999)");
 assert.equal(h.run('g.subjects.chinese'),150);assert.equal(h.run('g.subjects.english'),0);
});
test('neglect raises forgetting risk; spaced reviews strengthen retention without same-day farming',()=>{
 const h=harness();
 assert.ok(h.run("learningRisk(g,'math',1035)>learningRisk(g,'math',1000)"));
 h.run("g.day+=7;learningStudy(g,'chinese',()=>.82)");
 assert.equal(h.run('g.learning.memory.chinese.stability'),19);
 h.run("learningStudy(g,'chinese',()=>.82)");assert.equal(h.run('g.learning.memory.chinese.stability'),19);
 assert.ok(h.run("learningRisk(g,'chinese',1007)<learningRisk(g,'math',1007)"));
});
test('week decay is bounded, cannot repeat at same date and scales to a partial week',()=>{
 const h=harness();h.run('learningSettle(g,1000,()=>0)');
 assert.equal(h.run('g.subjects.math'),109.9);assert.equal(h.run('learningSettle(g,1000,()=>0).length'),0);
 h.run('learningSettle(g,1002,()=>0)');assert.equal(h.run('g.subjects.math'),109.87);
 assert.equal(h.run('g.learning.weeks.length'),2);
});
test('single-subject cramming has worse coverage than rotation with recovery',()=>{
 const h=harness();h.run(`function simulate(mode){const g=fixture();learningState(g);for(let w=0;w<14;w++){
 const ids=learningSubjects(g);for(let a=0;a<4;a++){if(a===3&&mode==='balanced')learningRecord(g,'rest');else learningStudy(g,mode==='balanced'?ids[(w*3+a)%6]:'chinese',()=>.82)}
 learningSettle(g,g.day+7,()=>.99);g.day+=7;}return g}
 globalThis.balanced=simulate('balanced');globalThis.cram=simulate('cram')`);
 assert.ok(h.run('learningPreparation(balanced).coverage>learningPreparation(cram).coverage'));
 assert.ok(h.run('learningPreparation(balanced).quality>learningPreparation(cram).quality'));
});
test('last 100 calendar days exclude old work; unknown past is neutral and history is bounded',()=>{
 const h=harness();assert.equal(h.run('learningPreparation(g).days'),0);assert.equal(h.run('learningPreparation(g).quality'),.5);
 h.run(`for(let w=0;w<180;w++){learningSettle(g,g.day+7,()=>.99);g.day+=7}`);
 assert.ok(h.run('g.learning.weeks.length<=16'));assert.equal(h.run('learningPreparation(g).days'),100);
 h.run('globalThis.before=JSON.stringify(learningPreparation(g));g.learning.weeks.unshift({from:1,to:8,study:{chinese:99},health:1})');
 assert.equal(h.run('JSON.stringify(learningPreparation(g))'),h.run('before'));
});
test('persistent RNG resumes identically from JSON and actual marks differ from abilities',()=>{
 const h=harness();h.run('globalThis.saved=JSON.stringify(g);globalThis.x=learningExam(g,g.subjects,learningSubjects(g));globalThis.restored=JSON.parse(saved);globalThis.y=learningExam(restored,restored.subjects,learningSubjects(restored))');
 assert.equal(h.run('JSON.stringify(x)'),h.run('JSON.stringify(y)'));
 assert.ok(h.run('Object.keys(x.subjects).some(id=>x.subjects[id]!==g.subjects[id])'));
});
test('prepared balanced candidates have higher means, fewer failures and less variance across 4000 seeded exams',()=>{
 const h=harness();const stats=h.run(`(()=>{
 function sample(q){const g=fixture(),ids=learningSubjects(g),p={quality:q,resilience:q,subject:Object.fromEntries(ids.map(id=>[id,q])),badChance:.005+.18*(1-q)**3};let sum=0,squares=0,bad=0,min=750,max=0;
 for(let i=1;i<=4000;i++){g.learning={version:1,startDay:993,settledDay:993,memory:{},current:{},weeks:[],seed:Math.imul(i,2654435761)>>>0};const r=learningExam(g,g.subjects,ids,()=>learningRandom(g),p);const score=Object.values(r.subjects).reduce((a,b)=>a+b,0);sum+=score;squares+=score*score;bad+=r.performance==='失常发挥';min=Math.min(min,score);max=Math.max(max,score);for(const id of ids)if(r.subjects[id]<0||r.subjects[id]>campusMax(id))throw Error('bounds');}
 return {mean:sum/4000,sd:Math.sqrt(squares/4000-(sum/4000)**2),bad,min,max};}return {prepared:sample(.9),neglected:sample(.2)}})()`);
 assert.ok(stats.prepared.mean>stats.neglected.mean+25);assert.ok(stats.prepared.sd<stats.neglected.sd);
 assert.ok(stats.prepared.bad>0&&stats.prepared.bad<stats.neglected.bad/5);
 console.log('Seeded 4000-exam comparison:',JSON.stringify(stats));
});
test('attributes and sustained health affect risk; last-minute recovery cannot replace history',()=>{
 const h=harness();h.run(`g.learning.weeks=[{from:993,to:1092,study:{},health:.1}];g.learning.settledDay=1092;g.day=1092;globalThis.a=learningPreparation(g);g.energy=100;g.stress=0;g.mood=100;globalThis.b=learningPreparation(g)`);
 assert.equal(h.run('a.quality'),h.run('b.quality'));
 h.run('g.attrs.mindset=100;g.attrs.stamina=100');assert.ok(h.run('learningPreparation(g).badChance<a.badChance'));
});
