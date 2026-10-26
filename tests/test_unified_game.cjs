const {test}=require('node:test');
const assert=require('node:assert/strict');
const vm=require('node:vm');
const fs=require('node:fs');
const path=require('node:path');
const zlib=require('node:zlib');
const admissionsGzip=fs.readFileSync(path.join(__dirname,'../frontend/admissions-records-2025.json.gz'));
const admissionsRecords=JSON.parse(zlib.gunzipSync(admissionsGzip));
function harness(){
 const elements=new Map(),storage=new Map(),listeners={};
 const el=id=>{if(!elements.has(id))elements.set(id,{innerHTML:'',textContent:'',value:'测试',hidden:true,classList:{add(){},remove(){},toggle(){}},addEventListener(){}});return elements.get(id)};
 const context=vm.createContext({document:{querySelector:el,addEventListener(type,fn){(listeners[type]??=[]).push(fn)},body:el('body')},localStorage:{getItem:k=>storage.get(k)||null,setItem:(k,v)=>storage.set(k,v),removeItem:k=>storage.delete(k)},location:{hash:'',pathname:'/1.0.0.0/',protocol:'https:'},Audio:class{pause(){} play(){return Promise.resolve()} addEventListener(){}},window:{addEventListener(){}},setTimeout:()=>0,clearTimeout(){},setInterval:()=>0,clearInterval(){},confirm:()=>true,console,URL,Blob,AbortController,Response,DecompressionStream,__admissionsRecords:admissionsRecords,__admissionsGzip:admissionsGzip});
 for(const name of ['characters/characters-data.js','school-roster-data.js','roster.js','henan-2025-data.js','gaokao.js','admissions-data.js','university-catalog.js','admissions.js','university-browser.js','game.js','journey-saves.js','keyword-chat.js','phone-chat.js']){
   let source=fs.readFileSync(path.join(__dirname,'../frontend',name),'utf8');
   if(name==='game.js')source=source.slice(0,source.lastIndexOf('initializeMusicLibrary().then'));
   vm.runInContext(source,context,{filename:name});
 }
 vm.runInContext('Math.random=()=>.5;settings.musicEnabled=false;settings.eventMusic=false;HENAN_2025_ADMISSIONS.schools=__admissionsRecords.schools;HENAN_2025_ADMISSIONS.loaded=true',context);
 return {run:s=>vm.runInContext(s,context),el,storage,change(target){for(const fn of listeners.change)fn({target})},click(dataset){const button={dataset,disabled:false,hasAttribute:()=>false,getAttribute:()=>null};for(const fn of listeners.click)fn({target:{closest:()=>button}})}};
}

test('expanded data contains real programs for elite, ordinary and junior institutions',()=>{
 const h=harness();
 assert.equal(h.run('HENAN_2025_ADMISSIONS.stats.institutions'),1220);
 assert.equal(h.run('HENAN_2025_ADMISSIONS.stats.programs'),30626);
 assert.equal(h.run('HENAN_2025_ADMISSIONS.stats.elite985'),38);
 assert.equal(h.run('HENAN_2025_ADMISSIONS.stats.elite211'),111);
 assert.equal(h.run('HENAN_2025_ADMISSIONS.stats.junior'),1303);
 for(const [school,major,category,min] of [['北京大学','法学','history',682],['清华大学','计算机类','physics',704],['郑州大学','法学','history',622],['郑州铁路职业技术学院','建筑装饰工程技术','history',466]]){
   const p=h.run(`admissionsPrograms(admissionsSchool('${school}'),'${category}').find(p=>p.major==='${major}')`);
   assert.equal(p.minScore,min);assert.ok(p.scoreId>0&&p.planId>0);assert.ok(p.minRank>0);
   const choices=[{school,major},...Array.from({length:4},()=>({school:'',major:''}))];
   assert.equal(h.run(`evaluateAdmissions({total:${min+1},rank:{category:'${category}'},subjects:{chinese:150,math:150,english:150,${category}:100,chemistry:100,politics:100}},${JSON.stringify(choices)}).status`),'admitted');
 }
});

