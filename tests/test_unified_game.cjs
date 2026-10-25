const {test}=require('node:test');
const assert=require('node:assert/strict');
const vm=require('node:vm');
const fs=require('node:fs');
const path=require('node:path');
function harness(){
 const elements=new Map(),storage=new Map(),listeners={};
 const el=id=>{if(!elements.has(id))elements.set(id,{innerHTML:'',textContent:'',value:'测试',hidden:true,classList:{add(){},remove(){},toggle(){}},addEventListener(){}});return elements.get(id)};
 const context=vm.createContext({document:{querySelector:el,addEventListener(type,fn){(listeners[type]??=[]).push(fn)},body:el('body')},localStorage:{getItem:k=>storage.get(k)||null,setItem:(k,v)=>storage.set(k,v),removeItem:k=>storage.delete(k)},location:{hash:'',pathname:'/1.0.0.0/',protocol:'https:'},Audio:class{pause(){} play(){return Promise.resolve()} addEventListener(){}},window:{addEventListener(){}},setTimeout:()=>0,clearTimeout(){},setInterval:()=>0,clearInterval(){},confirm:()=>true,console,URL,Blob,AbortController});
 for(const name of ['characters/characters-data.js','school-roster-data.js','roster.js','henan-2025-data.js','gaokao.js','game.js','journey-saves.js','keyword-chat.js','phone-chat.js']){
   let source=fs.readFileSync(path.join(__dirname,'../frontend',name),'utf8');
   if(name==='game.js')source=source.slice(0,source.lastIndexOf('initializeMusicLibrary().then'));
   vm.runInContext(source,context,{filename:name});
 }
 vm.runInContext('settings.musicEnabled=false;settings.eventMusic=false',context);
 return {run:s=>vm.runInContext(s,context),el,storage,click(dataset){const button={dataset,disabled:false,hasAttribute:()=>false,getAttribute:()=>null};for(const fn of listeners.click)fn({target:{closest:()=>button}})}};
}

test('gaokao uses exact six abilities for every person and saves the final table',()=>{
 for(const [id,total] of [['hu-yy',557],['zhang-z',594],['hu-zx',646.5],['hao-kj',566]]){
  const h=harness();h.run(`campusDraft('${id}');startGame();game.stress=100;game.attrs.insight=0;Math.random=()=>{throw Error('高考不应随机')};game.day=1092;openExam(EVENTS.find(e=>e.id==='gaokao'))`);
  assert.equal(h.run('game.completed'),true);assert.equal(h.run('game.finalScore'),total);
  assert.equal(h.run('game.gaokaoReport.rows.length'),210);
  assert.ok(h.run('game.gaokaoReport.rows.every(p=>Object.keys(p.subjects).length===6&&Math.round(Object.values(p.subjects).reduce((a,b)=>a+b,0)*100)/100===p.total)'));
  assert.equal(h.run('game.gaokaoReport.rows.filter(p=>p.active).length'),1);
  assert.match(h.el('#game-root').innerHTML,/高考成绩单/);assert.match(h.el('#game-root').innerHTML,/河南参考位次/);
  const snapshot=h.run('JSON.stringify(game.gaokaoReport)');
  h.run('game=loadGame();render()');assert.equal(h.run('JSON.stringify(game.gaokaoReport)'),snapshot);
  h.run("calculateGaokao(EVENTS.find(e=>e.id==='gaokao'))");assert.equal(h.run('game.examResults.length'),1);
 }
});

test('a full 100-day sprint reaches the saved final report through scheduled events',()=>{
 const h=harness();h.run("campusDraft('hu-zx');startGame();settings.autoEvents=false");
 h.run(`for(let week=0;week<20&&!game.completed;week++){
   advanceWeek();
   for(let i=0;i<30&&game.pendingEvents.length&&!game.completed;i++){
     currentModal=null;showNextEvent();
     if(game.completed)break;
     if(currentModal?.type==='exam'){calculateExam(currentModal.event,'steady');continueAfterEvent();}
     else {resolveEventChoice(0);continueAfterEvent();}
   }
 }`);
 assert.equal(h.run('game.completed'),true);
 assert.equal(h.run("game.fired.includes('gaokao')"),true);
 assert.match(h.el('#game-root').innerHTML,/高考成绩单/);
 assert.equal(h.run('game.finalScore'),h.run('campusOptions(game).reduce((sum,[id])=>sum+game.subjects[id],0)'));
});

