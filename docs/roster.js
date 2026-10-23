// Shared character and class data; all play uses game.js and qinghe-game-v2.
const CAMPUS_CLASSES = [
  {id:2,combo:'物化生',level:'尖子班',subjects:['physics','chemistry','biology'],size:30},
  {id:4,combo:'物化生',level:'普通班',subjects:['physics','chemistry','biology'],size:30},
  {id:7,combo:'物化政',level:'普通班',subjects:['physics','chemistry','politics'],size:30},
  {id:8,combo:'物化地',level:'普通班',subjects:['physics','chemistry','geography'],size:30},
  {id:11,combo:'政史地',level:'尖子班',subjects:['politics','history','geography'],size:30},
  {id:13,combo:'政史地',level:'普通班',subjects:['politics','history','geography'],size:30},
  {id:14,combo:'史政生',level:'普通班',subjects:['history','politics','biology'],size:30}
];
const CAMPUS_SUBJECTS = [['chinese','语文'],['math','数学'],['english','英语'],['physics','物理'],['chemistry','化学'],['biology','生物'],['history','历史'],['politics','政治'],['geography','地理']];
function campusClass(id){return CAMPUS_CLASSES.find(c=>c.id===Number(id))}
function campusPortrait(id){return 'characters/portraits/'+id+(['hu-zx','zhang-z'].includes(id)?'-v2.png':'-v1.png')}
function campusMax(id){return ['chinese','math','english','science','humanities'].includes(id)?150:100}
function campusOptions(g){return g.class_id?CAMPUS_SUBJECTS.filter(([id])=>['chinese','math','english',...campusClass(g.class_id).subjects].includes(id)):null}
function campusAssign(g,id){
  const c=campusClass(id);if(!c)throw Error('无效班级');
  if(!g.origin_class_id)g.origin_class_id=c.id;
  for(const [key] of CAMPUS_SUBJECTS)if(!Number.isFinite(g.subjects[key]))g.subjects[key]=Math.round((['physics','chemistry','biology'].includes(key)?g.subjects.science:g.subjects.humanities)*2/3);
  g.class_id=c.id;g.track=c.subjects.includes('physics')?'science':'humanities';
  g.subject_combination=[...c.subjects];
}
function campusDraft(id){
  const c=characterCatalog.find(c=>c.id===id);if(!c)return;
  draft.character_id=id;draft.class_id=c.initial_state.class_id;draft.name=c.name;draft.stage='sprint100';
  draft.attrs={insight:Number(c.fields['学习能力'])||60,stamina:c.initial_state.attrs.stamina,mindset:Number(c.fields['考场抗压'])||60,charm:Number(c.fields['魅力'])||60};
  renderLanding();
}
function campusStart(g,d){
  const c=characterCatalog.find(c=>c.id===d.character_id);
  if(c){g.character_id=c.id;g.origin_class_id=c.initial_state.class_id;g.name=c.name;for(const [id] of CAMPUS_SUBJECTS)g.subjects[id]=c.initial_state.attrs[id];g.energy=c.initial_state.attrs.stamina;g.stress=c.initial_state.attrs.stress;g.money=c.initial_state.attrs.money;}
  if(d.class_id||c)campusAssign(g,d.class_id||c.initial_state.class_id);
  return g;
}
function campusCards(){return `<section class="roster"><h2>选择人物</h2><p>选择后沿用当前游戏的行动、周末、剧情和考试流程；默认百日冲刺，也可调整开局阶段。</p><div class="roster-grid">${characterCatalog.map(c=>`<button type="button" data-roster="${c.id}" class="roster-card ${draft.character_id===c.id?'selected':''}"><img src="${campusPortrait(c.id)}" alt="${escapeHtml(c.name)}"><b>${escapeHtml(c.name)}</b><small>${c.initial_state.class_id}班 · ${c.fields['选科组合']}</small></button>`).join('')}</div><button type="button" data-custom-role>自定义人物</button><label>开局班级 <select id="campus-start-class"><option value="">随剧情分科</option>${CAMPUS_CLASSES.map(c=>`<option value="${c.id}" ${draft.class_id===c.id?'selected':''}>${c.id}班 · ${c.combo}${c.level}</option>`).join('')}</select></label></section>`}
function campusShowClasses(){
  if(!game)return toast('先选择人物并开始游戏');
  const population=campusMembers(game);
  openModal(`<h2>我的班级</h2><p>全校210人，每班30人，包含给定人物。其余同学使用固定生成的正态分布属性；换班与一名生成同学交换名额，保留进度和科目能力。</p>${CAMPUS_CLASSES.map(c=>{
    const members=population.filter(p=>p.class_id===c.id);
    return `<section class="class-row"><b>${c.id}班 · ${c.combo}${c.level}</b><p>${members.length}人（含已录入人物）</p><button data-campus-transfer="${c.id}" ${game.completed||game.class_id===c.id?'disabled':''}>${game.class_id===c.id?'当前班级':'转入此班'}</button><details><summary>查看30名同学及属性</summary>${members.map(p=>campusMemberCard(p,c)).join('')}</details></section>`;
  }).join('')}`);
}
function campusMembers(g){
  const members=campusPopulation.students.map(p=>({...p,subjects:{...p.subjects},attrs:{...p.attrs}}));
  for(const p of characterCatalog){
    members.push({id:p.id,name:p.name,class_id:p.initial_state.class_id,generated:false,
      subjects:Object.fromEntries(CAMPUS_SUBJECTS.map(([id])=>[id,p.initial_state.attrs[id]])),
      attrs:{insight:Number(p.fields['学习能力'])||60,stamina:p.initial_state.attrs.stamina,mindset:Number(p.fields['考场抗压'])||60,charm:Number(p.fields['魅力'])||60}});
  }
  if(!g?.class_id)return members;
  let player=members.find(p=>p.id===g.character_id);
  if(!player){
    const origin=campusClass(g.origin_class_id)?.id||g.class_id;
    player=members.find(p=>p.generated&&p.class_id===origin);
    player.id='custom-player';player.generated=false;
  }
  const origin=player.class_id;
  if(origin!==g.class_id){
    const exchange=members.find(p=>p.generated&&p.class_id===g.class_id);
    if(!exchange)throw Error('目标班没有可交换名额');
    exchange.class_id=origin;player.class_id=g.class_id;
  }
  player.name=g.name;player.subjects={...g.subjects};player.attrs={...g.attrs};player.active=true;
  return members;
}
function campusMemberCard(p,c){
  const total=['chinese','math','english',...c.subjects].reduce((n,id)=>n+(p.subjects[id]||0),0);
  return `<details class="class-student"><summary>${escapeHtml(p.name)}${p.active?'（当前人物）':p.generated?'（生成）':'（已给定）'} · 六科 ${Math.round(total*100)/100}/750</summary><p>${CAMPUS_SUBJECTS.map(([id,label])=>`${label} ${p.subjects[id]??0}/${campusMax(id)}`).join(' · ')}</p><p>${[['insight','学力'],['stamina','体质'],['mindset','心态'],['charm','魅力']].map(([id,label])=>`${label} ${p.attrs[id]}/100`).join(' · ')}</p></details>`;
}
function campusTransfer(id){
  if(!game||game.completed||modalLocked)return;
  if(!confirm('确认与目标班一名生成同学交换班级？每班保持30人，你的进度和科目能力保留。'))return;
  campusAssign(game,id);addLog('转入'+id+'班');persist();closeModal();render();campusShowClasses();
}
function campusEffect(id,value){
  const targets=game.class_id&&['science','humanities'].includes(id)?(id==='science'?['physics','chemistry','biology']:['history','politics','geography']):[id];
  let total=0;
  for(const key of targets){
    const before=game.subjects[key]||0;
    const delta=campusGrowth(value*(key!==id?2/3:1));
    game.subjects[key]=Math.round(clamp(before+delta,0,campusMax(key))*100)/100;
    total+=game.subjects[key]-before;
  }
  return Math.round(total/targets.length*100)/100;
}
function campusGrowth(value){return value>0?Math.min(value,0.5):value}
function campusValidate(g){
  if(!g||g.version!==2||!g.subjects||!g.attrs||!Number.isInteger(g.day)||g.day<1||g.day>1093)throw Error('不是当前玩法的进度');
  if(g.class_id&&!campusClass(g.class_id))throw Error('无效班级');
  if(g.character_id&&!characterCatalog.some(c=>c.id===g.character_id))throw Error('无效人物');
  for(const [id] of (g.class_id?CAMPUS_SUBJECTS:SUBJECTS))if(!Number.isFinite(g.subjects[id])||g.subjects[id]<0||g.subjects[id]>campusMax(id))throw Error('科目数值不正确');
  for(const key of ['pendingEvents','fired','achievements','log','examResults'])if(!Array.isArray(g[key]))throw Error('缺少进度记录');
  if(g.class_id)campusAssign(g,g.class_id);
  return g;
}
document.addEventListener('click',e=>{
  const b=e.target.closest('button');if(!b||b.disabled)return;
  if(b.dataset.roster)campusDraft(b.dataset.roster);
  if(b.hasAttribute('data-custom-role')){draft={name:'',attrs:{...PRESETS.balanced},preset:'balanced',stage:'high1',track:'science'};renderLanding();}
  if(b.hasAttribute('data-campus-classes'))campusShowClasses();
  if(b.dataset.campusTransfer)campusTransfer(Number(b.dataset.campusTransfer));
});
document.addEventListener('change',e=>{if(e.target.id==='campus-start-class')draft.class_id=Number(e.target.value)||null;});