test('junior programs use the junior floor, while undergraduate lower-score special rounds stay pending',()=>{
 const h=harness();
 const choice={school:'河南工业职业技术学院',major:'大数据与财务管理（第102组·专业代号55）'};
 const run=score=>h.run(`evaluateAdmissions({total:${score},rank:{category:'physics'},subjects:{chinese:100,math:100,english:100,physics:50,chemistry:50,geography:50}},${JSON.stringify([choice,...Array.from({length:4},()=>({school:'',major:''}))])})`);
 assert.equal(run(380).status,'admitted');assert.equal(run(379).status,'pending');assert.equal(run(378).status,'unplaced');
 h.run(`globalThis.lowerProgram=HENAN_2025_ADMISSIONS.schools.flatMap(s=>s.groups.filter(g=>g.degree==='undergraduate').flatMap(g=>g.programs.filter(p=>p[1]<(g.category==='physics'?426:470)).map(p=>({school:s.name,major:p[0],min:p[1],category:g.category,requires:g.requires})))).find(p=>p.min>185)`);
 assert.ok(h.run('!!lowerProgram'));
 assert.equal(h.run(`evaluateAdmissions({total:lowerProgram.min+1,rank:{category:lowerProgram.category},subjects:Object.fromEntries(['chinese','math','english',lowerProgram.category,...lowerProgram.requires].map(id=>[id,100]))},[{school:lowerProgram.school,major:lowerProgram.major},...Array.from({length:4},()=>({school:'',major:''}))]).rows[0].state`),'supplemental');
});

test('same-name majors with different enrollment codes never silently share a cutoff',()=>{
 const h=harness();
 const p=h.run(`admissionsPrograms(admissionsSchool('北京师范大学'),'history').filter(p=>p.major.startsWith('汉语言文学（第101组'))`);
 assert.equal(p.length,2);assert.deepEqual(p.map(p=>p.minScore).sort(),[653,655]);
 const choice=major=>[{school:'北京师范大学',major},...Array.from({length:4},()=>({school:'',major:''}))];
 for(const record of p){const result=h.run(`evaluateAdmissions({total:654,rank:{category:'history'},subjects:{chinese:150,math:150,english:150,history:100,politics:100,geography:100}},${JSON.stringify(choice(record.major))})`);assert.equal(result.status,record.minScore===653?'admitted':'unplaced');}
 assert.equal(h.run(`evaluateAdmissions({total:700,rank:{category:'history'},subjects:{history:100}},${JSON.stringify(choice('汉语言文学'))}).status`),'pending');
});

test('official record IDs and subject plans are retained, and the published gzip mirrors match',()=>{
 const h=harness();
 assert.equal(h.run('HENAN_2025_ADMISSIONS.schools.reduce((n,s)=>n+s.groups.reduce((m,g)=>m+g.programs.length,0),0)'),30626);
 assert.equal(h.run('HENAN_2025_ADMISSIONS.schools.flatMap(s=>s.groups.flatMap(g=>g.programs)).filter(p=>p[2].scoreId&&p[2].planId).length'),30620);
 assert.ok(fs.readFileSync(path.join(__dirname,'../docs/admissions-records-2025.json.gz')).equals(admissionsGzip));
 assert.equal(h.run(`admissionsPrograms(admissionsSchool('清华大学'),'physics').find(p=>p.major==='计算机类').requires.join(',')`),'chemistry');
 assert.match(h.run(`admissionsChoiceEvidence('北京大学','法学','history')`),/最低分参考位次|官方选科依据/);
});

test('compressed admissions load once, validate completeness, and retry after an invalid download',async()=>{
 const h=harness();
 h.run(`HENAN_2025_ADMISSIONS.loaded=false;HENAN_2025_ADMISSIONS.schools=[];globalThis.downloads=0;fetch=async()=>{downloads++;return new Response(__admissionsGzip)}`);
 await h.run('Promise.all([loadAdmissionsCatalog(),loadAdmissionsCatalog()])');
 assert.equal(h.run('downloads'),1);assert.equal(h.run('HENAN_2025_ADMISSIONS.schools.length'),1580);
 h.run(`HENAN_2025_ADMISSIONS.loaded=false;HENAN_2025_ADMISSIONS.schools=[];admissionsLoadPromise=null;fetch=async()=>new Response('invalid compressed file')`);
 await assert.rejects(h.run('loadAdmissionsCatalog()'));
 assert.equal(h.run('HENAN_2025_ADMISSIONS.loaded'),false);
 h.run('fetch=async()=>new Response(__admissionsGzip)');await h.run('loadAdmissionsCatalog()');
 assert.equal(h.run('HENAN_2025_ADMISSIONS.loaded'),true);
});