test('rank lookup uses the right category, floor, ties, and published boundaries',()=>{
 const h=harness();
 assert.equal(h.run("henanRank(600,'physics').cumulative"),45887);
 assert.equal(h.run("henanRank(500,'physics').cumulative"),209695);
 assert.equal(h.run("henanRank(550,'history').cumulative"),26513);
 assert.equal(h.run("henanRank(646.5,'physics').score"),646);
 assert.equal(h.run("henanRank(646.5,'physics').cumulative"),9989);
 assert.equal(h.run("henanRank(646.5,'physics').start"),9538);
 assert.equal(h.run("henanRank(750,'physics').kind"),'top');
 assert.equal(h.run("henanRank(750,'physics').end"),12);
 assert.equal(h.run("henanRank(685,'history').kind"),'empty');
 assert.equal(h.run("henanRank(100,'physics').cumulative"),555040);
 assert.equal(h.run("henanRank(99.9,'history').kind"),'below');
 assert.equal(h.run("henanRank(99.9,'history').start"),352176);
 for(const category of ['physics','history']){
  assert.ok(h.run(`HENAN_2025_RANKS.categories.${category}.rows.every((r,i,a)=>Number.isInteger(r[0])&&Number.isInteger(r[1])&&(!i||(r[0]<a[i-1][0]&&r[1]>=a[i-1][1])))`));
 }
});

test('transfers use final selection, leave roster intact, and legacy completion stays readable',()=>{
 const h=harness();h.run("campusDraft('hu-zx');startGame();campusAssign(game,14)");
 const before=h.run('JSON.stringify(campusPopulation)');
 h.run("openExam(EVENTS.find(e=>e.id==='gaokao'))");
 assert.equal(h.run('game.gaokaoReport.rows.find(p=>p.active).rank.category'),'history');
 assert.equal(h.run('game.gaokaoReport.rows.find(p=>p.active).subjects.physics'),undefined);
 assert.ok(h.run('CAMPUS_CLASSES.every(c=>game.gaokaoReport.rows.filter(p=>p.class_id===c.id).length===30)'));
 assert.equal(h.run('JSON.stringify(campusPopulation)'),before);
 h.run('delete game.gaokaoReport;game.finalScore=120;renderFinal()');
 assert.equal(h.run('game.finalScore'),h.run('game.gaokaoReport.rows.find(p=>p.active).total'));
 h.run("game=initialState('自定义',PRESETS.balanced);game.completed=true;renderFinal()");
 assert.equal(h.run('game.gaokaoReport.rows.length'),210);
 assert.ok(h.run('Number.isFinite(game.finalScore)'));
});
test('four people start in original day engine and keep exact subject conversion',()=>{
 const h=harness();h.run('openCharacterSaves()');assert.match(h.el('#game-dialog').innerHTML,/hu-zx/);
 for(const [id,score,cls] of [['hu-yy',557,8],['zhang-z',594,8],['hu-zx',646.5,2],['hao-kj',566,2]]){
  h.run(`campusDraft('${id}');startGame()`);
  assert.equal(h.run('game.day'),993);assert.equal(h.run('game.class_id'),cls);
  assert.equal(h.run('campusOptions(game).reduce((n,[id])=>n+game.subjects[id],0)'),score);
  assert.match(h.el('#game-root').innerHTML,/我的班级/);
  h.run('advanceWeek()');assert.equal(h.run('game.day'),1000);
 }
});
test('study, event gains, class transfers and reload use same journey',()=>{
 const h=harness();h.run("campusDraft('hu-zx');startGame();game.subjects.physics=99.8;studySubject('physics')");
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
 assert.match(h.el('#game-dialog').innerHTML,/30人（含已录入人物）/);
 assert.match(h.el('#game-dialog').innerHTML,/30人（含已录入人物）/);
 assert.equal(h.run('game.subjects.math'),characterMath());
 function characterMath(){return h.run("characterCatalog.find(c=>c.id==='hu-zx').initial_state.attrs.math")}
});
test('study, tutoring and events grow slowly and preserve decimals in saves',()=>{
 const h=harness();h.run("campusDraft('hu-zx');startGame();game.subjects.chinese=120;studySubject('chinese')");
 assert.equal(h.run('game.subjects.chinese'),120.5);
 h.run("game.tutoring={decided:true,subject:'chinese'};showMandatoryTutoring()");
 assert.equal(h.run('game.subjects.chinese'),121);
 h.run('applyEffects({subjects:{chinese:12,science:12},charm:8,mindset:10});persist();game=loadGame()');
 assert.equal(h.run('game.subjects.chinese'),121.5);
 assert.equal(h.run("game.attrs.charm"),70.5);
 h.run("game.subjects.chinese=149.8;game.tutoringDoneThisWeek=false;showMandatoryTutoring()");
 assert.equal(h.run('game.subjects.chinese'),150);
 assert.match(h.el('#game-dialog').innerHTML,/\+0\.2/);
 h.run('applyEffects({subjects:{chinese:-4}})');assert.equal(h.run('game.subjects.chinese'),146);
});
test('all classes contain exactly 30 unique people across transfers and reloads',()=>{
 const h=harness();h.run("campusDraft('hu-zx');startGame()");
 const baseline=h.run('JSON.stringify(campusPopulation)');
 for(const id of [14,8,11,2,7,4,13]){
   h.run(`campusAssign(game,${id});persist();game=loadGame()`);
   assert.equal(h.run('campusMembers(game).length'),210);
   assert.equal(h.run('new Set(campusMembers(game).map(p=>p.id)).size'),210);
   assert.ok(h.run('CAMPUS_CLASSES.every(c=>campusMembers(game).filter(p=>p.class_id===c.id).length===30)'));
   assert.equal(h.run("campusMembers(game).find(p=>p.id==='hu-zx').class_id"),id);
 }
 assert.equal(h.run('JSON.stringify(campusPopulation)'),baseline);
 h.run("game=initialState('自定义',PRESETS.balanced);campusAssign(game,14);campusAssign(game,2)");
 assert.ok(h.run('CAMPUS_CLASSES.every(c=>campusMembers(game).filter(p=>p.class_id===c.id).length===30)'));
 assert.equal(h.run('campusMembers(game).filter(p=>characterCatalog.some(c=>c.id===p.id)).length'),4);
});
test('custom original gameplay remains usable and class-based exams depend on current six subjects',()=>{
 const h=harness();h.run('startGame()');assert.equal(h.run('game.stage'),'high1');assert.equal(h.run('game.day'),1);
 h.run("campusDraft('hu-zx');startGame();settings.eventMusic=false;Math.random=()=>0.5;game.subjects.physics=100;game.subjects.chemistry=100;game.subjects.biology=100;game.subjects.history=0;game.subjects.politics=0;game.subjects.geography=0;calculateExam({id:'x',title:'模拟考',difficulty:0},'steady')");
 const science=h.run('game.examResults.at(-1).score');h.run("campusAssign(game,13);calculateExam({id:'y',title:'模拟考',difficulty:0},'steady')");
 assert.ok(science>h.run('game.examResults.at(-1).score')+200);
});

