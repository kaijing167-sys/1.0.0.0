const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict'),path=require('node:path');
const dir=path.join(__dirname,'../frontend'),preview=dir;
const storage=new Map(),elements=new Map();
const el=k=>{if(!elements.has(k))elements.set(k,{innerHTML:'',value:'测试角色',classList:{add(){},remove(){},toggle(){}},addEventListener(){},setAttribute(){},removeAttribute(){},focus(){}});return elements.get(k)};
const c=vm.createContext({document:{querySelector:el,addEventListener(){},body:el('body')},localStorage:{getItem:k=>storage.get(k)||null,setItem:(k,v)=>storage.set(k,v),removeItem:k=>storage.delete(k)},location:{hash:'',pathname:'/',protocol:'https:'},Audio:class{pause(){}play(){return Promise.resolve()}addEventListener(){}},window:{addEventListener(){}},setTimeout:()=>0,clearTimeout(){},setInterval:()=>0,clearInterval(){},confirm:()=>true,console,URL,Blob,crypto:{randomUUID:()=> 'test-custom'},performance:{now:()=>0}});
const run=s=>vm.runInContext(s,c);
for(const file of ['characters/characters-data.js','school-roster-data.js','henan-2025-data.js','roster.js','gaokao.js','curriculum.js','game.js','custom-tiers.js']){
 let s=fs.readFileSync(path.join(fs.existsSync(path.join(dir,file))?dir:preview,file),'utf8');
 if(file==='game.js')s=s.slice(0,s.lastIndexOf('\nrender();\nif(location.hash'));
 new vm.Script(s,{filename:file});run(s);
}
run(`render=()=>{};settings.autoEvents=false;function button(dataset={},attr=''){return {dataset,hasAttribute:k=>k===attr}}`);
for(const primary of ['physics','history'])for(const extras of [['chemistry','biology'],['chemistry','politics'],['chemistry','geography'],['biology','politics'],['biology','geography'],['politics','geography']]){
 run(`draft={custom_id:'test-custom',name:'测试角色',stage:'high1',class_id:4,attrs:{...PRESETS.balanced},customTier:'t4'};draft.customParameters=generateCustomTier(CUSTOM_TIERS[4]);startGame();`);
 assert.equal(run('campusOptions(game).length'),9);assert.equal(run('learningSubjects(game).length'),9);
 run('game.day=365;game.learning.settledDay=365;advanceWeek()');
 assert.equal(run('game.day'),365);
 run(`courseHandler(button({},'data-course-next'))`);
 assert.equal(run('game.curriculum_selected'),false);
 run(`courseHandler(button({courseSubject:'${primary}'}));courseHandler(button({},'data-course-next'));courseHandler(button({courseSubject:'${extras[0]}'}));courseHandler(button({courseSubject:'${extras[1]}'}));`);
 const third=['chemistry','biology','politics','geography'].find(k=>!extras.includes(k));
 run(`courseHandler(button({courseSubject:'${third}'}));courseHandler(button({},'data-course-next'));`);
 assert.equal(run('game.day'),372);assert.equal(run('game.stage'),'high2');
 const expected=['chinese','math','english',primary,...extras].sort();
 assert.deepEqual(JSON.parse(run('JSON.stringify(curriculumKeys(game))')).sort(),expected);
 run('game=campusValidate(JSON.parse(JSON.stringify(game)))');
 assert.deepEqual(JSON.parse(run('JSON.stringify(learningSubjects(game))')).sort(),expected);
 run('game.day=729;advanceWeek()');assert.equal(run('game.stage'),'high3');
 run('game.day=990;advanceWeek()');assert.equal(run('game.stage'),'sprint100');
 const player=JSON.parse(run('JSON.stringify(buildGaokaoReport(game).rows.find(p=>p.active))'));
 assert.deepEqual(Object.keys(player.subjects).sort(),expected);assert.equal(player.rank.category,primary);
}
for(const stage of ['high2','high3','sprint100']){
 run(`draft.stage='${stage}';chooseCustomStage(draft.stage);courseHandler(button({courseClass:'2'}));courseHandler(button({},'data-course-class-next'));chooseCustomTier('t4');startGame();`);
 assert.equal(run('game.class_id'),2);assert.equal(run('campusOptions(game).length'),6);assert.equal(run('!!game.custom_curriculum'),false);
}
for(const file of ['game.js','roster.js','gaokao.js','custom-tiers.js','curriculum.js'])new vm.Script(fs.readFileSync(path.join(dir,file),'utf8'));
assert.ok(fs.readFileSync(path.join(dir,'game.js'),'utf8').includes('function mergeSettings'));
assert.ok(!fs.readFileSync(path.join(dir,'curriculum.js'),'utf8').includes('data-trial-jump'));
console.log('PASS: 12 combinations; year-one nine subjects; mandatory selection; two-choice limit; grade progression; reload; gaokao subjects/category; all later starting grades; preserved chat settings; JS syntax.');