test('leaving the loading page prevents a late download from replacing the personal score page',async()=>{
 const h=harness();h.run("campusDraft('hu-zx');startGame();openExam(EVENTS.find(e=>e.id==='gaokao'))");
 h.run(`HENAN_2025_ADMISSIONS.loaded=false;HENAN_2025_ADMISSIONS.schools=[];fetch=()=>new Promise(resolve=>{globalThis.deliverDownload=resolve});openAdmissions()`);
 assert.match(h.el('#game-root').innerHTML,/正在载入/);
 h.run("openAdmissions('scores');deliverDownload(new Response(__admissionsGzip))");
 await h.run('admissionsLoadPromise');await Promise.resolve();
 assert.equal(h.run('game.postExamPage'),'scores');assert.match(h.el('#game-root').innerHTML,/我的高考成绩单/);
});

test('personal good-news score page renders exactly six subjects and no other student names',()=>{
 for(const id of ['hu-yy','zhang-z','hu-zx','hao-kj']){
  const h=harness();h.run(`campusDraft('${id}');startGame();openExam(EVENTS.find(e=>e.id==='gaokao'))`);
  const html=h.el('#game-root').innerHTML;
  assert.match(html,/<h1>喜报<\/h1>/);assert.match(html,/celebration-screen/);
  assert.match(html,/我的高考成绩单/);assert.equal((html.match(/<dt>/g)||[]).length,6);
  assert.doesNotMatch(html,/全校|全校高考成绩表|<table/);
  const others=h.run(`characterCatalog.filter(c=>c.id!=='${id}').map(c=>c.name).join('|')`);
  assert.doesNotMatch(html,new RegExp(others));
  h.run('game=loadGame();render()');assert.doesNotMatch(h.el('#game-root').innerHTML,new RegExp(others));
 }
});

test('university directory covers every 985 and 211 root, all civil undergraduate schools and selected junior colleges',()=>{
 const h=harness();
 assert.equal(h.run('UNIVERSITY_CATALOG.schools.length'),1388);
 assert.equal(h.run('universityMatches("985").length'),39);
 assert.equal(h.run('universityMatches("211").length'),115);
 assert.equal(h.run('universityMatches("junior").length'),20);
 assert.equal(h.run('UNIVERSITY_CATALOG.schools.filter(s=>s.level==="本科"&&!s.special).length'),1365);
 assert.equal(h.run('new Set(UNIVERSITY_CATALOG.schools.map(s=>s.code)).size'),1388);
 assert.equal(h.run('universityProfile("中国矿业大学徐海学院").elite211'),false);
 assert.equal(h.run('universityProfile("国防科学技术大学").elite985'),true);
 assert.equal(h.run('universityProfile("北京师范大学（北京校区）").name'),'北京师范大学');
 assert.equal(h.run('universityMatches("985","清华")[0].name'),'清华大学');
 assert.equal(h.run('universityMatches("junior","郑州铁路")[0].name'),'郑州铁路职业技术学院');
 assert.equal(h.run('universityMatches("ordinary","清华").length'),0);
 assert.match(h.run('universityCoverage("清华大学","physics")'),/已核实/);
 assert.match(h.run('universityCoverage("河南城建学院","physics")'),/已核实/);
});

test('school picker fills the selected choice and clears mismatched majors and stale outcomes',()=>{
 const h=harness();h.run("campusDraft('hu-zx');startGame();openExam(EVENTS.find(e=>e.id==='gaokao'));openAdmissions();universityBrowser.target=3;game.admissions.result={status:'admitted'};game.admissions.choices[3]={school:'东华大学',major:'计算机类'}");
 h.run('fillUniversity(universityProfile("清华大学").code)');
 assert.equal(h.run('game.admissions.choices[3].school'),'清华大学');
 assert.equal(h.run('game.admissions.choices[3].major'),'');
 assert.equal(h.run('game.admissions.result'),undefined);
 assert.equal(h.el('#admissions-school-3').value,'清华大学');
 assert.match(h.el('#admissions-coverage-3').textContent,/已核实/);
 h.run("universityBrowser.tier='985';universityBrowser.page=1;refreshUniversityResults()");
 assert.match(h.el('#university-results').innerHTML,/第 2 \/ 2 页/);
 const rows=h.run(`evaluateAdmissions(admissionsPlayer(),[{school:'清华大学',major:'计算机科学与技术'},...Array.from({length:4},()=>({school:'',major:''}))])`);
 assert.equal(rows.status,'pending');assert.equal(rows.admitted,null);
});

