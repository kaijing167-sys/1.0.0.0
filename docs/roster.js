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
    if(value>0){learningStudy(game,key);total+=game.subjects[key]-before;continue;}
    const delta=value*(key!==id?2/3:1);
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

// Game simulation inspired by forgetting/spacing research; parameters are game balance, not clinical estimates.
function learningClamp(x,a=0,b=1){return Math.max(a,Math.min(b,Number.isFinite(x)?x:a))}
function learningSubjects(g){return g.class_id?['chinese','math','english',...campusClass(g.class_id).subjects]:[ 'chinese','math','english',...(g.track==='undecided'?['science','humanities']:[g.track==='humanities'?'humanities':'science'])]}
function learningState(g){
  if(!g.learning||g.learning.version!==1){
    g.learning={version:1,startDay:g.day,settledDay:g.day,seed:Math.floor(Math.random()*4294967296)>>>0,memory:{},weeks:[],current:{}};
  }
  const l=g.learning;
  for(const id of learningSubjects(g))if(!l.memory[id])l.memory[id]={lastReview:g.day,stability:14};
  return l;
}
function learningRandom(g){
  const l=learningState(g);l.seed=(Math.imul(l.seed,1664525)+1013904223)>>>0;return l.seed/4294967296;
}
function learningHealth(g){
  return learningClamp(.4*learningClamp(g.energy/100)+.4*(1-learningClamp(g.stress/100))+.2*learningClamp(g.mood/100));
}
function learningRecord(g,type,id){
  const l=learningState(g),c=l.current;
  c.study??={};c.actions??=0;c.healthSum??=0;c.samples??=0;
  if(type==='study')c.study[id]=(c.study[id]||0)+1;
  c.actions++;c.healthSum+=learningHealth(g);c.samples++;
  if(type==='rest'||type==='exercise')c.recovery=(c.recovery||0)+1;
}
function learningTargets(g,id){return id==='science'?['physics','chemistry','biology']:id==='humanities'?['history','politics','geography']:[id]}
function learningStudy(g,id,random=()=>learningRandom(g)){
  const l=learningState(g),targets=g.class_id?learningTargets(g,id):[id];
  const health=learningHealth(g),insight=learningClamp(g.attrs.insight/100);
  let total=0;
  // One outcome for this study action, with bounded gains even in story/tutoring effects.
  const roll=random(),up=.50+.20*health+.10*insight,down=.04+.16*(1-health);
  const change=roll<up?.15+.35*random():roll<1-down?0:-(.05+.20*random());
  for(const key of targets){
    const m=l.memory[key]??={lastReview:g.day,stability:14};
    const gap=g.day-m.lastReview;
    if(gap>=4)m.stability=learningClamp(m.stability+5,14,70);
    m.lastReview=g.day;
    const before=g.subjects[key]||0;
    g.subjects[key]=Math.round(learningClamp(before+change,0,campusMax(key))*100)/100;
    total+=g.subjects[key]-before;
    learningRecord(g,'study',key);
  }
  return Math.round(total/targets.length*100)/100;
}
function learningRisk(g,id,day=g.day){
  const m=learningState(g).memory[id];
  if(!m)return 0;
  return .04+.71*(1-Math.exp(-Math.max(0,day-m.lastReview)/m.stability));
}
function learningSettle(g,toDay,random=()=>learningRandom(g)){
  const l=learningState(g),from=l.settledDay,span=toDay-from;
  if(span<=0)return [];
  const losses=[];
  for(const id of learningSubjects(g)){
    const risk=learningRisk(g,id,toDay);
    // Weekly hazard scaled for the final partial week; ordinary school instruction provides a floor.
    if(random()<1-Math.pow(1-risk,span/7)){
      const loss=(.10+.40*random())*Math.min(1,span/7),before=g.subjects[id];
      g.subjects[id]=Math.round(learningClamp(before-loss,0,campusMax(id))*100)/100;
      if(before>g.subjects[id])losses.push([id,Math.round((before-g.subjects[id])*100)/100]);
    }
  }
  const c=l.current;
  l.weeks.push({from,to:toDay,study:{...(c.study||{})},recovery:c.recovery||0,health:c.samples?(c.healthSum+learningHealth(g))/(c.samples+1):learningHealth(g)});
  l.weeks=l.weeks.filter(w=>w.to>toDay-107);l.current={};l.settledDay=toDay;
  return losses;
}
function learningPreparation(g,day=g.day){
  const l=learningState(g),ids=learningSubjects(g),start=Math.max(day-100,l.startDay);
  const weeks=l.weeks.filter(w=>w.to>start&&w.from<day);
  if(l.settledDay<day)weeks.push({from:l.settledDay,to:day,study:l.current.study||{},health:l.current.samples?l.current.healthSum/l.current.samples:learningHealth(g)});
  let days=0,effort=0,health=0,consistent=0;
  const touches=Object.fromEntries(ids.map(id=>[id,0]));
  for(const w of weeks){
    const n=Math.max(0,Math.min(day,w.to)-Math.max(start,w.from)),weight=n/7;
    const count=ids.reduce((sum,id)=>sum+Math.min(4,w.study[id]||0),0);
    days+=n;effort+=learningClamp(count/2.6)*n;health+=w.health*n;consistent+=(count>=2?1:count/2)*n;
    for(const id of ids)touches[id]+=Math.min(1,w.study[id]||0)*weight;
  }
  const observed=learningClamp(days/100),denom=Math.max(days,1);
  const subject=Object.fromEntries(ids.map(id=>[id,.5*(1-observed)+observed*learningClamp(touches[id]/Math.max(days/14,1))]));
  const coverage=ids.reduce((sum,id)=>sum+subject[id],0)/ids.length;
  const sustained=.5*(1-observed)+observed*effort/denom;
  const wellness=.5*(1-observed)+observed*health/denom;
  const consistency=.5*(1-observed)+observed*consistent/denom;
  const quality=learningClamp(.32*sustained+.30*coverage+.25*wellness+.13*consistency);
  const resilience=learningClamp(.65*quality+.25*learningClamp(g.attrs.mindset/100)+.10*learningClamp(g.attrs.stamina/100));
  return {days:Math.round(days),quality,coverage,effort:sustained,wellness,consistency,subject,resilience,badChance:.005+.18*Math.pow(1-resilience,3)};
}
function learningExam(g,abilities,ids,random=()=>learningRandom(g),preparation=learningPreparation(g)){
  const p=preparation,roll=random(),bad=roll<p.badChance,good=!bad&&roll>1-(.03+.07*p.quality);
  const centered=()=>random()+random()+random()-1.5;
  const shared=centered()*(.012+.035*(1-p.resilience));
  const shock=bad?-(.10+.12*random()):good?.025+.025*random():0;
  const subjects={};
  for(const id of ids){
    const prep=p.subject[id]??.5;
    const mean=.90+.065*p.quality+.025*prep+.01*learningClamp(g.attrs.insight/100);
    const dayState=.008*(learningHealth(g)-.5);
    const noise=centered()*(.010+.025*(1-prep));
    subjects[id]=Math.round(learningClamp(abilities[id]*(mean+shared+shock+dayState+noise),0,campusMax(id))*100)/100;
  }
  return {subjects,preparation:p,performance:bad?'失常发挥':good?'超常发挥':'正常波动'};
}
function learningSummary(g){
  const p=learningPreparation(g);
  return `近百天已记录 ${p.days} 天 · 综合准备 ${Math.round(p.quality*100)}/100。轮换复习有助于保持知识，休息和运动有助于稳定发挥；能力值不等于高考成绩。`;
}