test('home has exactly three buttons and opens music settings before any game exists',()=>{
 const h=harness();assert.equal((h.el('#game-root').innerHTML.match(/<button /g)||[]).length,3);
 assert.equal(h.run('game'),null);h.click({action:'settings'});
 assert.match(h.el('#game-dialog').innerHTML,/settings-volume/);assert.match(h.el('#game-dialog').innerHTML,/simple-music-theme/);
 h.run("updateSetting('musicVolume',73)");assert.equal(h.run('settings.musicVolume'),73);assert.equal(h.run('musicAudio[0].volume'),0.73);
});
test('all four characters enter all four stages through the actual menu buttons',()=>{
 for(const id of ['hu-yy','zhang-z','hu-zx','hao-kj'])for(const [stage,day] of [['high1',1],['high2',366],['high3',731],['sprint100',993]]){
  const h=harness();h.click({menu:'saves'});h.click({characterStart:id});
  assert.equal(h.run('menuScreen'),'stages');assert.equal(h.run('game'),null);
  assert.equal((h.el('#game-root').innerHTML.match(/data-menu-stage=/g)||[]).length,4);
  h.click({menuStage:stage});assert.equal(h.run('game.character_id'),id);assert.equal(h.run('game.day'),day);assert.equal(h.run('menuScreen'),'play');
  assert.ok(Number.isFinite(h.run('Date.parse(game.createdAt)')));
 }
});
test('per-character saves keep creation date and independent progress on restore',()=>{
 const h=harness();h.click({characterStart:'hu-zx'});h.click({menuStage:'high2'});
 const created=h.run('game.createdAt');h.run('game.actionPoints=2;persist()');
 h.click({menu:'home'});h.click({characterStart:'hu-yy'});h.click({menuStage:'sprint100'});
 h.click({menu:'home'});h.click({menu:'saves'});h.click({saveCharacter:'hu-zx'});
 assert.match(h.el('#game-dialog').innerHTML,/建档日期/);assert.match(h.el('#game-dialog').innerHTML,/查看人物完整属性面板/);
 h.click({characterLoad:'hu-zx'});assert.equal(h.run('game.day'),366);assert.equal(h.run('game.actionPoints'),2);assert.equal(h.run('game.createdAt'),created);
 h.run("delete game.createdAt;persist();openCharacterSaves('hu-zx')");assert.match(h.el('#game-dialog').innerHTML,/旧存档未记录建档日期/);
});

