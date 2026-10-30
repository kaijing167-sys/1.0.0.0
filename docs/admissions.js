function admissionsPlayer(){return game?.gaokaoReport?.rows.find(p=>p.active)}
function admissionsNormalize(value){return String(value||'').trim().replace(/\s+/g,'').replace(/\(/g,'（').replace(/\)/g,'）')}
let admissionsSchoolIndex=null,admissionsSchoolIndexSource=null;
const admissionsProgramsCache=new WeakMap();
function admissionsSchool(name){
  if(admissionsSchoolIndexSource!==HENAN_2025_ADMISSIONS.schools){admissionsSchoolIndex=new Map();for(const s of HENAN_2025_ADMISSIONS.schools)for(const n of [s.name,...s.aliases||[]])admissionsSchoolIndex.set(admissionsNormalize(n),s);admissionsSchoolIndexSource=HENAN_2025_ADMISSIONS.schools;}
  return admissionsSchoolIndex.get(admissionsNormalize(name));
}
function admissionsPrograms(school,category){
  if(!school)return [];
  let cached=admissionsProgramsCache.get(school);if(!cached){cached={};admissionsProgramsCache.set(school,cached);}
  return cached[category]??=(school.groups||[]).filter(g=>g.category===category).flatMap(g=>g.programs.map(([major,minScore,meta={}])=>({major,minScore,requires:g.requires,group:g.group,degree:g.degree||'undergraduate',school:school.name,source:school.source,requirementsSource:school.requirementsSource||school.source,...meta})));
}
function admissionsProgramEvidence(p,reveal=false,category=''){
 const r=category?admissionsHistoricalReference(p.school,category,p.degree):null;
 return `<p>${p.degree==='junior'?'高职专科批':'普通本科批'} · ${admissionsRequirements(p)}</p>${reveal?`<p>本次专业录取线 ${formatExamScore(p.minScore)} 分</p>`:r?`<p>2024 院校参考线 ${formatExamScore(r.score)} 分（不代表专业线）</p>`:'<p>暂无已核实的 2024 院校参考线</p>'}${p.restriction?`<p>招生备注：${escapeHtml(p.restriction)}（额外条件未自动校验）</p>`:''}`;
}
function admissionsChoiceEvidence(school,major,category){const p=admissionsPrograms(admissionsSchool(school),category).find(p=>admissionsNormalize(p.major)===admissionsNormalize(major));return p?admissionsProgramEvidence(p,false,category):''}
let admissionsLoadPromise=null;
function loadAdmissionsCatalog(){
  if(HENAN_2025_ADMISSIONS.loaded)return Promise.resolve();
  if(admissionsLoadPromise)return admissionsLoadPromise;
  admissionsLoadPromise=(async()=>{
    const response=await fetch(HENAN_2025_ADMISSIONS.recordsUrl);
    if(!response.ok)throw Error('录取数据加载失败，请检查网络后重试');
    const bytes=new Uint8Array(await response.arrayBuffer());
    const stream=bytes[0]===31&&bytes[1]===139?new Blob([bytes]).stream().pipeThrough(new DecompressionStream('gzip')):new Blob([bytes]).stream();
    const data=await new Response(stream).json();
    if(data.version!==HENAN_2025_ADMISSIONS.version||!Array.isArray(data.schools))throw Error('数据版本不匹配，请刷新网页后重试');
    const count=data.schools.reduce((n,s)=>n+s.groups.reduce((m,g)=>m+g.programs.length,0),0);
    if(count!==HENAN_2025_ADMISSIONS.stats.programs)throw Error('录取数据不完整，请重试');
    HENAN_2025_ADMISSIONS.schools=data.schools;HENAN_2025_ADMISSIONS.loaded=true;
  })().catch(error=>{admissionsLoadPromise=null;throw error});
  return admissionsLoadPromise;
}
function admissionsLoadingHtml(error=''){
  $('#game-root').innerHTML=`<main id="main" class="final-screen"><div class="final-wrap"><section class="final-card" role="status"><h1>${error?'录取数据暂未载入':'正在载入志愿信息'}</h1><p>${escapeHtml(error||'首次进入需要下载专业数据，载入后即可使用院校与专业提示。')}</p><button class="ghost-button" data-admissions-page="scores">返回我的成绩</button>${error?'<button class="primary-button" data-admissions-page="choices">重试加载</button>':''}</section></div></main>`;
}
function admissionsChoices(){
  return Array.from({length:5},(_,i)=>({school:String(game.admissions?.choices?.[i]?.school||''),major:String(game.admissions?.choices?.[i]?.major||''),adjustment:game.admissions?.choices?.[i]?.adjustment===true}));
}
function evaluateAdmissions(player,choices){
  const rows=choices.map((choice,index)=>({...choice,index:index+1}));
  const errors=[],seen=new Set();
  if(choices.length!==5)errors.push('请保留 5 个志愿位置。');
  if(!rows.some(c=>c.school.trim()||c.major.trim()))errors.push('至少填写 1 个完整志愿，其余位置可留空。');
  for(const row of rows){
    if(!!row.school.trim()!==!!row.major.trim())errors.push(`第 ${row.index} 志愿请同时填写大学和专业。`);
    if(!row.school.trim()||!row.major.trim())continue;
    const key=(admissionsSchool(row.school)?.name||admissionsNormalize(row.school))+'|'+admissionsNormalize(row.major);
    if(seen.has(key))errors.push(`第 ${row.index} 志愿与前面重复，请更换或留空。`);
    seen.add(key);
  }
  if(errors.length)return {status:'invalid',errors,rows:[]};
  if(!player||!Number.isFinite(player.total))return {status:'invalid',errors:['请先完成高考出分。'],rows:[]};
  const score=Math.floor(player.total),category=player.rank?.category||(Object.hasOwn(player.subjects,'physics')?'physics':'history');
  const selected=Object.keys(player.subjects),evaluated=[];
  let status='unplaced',admitted=null,stopped=false;
  for(const row of rows){
    if(!row.school.trim()){evaluated.push({...row,state:'blank',reason:'未填写'});continue;}
    if(stopped){evaluated.push({...row,state:'not-reviewed',reason:'前面的志愿已产生结果，不再检索'});continue;}
    const school=admissionsSchool(row.school);
    const program=admissionsPrograms(school,category).find(p=>admissionsNormalize(p.major)===admissionsNormalize(row.major));
    if(!program){
      const other=school?.completeOrdinaryCatalog&&school.groups.some(g=>g.category!==category&&g.programs.some(([m])=>admissionsNormalize(m)===admissionsNormalize(row.major)));
      if(other){evaluated.push({...row,state:'ineligible',reason:'已收录的该专业不招收你的首选科目类别'});continue;}
      evaluated.push({...row,state:'unknown',reason:'尚无该学校及专业的已核实数据，无法判断；请从已收录专业中选择'});
      status='pending';stopped=true;continue;
    }
    const detail={...row,program};
    if(row.adjustment===true&&(score<program.minScore||!program.requires.every(s=>selected.includes(s)))){
      const candidates=admissionsPrograms(school,category).filter(p=>p!==program&&p.degree===program.degree&&p.requires.every(s=>selected.includes(s))&&score>= (p.degree==='junior'?185:category==='physics'?427:471)&&score>p.minScore);
      candidates.sort((a,b)=>Number(b.group===program.group)-Number(a.group===program.group)||b.minScore-a.minScore||a.major.localeCompare(b.major,'zh-CN'));
      const alternative=candidates[0];
      if(alternative){
        admitted={...alternative,choice:row.index,adjusted:true,requestedMajor:row.major,requestedGroup:program.group};status='admitted';stopped=true;
        evaluated.push({...detail,program:alternative,state:'adjusted',reason:`原专业未达到录取条件；已选择服从调剂，调剂至本校${alternative.group?'专业组 '+alternative.group+' · ':''}${alternative.major}，选科符合且成绩高于专业最低分 ${formatExamScore(alternative.minScore)} 分`});
        continue;
      }
    }
    if(!program.requires.every(s=>selected.includes(s))){evaluated.push({...detail,state:'ineligible',reason:'选科不符合要求：'+admissionsRequirements(program)});continue;}
    const threshold=program.minScore,control=program.degree==='junior'?185:category==='physics'?427:471;
    if(score<threshold){evaluated.push({...detail,state:'below',reason:`查表成绩 ${formatExamScore(score)} 分，未达到 2025 年该专业最低分 ${formatExamScore(threshold)} 分`});continue;}
    if(score<control){evaluated.push({...detail,state:'supplemental',reason:`已达到公布的专业最低分，但低于常规${program.degree==='junior'?'专科':'本科'}控制线 ${formatExamScore(control)} 分；本游戏不模拟征集降分等额外条件，结果待定`});status='pending';stopped=true;continue;}
    if(score===threshold){
      evaluated.push({...detail,state:'tie',reason:`与 2025 年专业最低分 ${formatExamScore(threshold)} 分同分，缺少该专业末位考生的同分排序信息，暂不能确定`});
      status='pending';stopped=true;continue;
    }
    admitted={...program,choice:row.index};status='admitted';stopped=true;
    evaluated.push({...detail,state:'admitted',reason:`选科符合，查表成绩 ${formatExamScore(score)} 分高于 2025 年专业最低分 ${formatExamScore(threshold)} 分，按本游戏规则模拟录取`});
  }
  return {status,admitted,rows:evaluated,score,actualScore:player.total,category,dataVersion:HENAN_2025_ADMISSIONS.version};
}
function admissionsRequirements(program){
  return (program.requires.length?program.requires.map(id=>CAMPUS_SUBJECTS.find(([key])=>key===id)[1]).join('＋'):'再选不限');
}
function openAdmissions(page='choices'){
  if(!game?.completed||!admissionsPlayer())return;
  if(page!=='scores'&&!HENAN_2025_ADMISSIONS.loaded){
    const currentGame=game;game.postExamPage=page;
    admissionsLoadingHtml();
    loadAdmissionsCatalog().then(()=>{if(game===currentGame&&game.postExamPage===page)openAdmissions(page)}).catch(error=>{if(game===currentGame&&game.postExamPage===page)admissionsLoadingHtml(error.message)});
    return;
  }
  game.postExamPage=page;
  if(!game.admissions)game.admissions={choices:admissionsChoices()};
  persist();render();window.scrollTo?.({top:0,behavior:'instant'});
}
function admissionsSourceLink(url,label){return `<a href="${escapeHtml(url)}" target="_blank" rel="noopener noreferrer">${escapeHtml(label)}</a>`}
function renderAdmissions(){
  const player=admissionsPlayer(),choices=admissionsChoices(),category=player.rank.category;
  const result=game.admissions?.result?evaluateAdmissions(player,choices):null;
  $('#game-root').innerHTML=`<main id="main" class="final-screen"><div class="final-wrap admissions-wrap">
    <div class="eyebrow">出分 → 志愿填报 → 模拟录取</div><h1>把下一站，写进志愿里</h1>
    <p>${escapeHtml(player.name)} · ${escapeHtml(player.combination)} · 高考 ${formatExamScore(player.total)} 分 · 参考位次：${gaokaoRankText(player.rank)}</p>
    ${admissionsRecommendationsHtml(player)}
    <section class="final-card"><h2>5 个志愿，按你的期待排序</h2>
      <p>每行填写一所大学和一个专业，按第 1 至第 5 志愿依次检索。至少填写一行，其余可留空；可输入学校名称，专业可从“查看全部专业”下拉框中完整选择，手机展开后可上下滑动；也可手动填写。大学列表按院校排名顺序排列，未收录院校随后按校名排序；排名仅用于列表顺序，不影响录取。</p>
      <p class="admissions-note">你正在填报五个志愿，已知信息仅供参考。本次专业录取线尚未公布；服从调剂时可在同校符合选科的其他专业中检索。录取结果将在提交后公布。</p>
      <form id="admissions-form">
        ${choices.map((c,i)=>`<fieldset class="admissions-choice"><legend>第 ${i+1} 志愿</legend><label for="admissions-school-${i}">大学搜索<input id="admissions-school-${i}" data-admissions-index="${i}" data-admissions-field="school" maxlength="100" placeholder="搜索大学、别名或地区，如：武汉、浙江、复旦" autocomplete="off" value="${escapeHtml(c.school)}" aria-describedby="admissions-coverage-${i}"></label><div class="admissions-school-picker admissions-major-select-label"><button type="button" class="ghost-button admissions-school-toggle" id="admissions-school-toggle-${i}" data-school-toggle="${i}" aria-expanded="false" aria-controls="admissions-school-panel-${i}">大学完整列表</button><div class="admissions-school-panel" id="admissions-school-panel-${i}" hidden><small>按院校排名排序；985 红色 · 211 黄色 · 双一流绿色。支持搜索大学、别名或地区，列表可上下滚动，点击学校选填。</small><div class="admissions-school-scroll" id="admissions-school-list-${i}" role="group" aria-label="第 ${i+1} 志愿大学列表"></div></div></div><label for="admissions-major-${i}">专业（可手动输入）<input id="admissions-major-${i}" data-admissions-index="${i}" data-admissions-field="major" maxlength="100" placeholder="手动输入，或从下方完整列表选择" autocomplete="off" value="${escapeHtml(c.major)}"></label><label class="admissions-major-select-label" for="admissions-major-select-${i}"><span id="admissions-major-count-${i}">查看全部专业（${admissionsPrograms(admissionsSchool(c.school),category).length} 个已收录选项）</span><select id="admissions-major-select-${i}" data-admissions-index="${i}" data-admissions-field="major" aria-describedby="admissions-major-help-${i}">${admissionsMajorSelectOptions(c.school,category,c.major)}</select><small id="admissions-major-help-${i}">展开后上下滑动可查看该校当前选科类别下全部已收录专业，选择后自动填入上方。不同专业组和专业代号分别列出。</small></label><label class="admissions-adjustment-label" for="admissions-adjustment-${i}">是否服从调剂<select id="admissions-adjustment-${i}" data-admissions-index="${i}" data-admissions-field="adjustment"><option value="no"${c.adjustment?'':' selected'}>不服从调剂</option><option value="yes"${c.adjustment?' selected':''}>服从调剂</option></select><small>原专业未录取时，允许调剂到该校同批次、符合选科和分数条件的其他专业或专业组。</small></label><p class="admissions-coverage" id="admissions-coverage-${i}" aria-live="polite">${escapeHtml(universityCoverage(c.school,category))}</p><div class="admissions-evidence" id="admissions-evidence-${i}">${admissionsChoiceEvidence(c.school,c.major,category)}</div></fieldset>`).join('')}
        <div id="admissions-errors" role="alert">${(game.admissions?.errors||[]).map(s=>`<p>${escapeHtml(s)}</p>`).join('')}</div>
        <div class="dialog-footer"><button type="button" class="ghost-button" data-admissions-page="scores">← 返回成绩页</button><button type="submit" class="primary-button">提交志愿，查看模拟录取 →</button></div>
      </form>
    </section>
    ${result?'<button type="button" class="ghost-button" data-admissions-page="admission-result">查看上次模拟结果 →</button>':''}
    ${universityPickerHtml()}
    ${admissionsReferenceCatalogHtml(choices,category)}
  </div></main>`;
}

