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
function admissionsProgramEvidence(p){return `<p>${p.degree==='junior'?'高职专科批':'普通本科批'} · 专业最低分 ${p.minScore} · 最低分参考位次 ${p.minRank?.toLocaleString()||'未公布'}${p.rankRange?`（${p.rankRange[0].toLocaleString()}—${p.rankRange[1].toLocaleString()}）`:''} · ${admissionsRequirements(p)}</p>${p.restriction?`<p>招生备注：${escapeHtml(p.restriction)}（原表信息，额外条件未自动校验）</p>`:''}${admissionsSourceLink(p.source,'官方录取数据')} · ${admissionsSourceLink(p.requirementsSource,'官方选科依据')}`}
function admissionsChoiceEvidence(school,major,category){const p=admissionsPrograms(admissionsSchool(school),category).find(p=>admissionsNormalize(p.major)===admissionsNormalize(major));return p?admissionsProgramEvidence(p):''}
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
  $('#game-root').innerHTML=`<main id="main" class="final-screen"><div class="final-wrap"><section class="final-card" role="status"><h1>${error?'录取数据暂未载入':'正在载入河南 2025 录取数据'}</h1><p>${escapeHtml(error||'首次进入需要下载专业数据，载入后即可使用院校与专业提示。')}</p><button class="ghost-button" data-admissions-page="scores">返回我的成绩</button>${error?'<button class="primary-button" data-admissions-page="choices">重试加载</button>':''}</section></div></main>`;
}
function admissionsChoices(){
  return Array.from({length:5},(_,i)=>({school:String(game.admissions?.choices?.[i]?.school||''),major:String(game.admissions?.choices?.[i]?.major||'')}));
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
    if(!program.requires.every(s=>selected.includes(s))){evaluated.push({...detail,state:'ineligible',reason:'选科不符合要求：'+admissionsRequirements(program)});continue;}
    const threshold=program.minScore,control=program.degree==='junior'?185:category==='physics'?427:471;
    if(score<threshold){evaluated.push({...detail,state:'below',reason:`查表成绩 ${score} 分，未达到 2025 年该专业最低分 ${threshold} 分`});continue;}
    if(score<control){evaluated.push({...detail,state:'supplemental',reason:`已达到公布的专业最低分，但低于常规${program.degree==='junior'?'专科':'本科'}控制线 ${control} 分；本游戏不模拟征集降分等额外条件，结果待定`});status='pending';stopped=true;continue;}
    if(score===threshold){
      evaluated.push({...detail,state:'tie',reason:`与 2025 年专业最低分 ${threshold} 分同分，缺少该专业末位考生的同分排序信息，暂不能确定`});
      status='pending';stopped=true;continue;
    }
    admitted={...program,choice:row.index};status='admitted';stopped=true;
    evaluated.push({...detail,state:'admitted',reason:`选科符合，查表成绩 ${score} 分高于 2025 年专业最低分 ${threshold} 分，按本游戏规则模拟录取`});
  }
  return {status,admitted,rows:evaluated,score,category,dataVersion:HENAN_2025_ADMISSIONS.version};
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
    <p>${escapeHtml(player.name)} · ${escapeHtml(player.combination)} · 高考 ${player.total} 分 · 河南参考位次：${gaokaoRankText(player.rank)}</p>
    <section class="final-card"><h2>5 个志愿，按你的期待排序</h2>
      <p>每行填写一所大学和一个专业，按第 1 至第 5 志愿依次检索。至少填写一行，其余可留空；可自由输入，输入时会提示已收录名称。</p>
      <p class="admissions-note">这是普通本科与高职专科的五志愿简化模拟。河南 2025 年实际普通本科批设置 48 个院校专业组志愿，每组可填 6 个专业。本游戏按已公布专业最低分和选科匹配，不模拟真实专业组投档、计划竞争、征集降分、调剂、体检及单科限制。超过最低分且达到常规批次线按游戏规则录取；同分待定，不随机决定。</p>
      <form id="admissions-form"><datalist id="admissions-schools">${[...new Set([...UNIVERSITY_CATALOG.schools.map(s=>s.name),...HENAN_2025_ADMISSIONS.schools.map(s=>s.name)])].map(name=>`<option value="${escapeHtml(name)}"></option>`).join('')}</datalist>
        ${choices.map((c,i)=>`<fieldset class="admissions-choice"><legend>第 ${i+1} 志愿</legend><label for="admissions-school-${i}">大学<input id="admissions-school-${i}" data-admissions-index="${i}" data-admissions-field="school" maxlength="100" list="admissions-schools" placeholder="输入大学名称" autocomplete="off" value="${escapeHtml(c.school)}" aria-describedby="admissions-coverage-${i}"></label><label for="admissions-major-${i}">专业<input id="admissions-major-${i}" data-admissions-index="${i}" data-admissions-field="major" maxlength="100" list="admissions-majors-${i}" placeholder="输入专业名称" autocomplete="off" value="${escapeHtml(c.major)}"></label><datalist id="admissions-majors-${i}">${admissionsMajorOptions(c.school,category)}</datalist><p class="admissions-coverage" id="admissions-coverage-${i}" aria-live="polite">${escapeHtml(universityCoverage(c.school,category))}</p><div class="admissions-evidence" id="admissions-evidence-${i}">${admissionsChoiceEvidence(c.school,c.major,category)}</div></fieldset>`).join('')}
        <div id="admissions-errors" role="alert">${(game.admissions?.errors||[]).map(s=>`<p>${escapeHtml(s)}</p>`).join('')}</div>
        <div class="dialog-footer"><button type="button" class="ghost-button" data-admissions-page="scores">← 返回成绩页</button><button type="submit" class="primary-button">提交志愿，查看模拟录取 →</button></div>
      </form>
    </section>
    ${result?'<button type="button" class="ghost-button" data-admissions-page="admission-result">查看上次模拟结果 →</button>':''}
    ${universityPickerHtml()}
    <details class="final-card admissions-catalog"><summary>查看当前所选院校的专业、分数和位次</summary><p>本科及高职专科普通类专业数据，不使用学校最低线代替专业最低线；中外合作、专项、提前批和艺体类未纳入。不同专业组或专业代号同名的记录会分列，请使用完整提示名称。</p>${[...new Set(choices.map(c=>admissionsSchool(c.school)).filter(Boolean))].map(s=>`<h3>${escapeHtml(s.name)}</h3><p>${admissionsSourceLink(s.source,'2025 年河南录取原表')} · ${admissionsSourceLink(s.requirementsSource||s.source,'选科依据')}</p><ul>${admissionsPrograms(s,category).map(p=>`<li>${escapeHtml(p.major)} · ${p.degree==='junior'?'专科':'本科'} · ${p.minScore} 分 · 最低分参考位次 ${p.minRank?.toLocaleString()||'未公布'} · ${admissionsRequirements(p)}${p.restriction?`<br>招生备注：${escapeHtml(p.restriction)}（额外条件未模拟）`:''}</li>`).join('')}</ul>`).join('')||'<p>先填写学校，或使用“已有录取数据”筛选选填。</p>'}<p>${admissionsSourceLink(HENAN_2025_ADMISSIONS.policy,'河南省 2025 年招生工作规定')}</p></details>
  </div></main>`;
}
function admissionsMajorOptions(school,category){return admissionsPrograms(admissionsSchool(school),category).map(p=>`<option value="${escapeHtml(p.major)}"></option>`).join('')}
function admissionsResultHtml(result){
  const p=result.admitted;
  return `<section class="final-card admissions-result ${p?'admission-good-news':''}" role="status" aria-live="polite">${p?`<header class="admission-banner"><p class="celebration-title">喜报</p><h2>模拟录取通知</h2><p>祝贺 ${escapeHtml(admissionsPlayer()?.name)}，下一站，继续闪光！</p></header>`:`<h2>${result.status==='pending'?'录取结果待定':'本次模拟未录取'}</h2>`}${p?`<p class="admissions-offer">第 ${p.choice} 志愿<br><b>${escapeHtml(p.school)}</b><br>${escapeHtml(p.major)}</p><p>2025 年该专业最低分 ${p.minScore}；本次查表成绩 ${result.score} 分。</p>`:`<p>${result.status==='pending'?'前面志愿存在同分或缺少数据的情况，暂不能确定最终学校。请查看原因，或修改志愿后重新模拟。':'所填志愿均未达到已收录条件；可调整学校或专业后重新模拟。'}</p>`}<details><summary>查看 5 个志愿的检索结果与来源</summary><ol>${result.rows.map(r=>`<li><b>第 ${r.index} 志愿：${escapeHtml(r.school||'留空')}${r.major?' · '+escapeHtml(r.major):''}</b><p>${escapeHtml(r.reason)}</p>${r.program?admissionsProgramEvidence(r.program):''}</li>`).join('')}</ol></details><p class="admissions-note">以上是基于 2025 年专业最低分的游戏结果，不是真实录取通知。</p></section>`;
}
function renderAdmissionsResult(){
  const choices=admissionsChoices(),result=evaluateAdmissions(admissionsPlayer(),choices);
  $('#game-root').innerHTML=`<main id="main" class="final-screen ${result.status==='admitted'?'celebration-screen':''}"><div class="final-wrap admissions-wrap"><p class="eyebrow">我的下一站 · 模拟录取结果</p>${admissionsResultHtml(result)}<div class="dialog-footer"><button class="ghost-button" data-admissions-page="scores">返回我的成绩</button><button class="primary-button" data-admissions-page="choices">修改志愿，重新模拟</button></div></div></main>`;
}
function saveAdmissionsField(target){
  if(!game?.completed||target.dataset.admissionsIndex===undefined)return;
  const index=Number(target.dataset.admissionsIndex),field=target.dataset.admissionsField;
  if(!Number.isInteger(index)||index<0||index>4||!['school','major'].includes(field))return;
  const choices=admissionsChoices();choices[index][field]=String(target.value||'').slice(0,100);
  game.admissions={choices};
  if(field==='school'){
    $('#admissions-majors-'+index).innerHTML=admissionsMajorOptions(target.value,admissionsPlayer().rank.category);
    $('#admissions-coverage-'+index).textContent=universityCoverage(target.value,admissionsPlayer().rank.category);
  }
  $('#admissions-evidence-'+index).innerHTML=admissionsChoiceEvidence(choices[index].school,choices[index].major,admissionsPlayer().rank.category);
  const resultNode=document.querySelector('.admissions-result');if(resultNode)resultNode.hidden=true;
  $('#admissions-errors').textContent='';persist();
}
function submitAdmissions(){
  if(!game?.completed||!admissionsPlayer())return;
  const choices=Array.from({length:5},(_,i)=>({school:$('#admissions-school-'+i).value.trim().slice(0,100),major:$('#admissions-major-'+i).value.trim().slice(0,100)}));
  const result=evaluateAdmissions(admissionsPlayer(),choices);
  game.admissions={choices,...(result.status==='invalid'?{errors:result.errors}:{result})};
  game.postExamPage=result.status==='invalid'?'choices':'admission-result';persist();render();window.scrollTo?.({top:0,behavior:'instant'});
}
document.addEventListener('click',e=>{const b=e.target.closest('button');if(b&&!b.disabled&&b.dataset.admissionsPage)openAdmissions(b.dataset.admissionsPage)});
document.addEventListener('input',e=>saveAdmissionsField(e.target));
document.addEventListener('submit',e=>{if(e.target.id==='admissions-form'){e.preventDefault();submitAdmissions()}});
