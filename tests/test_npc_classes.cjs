const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const root=path.join(__dirname,'../frontend');
const source=name=>fs.readFileSync(path.join(root,name),'utf8');
function harness(){
  const listeners={},elements=new Map();
  const el=id=>{if(!elements.has(id))elements.set(id,{classList:{add(){},remove(){}},focus(){},value:'',scrollHeight:0});return elements.get(id)};
  const context=vm.createContext({
    document:{addEventListener(type,fn){(listeners[type]??=[]).push(fn)},querySelector:el},
    characterCatalog:JSON.parse(source('characters/characters.json')),
    escapeHtml:value=>String(value).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c])),
    openModal:html=>{context.html=html},closeModal(){},render(){},toast(){},
    gradeForDay:()=> '高三',favoritePlace:()=>null,unlockMusic(){},
    clamp:(n,min,max)=>Math.max(min,Math.min(max,n)),
    settings:{chatMode:'keyword'},window:{},URL,AbortController,TextDecoder,
    setTimeout:()=>0,clearTimeout(){},confirm:()=>true,console
  });
  const run=s=>vm.runInContext(s,context);
  const game=source('game.js');
  run(game.slice(game.indexOf('const FRIENDS ='),game.indexOf('const DEFAULT_RELATIONSHIPS')));
  run(game.slice(game.indexOf('function relationshipLabel('),game.indexOf('function showFriendSelect(')));
  run(game.slice(game.indexOf('function relationshipPanelHtml('),game.indexOf('function roadmapPanelHtml(')));
  run('var game=null;var resolveSocialChoice;');
  run(source('school-roster-data.js'));run(source('roster.js'));run(source('phone-chat.js'));
  run(game.slice(game.indexOf('document.addEventListener("click",event=>{'),game.indexOf('document.addEventListener("submit",event=>{')));
  function click(dataset){
    const b={dataset,disabled:false,hasAttribute:()=>false};
    for(const fn of listeners.click)fn({target:{closest:()=>b}});
  }
  run("game={name:'测试玩家',class_id:2,origin_class_id:2,day:993,actionPoints:4,relationships:{liqiang:5,su:2,lin:0},subjects:{chinese:100,math:100,english:100,physics:70,chemistry:70,biology:70},attrs:{insight:60,stamina:60,mindset:60,charm:60}}");
  return {run,click,context};
}
test('every story friend occupies one fixed class seat across transfers and saved-game reloads',()=>{
  const h=harness(),baseline=h.run('JSON.stringify(campusPopulation)');
  assert.equal(h.run('CAMPUS_NPCS.length'),h.run('FRIENDS.length'));
  for(const characterId of [null,'hu-zx','hu-yy','zhang-z','hao-kj']){
    h.context.characterId=characterId;
    h.run('game.character_id=characterId');
    for(const id of [2,4,7,8,11,13,14]){
      h.context.destination=id;
      h.run('game.class_id=destination;game=JSON.parse(JSON.stringify(game))');
      assert.equal(h.run('campusMembers(game).length'),210);
      assert.equal(h.run('new Set(campusMembers(game).map(p=>p.id)).size'),210);
      assert.ok(h.run('CAMPUS_CLASSES.every(c=>campusMembers(game).filter(p=>p.class_id===c.id).length===30)'));
      assert.ok(h.run('CAMPUS_NPCS.every(n=>{const rows=campusMembers(game).filter(p=>p.npc_id===n.id);return rows.length===1&&rows[0].class_id===n.class_id&&rows[0].name===n.name&&rows[0].gender===n.gender&&!rows[0].generated})'));
    }
  }
  assert.equal(h.run('JSON.stringify(campusPopulation)'),baseline);
});
test('clicking NPC names opens class details; profiles lead into chats with matching class labels',()=>{
  const h=harness();
  const npcs=JSON.parse(h.run('JSON.stringify(CAMPUS_NPCS)'));
  assert.deepEqual(Object.fromEntries(npcs.map(n=>[n.id,n.mbti])),{liqiang:'ESTP',su:'INFP',lin:'ISFP'});
  for(const npc of npcs){
    h.context.npcId=npc.id;
    const panel=h.run('relationshipPanelHtml()');
    assert.ok(panel.includes('data-campus-npc="'+npc.id+'"'));
    h.click({campusNpc:npc.id});
    assert.ok(h.context.html.includes(npc.name));
    assert.ok(h.context.html.includes('所属班级：'+npc.class_id+'班'));
    assert.ok(h.context.html.includes('性别：'+npc.gender));
    assert.ok(h.context.html.includes('MBTI：'+npc.mbti));
    h.click({socialFriend:npc.id});
    assert.ok(h.context.html.includes('phone-screen'));
    assert.ok(h.context.html.includes(npc.mbti));
    assert.ok(h.context.html.includes(npc.class_id+'班'));
    assert.equal(h.run('game.actionPoints'),4);
    h.click({campusNpc:npc.id});
    assert.equal(h.run('phoneChat'),null);
    assert.ok(h.context.html.includes('所属班级：'+npc.class_id+'班'));
  }
  h.run('game.actionPoints=0');h.click({campusNpc:'lin'});
  assert.match(h.context.html,/data-social-friend="lin" disabled/);
  h.click({campusClasses:''}); // class button uses hasAttribute; direct opening covers the roster view.
  h.run('campusShowClasses()');
  assert.equal((h.context.html.match(/（剧情 NPC）/g)||[]).length,3);
});
test('published scripts match their frontend counterparts and use updated cache versions',()=>{
  for(const name of ['roster.js','game.js','phone-chat.js','index.html']){
    assert.equal(source(name),fs.readFileSync(path.join(__dirname,'../docs',name),'utf8'));
  }
  assert.match(source('index.html'),/roster\.js\?v=50/);
  assert.match(source('index.html'),/game\.js\?v=56/);
  assert.match(source('index.html'),/phone-chat\.js\?v=10/);
});
