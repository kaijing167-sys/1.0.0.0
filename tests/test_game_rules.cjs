const {test} = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const rules = require('../frontend/characters/game-rules.js');
const characters = require('../frontend/characters/characters.json');

test('four characters preserve fractional conversion and start independently', () => {
  const totals = [557, 594, 646.5, 566];
  characters.forEach((character, index) => {
    const state = rules.newCharacterState(character);
    assert.equal(rules.baseScore(state), totals[index]);
    state.attrs.math = 0;
    assert.notEqual(rules.newCharacterState(character).attrs.math, 0);
  });
  assert.equal(characters[0].initial_state.attrs.math, 112.5);
});

test('selection determines counting; capped subjects total 750', () => {
  const state = rules.newCharacterState(characters[0]);
  assert.ok(rules.selectedSubjects(state).includes('geography'));
  assert.ok(!rules.selectedSubjects(state).includes('biology'));
  const score = rules.baseScore(state);
  state.attrs.biology = 99;
  assert.equal(rules.baseScore(state), score);
  state.attrs.geography += 1;
  assert.equal(rules.baseScore(state), score + 1);
  for (const key of rules.selectedSubjects(state)) state.attrs[key] = rules.subjectMax(state, key);
  assert.equal(rules.baseScore(state), 750);
});

test('100-day countdown reaches zero exactly and cannot advance past the exam', () => {
  const state = rules.newCharacterState(characters[0]);
  const expected = [93,86,79,72,65,58,51,44,37,30,23,16,9,2,0];
  expected.forEach(days => {
    assert.ok(rules.nextPeriod(state));
    assert.equal(state.days_remaining, days);
    assert.equal(state.week, 156-Math.ceil(days/7));
  });
  assert.equal(rules.nextPeriod(state), false);
  assert.equal(state.days_remaining, 0);
});

test('legacy game preserves its old exam formula and subject limits', () => {
  const state = {version:1,week:1,attrs:{chinese:60,math:60,english:60,stamina:90}};
  assert.equal(rules.baseScore(state), 450);
  assert.equal(rules.subjectMax(state,'physics'),150);
  rules.nextPeriod(state);
  assert.equal(state.week,2);
});

test('static-site mirrors have exactly the same character rules and UI', () => {
  for (const name of ['characters.json','characters-data.js','game-rules.js','characters.js','characters.css','app.js','index.html','saves.js']) {
    assert.equal(fs.readFileSync(path.join(__dirname,'../frontend/characters',name),'utf8'),
      fs.readFileSync(path.join(__dirname,'../docs/characters',name),'utf8'));
  }
});
