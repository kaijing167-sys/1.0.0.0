// Abilities are a baseline; preparation and shared/subject exam fluctuations determine scores.
function formatExamScore(value){return Number.isFinite(value)?String(Math.round(value*2)/2):'—'}
function henanRank(total,category){
  const table=HENAN_2025_RANKS.categories[category];
  if(!table||!Number.isFinite(total))return null;
  const score=Math.floor(total),rows=table.rows;
  const [top,topCount]=rows[0], [bottom,bottomCount]=rows[rows.length-1];
  if(score>=top)return {category,score,cumulative:topCount,start:1,end:topCount,kind:'top',label:table.label};
  if(score<bottom)return {category,score,cumulative:null,start:bottomCount+1,end:null,kind:'below',label:table.label};
  let higher=0;
  for(const [points,cumulative] of rows){
    if(points>score){higher=cumulative;continue;}
    if(points===score)return {category,score,cumulative,start:higher+1,end:cumulative,kind:'exact',label:table.label};
    return {category,score,cumulative:higher,start:null,end:null,kind:'empty',label:table.label};
  }
  return null;
}
function gaokaoRankText(rank){
  if(!rank)return '暂无对应数据';
  if(rank.kind==='below')return `未公布（100 分以下，${rank.start.toLocaleString()} 名起）`;
  if(rank.kind==='empty')return `累计 ${rank.cumulative.toLocaleString()} 人（该分无考生）`;
  return `${rank.cumulative.toLocaleString()}${rank.kind==='top'?'（最高公布分段）':''}`;
}
function buildGaokaoReport(g){
  // Legacy custom saves used two aggregate subjects; expand them using existing class rules.
  const state={...g,subjects:{...g.subjects}};
  if(!state.class_id)campusAssign(state,state.track==='humanities'?13:4);
  const preparation=learningPreparation(g);
  for(const id of ["physics","chemistry","biology"])preparation.subject[id]??=preparation.subject.science??.5;
  for(const id of ["history","politics","geography"])preparation.subject[id]??=preparation.subject.humanities??.5;
  const rows=campusMembers(state).map(person=>{
    const cls=campusClass(person.class_id);
    const selected=person.active&&g.custom_curriculum?curriculumKeys(g):['chinese','math','english',...cls.subjects];
    const abilities=Object.fromEntries(selected.map(id=>[id,person.subjects[id]]));
    // NPCs have no recorded player history; use neutral preparation and their own attributes.
    const candidate=person.active?g:{...state,attrs:person.attrs,energy:60,stress:40,mood:60};
    const prep=person.active?preparation:{...preparation,quality:.5,resilience:.5,subject:{},badChance:.0275};
    const exam=g.completed?{subjects:{...abilities},performance:"历史成绩",preparation:null}:learningExam(candidate,abilities,selected,()=>learningRandom(g),prep);
    const subjects=Object.fromEntries(Object.entries(exam.subjects).map(([id,value])=>[id,Math.round(value*2)/2]));
    const selectedElectives=selected.filter(id=>GRADE_SCORE_RULES.subjects.includes(id));
    const extraAbilities=Object.fromEntries(GRADE_SCORE_RULES.subjects.map(id=>[id,person.subjects[id]??g.subjects[id]??50]));
    const extraExam=g.completed?{subjects:extraAbilities}:learningExam(candidate,extraAbilities,GRADE_SCORE_RULES.subjects,()=>learningRandom(g),prep);
    const reselectionRaw=Object.fromEntries(GRADE_SCORE_RULES.subjects.map(id=>[id,Math.round((subjects[id]??extraExam.subjects[id])*2)/2]));
    const total=Object.values(subjects).reduce((sum,value)=>sum+value,0);
    const category=selected.includes('physics')?'physics':'history';
    return {id:person.id,name:person.name,class_id:cls.id,combination:person.active&&g.custom_curriculum?g.subject_combination.map(id=>CAMPUS_SUBJECTS.find(s=>s[0]===id)[1]).join(""):cls.combo,active:!!person.active,abilities,performance:exam.performance,preparation:person.active&&!g.completed?preparation:undefined,calibration:exam.calibration,subjects,total,selectedElectives,reselectionRaw,rank:henanRank(total,category)};
  });
  if(!g.completed)assignGaokaoGrades(rows);
  for(const row of rows)row.rank=henanRank(row.total,Object.hasOwn(row.subjects,'physics')?'physics':'history');
  rows.sort((a,b)=>b.total-a.total||a.class_id-b.class_id||a.id.localeCompare(b.id));
  return {version:g.completed?1:3,model:g.completed?"legacy-preserved":"reselected-grades-v1",year:2025,day:g.day,rows};
}
function gaokaoResultsTable(report){
  const player=report.rows.find(p=>p.active);
  const rank=player?.rank;
  if(!player)return '';
  return `<section class="final-card gaokao-report" aria-labelledby="gaokao-report-title">
    <h2 id="gaokao-report-title">我的高考成绩单</h2>
    <p>这是属于 ${escapeHtml(player.name)} 的答卷。${report.version>=2?"学科能力、近期准备和当天状态共同形成卷面分；新结算的两门再选科目经等级转换后计入总分。":"这是旧版已结算的历史成绩，保留原结果。"}</p>
    ${player?`<p class="gaokao-player-summary"><b>${escapeHtml(player.name)} · ${player.combination} · 总分 ${formatExamScore(player.total)}</b><br>2025 ${rank?.label||''}参考位次：${gaokaoRankText(rank)}${rank?.kind==='exact'?`；同分位次范围 ${rank.start.toLocaleString()}—${rank.end.toLocaleString()} 名`:rank?.kind==='top'?`；最高公布分段范围 1—${rank.end} 名`:''}</p>`:''}
    <p class="gaokao-rank-note" id="gaokao-rank-note">参考位次采用 2025 年同类别分数段统计，物理类、历史类分别查询；小数总分向下取整，超出公开范围不推算。位次仅作游戏参考。</p>
    ${player.preparation?`<p>已记录近百天中的 ${player.preparation.days} 天；综合准备 ${Math.round(player.preparation.quality*100)}/100，复习覆盖 ${Math.round(player.preparation.coverage*100)}/100，身心状态 ${Math.round(player.preparation.wellness*100)}/100。${player.performance}，本次失常事件概率约 ${(player.preparation.badChance*100).toFixed(1)}%。缺少记录的时段按中性处理。</p>`:""}
    ${player.calibration?`<p>分档校准模型：能力与准备掌握估分 ${formatExamScore(player.calibration.rawTotal)}，特殊发挥修正后 ${formatExamScore(player.calibration.adjustedTotal)}；再结合当天状态映射到一分一段表。</p>`:""}
    ${report.version>=3?'<p class="gaokao-grade-note">计分方式：语文、数学、英语及物理／历史使用原始分；其余两科按 A—E 等级赋分后计入总分。等级比例依次约为 15%、35%、35%、13%、2%，对应 86—100、71—85、56—70、41—55、30—40 分。同科参考群体来自本局模拟考生，属于游戏模拟赋分。</p>':''}
    <dl class="personal-subjects" aria-label="我的六科成绩">${CAMPUS_SUBJECTS.filter(([id])=>Object.hasOwn(player.subjects,id)).map(([id,label])=>`<div><dt>${label}</dt><dd><strong>${formatExamScore(player.subjects[id])}</strong><span> / ${campusMax(id)}${player.gradeDetails?.[id]?` · 卷面 ${formatExamScore(player.rawSubjects[id])} · ${player.gradeDetails[id].grade} 级赋分`:player.gradeAssignment?" · 原始分":""}${player.abilities?` · 考前能力 ${formatExamScore(player.abilities[id])}`:""}</span></dd></div>`).join('')}</dl>
    ${report.version>=3?`<h3>四选二科目成绩对照</h3><p class="gaokao-grade-note">以下展示化学、生物、政治、地理四科的卷面分与模拟赋分。标注“计入总分”的两科参与总分；另两科仅作对照。</p><dl class="personal-subjects elective-score-comparison" aria-label="四门再选科目原始分和赋分">${GRADE_SCORE_RULES.subjects.map(id=>{const detail=player.reselectionDetails?.[id],label=CAMPUS_SUBJECTS.find(s=>s[0]===id)[1];return detail?`<div><dt>${label}${detail.selected?' · 计入总分':' · 未选'}</dt><dd><strong>卷面 ${formatExamScore(detail.raw)}</strong><span>赋分 ${detail.grade} 级 · ${formatExamScore(detail.score)}</span></dd></div>`:''}).join('')}</dl>`:''}
    <p class="gaokao-source">数据来源：<a href="${HENAN_2025_RANKS.source}" target="_blank" rel="noopener noreferrer">2025 年参考分数段资料</a> · <a href="${HENAN_2025_RANKS.categories.physics.pdf}" target="_blank" rel="noopener noreferrer">物理类原表</a> · <a href="${HENAN_2025_RANKS.categories.history.pdf}" target="_blank" rel="noopener noreferrer">历史类原表</a></p>
  </section>`;
}
function calculateGaokao(event){
  if(game.completed)return;
  game.gaokaoReport??=buildGaokaoReport(game);
  const score=game.gaokaoReport.rows.find(p=>p.active).total;
  game.examResults.push({day:game.day,title:event.title,score,subjects:{...game.gaokaoReport.rows.find(p=>p.active).subjects}});
  markEventResolved(event.id);
  addLog(`高考成绩：${formatExamScore(score)} 分（实际考试成绩，能力与发挥分开计算）。`);
  completeGame(score);
}