function admissionsSchoolDirectory(){
  const names=new Map(),profiles=new Map();
  for(const s of UNIVERSITY_CATALOG.schools){
    names.set(admissionsNormalize(s.name),s);
    for(const name of [s.name,...s.aliases||[]])profiles.set(admissionsNormalize(name),s);
  }
  for(const s of HENAN_2025_ADMISSIONS.schools){
    const key=admissionsNormalize(s.name);
    if(!names.has(key)){
      const profile=[s.name,...s.aliases||[]].map(n=>profiles.get(admissionsNormalize(n))).find(Boolean);
      names.set(key,{...profile,...s,province:profile?.province||'其他招生单位',city:profile?.city||''});
    }
  }
  return [...names.values()];
}
const admissionsRankIndex=new Map(UNIVERSITY_RANKINGS.rows.map(r=>[admissionsNormalize(r.name),r]));
const admissionsDoubleFirst=new Set(UNIVERSITY_RANKINGS.doubleFirstClass.map(admissionsNormalize));
function admissionsSchoolRank(s){return admissionsRankIndex.get(admissionsNormalize(s.name))}
function admissionsSchoolTags(s){
  return (s.elite985?'<span class="school-tag school-tag-985">985</span>':'')+
    (s.elite211?'<span class="school-tag school-tag-211">211</span>':'')+
    (admissionsDoubleFirst.has(admissionsNormalize(s.name))?'<span class="school-tag school-tag-double">双一流</span>':'');
}
function admissionsSchoolMatches(query=''){
  const key=admissionsNormalize(query).toLowerCase();
  return admissionsSchoolDirectory().filter(s=>!key||[s.name,s.province,s.city,...s.aliases||[]].some(n=>admissionsNormalize(n).toLowerCase().includes(key)))
    .sort((a,b)=>(admissionsSchoolRank(a)?.order??Infinity)-(admissionsSchoolRank(b)?.order??Infinity)||a.name.localeCompare(b.name,'zh-CN'));
}
function admissionsSchoolListHtml(query='',index=0,current=''){
  const schools=admissionsSchoolMatches(query);
  return '<p class="school-match-count" role="status">找到 '+schools.length+' 所大学</p>'+schools.map(s=>{
    const rank=admissionsSchoolRank(s);
    return '<button type="button" class="admissions-school-option'+(s.name===current?' is-selected':'')+'" data-school-pick="'+index+'" data-school-name="'+escapeHtml(s.name)+'" aria-pressed="'+(s.name===current)+'"><span class="school-option-name">'+escapeHtml(s.name)+'</span><span class="school-option-tags">'+admissionsSchoolTags(s)+'</span><small>'+escapeHtml(rank?'参考排序 · '+rank.rank+(rank.overall!==rank.rank?'（总榜 '+rank.overall+'）':''):'未列入院校排名')+'</small></button>';
  }).join('')+(schools.length?'':'<p>没有找到，试试学校全称、别名或地区。</p>');
}
function refreshAdmissionsSchools(index){
  const panel=$('#admissions-school-panel-'+index);
  if(!panel||panel.hidden)return;
  const query=$('#admissions-school-'+index).value;
  $('#admissions-school-list-'+index).innerHTML=admissionsSchoolListHtml(query,index,query);
}
function toggleAdmissionsSchools(index){
  const panel=$('#admissions-school-panel-'+index),button=$('#admissions-school-toggle-'+index);
  panel.hidden=!panel.hidden;
  button.setAttribute('aria-expanded',String(!panel.hidden));
  if(!panel.hidden)refreshAdmissionsSchools(index);
}
function admissionsMajorSelectOptions(school,category,current=''){
  const programs=admissionsPrograms(admissionsSchool(school),category);
  const known=programs.some(p=>admissionsNormalize(p.major)===admissionsNormalize(current));
  return '<option value="">'+(programs.length?'请选择专业 · 全部 '+programs.length+' 个选项（可滑动）':'暂无本类别已收录专业，请先选学校或查看数据覆盖')+'</option>'+programs.map(p=>'<option value="'+escapeHtml(p.major)+'"'+(known&&admissionsNormalize(p.major)===admissionsNormalize(current)?' selected':'')+'>'+escapeHtml(p.major)+'</option>').join('');
}
function admissionsMajorOptions(school,category){return admissionsPrograms(admissionsSchool(school),category).map(p=>`<option value="${escapeHtml(p.major)}"></option>`).join('')}
function admissionsResultHtml(result){
  const p=result.admitted;
  return `<section class="final-card admissions-result ${p?'admission-good-news':result.status==='unplaced'?'admission-unplaced':''}" role="status" aria-live="polite">${p?`<header class="admission-banner"><p class="celebration-title">喜报</p><h2>模拟录取通知</h2><p>祝贺 ${escapeHtml(admissionsPlayer()?.name)}，下一站，继续闪光！</p></header>`:`<header class="admission-empty-hero"><p class="eyebrow">${result.status==='pending'?'等待确认':'下一站，仍有可能'}</p><h2>${result.status==='pending'?'录取结果待定':'本次模拟未录取'}</h2><p>一次填报结果，不是青春的终点。</p></header>`}${p?`<p class="admissions-offer">第 ${p.choice} 志愿<br><b>${escapeHtml(p.school)}</b><br>${escapeHtml(p.major)}${p.group?`<br><small>专业组 ${escapeHtml(p.group)}</small>`:''}</p>${p.adjusted?`<p class="admissions-adjusted"><b>服从调剂 · 调剂录取</b><br>原填报：${escapeHtml(p.requestedMajor)}${p.requestedGroup?`（专业组 ${escapeHtml(p.requestedGroup)}）`:''}<br>调剂至：${escapeHtml(p.major)}${p.group?`（专业组 ${escapeHtml(p.group)}）`:''}</p>`:''}<p>本次该专业录取线 ${formatExamScore(p.minScore)}；本次实考成绩 ${formatExamScore(result.actualScore??result.score)} 分；录取检索按向下取整的 ${formatExamScore(result.score)} 分查表。</p>`:`<p>${result.status==='pending'?'前面志愿存在同分或缺少数据的情况，暂不能确定最终学校。请查看原因，或修改志愿后重新模拟。':'本次填报未匹配到符合录取条件的专业。查看下方逐项检索原因，调整院校与专业，或考虑服从调剂后再次模拟。'}</p>`}<details ${result.status==='unplaced'?'open':''}><summary>查看 5 个志愿的检索详情</summary><ol>${result.rows.map(r=>`<li><b>第 ${r.index} 志愿：${escapeHtml(r.school||'留空')}${r.major?' · '+escapeHtml(r.major):''}${r.school?` · ${r.adjustment?'服从调剂':'不服从调剂'}`:''}</b><p>${escapeHtml(r.reason.replaceAll('2025 年','本次'))}</p>${r.program?admissionsProgramEvidence(r.program,true):''}</li>`).join('')}</ol></details><p class="admissions-note">以上是基于本次模拟录取线的游戏结果，不是真实录取通知。</p></section>`;
}
function renderAdmissionsResult(){
  const choices=admissionsChoices(),result=evaluateAdmissions(admissionsPlayer(),choices);
  $('#game-root').innerHTML=`<main id="main" class="final-screen celebration-screen ${result.status==='unplaced'?'admissions-unplaced-screen':''}"><div class="final-wrap admissions-wrap"><p class="eyebrow">我的下一站 · 模拟录取结果</p>${admissionsResultHtml(result)}<div class="dialog-footer"><button class="ghost-button" data-admissions-page="scores">返回我的成绩</button><button class="primary-button" data-admissions-page="choices">修改志愿，重新模拟</button></div></div></main>`;
}
function saveAdmissionsField(target){
  if(!game?.completed||target.dataset.admissionsIndex===undefined)return;
  const index=Number(target.dataset.admissionsIndex),field=target.dataset.admissionsField;
  if(!Number.isInteger(index)||index<0||index>4||!['school','major','adjustment'].includes(field))return;
  const choices=admissionsChoices();choices[index][field]=field==='adjustment'?target.value==='yes':String(target.value||'').slice(0,100);
  game.admissions={choices};
  if(field==='school'){
    choices[index].major='';
    refreshAdmissionsSchools(index);
    $('#admissions-major-'+index).value='';
    const programs=admissionsPrograms(admissionsSchool(target.value),admissionsPlayer().rank.category);
    $('#admissions-major-select-'+index).innerHTML=admissionsMajorSelectOptions(target.value,admissionsPlayer().rank.category);
    $('#admissions-major-select-'+index).value='';
    $('#admissions-major-count-'+index).textContent='查看全部专业（'+programs.length+' 个已收录选项）';
    $('#admissions-coverage-'+index).textContent=universityCoverage(target.value,admissionsPlayer().rank.category);
  }
  if(field==='major'){
    $('#admissions-major-'+index).value=choices[index].major;
    const match=admissionsPrograms(admissionsSchool(choices[index].school),admissionsPlayer().rank.category).find(p=>admissionsNormalize(p.major)===admissionsNormalize(choices[index].major));
    $('#admissions-major-select-'+index).value=match?.major||'';
  }
  $('#admissions-evidence-'+index).innerHTML=admissionsChoiceEvidence(choices[index].school,choices[index].major,admissionsPlayer().rank.category);
  const resultNode=document.querySelector('.admissions-result');if(resultNode)resultNode.hidden=true;
  $('#admissions-errors').textContent='';persist();
}
function submitAdmissions(){
  if(!game?.completed||!admissionsPlayer())return;
  const choices=Array.from({length:5},(_,i)=>({school:$('#admissions-school-'+i).value.trim().slice(0,100),major:$('#admissions-major-'+i).value.trim().slice(0,100),adjustment:$('#admissions-adjustment-'+i).value==='yes'}));
  const result=evaluateAdmissions(admissionsPlayer(),choices);
  game.admissions={choices,...(result.status==='invalid'?{errors:result.errors}:{result})};
  game.postExamPage=result.status==='invalid'?'choices':'admission-result';persist();render();window.scrollTo?.({top:0,behavior:'instant'});
}
document.addEventListener('click',e=>{const b=e.target.closest('button');if(b&&!b.disabled&&b.dataset.admissionsPage)openAdmissions(b.dataset.admissionsPage)});
document.addEventListener('input',e=>{if(!e.target.id?.startsWith('admissions-major-select-'))saveAdmissionsField(e.target)});
document.addEventListener('change',e=>{
  const target=e.target;
  if(target.id?.startsWith('admissions-major-select-')||target.dataset.admissionsField==='adjustment')saveAdmissionsField(target);
});
document.addEventListener('submit',e=>{if(e.target.id==='admissions-form'){e.preventDefault();submitAdmissions()}});

document.addEventListener('click',e=>{
  const toggle=e.target.closest('button[data-school-toggle]');
  if(toggle){toggleAdmissionsSchools(Number(toggle.dataset.schoolToggle));return;}
  const b=e.target.closest('button[data-school-pick]');
  if(!b)return;
  const i=Number(b.dataset.schoolPick),name=b.dataset.schoolName;
  $('#admissions-school-'+i).value=name;
  saveAdmissionsField({dataset:{admissionsIndex:String(i),admissionsField:'school'},value:name});
  $('#admissions-school-panel-'+i).hidden=true;
  const toggleButton=$('#admissions-school-toggle-'+i);
  toggleButton.setAttribute('aria-expanded','false');
  toggleButton.focus();
});
