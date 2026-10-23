const schoolClasses = [
  {id:2,name:'2班',combination:'物化生',level:'尖子班',subjects:['physics','chemistry','biology'],track:'science',size:30},
  {id:4,name:'4班',combination:'物化生',level:'普通班',subjects:['physics','chemistry','biology'],track:'science',size:30},
  {id:7,name:'7班',combination:'物化政',level:'普通班',subjects:['physics','chemistry','politics'],track:'science',size:30},
  {id:8,name:'8班',combination:'物化地',level:'普通班',subjects:['physics','chemistry','geography'],track:'science',size:30},
  {id:11,name:'11班',combination:'政史地',level:'尖子班',subjects:['politics','history','geography'],track:'arts',size:30},
  {id:13,name:'13班',combination:'政史地',level:'普通班',subjects:['politics','history','geography'],track:'arts',size:30},
  {id:14,name:'14班',combination:'史政生',level:'普通班',subjects:['history','politics','biology'],track:'arts',size:30}
];
const SchoolRules = {
  find(id) { return schoolClasses.find(item => item.id === id); },
  apply(state, id) {
    const target=this.find(id);
    if (!target || state.version !== 2) throw new Error('请先选择角色和有效班级。');
    state.class_id=id;
    state.subject_combination=[...target.subjects];
    state.track=target.track;
    return state;
  },
  normalize(state) {
    if (state.version===2 && !state.class_id) {
      const character=characterCatalog.find(item=>item.id===state.character_id);
      if(character) this.apply(state,character.initial_state.class_id);
    }
    return state;
  },
  size(id,state) {
    const base=this.find(id).size;
    const character=characterCatalog.find(item=>item.id===state.character_id);
    if(!character || !state.class_id) return base;
    const original=character.initial_state.class_id;
    return base;
  }
};
function currentClass(){return SchoolRules.find(state.class_id);}
function classLabel(){const c=currentClass();return c?c.name+' · '+c.combination+' '+c.level:'';}
function classesPage(){
  return title('我的班级','全校 7 个班，共 210 人。选择适合自己的学习方向。')+
    '<p class="page-intro">'+(currentClass()?'当前：'+classLabel():'先在角色选择中选择一位人物，即可选择或更换班级。')+
    ' 换班保留已有科目能力、进度和物品，考试改按新班级选科计分。</p><div class="character-grid">'+
    schoolClasses.map(c=>{
      const known=characterCatalog.filter(p=>(p.id===state.character_id?state.class_id:p.initial_state.class_id)===c.id);
      const size=SchoolRules.size(c.id,state);
      return '<section class="panel"><h2>'+c.name+' · '+c.combination+'</h2><p>'+c.level+' · 当前 '+size+' 人（默认 '+c.size+' 人）</p>'+
      '<p>已录入人物：'+(known.map(p=>escapeText(p.name)).join('、')||'暂无')+'</p>'+
      '<p class="sub">其余 '+Math.max(0,size-known.length)+' 位同学待补充人物资料。</p>'+
      '<button class="primary" data-transfer-class="'+c.id+'" '+(!state.character_id||state.class_id===c.id||state.graduated?'disabled':'')+'>'+
      (state.class_id===c.id?'当前班级':'转入此班')+'</button></section>';
    }).join('')+'</div>';
}
function transferClass(id){
  if(!state.character_id||state.graduated||state.class_id===id)return;
  const c=SchoolRules.find(id);
  if(!c||!confirm('转入'+c.name+'（'+c.combination+' '+c.level+'）？已有属性和进度保留，后续考试按新选科计分。'))return;
  SchoolRules.apply(state,id);
  log('转入'+classLabel()+'。');
  commit('已转入'+classLabel()+'。');
}
document.addEventListener('click',event=>{
  const button=event.target.closest('button');
  if(button&&!button.disabled&&button.dataset.transferClass)transferClass(Number(button.dataset.transferClass));
});
