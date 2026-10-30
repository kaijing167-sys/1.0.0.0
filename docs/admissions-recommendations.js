// Historical school scores help choose; only the current program catalog decides admission.
const admissionsReferenceIndex=new Map(ADMISSIONS_REFERENCE_2024.rows.map(r=>[[r.school,r.category,r.degree].map(admissionsNormalize).join('|'),r]));
const admissionsRecommendationBands=[{id:'reach',name:'冲刺',hint:'接近参考线，谨慎冲一冲',target:0},{id:'match',name:'稳妥',hint:'保留一定分差，稳一稳',target:20},{id:'safe',name:'保底',hint:'分差更充足，保一保',target:45}];
let admissionsRecommendedRows=[];
function buildAdmissionsRecommendations(player){
 const empty=Object.fromEntries(admissionsRecommendationBands.map(b=>[b.id,[]]));
 if(!player||!Number.isFinite(player.total))return empty;
 const score=Math.floor(player.total),category=player.rank?.category||(Object.hasOwn(player.subjects,'physics')?'physics':'history'),selected=Object.keys(player.subjects),candidates=[];
 for(const school of HENAN_2025_ADMISSIONS.schools){
  for(const p of admissionsPrograms(school,category)){
   const history=admissionsReferenceIndex.get([school.name,category,p.degree].map(admissionsNormalize).join('|'));
   if(!history||(school.institutionCode&&String(school.institutionCode)!==history.code)||!p.requires.every(k=>selected.includes(k)))continue;
   if(p.restriction&&/性别|色盲|色弱|身高|体检|外语语种|面试|视力/.test(p.restriction))continue;
   const control=p.degree==='junior'?185:category==='physics'?427:471;
   if(score<control)continue;
   const historicalMargin=score-history.score,currentMargin=score-p.minScore,margin=Math.min(historicalMargin,currentMargin);
   const band=margin>=30?'safe':margin>=10?'match':margin>=-15?'reach':null;if(!band)continue;
   candidates.push({school:school.name,major:p.major,program:p,history,band,margin,historicalMargin,currentMargin,score,category,institution:history.code});
  }
 }
 const used=new Set();
 for(const band of admissionsRecommendationBands){
  const sorted=candidates.filter(r=>r.band===band.id).sort((a,b)=>Number(a.program.degree==='junior')-Number(b.program.degree==='junior')||Math.abs(a.margin-band.target)-Math.abs(b.margin-band.target)||a.school.localeCompare(b.school,'zh-CN')||a.major.localeCompare(b.major,'zh-CN'));
  for(const row of sorted){if(used.has(row.institution))continue;empty[band.id].push(row);used.add(row.institution);if(empty[band.id].length===3)break;}
 }
 return empty;
}
function admissionsRecommendationsHtml(player){
 const groups=buildAdmissionsRecommendations(player);admissionsRecommendedRows=[];
 const choices=admissionsChoices(),empty=Math.max(0,choices.findIndex(c=>!c.school&&!c.major));
 return `<section class="final-card recommendation-section"><div class="recommendation-heading"><div><p class="eyebrow">下一站 · 为你选校</p><h2>先看看这 9 个志愿方向</h2></div><label>推荐填入<select id="recommendation-target">${Array.from({length:5},(_,i)=>`<option value="${i}" ${i===empty?'selected':''}>第 ${i+1} 志愿</option>`).join('')}</select></label></div><p>2024 年院校录取线供参考，配套专业依据当前选科匹配；提交志愿后，仍按 2025 年专业数据与现有规则模拟录取。</p><p class="recommendation-note">按两年分差中较小的一项分层：冲刺 −15～9 分，稳妥 10～29 分，保底 30 分及以上。不同年份的考试类别、难度和招生计划存在变化，这只是游戏选填建议，不代表录取概率或保证录取。</p><div class="recommendation-columns">${admissionsRecommendationBands.map(b=>`<section class="recommendation-band recommendation-${b.id}"><header><span>${b.name}</span><h3>${b.hint}</h3><small>${groups[b.id].length} / 3 所</small></header>${Array.from({length:3},(_,i)=>{
 const row=groups[b.id][i];if(!row)return `<article class="recommendation-card recommendation-missing"><b>暂无合适的${b.name}推荐</b><p>当前分数、选科或已核实数据不足，不以其他档次学校补位。</p></article>`;
 const index=admissionsRecommendedRows.push(row)-1;
 return `<article class="recommendation-card"><span class="recommendation-card-label">${b.name}</span><h4>${escapeHtml(row.school)}</h4><p class="recommendation-major">${escapeHtml(row.major)}</p><div class="recommendation-tags">${typeof admissionsSchoolTags==='function'?admissionsSchoolTags(universityProfile(row.school)||{name:row.school}):''}</div><dl><div><dt>2024 院校参考线</dt><dd>${formatExamScore(row.history.score)} 分</dd></div><div><dt>2025 专业录取线</dt><dd>${formatExamScore(row.program.minScore)} 分</dd></div></dl><p class="recommendation-condition">选科符合 · ${row.program.degree==='junior'?'专科':'本科'}${row.program.group?' · 专业组 '+escapeHtml(row.program.group):''}</p>${row.currentMargin<0?'<p class="recommendation-risk">当前分数低于 2025 专业线，直接填报有未录取风险。</p>':row.currentMargin===0?'<p class="recommendation-risk">与 2025 专业线同分，按现有规则结果待定。</p>':''}<p class="recommendation-sources">${admissionsSourceLink(row.history.source,'2024 数据来源')} · ${admissionsSourceLink(row.program.source,'2025 专业来源')}</p><button type="button" class="ghost-button" data-recommendation-pick="${index}">选填这所大学与专业 →</button></article>`;
 }).join('')}</section>`).join('')}</div><p class="recommendation-note">2024 年接口公布的是院校录取线，不能替代专业线；2025 年专业名称、选科要求与分数独立保留。推荐不足时显示空位。</p><p id="recommendation-status" role="status" aria-live="polite"></p></section>`;
}
function fillAdmissionsRecommendation(index){
 const row=admissionsRecommendedRows[index],slot=Number($('#recommendation-target')?.value);
 if(!row||!game?.completed||!Number.isInteger(slot)||slot<0||slot>4)return;
 const old=admissionsChoices()[slot];
 if((old.school||old.major)&&(old.school!==row.school||old.major!==row.major)&&!confirm('第 '+(slot+1)+' 志愿已有内容，是否替换为推荐的大学与专业？'))return;
 $('#admissions-school-'+slot).value=row.school;
 saveAdmissionsField({dataset:{admissionsIndex:String(slot),admissionsField:'school'},value:row.school});
 saveAdmissionsField({dataset:{admissionsIndex:String(slot),admissionsField:'major'},value:row.major});
 $('#recommendation-status').textContent='已将 '+row.school+' · '+row.major+' 填入第 '+(slot+1)+' 志愿。';
 $('#admissions-school-'+slot).scrollIntoView?.({behavior:'smooth',block:'center'});
 $('#admissions-school-'+slot).focus({preventScroll:true});
}
document.addEventListener('click',e=>{const b=e.target.closest('button[data-recommendation-pick]');if(b&&!b.disabled)fillAdmissionsRecommendation(Number(b.dataset.recommendationPick));});