test('social opens full-screen phone; missing AI keeps message and does not consume an action',async()=>{
 const h=harness();h.run("campusDraft('hu-zx');startGame();resolveSocialChoice('su')");
 assert.match(h.el('#game-dialog').innerHTML,/phone-screen/);assert.equal(h.run('game.actionPoints'),4);
 h.run("settings.chatMode='ai';fetch=async()=>({ok:false,json:async()=>({error:'尚未配置 AI'})})");
 h.el('#phone-message-input').value='数学考试没考好，怎么办？';await h.run('sendPhoneMessage()');
 assert.equal(h.run('game.actionPoints'),4);assert.equal(h.run('game.chatHistory.su.length'),1);
 assert.match(h.el('#game-dialog').innerHTML,/尚未配置 AI/);assert.match(h.el('#game-dialog').innerHTML,/重试回复/);
});
test('AI receives exact messages and game context; retry charges once, then history survives save',async()=>{
 const h=harness();h.run("settings.chatMode='ai';campusDraft('hu-zx');startGame();openPhoneChat('su');fetch=async(url,opts)=>{globalThis.sent=JSON.parse(opts.body);return {ok:true,json:async()=>({reply:'哪类题扣分最多？我们一起看看。'})}}");
 h.el('#phone-message-input').value='今天数学错了三道函数题。';await h.run('sendPhoneMessage()');
 assert.equal(h.run('sent.npcId'),'su');assert.equal(h.run('sent.messages[0].content'),'今天数学错了三道函数题。');assert.equal(h.run('sent.context.playerName'),'虎zx');
 assert.equal(h.run('game.actionPoints'),3);assert.equal(h.run('game.chatHistory.su.length'),2);
 h.el('#phone-message-input').value='主要是导数。';await h.run('sendPhoneMessage()');
 assert.equal(h.run('game.actionPoints'),3);assert.equal(h.run('sent.messages.length'),3);
 h.run('leavePhoneChat();game=loadGame();openPhoneChat("su")');assert.equal(h.run('game.chatHistory.su.length'),4);
 h.run('leavePhoneChat();openPhoneChat("lin")');assert.equal(h.run('phoneHistory().length'),0);
});
test('late AI responses cannot change another scene or save; message markup is escaped',async()=>{
 const h=harness();h.run("settings.chatMode='ai';campusDraft('hu-zx');startGame();openPhoneChat('su');fetch=()=>new Promise(r=>globalThis.respond=r)");
 h.el('#phone-message-input').value='<img onerror=alert(1)>';
 const pending=h.run('sendPhoneMessage()');h.run('leavePhoneChat();campusDraft("hu-yy");startGame();respond({ok:true,json:async()=>({reply:"迟到的回复"})})');await pending;
 assert.equal(h.run('game.character_id'),'hu-yy');assert.equal(h.run('game.actionPoints'),4);assert.equal(h.run('game.chatHistory'),undefined);
 h.run('game=readCharacterSaves()["hu-zx"];openPhoneChat("su")');assert.match(h.el('#game-dialog').innerHTML,/&lt;img onerror=alert\(1\)&gt;/);
});

test('keyword mode chats offline by default and keeps distinct NPC voices and followups',async()=>{
 const h=harness();h.run("campusDraft('hu-zx');startGame();fetch=()=>{throw Error('must not call network')};openPhoneChat('liqiang')");
 h.el('#phone-message-input').value='你好李强';await h.run('sendPhoneMessage()');
 assert.equal(h.run('game.chatHistory.liqiang.length'),2);assert.equal(h.run('game.actionPoints'),3);
 assert.match(h.el('#game-dialog').innerHTML,/本地关键词回复/);assert.doesNotMatch(h.el('#game-dialog').innerHTML,/AI 待连接/);
 h.el('#phone-message-input').value='今天考砸了';await h.run('sendPhoneMessage()');assert.match(h.run('phoneHistory().at(-1).content'),/哪一科|吐槽/);assert.equal(h.run('game.actionPoints'),3);
 h.el('#phone-message-input').value='嗯';await h.run('sendPhoneMessage()');assert.match(h.run('phoneHistory().at(-1).content'),/展开|然后/);
 assert.notEqual(h.run("keywordReply('su',[{role:'user',content:'考砸了'}])"),h.run("keywordReply('liqiang',[{role:'user',content:'考砸了'}])"));
 assert.match(h.run("keywordReply('lin',[{role:'user',content:'听音乐'}])"),/歌|旋律/);
});
test('an old unanswered AI message can be retried locally without duplicate user messages',async()=>{
 const h=harness();h.run("campusDraft('hu-zx');startGame();game.chatHistory={su:[{role:'user',content:'你好',time:Date.now()}]};openPhoneChat('su')");
 assert.match(h.el('#game-dialog').innerHTML,/重试/);await h.run('sendPhoneMessage(true)');
 assert.equal(h.run('phoneHistory().length'),2);assert.equal(h.run('phoneHistory()[1].role'),'assistant');
});
