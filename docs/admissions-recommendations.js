// Historical reference only while choosing. Future thresholds are used only by the evaluator.
const admissionsReferenceIndex=new Map(ADMISSIONS_REFERENCE_2024.rows.map(r=>[[r.school,r.category,r.degree].map(admissionsNormalize).join('|'),r]));
const admissionsRecommendationBands=[{id:'reach',name:'冲刺',hint:'留一点向上的可能',target:0},{id:'match',name:'稳妥',hint:'让选择更有把握',target:20},{id:'safe',name:'保底',hint:'给下一站留好余地',target:45}];
let admissionsRecommendedRows=[];
function buildAdmissionsRecommendations(player){
 const groups=Object.fromEntries(admissionsRecommendationBands.map(b=>[b.id,[]]));
 if(!player||!Number.isFinite(player.total))return groups;
 const score=Math.floor(player.total),category=player.rank?.category||(Object.hasOwn(player.subjects,'physics')?'physics':'history'),selected=Object.keys(player.subjects),candidates=[];
 for(const school of HENAN_2025_ADMISSIONS.schools)for(const p of admissionsPrograms(school,category)){
  const history=admissionsHistoricalReference(school.name,category,p.degree);
  if(!history||(school.institutionCode&&String(school.institutionCode)!==history.code)||!p.requires.every(k=>selected.includes(k)))continue;
  if(p.restriction&&/性别|色盲|色弱|身高|体检|外语语种|面试|视力/.test(p.restriction))continue;
  if(score<(p.degree==='junior'?185:category==='physics'?396:428))continue;
  const margin=score-history.score,band=margin>=30?'safe':margin>=10?'match':margin>=-15?'reach':null;
  if(band)candidates.push({school:school.name,major:p.major,program:p,history,band,margin,historicalMargin:margin,score,category,institution:history.code});
 }
 const used=new Set();
 for(const band of admissionsRecommendationBands){
  const sorted=candidates.filter(r=>r.band===band.id).sort((a,b)=>Number(a.program.degree==='junior')-Number(b.program.degree==='junior')||Math.abs(a.margin-band.target)-Math.abs(b.margin-band.target)||a.school.localeCompare(b.school,'zh-CN')||a.major.localeCompare(b.major,'zh-CN'));
  for(const r of sorted){if(used.has(r.institution))continue;groups[band.id].push(r);used.add(r.institution);if(groups[band.id].length===3)break;}
 }
 return groups;
}

function admissionsHistoricalReference(school,category,degree){return admissionsReferenceIndex.get([school,category,degree].map(admissionsNormalize).join('|'));}
function admissionsReferenceCatalogHtml(choices,category){
 const schools=[...new Set(choices.map(c=>admissionsSchool(c.school)).filter(Boolean))];
 return `<details class="final-card admissions-catalog"><summary>查看已选院校的参考线与专业</summary><p>以下仅展示 2024 年院校参考线。院校参考线不代表专业线，本次录取线将在结果公布后揭晓。</p>${schools.map(s=>`<h3>${escapeHtml(s.name)}</h3>${['undergraduate','junior'].map(degree=>{const r=admissionsHistoricalReference(s.name,category,degree);return r?`<p>2024 ${degree==='junior'?'专科':'本科'}院校参考线：${formatExamScore(r.score)} 分</p>`:'';}).join('')}<ul>${admissionsPrograms(s,category).map(p=>`<li>${escapeHtml(p.major)} · ${admissionsRequirements(p)}</li>`).join('')}</ul>`).join('')||'<p>选好大学后即可查看参考信息。</p>'}</details>`;
}

function admissionsRecommendationsHtml(player){
 const groups=buildAdmissionsRecommendations(player);admissionsRecommendedRows=[];
 const choices=admissionsChoices(),empty=Math.max(0,choices.findIndex(c=>!c.school&&!c.major));
 return `<section class="final-card recommendation-section"><div class="recommendation-heading"><div><p class="eyebrow">志愿参考册 · 2024</p><h2>先选方向，再写志愿</h2><p class="recommendation-intro">三所冲刺，三所稳妥，三所保底。为你的下一站，多留几种可能。</p></div><label>选填位置<select id="recommendation-target">${Array.from({length:5},(_,i)=>`<option value="${i}" ${i===empty?'selected':''}>第 ${i+1} 志愿</option>`).join('')}</select></label></div><div class="recommendation-context"><span>你的成绩 <strong>${formatExamScore(player.total)}</strong> 分</span><span>仅展示 2024 院校参考线</span><span>本次录取线尚未公布</span></div><div class="recommendation-columns">${admissionsRecommendationBands.map((b,bi)=>`<section class="recommendation-band recommendation-${b.id}"><header><div class="recommendation-band-title"><span>${b.name}</span><small>${groups[b.id].length} / 3 所</small></div><h3>${b.hint}</h3></header>${Array.from({length:3},(_,i)=>{
 const row=groups[b.id][i];if(!row)return `<article class="recommendation-card recommendation-missing"><span class="recommendation-card-label">${b.name}</span><h4>暂缺合适的选择</h4><p>当前分数或选科下，暂无足够参考数据。你也可以在下方完整列表自行选填。</p></article>`;
 const index=admissionsRecommendedRows.push(row)-1;
 return `<article class="recommendation-card"><div class="recommendation-card-top"><span class="recommendation-card-label">${b.name}</span><span class="recommendation-card-number">${String(bi*3+i+1).padStart(2,'0')}</span></div><h4>${escapeHtml(row.school)}</h4><p class="recommendation-major">${escapeHtml(row.major)}</p><div class="recommendation-tags">${typeof admissionsSchoolTags==='function'?admissionsSchoolTags(universityProfile(row.school)||{name:row.school}):''}</div><div class="recommendation-score"><span>2024 院校参考线</span><strong>${formatExamScore(row.history.score)}<small> 分</small></strong><p>${row.margin>=0?'你的成绩高出 '+row.margin+' 分':'你的成绩低于参考线 '+Math.abs(row.margin)+' 分'}</p></div><p class="recommendation-condition">${row.program.degree==='junior'?'专科':'本科'} · 选科符合 · 院校线不代表专业线</p><button type="button" class="ghost-button" data-recommendation-pick="${index}">选填大学与专业 <span aria-hidden="true">↗</span></button></article>`;
 }).join('')}</section>`).join('')}</div><p class="recommendation-note">冲稳保仅依据你的成绩与 2024 院校参考线的分差划分。历史分数不能保证录取，专业线和最终去向将在录取结果中揭晓。</p><p id="recommendation-status" role="status" aria-live="polite"></p></section>`;
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
