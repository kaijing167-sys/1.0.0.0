const {test} = require('node:test');
const assert = require('node:assert/strict');
const vm = require('node:vm');
const fs = require('node:fs');
const path = require('node:path');

function game() {
  const elements = new Map();
  const storage = new Map();
  const element = selector => {
    if (!elements.has(selector)) elements.set(selector, {
      innerHTML:'',textContent:'',open:false,
      classList:{add(){},remove(){},toggle(){}},addEventListener(){},
      showModal(){this.open=true;},close(){this.open=false;}
    });
    return elements.get(selector);
  };
  const context = vm.createContext({
    document:{querySelector:element,addEventListener(){}},
    location:{hash:'',pathname:'/static/',protocol:'http:'},
    localStorage:{getItem:key=>storage.get(key)||null,setItem:(key,value)=>storage.set(key,value)},
    window:{addEventListener(){},scrollTo(){}},
    setTimeout:()=>0,clearTimeout(){},setInterval:()=>0,clearInterval(){},
    confirm:()=>true,console,
    FormData:class { get(name){return {essay:'steady',math:'safe',check:'careful'}[name];}}
  });
  for (const name of ['characters-data.js','game-rules.js','school.js','characters.js','app.js','saves.js']) {
    vm.runInContext(fs.readFileSync(path.join(__dirname,'../frontend/characters',name),'utf8'),context,{filename:name});
  }
  return {context,element,run:source=>vm.runInContext(source,context),storage};
}

test('actual scripts render selection, all profiles and all four starts', async () => {
  const g=game();
  assert.equal((g.element('#main').innerHTML.match(/class="panel character-card"/g)||[]).length,4);
  g.run("showCharacterProfile('hu-yy')");
  assert.equal((g.element('#dialog-content').innerHTML.match(/<dt>/g)||[]).length,95);
  for (const [id,score] of [['hu-yy',557],['zhang-z',594],['hu-zx',646.5],['hao-kj',566]]) {
    await g.run("selectCharacter('" + id + "')");
    assert.equal(g.run('state.character_id'),id);
    assert.equal(g.run('GameRules.baseScore(state)'),score);
    assert.equal(g.run('state.days_remaining'),100);
    assert.ok(g.element('#main').innerHTML.includes('当前六科实力'));
    g.run("location.hash='#study';render();chooseStudy()");
    assert.ok(g.element('#main').innerHTML.includes('物化'));
    assert.ok(g.element('#dialog-content').innerHTML.includes('/ 100'));
    assert.ok(g.element('#dialog-content').innerHTML.includes('/ 150'));
  }
});

test('actual gameplay caps elective subjects, saves decimals and retains identity in new rounds', async () => {
  const g=game();
  await g.run("selectCharacter('hu-yy')");
  g.run("state.attrs.physics=99;study('physics')");
  assert.equal(g.run('state.attrs.physics'),100);
  assert.equal(JSON.parse(g.storage.get('qinghe-school-v1')).attrs.math,112.5);
  g.run('advance()');
  assert.equal(g.run('state.days_remaining'),93);
  g.run('state.days_remaining=2;state.week=155;advance();calculateExam({})');
  assert.equal(g.run('state.days_remaining'),0);
  assert.equal(g.run('state.graduated'),true);
  assert.ok(g.run('state.exam.score>=0 && state.exam.score<=750'));
  g.run('startNewGame()');
  assert.equal(g.run('state.character_id'),'hu-yy');
  assert.equal(g.run('state.days_remaining'),100);
  assert.equal(g.run('state.round'),2);
  assert.equal(g.run('state.attrs.math'),112.5);
});

test('cancelled role selection leaves current progress untouched', async () => {
  const g=game();
  const before=g.run('JSON.stringify(state)');
  g.context.confirm=()=>false;
  await g.run("selectCharacter('hu-yy')");
  assert.equal(g.run('JSON.stringify(state)'),before);
});

test('class selection, transfers, headcounts, reload and new rounds preserve choices', async () => {
  const g=game();
  g.element('#start-class-hu-zx').value='14';
  await g.run("selectCharacter('hu-zx')");
  assert.equal(g.run('state.class_id'),14);
  assert.equal(g.run('state.track'),'arts');
  assert.equal(g.run('SchoolRules.size(2,state)'),30);
  assert.equal(g.run('SchoolRules.size(14,state)'),30);
  const attrs=g.run('JSON.stringify(state.attrs)');
  g.run('transferClass(11)');
  assert.equal(g.run('state.class_id'),11);
  assert.equal(g.run('JSON.stringify(state.attrs)'),attrs);
  assert.equal(g.run('schoolClasses.reduce((n,c)=>n+SchoolRules.size(c.id,state),0)'),210);
  assert.equal(g.run('SchoolRules.size(14,state)'),30);
  assert.equal(JSON.parse(g.storage.get('qinghe-school-v1')).class_id,11);
  g.run("state=JSON.parse(localStorage.getItem(key));SchoolRules.normalize(state);location.hash='#classes';render()");
  assert.equal(g.run('state.class_id'),11);
  assert.ok(g.element('#main').innerHTML.includes('当前：11班'));
  g.run('state.days_remaining=0;state.week=156;calculateExam({});startNewGame()');
  assert.equal(g.run('state.class_id'),11);
  g.run('transferClass(2)');
  assert.equal(g.run('SchoolRules.size(2,state)'),30);
  assert.equal(g.run('SchoolRules.size(11,state)'),30);
});

test('old character snapshots receive corrected default placement without resetting attributes', () => {
  const g=game();
  g.run("state=GameRules.newCharacterState(characterCatalog.find(c=>c.id==='hu-zx'));delete state.class_id;state.attrs.money=321;SchoolRules.normalize(state)");
  assert.equal(g.run('state.class_id'),2);
  assert.equal(g.run('state.attrs.money'),321);
});
