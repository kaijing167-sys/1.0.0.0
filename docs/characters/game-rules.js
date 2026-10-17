/* Shared pure rules for the browser and Node regression tests. */
const GameRules = (() => {
  const major = ['chinese', 'math', 'english'];
  function subjectMax(state, subject) {
    return state.version === 2 && !major.includes(subject) ? 100 : 150;
  }
  function selectedSubjects(state) {
    return [...major, ...(state.subject_combination ||
      (state.track === 'arts' ? ['history', 'politics', 'geography'] : ['physics', 'chemistry', 'biology']))];
  }
  function baseScore(state) {
    if (state.version !== 2) return major.reduce((n, key) => n + state.attrs[key], 0) * 2.5;
    return selectedSubjects(state).reduce((n, key) => n + state.attrs[key], 0);
  }
  function nextPeriod(state) {
    if (state.graduated || state.week >= 156) return false;
    if (state.version === 2) {
      state.days_remaining = Math.max(0, state.days_remaining - 7);
      state.week = 156 - Math.ceil(state.days_remaining / 7);
    } else state.week++;
    state.attrs.action_points = 4;
    state.attrs.stamina = Math.min(100, state.attrs.stamina + 15);
    state.study = 0;
    return true;
  }
  function newCharacterState(character) {
    return JSON.parse(JSON.stringify(character.initial_state));
  }
  return {subjectMax, selectedSubjects, baseScore, nextPeriod, newCharacterState};
})();
if (typeof module !== 'undefined') module.exports = GameRules;