test('only successful simulated admission gets a celebration, on its own final page',()=>{
 const h=harness();h.run("campusDraft('hu-zx');startGame();openExam(EVENTS.find(e=>e.id==='gaokao'));admissionsPlayer().total=646.5;game.finalScore=admissionsPlayer().total;openAdmissions()");
 for(let i=0;i<5;i++){h.el('#admissions-school-'+i).value='';h.el('#admissions-major-'+i).value='';}
 h.el('#admissions-school-0').value='东华大学';h.el('#admissions-major-0').value='计算机类';
 h.run('submitAdmissions()');assert.equal(h.run('game.postExamPage'),'admission-result');
 assert.match(h.el('#game-root').innerHTML,/admission-banner/);assert.match(h.el('#game-root').innerHTML,/喜报/);
 assert.doesNotMatch(h.el('#game-root').innerHTML,/<form/);
 h.run('game=loadGame();render()');assert.match(h.el('#game-root').innerHTML,/admission-banner/);
 h.run("game.admissions.choices[0]={school:'清华大学',major:'计算机科学与技术'};renderAdmissionsResult()");
 assert.match(h.el('#game-root').innerHTML,/录取结果待定/);assert.doesNotMatch(h.el('#game-root').innerHTML,/admission-banner|喜报/);
 h.run("game.gaokaoReport.rows.find(p=>p.active).total=400;game.admissions.choices[0]={school:'东华大学',major:'计算机类'};renderAdmissionsResult()");
 assert.match(h.el('#game-root').innerHTML,/本次模拟未录取/);assert.doesNotMatch(h.el('#game-root').innerHTML,/admission-banner|喜报/);
});

test('score page leads to a separate five-choice page, submissions and reload keep the result',()=>{
 const h=harness();
 h.click({admissionsPage:'choices'});assert.equal(h.run('game'),null);
 h.run("campusDraft('hu-zx');startGame();openExam(EVENTS.find(e=>e.id==='gaokao'));admissionsPlayer().total=646.5;game.finalScore=admissionsPlayer().total");
 assert.match(h.el('#game-root').innerHTML,/下一页：志愿填报/);
 assert.doesNotMatch(h.el('#game-root').innerHTML,/<form id="admissions-form"/);
 h.click({admissionsPage:'choices'});
 assert.equal((h.el('#game-root').innerHTML.match(/<fieldset /g)||[]).length,5);
 for(let i=0;i<5;i++){h.el('#admissions-school-'+i).value='';h.el('#admissions-major-'+i).value='';}
 h.el('#admissions-school-0').value='北京师范大学';h.el('#admissions-major-0').value='计算机科学与技术';
 h.el('#admissions-school-1').value='东华大学';h.el('#admissions-major-1').value='计算机类';
 h.run('submitAdmissions()');
 assert.equal(h.run('game.admissions.result.status'),'admitted');
 assert.equal(h.run('game.admissions.result.admitted.school'),'东华大学');
 assert.equal(h.run('game.admissions.result.admitted.choice'),2);
 assert.equal(h.run('game.finalScore'),646.5);
 assert.match(h.el('#game-root').innerHTML,/模拟录取通知/);
 h.run('game=loadGame();render()');assert.match(h.el('#game-root').innerHTML,/模拟录取通知/);
 h.click({admissionsPage:'scores'});assert.match(h.el('#game-root').innerHTML,/高考成绩单/);
 h.click({admissionsPage:'choices'});assert.equal(h.run('game.admissions.choices[1].school'),'东华大学');
 h.run("saveAdmissionsField({dataset:{admissionsIndex:'1',admissionsField:'major'},value:'材料类'})");
 assert.equal(h.run('game.admissions.result'),undefined);
 h.run('render()');assert.doesNotMatch(h.el('#game-root').innerHTML,/模拟录取通知/);
});

