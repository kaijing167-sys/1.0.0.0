// Custom character curriculum: nine subjects in year one, then 3+1+2.
function courseSubjectIcon(key){
  const shapes={
    physics:'<ellipse cx="16" cy="16" rx="13" ry="5"/><ellipse cx="16" cy="16" rx="13" ry="5" transform="rotate(60 16 16)"/><ellipse cx="16" cy="16" rx="13" ry="5" transform="rotate(120 16 16)"/><circle cx="16" cy="16" r="1.5" fill="currentColor" stroke="none"/>',
    history:'<path d="M9 6h15v20H10a4 4 0 0 1-4-4V9a3 3 0 0 1 6 0v13H6m6 4h14M16 11h5m-5 5h5"/>',
    chemistry:'<path d="M12 4h8m-6 0v9L6 25a2 2 0 0 0 2 3h16a2 2 0 0 0 2-3l-8-12V4M10 20h12"/><circle cx="16" cy="24" r="1" fill="currentColor" stroke="none"/>',
    biology:'<path d="M7 27C5 13 13 5 27 5c0 15-7 24-20 22Zm0 0L22 11m-9 10v-6m0 6h6"/>',
    politics:'<path d="M16 5v21m-8 2h16M6 10h20M8 10 3 21h10L8 10Zm16 0-5 11h10l-5-11Z"/><circle cx="16" cy="6" r="2"/>',
    geography:'<circle cx="16" cy="16" r="12"/><ellipse cx="16" cy="16" rx="5" ry="12"/><path d="M4 16h24M6 10h20M6 22h20"/>'
  };
  return `<svg class="course-subject-icon" viewBox="0 0 32 32" fill="none" stroke="currentColor" stroke-width="1.3" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${shapes[key]||''}</svg>`;
}
function curriculumKeys(g){return g.curriculum_selected?['chinese','math','english',...g.subject_combination]:CAMPUS_SUBJECTS.map(([k])=>k)}
function customDraftSubjects(){return draft.stage==='high1'?CAMPUS_SUBJECTS.map(([k])=>k):['chinese','math','english',...campusClass(draft.class_id).subjects]}
function chooseCustomStage(stage){
  draft.stage=stage;
  if(stage==='high1'){draft.class_id=4;prepareCustomAttributes(stage);return;}
  let selected=draft.class_id||4;
  function draw(){openModal(`<section class="course-flow"><p class="course-eyebrow">我的高中 / 选择班级</p><h2>找到你的新班级</h2><p>${START_STAGES[stage].label}，沿用原有班级与选科组合。</p><div class="course-classes">${CAMPUS_CLASSES.map(c=>`<button class="course-option ${selected===c.id?'is-selected':''}" data-course-class="${c.id}" aria-pressed="${selected===c.id}"><small>${c.id} 班</small><strong>${c.combo}</strong><span>${c.level}</span></button>`).join('')}</div><div class="course-footer"><button class="ghost-button" data-course-stage-back>← 重选年级</button><button class="primary-button" data-course-class-next>下一步：开局能力 →</button></div></section>`,false);}
  draw();
  courseHandler=b=>{if(b.dataset.courseClass){selected=Number(b.dataset.courseClass);draw();}if(b.hasAttribute('data-course-stage-back')){closeModal(true);menuScreen='stages';render();}if(b.hasAttribute('data-course-class-next')){draft.class_id=selected;draft.track=campusClass(selected).subjects.includes('physics')?'science':'humanities';closeModal(true);prepareCustomAttributes(stage);}};
}
let courseHandler=null;
function openCurriculumPicker(){
  if(!game?.custom_curriculum||game.curriculum_selected)return;
  let step=1,primary=null,extras=[];
  const label=k=>CAMPUS_SUBJECTS.find(s=>s[0]===k)[1];
  function draw(){
    openModal(`<section class="course-flow"><p class="course-eyebrow">高一 → 高二 / 我的选科志愿</p><div class="course-progress"><span class="${step===1?'active':''}">01 首选科目</span><i></i><span class="${step===2?'active':''}">02 再选科目</span></div><h2>${step===1?'选择你想深入的方向':'再选两科，拼出你的未来'}</h2><p>${step===1?'物理、历史，选择其中一科。':'从化学、生物、政治、地理中选择两科。'}确认后将沿用至高二、高三和百日冲刺。</p><div class="course-required"><small>共同必修 · 3</small><div>${['语文','数学','英语'].map(s=>`<span>${s}<b>必修</b></span>`).join('')}</div></div><div class="course-section-title"><b>${step===1?'首选科目 · 1':'再选科目 · 2'}</b><small>${step===1?(primary?'已选 1 / 1':'已选 0 / 1'):'已选 '+extras.length+' / 2'}</small></div><div class="course-options">${(step===1?['physics','history']:['chemistry','biology','politics','geography']).map(k=>{const on=step===1?primary===k:extras.includes(k);return `<button class="course-option ${on?'is-selected':''}" data-course-subject="${k}" aria-pressed="${on}" ${step===2&&extras.length===2&&!on?'disabled':''}><small>${on?'✓ 已选择':'点击选择'}</small>${courseSubjectIcon(k)}<strong>${label(k)}</strong><span>${({physics:'探索规律，理解世界',history:'回望过去，理解时代',chemistry:'物质变化中的答案',biology:'认识生命的奥秘',politics:'关注社会与思辨',geography:'读懂山川与人间'})[k]}</span></button>`}).join('')}</div><div class="course-summary"><small>你的 3 + 1 + 2 组合</small><p>语文 · 数学 · 英语 <em>＋</em> ${primary?label(primary):'待选'} <em>＋</em> ${extras.length?extras.map(label).join(' · '):'待选两科'}</p></div><div class="course-footer">${step===2?'<button class="ghost-button" data-course-prev>← 返回首选科目</button>':'<small>兴趣与擅长，都值得认真考虑。</small>'}<button class="primary-button" data-course-next ${step===1?!primary?'disabled':'':extras.length!==2?'disabled':''}>${step===1?'下一步：再选两科 →':'确认组合，进入高二 →'}</button></div><p class="course-hint" role="status">${step===2&&extras.length===2?'已选满两科，点击已选科目可取消并更换。':''}</p></section>`,false);
  }
  draw();
  courseHandler=b=>{
    if(b.dataset.courseSubject){const k=b.dataset.courseSubject;if(step===1&&['physics','history'].includes(k))primary=k;else if(step===2&&['chemistry','biology','politics','geography'].includes(k)){if(extras.includes(k))extras=extras.filter(s=>s!==k);else if(extras.length<2)extras.push(k);}draw();}
    if(b.hasAttribute('data-course-prev')){step=1;draw();}
    if(b.hasAttribute('data-course-next')){if(step===1&&primary){step=2;draw();}else if(step===2&&primary&&extras.length===2){game.subject_combination=[primary,...extras];game.curriculum_selected=true;game.track=primary==='physics'?'science':'humanities';if(game.tutoring?.subject!=='none'&&!curriculumKeys(game).includes(game.tutoring.subject))game.tutoring.subject='none';addLog('完成 3+1+2 选科：'+curriculumKeys(game).map(label).join('、')+'。');persist();closeModal(true);courseHandler=null;advanceWeek();}}
  };
}
document.addEventListener('click',e=>{const b=e.target.closest('button');if(!b||b.disabled)return;if(b.matches('[data-course-class],[data-course-stage-back],[data-course-class-next],[data-course-subject],[data-course-prev],[data-course-next]'))courseHandler?.(b);});

