const {test}=require('node:test');
const assert=require('node:assert/strict');
const vm=require('node:vm');
const fs=require('node:fs');
const path=require('node:path');
function harness(){
 const elements=new Map(),storage=new Map();
 const el=id=>{if(!elements.has(id))elements.set(id,{innerHTML:'',textContent:'',value:'测试',hidden:true,classList:{add(){},remove(){},toggle(){}},addEventListener(){}});return elements.get(id)};
 const context=vm.createContext({document:{querySelector:el,addEventListener(){},body:el('body')},localStorage:{getItem:k=>storage.get(k)||null,setItem:(k,v)=>storage.set(k,v),removeItem:k=>storage.delete(k)},location:{hash:'',pathname:'/1.0.0.0/',protocol:'https:'},Audio:class{pause(){} play(){return Promise.resolve()} addEventListener(){}},window:{addEventListener(){}},setTimeout:()=>0,clearTimeout(){},setInterval:()=>0,clearInterval(){},confirm:()=>true,console,URL,Blob});
 for(const name of ['characters/characters-data.js','roster.js','game.js','journey-saves.js']){
   let source=fs.readFileSync(path.join(__dirname,'../frontend',name),'utf8');
   if(name==='game.js')source=source.slice(0,source.lastIndexOf('initializeMusicLibrary().then'));
   vm.runInContext(source,context,{filename:name});
 }
 vm.runInContext('settings.musicEnabled=false;settings.eventMusic=false',context);
 return {run:s=>vm.runInContext(s,context),el,storage};
}
test('four people start in original day engine and keep exact subject conversion',()=>{
 const h=harness();assert.match(h.el('#game-root').innerHTML,/hu-zx/);
 for(const [id,score,cls] of [['hu-yy',557,8],['zhang-z',594,8],['hu-zx',646.5,2],['hao-kj',566,2]]){
  h.run(`campusDraft('${id}');startGame()`);
  assert.equal(h.run('game.day'),993);assert.equal(h.run('game.class_id'),cls);
  assert.equal(h.run('campusOptions(game).reduce((n,[id])=>n+game.subjects[id],0)'),score);
  assert.match(h.el('#game-root').innerHTML,/我的班级/);
  h.run('advanceWeek()');assert.equal(h.run('game.day'),1000);
 }
});
test('study, event gains, class transfers and reload use same journey',()=>{
 const h=harness();h.run("campusDraft('hu-zx');startGame();game.subjects.physics=99;studySubject('physics')");
 assert.equal(h.run('game.subjects.physics'),100);assert.equal(h.run('game.actionPoints'),3);
 const before=h.run('JSON.stringify(game.subjects)');h.run('campusTransfer(14)');
 assert.equal(h.run('JSON.stringify(game.subjects)'),before);assert.equal(h.run('game.day'),993);
 assert.equal(h.run('game.class_id'),14);h.run('applyEffects({subjects:{humanities:15}});persist();game=loadGame()');
 assert.equal(h.run('game.class_id'),14);assert.equal(h.run('studyOptions().length'),6);
 assert.ok(h.run('Object.values(game.subjects).every(Number.isFinite)'));
});
test('local slots round trip unified identity, class, actions and pending events',async()=>{
 const h=harness();h.run("campusDraft('zhang-z');startGame();game.pendingEvents=['test'];game.actionPoints=2");
 await h.run('journeySlots();');await h.run("journeySlotAction('save',1)");
 h.run('campusAssign(game,14);game.day=1020');await h.run("journeySlotAction('load',1)");
 assert.equal(h.run('game.class_id'),8);assert.equal(h.run('game.day'),993);assert.equal(h.run('game.pendingEvents[0]'),'test');assert.equal(h.run('game.actionPoints'),2);
});
test('changing opening class counts against the character original class and keeps all subjects',()=>{
 const h=harness();h.run("campusDraft('hu-zx');draft.class_id=14;startGame();campusShowClasses()");
 assert.equal(h.run('game.origin_class_id'),2);
 assert.match(h.el('#game-dialog').innerHTML,/31人（默认30人）/);
 assert.match(h.el('#game-dialog').innerHTML,/49人（默认50人）/);
 assert.equal(h.run('game.subjects.math'),characterMath());
 function characterMath(){return h.run("characterCatalog.find(c=>c.id==='hu-zx').initial_state.attrs.math")}
});
test('custom original gameplay remains usable and class-based exams depend on current six subjects',()=>{
 const h=harness();h.run('startGame()');assert.equal(h.run('game.stage'),'high1');assert.equal(h.run('game.day'),1);
 h.run("campusDraft('hu-zx');startGame();settings.eventMusic=false;Math.random=()=>0.5;game.subjects.physics=100;game.subjects.chemistry=100;game.subjects.biology=100;game.subjects.history=0;game.subjects.politics=0;game.subjects.geography=0;calculateExam({id:'x',title:'模拟考',difficulty:0},'steady')");
 const science=h.run('game.examResults.at(-1).score');h.run("campusAssign(game,13);calculateExam({id:'y',title:'模拟考',difficulty:0},'steady')");
 assert.ok(science>h.run('game.examResults.at(-1).score')+200);
});