test('admissions follows preference order and never guesses ties or missing data',()=>{
 const h=harness();h.run("campusDraft('hu-yy');startGame();openExam(EVENTS.find(e=>e.id==='gaokao'))");
 const evaluate=(first,second,total=557)=>h.run(`evaluateAdmissions({...admissionsPlayer(),total:${total}},${JSON.stringify([first,second,{school:'',major:''},{school:'',major:''},{school:'',major:''}])})`);
 const low={school:'河南城建学院',major:'计算机科学与技术'},high={school:'江苏大学',major:'计算机科学与技术'};
 assert.equal(evaluate(high,low).admitted.school,'河南城建学院');
 assert.equal(evaluate(low,high,700).admitted.school,'河南城建学院');
 assert.equal(evaluate(low,high,500).status,'pending');
 assert.equal(evaluate(low,high,499).status,'unplaced');
 assert.equal(evaluate({school:'未收录大学',major:'法学'},low).status,'pending');
 assert.equal(evaluate({school:'河南城建学院',major:'未知专业'},low).status,'pending');
 assert.equal(evaluate({school:'河南城建学院',major:'计算机科学与技术（国家专项）'},low).status,'pending');
});

test('admissions checks real elective requirements and rejects incomplete and duplicate choices',()=>{
 const h=harness();h.run("campusDraft('hu-yy');startGame();openExam(EVENTS.find(e=>e.id==='gaokao'));admissionsPlayer().total=600;game.finalScore=admissionsPlayer().total");
 const evaluate=choices=>h.run(`evaluateAdmissions(admissionsPlayer(),${JSON.stringify([...choices,...Array.from({length:5-choices.length},()=>({school:'',major:''}))])})`);
 assert.equal(evaluate([]).status,'invalid');
 assert.equal(evaluate([{school:'江苏大学',major:''}]).status,'invalid');
 assert.equal(evaluate([{school:'江苏大学',major:'法学'},{school:' 江苏大学 ',major:'法学'}]).status,'invalid');
 assert.equal(evaluate([{school:'河南农业大学',major:'动物生产类'}]).rows[0].state,'ineligible');
 assert.equal(evaluate([{school:'河南农业大学',major:'人文地理与城乡规划'}]).status,'admitted');
 h.run('admissionsPlayer().subjects={chinese:140,math:140,english:140,physics:90,chemistry:90,biology:90}');
 assert.equal(evaluate([{school:'河南农业大学',major:'人文地理与城乡规划'}]).rows[0].state,'ineligible');
 assert.equal(evaluate([{school:'河南农业大学',major:'动物生产类'}]).status,'admitted');
 h.run("admissionsPlayer().rank.category='history';admissionsPlayer().subjects={chinese:140,math:140,english:140,history:90,politics:90,geography:90}");
 assert.equal(evaluate([{school:'河南城建学院',major:'计算机科学与技术'}]).rows[0].state,'unknown');
 assert.equal(evaluate([{school:'河南城建学院',major:'法学'}]).status,'admitted');
});

test('all admission records have professional cutoffs, verified sources and deterministic boundaries',()=>{
 const h=harness();
 assert.equal(h.run('HENAN_2025_ADMISSIONS.schools.length'),1580);
 assert.ok(h.run(`HENAN_2025_ADMISSIONS.schools.every(s=>s.source.startsWith('https://')&&s.groups.every(g=>g.programs.every(([m,n,meta])=>m&&Number.isInteger(n)&&n>=185&&n<=750&&Number.isInteger(meta.minRank)&&meta.source.startsWith('https://'))))`));
 assert.ok(h.run(`HENAN_2025_ADMISSIONS.schools.every(s=>s.groups.every(g=>g.programs.every(([major,minScore])=>{
   const subjects=Object.fromEntries(['chinese','math','english',g.category==='physics'?'physics':'history',...g.requires].map(id=>[id,100]));
   const choices=[{school:s.name,major},...Array.from({length:4},()=>({school:'',major:''}))];
   const control=g.degree==='junior'?185:g.category==='physics'?427:471;
   return [-1,0,1].every(delta=>evaluateAdmissions({total:minScore+delta,rank:{category:g.category},subjects},choices).status===(delta<0?'unplaced':delta===0||minScore+delta<control?'pending':'admitted'));
 })))`));
});

