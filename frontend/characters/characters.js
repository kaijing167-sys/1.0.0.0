function currentCharacter() {
  return characterCatalog.find(character => character.id === state.character_id);
}

function portraitPath(id) {
  const version = ['zhang-z', 'hu-zx'].includes(id) ? 'v2' : 'v1';
  return 'portraits/' + encodeURIComponent(id) + '-' + version + '.png';
}

function characterAvatar(character) {
  return '<img src="' + portraitPath(character.id) + '" alt="' +
    escapeText(character.name) + '的头像" width="1254" height="1254">';
}

function characterSubjectRows(character) {
  const start = character.initial_state;
  return GameRules.selectedSubjects(start).map(key =>
    '<div class="subject-row"><span>' + subjects[key] + '</span>' +
    bar(start.attrs[key], GameRules.subjectMax(start, key)) +
    '<small>' + start.attrs[key] + ' / ' + GameRules.subjectMax(start, key) + '</small></div>'
  ).join('');
}

function classSelector(character) {
  return '<label class="field">开局班级<select id="start-class-'+character.id+'">'+
    schoolClasses.map(c=>'<option value="'+c.id+'" '+(c.id===character.initial_state.class_id?'selected':'')+'>'+
    c.name+' · '+c.combination+' '+c.level+'</option>').join('')+'</select></label>';
}

function charactersPage() {
  return title('选择你的角色', '选择人物与班级，从高考前 100 天开始。') +
    '<p class="page-intro">先查看人物档案，再选择角色开始。语数外按 150 分换算，选考学科满分 100 分。</p>' +
    '<div class="character-grid">' + characterCatalog.map((character, index) => {
      const f = character.fields, active = state.character_id === character.id;
      return '<article class="panel character-card">' +
        '<img class="character-portrait" src="' + portraitPath(character.id) + '" alt="' +
        escapeText(character.name) + '的赛博校园形象" width="1254" height="1254">' +
        '<div class="character-heading"><div class="avatar avatar-face">' + characterAvatar(character) +
        '</div><div><span class="eyebrow">人物档案 0' + (index + 1) + '</span><h2>' +
        escapeText(character.name) + ' <small>' + escapeText(character.nickname) + '</small></h2></div>' +
        (active ? '<span class="tag">当前角色</span>' : '') + '</div>' +
        '<p>' + f['年龄'] + ' 岁 · ' + escapeText(f['班级']) + ' · ' + escapeText(f['选科组合']) + ' · ' +
        escapeText(f.mbti.toUpperCase()) + '</p>' +
        '<p class="character-target">目标：' + escapeText(f['目标大学']) + '<br><span>' +
        escapeText(f['目标专业']) + '</span></p>' +
        '<p class="character-description">' + escapeText(f['气质']) + '</p>' +
        characterSubjectRows(character) +
        '<p class="sub">六科换算合计 <b>' + GameRules.baseScore(character.initial_state) +
        ' / 750（默认班级）</b> · 档案总分实力 ' + f['总分实力'] + '</p>' +
        classSelector(character) +
        '<div class="character-actions"><button data-profile="' + character.id +
        '">查看完整档案</button><button class="primary" data-character="' + character.id +
        '">选择角色开始</button></div></article>';
    }).join('') +
    '<p class="sub">选角会开始新的进度；当前进度如需保留，请先保存到进度槽。人物档案中的其他属性已保留，后续可继续接入事件和成长规则。</p>';
}

function showCharacterProfile(id) {
  const character = characterCatalog.find(item => item.id === id);
  if (!character) return;
  const entries = Object.entries(character.fields);
  const groups = [['基本资料',0,17],['学习与考试',17,45],['状态与性格',45,63],
    ['社交与关系',63,81],['家庭与其他',81,95]];
  modal('<h2>' + escapeText(character.name) + '的人物档案</h2>' +
    '<img class="profile-portrait" src="' + portraitPath(character.id) + '" alt="' +
    escapeText(character.name) + '的赛博校园形象" width="1254" height="1254">' +
    '<p>以下为开局资料。各科原始水平按百分制填写；实时学科属性请查看“学业成长”。</p>' +
    groups.map(([name, start, end]) => '<details class="profile-group"' +
      (start === 0 ? ' open' : '') + '><summary>' + name + '</summary><dl class="profile-fields">' +
      entries.slice(start, end).map(([label, value]) => '<div><dt>' +
        escapeText(label === '记忆里' ? '记忆力' : label) + '</dt><dd>' +
        escapeText(value) + '</dd></div>').join('') + '</dl></details>').join('') +
    '<p class="sub">好感、信任等关系值按原表保留，尚未指定关系对象。</p>' +
    '<button class="primary" data-character="' + character.id + '">选择此角色开始</button>');
}

let characterStarting = false;
async function selectCharacter(id) {
  if (characterStarting) return;
  const character = characterCatalog.find(item => item.id === id);
  const chosenClass = Number(document.querySelector('#start-class-'+id)?.value) || character?.initial_state.class_id;
  if (!character || !confirm('以' + character.name + '开始高考前 100 天的生活？当前进度会被替换，请先保存需要保留的进度。')) return;
  characterStarting = true;
  try {
    let nextState = GameRules.newCharacterState(character);
    SchoolRules.apply(nextState, chosenClass);
    if (location.pathname.startsWith('/play/')) {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 10000);
      try {
        const response = await fetch('/api/characters/' + encodeURIComponent(id) + '/start',
          {method:'POST', signal:controller.signal, headers:{'Content-Type':'application/json'}, body:JSON.stringify({class_id:chosenClass})});
        if (!response.ok) throw new Error('开局失败，请稍后重试。');
        nextState = (await response.json()).state;
      } finally { clearTimeout(timeout); }
    }
    state = nextState;
    selectedPerks = [];
    closeModal();
    location.hash = 'home';
    commit('你选择了' + character.name + '，百日冲刺开始。');
  } catch (error) {
    toast(error.name === 'AbortError' ? '开局请求超时，请重试。' : '暂时无法开始角色，请检查后端连接后重试。');
  } finally { characterStarting = false; }
}

document.addEventListener('click', event => {
  const button = event.target.closest('button');
  if (!button || button.disabled) return;
  if (button.dataset.profile) showCharacterProfile(button.dataset.profile);
  if (button.dataset.character) selectCharacter(button.dataset.character);
});
