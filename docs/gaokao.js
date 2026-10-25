// Final scores are the six subject abilities, with no exam performance modifiers.
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
  const rows=campusMembers(state).map(person=>{
    const cls=campusClass(person.class_id);
    const selected=['chinese','math','english',...cls.subjects];
    const subjects=Object.fromEntries(selected.map(id=>[id,person.subjects[id]]));
    const total=Math.round(Object.values(subjects).reduce((sum,value)=>sum+value,0)*100)/100;
    const category=cls.subjects.includes('physics')?'physics':'history';
    return {id:person.id,name:person.name,class_id:cls.id,combination:cls.combo,active:!!person.active,subjects,total,rank:henanRank(total,category)};
  }).sort((a,b)=>b.total-a.total||a.class_id-b.class_id||a.id.localeCompare(b.id));
  return {version:1,year:2025,day:g.day,rows};
}
function gaokaoResultsTable(report){
  const player=report.rows.find(p=>p.active);
  const rank=player?.rank;
  if(!player)return '';
  return `<section class="final-card gaokao-report" aria-labelledby="gaokao-report-title">
    <h2 id="gaokao-report-title">我的高考成绩单</h2>
    <p>这是属于 ${escapeHtml(player.name)} 的答卷。各科成绩就是本局最终能力值，六科相加为高考总分。</p>
    ${player?`<p class="gaokao-player-summary"><b>${escapeHtml(player.name)} · ${player.combination} · 总分 ${player.total}</b><br>河南 2025 ${rank?.label||''}参考位次：${gaokaoRankText(rank)}${rank?.kind==='exact'?`；同分位次范围 ${rank.start.toLocaleString()}—${rank.end.toLocaleString()} 名`:rank?.kind==='top'?`；最高公布分段范围 1—${rank.end} 名`:''}</p>`:''}
    <p class="gaokao-rank-note" id="gaokao-rank-note">省位次取 2025 年河南同类别一分一段表的累计人数，物理类、历史类分别查询。小数总分向下取整查表，不插值；最高分段只显示公布范围，100 分以下不推算。官方统计含政策性照顾分，本游戏不另加分、不重复赋分，位次仅作游戏参考。</p>
    <dl class="personal-subjects" aria-label="我的六科成绩">${CAMPUS_SUBJECTS.filter(([id])=>Object.hasOwn(player.subjects,id)).map(([id,label])=>`<div><dt>${label}</dt><dd><strong>${player.subjects[id]}</strong><span> / ${campusMax(id)}</span></dd></div>`).join('')}</dl>
    <p class="gaokao-source">数据来源：<a href="${HENAN_2025_RANKS.source}" target="_blank" rel="noopener noreferrer">河南省教育考试院 2025 年分数段统计表</a> · <a href="${HENAN_2025_RANKS.categories.physics.pdf}" target="_blank" rel="noopener noreferrer">物理类原表</a> · <a href="${HENAN_2025_RANKS.categories.history.pdf}" target="_blank" rel="noopener noreferrer">历史类原表</a></p>
  </section>`;
}
function calculateGaokao(event){
  if(game.completed)return;
  game.gaokaoReport=buildGaokaoReport(game);
  const score=game.gaokaoReport.rows.find(p=>p.active).total;
  game.examResults.push({day:game.day,title:event.title,score,subjects:{...game.gaokaoReport.rows.find(p=>p.active).subjects}});
  markEventResolved(event.id);
  addLog(`高考成绩：${score} 分（各科最终能力之和）。`);
  completeGame(score);
}