test('gaokao separates abilities from actual scores and saves the final table',()=>{
 for(const [id,total] of [['hu-yy',557],['zhang-z',594],['hu-zx',646.5],['hao-kj',566]]){
  const h=harness();h.run(`campusDraft('${id}');startGame();game.stress=100;game.attrs.insight=0;game.learning.seed=12345;game.day=1092;openExam(EVENTS.find(e=>e.id==='gaokao'))`);
  assert.equal(h.run('game.completed'),true);assert.notEqual(h.run('game.finalScore'),total);assert.equal(h.run('game.gaokaoReport.version'),2);
  assert.equal(h.run('game.gaokaoReport.rows.length'),210);
  assert.ok(h.run('game.gaokaoReport.rows.every(p=>Object.keys(p.subjects).length===6&&Math.round(Object.values(p.subjects).reduce((a,b)=>a+b,0)*100)/100===p.total)'));
  assert.equal(h.run('game.gaokaoReport.rows.filter(p=>p.active).length'),1);
  assert.match(h.el('#game-root').innerHTML,/高考成绩单/);assert.match(h.el('#game-root').innerHTML,/河南.*参考位次/);
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
 assert.equal(h.run('game.finalScore'),h.run('game.gaokaoReport.rows.find(p=>p.active).total'));assert.notEqual(h.run('game.finalScore'),h.run('campusOptions(game).reduce((sum,[id])=>sum+game.subjects[id],0)'));
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
 const h=harness();h.run("campusDraft('hu-zx');startGame();game.subjects.physics=99.8;learningRandom=()=>.2;studySubject('physics')");
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
 const h=harness();h.run("campusDraft('hu-zx');startGame();game.subjects.chinese=120;learningRandom=()=>0;studySubject('chinese')");
 assert.equal(h.run('game.subjects.chinese'),120.15);
 h.run("game.tutoring={decided:true,subject:'chinese'};showMandatoryTutoring()");
 assert.equal(h.run('game.subjects.chinese'),120.30);
 h.run('applyEffects({subjects:{chinese:12,science:12},charm:8,mindset:10});persist();game=loadGame()');
 assert.equal(h.run('game.subjects.chinese'),120.45);
 assert.equal(h.run("game.attrs.charm"),70.5);
 h.run("game.subjects.chinese=149.95;game.tutoringDoneThisWeek=false;showMandatoryTutoring()");
 assert.equal(h.run('game.subjects.chinese'),150);
 assert.match(h.el('#game-dialog').innerHTML,/\+0\.05/);
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

test('old unfinished saves begin learning history at migration without invented past',()=>{
 const h=harness();h.run("campusDraft('hu-zx');startGame();delete game.learning;game.day=1050;persist();game=loadGame();render();globalThis.oldScores=JSON.stringify(game.subjects)");
 assert.equal(h.run('game.learning.startDay'),1050);assert.equal(h.run('learningPreparation(game).days'),0);
 assert.equal(h.run('learningPreparation(game).quality'),.5);
 assert.equal(h.run('JSON.stringify(game.subjects)'),h.run('oldScores'));
 h.run('advanceWeek();persist();game=loadGame()');assert.equal(h.run('learningPreparation(game).days'),7);
});
test('learning state, memory, RNG and settled weeks survive independent character saves',()=>{
 const h=harness();h.run("campusDraft('hu-zx');startGame();studySubject('chinese');advanceWeek();globalThis.learningSnapshot=JSON.stringify(game.learning);persist();campusDraft('hu-yy');startGame()");
 assert.notEqual(h.run('JSON.stringify(game.learning)'),h.run('learningSnapshot'));
 h.run("game=campusValidate(JSON.parse(JSON.stringify(characterSave('hu-zx'))));render()");
 assert.equal(h.run('JSON.stringify(game.learning)'),h.run('learningSnapshot'));
 assert.ok(h.run('Object.keys(game.learning.memory).length>=6'));
});
test('legacy completed score snapshots stay unchanged through the new rules',()=>{
 const h=harness();h.run("campusDraft('hu-zx');startGame();openExam(EVENTS.find(e=>e.id==='gaokao'));game.gaokaoReport.version=1;delete game.gaokaoReport.rows.find(p=>p.active).preparation;globalThis.legacy=JSON.stringify(game.gaokaoReport);persist();game=loadGame();render()");
 assert.equal(h.run('JSON.stringify(game.gaokaoReport)'),h.run('legacy'));
 assert.match(h.el('#game-root').innerHTML,/旧版已结算/);
});


test('new exam marks and their total retain one decimal and the score page formats old marks consistently',()=>{
 const h=harness();h.run("campusDraft('hu-zx');startGame();openExam(EVENTS.find(e=>e.id==='gaokao'))");
 assert.ok(h.run('game.gaokaoReport.rows.every(p=>Object.values(p.subjects).every(v=>Math.abs(v*10-Math.round(v*10))<1e-8)&&Math.abs(p.total*10-Math.round(p.total*10))<1e-8)'));
 assert.equal(h.run('formatExamScore(646)'), '646.0');assert.equal(h.run('formatExamScore(646.56)'), '646.6');
 h.run('admissionsPlayer().subjects.chinese=110.26;admissionsPlayer().total=646.56;game.finalScore=646.56;renderFinal()');
 assert.match(h.el('#game-root').innerHTML,/646\.6/);assert.match(h.el('#game-root').innerHTML,/110\.3/);
 assert.equal(h.run('admissionsPlayer().total'),646.56);
});
test('mobile major selector includes every recorded program, codes and thresholds without a two-item limit',()=>{
 const h=harness();h.run("campusDraft('hu-zx');startGame();openExam(EVENTS.find(e=>e.id==='gaokao'));openAdmissions();saveAdmissionsField({dataset:{admissionsIndex:'0',admissionsField:'school'},value:'郑州大学'});renderAdmissions()");
 const count=h.run("admissionsPrograms(admissionsSchool('郑州大学'),'physics').length");assert.ok(count>2);
 const options=h.run("admissionsMajorSelectOptions('郑州大学','physics')");
 assert.equal((options.match(/<option /g)||[]).length,count+1);
 assert.ok(h.run("admissionsPrograms(admissionsSchool('郑州大学'),'physics').every(p=>admissionsMajorSelectOptions('郑州大学','physics').includes(escapeHtml(p.major)))"));
 assert.match(h.el('#game-root').innerHTML,/查看全部专业/);assert.match(h.el('#game-root').innerHTML,/上下滑动/);
 const empty=h.run("admissionsMajorSelectOptions('未收录大学','physics')");assert.match(empty,/暂无本类别已收录专业/);
});
test('native mobile selection and manual input sync with the saved choice and clear stale admission outcomes',()=>{
 const h=harness();h.run("campusDraft('hu-zx');startGame();openExam(EVENTS.find(e=>e.id==='gaokao'));openAdmissions();saveAdmissionsField({dataset:{admissionsIndex:'0',admissionsField:'school'},value:'郑州大学'})");
 const major=h.run("admissionsPrograms(admissionsSchool('郑州大学'),'physics').at(-1).major");
 h.run("game.admissions.result={status:'admitted'}");
 h.change({id:'admissions-major-select-0',dataset:{admissionsIndex:'0',admissionsField:'major'},value:major,matches:()=>false});
 assert.equal(h.el('#admissions-major-0').value,major);assert.equal(h.run('game.admissions.choices[0].major'),major);assert.equal(h.run('game.admissions.result'),undefined);
 h.run('game=loadGame()');assert.equal(h.run('game.admissions.choices[0].major'),major);
 h.run("saveAdmissionsField({dataset:{admissionsIndex:'0',admissionsField:'major'},value:'手动输入专业'})");
 assert.equal(h.el('#admissions-major-select-0').value,'');assert.equal(h.el('#admissions-major-0').value,'手动输入专业');
 h.run("saveAdmissionsField({dataset:{admissionsIndex:'0',admissionsField:'school'},value:'清华大学'})");
 assert.equal(h.run('game.admissions.choices[0].major'),'');assert.equal(h.el('#admissions-major-0').value,'');
 assert.ok(h.el('#admissions-major-select-0').innerHTML.includes('请选择专业'));
});
test('admission results show the one-decimal actual mark separately from the integer lookup policy',()=>{
 const h=harness();h.run("campusDraft('hu-zx');startGame();openExam(EVENTS.find(e=>e.id==='gaokao'));admissionsPlayer().total=646.56;game.admissions={choices:[{school:'东华大学',major:'计算机类'},...Array.from({length:4},()=>({school:'',major:''}))]};renderAdmissionsResult()");
 assert.match(h.el('#game-root').innerHTML,/实考成绩 646\.6 分/);assert.match(h.el('#game-root').innerHTML,/646\.0 分查表/);assert.match(h.el('#game-root').innerHTML,/最低分 639\.0/);
 assert.equal(h.run('evaluateAdmissions(admissionsPlayer(),admissionsChoices()).score'),646);
});
