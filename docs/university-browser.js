// Directory completeness is separate from verified admissions coverage.
let universityBrowser={tier:'all',query:'',page:0,target:0};
const UNIVERSITY_PAGE_SIZE=24;
function universityProfile(name){
  const key=admissionsNormalize(name);
  const exact=UNIVERSITY_CATALOG.schools.find(s=>[s.name,...s.aliases||[]].some(n=>admissionsNormalize(n)===key));
  if(exact)return exact;
  const known=admissionsSchool(name);
  return known?UNIVERSITY_CATALOG.schools.find(s=>[known.name,...known.aliases||[]].includes(s.name)):null;
}
function universityTier(s){return s.elite985?'985 · 211':s.elite211?'211':s.level==='专科'?'专科':'普通本科'}
function universityCoverage(name,category){
  const s=universityProfile(name),records=admissionsPrograms(admissionsSchool(name),category);
  if(records.length)return `已核实 ${records.length} 条本类别专业录取数据`;
  if(!s)return name.trim()?'未匹配院校目录，请核对学校全称':'可输入学校名，或从下方院校库选填';
  return `${universityTier(s)} · ${s.province} · ${s.special?'军队院校涉及额外招生条件；':''}本类别专业录取数据待补充，提交后待定`;
}
function universityMatches(tier='all',query=''){
  const key=admissionsNormalize(query).toLowerCase();
  return UNIVERSITY_CATALOG.schools.filter(s=>{
    if(tier==='985'&&!s.elite985)return false;
    if(tier==='211'&&!s.elite211)return false;
    if(tier==='double'&&!admissionsDoubleFirst.has(admissionsNormalize(s.name)))return false;
    if(tier==='ordinary'&&(s.level!=='本科'||s.elite211))return false;
    if(tier==='junior'&&s.level!=='专科')return false;
    if(tier==='verified'&&!admissionsSchool(s.name))return false;
    return !key||[s.name,s.province,s.city,...s.aliases||[]].some(n=>admissionsNormalize(n).toLowerCase().includes(key));
  }).sort((a,b)=>(admissionsSchoolRank(a)?.order??Infinity)-(admissionsSchoolRank(b)?.order??Infinity)||a.name.localeCompare(b.name,'zh-CN'));
}
function universityPickerHtml(){
  return `<details class="final-card university-picker"><summary>选学校 · 全部 985 / 211、全国本科与部分专科</summary>
    <p>按院校排名顺序排列，未列入院校随后按校名排序；排名不影响模拟录取。院校目录共 ${UNIVERSITY_CATALOG.schools.length} 条：985 为 39 校，211 为 115 个分列办学实体（包含 985）；本科院校目录含院校名单的 1365 校及 3 所军队院校，另选取 20 所专科。</p>
    <p class="admissions-note">已接入 ${HENAN_2025_ADMISSIONS.stats.institutions} 所院校、${HENAN_2025_ADMISSIONS.stats.admissionUnits} 个招生单位（含校区、医学部等）的 ${HENAN_2025_ADMISSIONS.stats.programs} 条专业录取数据，其中本科 ${HENAN_2025_ADMISSIONS.stats.undergraduate} 条、专科 ${HENAN_2025_ADMISSIONS.stats.junior} 条。录取数据覆盖 38 所非军队 985 和 111 个 211 办学实体。可筛选“已有录取数据”选填；未公布分数或无法匹配选科的专业不推算。军队招生和艺术统考额外条件未模拟。</p>
    <div class="university-filters"><label for="university-tier">院校层次<select id="university-tier">${[['all','全部院校'],['985','985（含 211）'],['211','211（含 985）'],['double','双一流'],['ordinary','普通本科'],['junior','部分专科'],['verified','已有录取数据']].map(([id,label])=>`<option value="${id}" ${universityBrowser.tier===id?'selected':''}>${label}</option>`).join('')}</select></label><label for="university-query">搜索学校或地区<input type="search" id="university-query" value="${escapeHtml(universityBrowser.query)}" placeholder="如：郑州、清华、北京"></label><label for="university-target">填入哪个志愿<select id="university-target">${Array.from({length:5},(_,i)=>`<option value="${i}" ${universityBrowser.target===i?'selected':''}>第 ${i+1} 志愿</option>`).join('')}</select></label></div>
    <p id="university-fill-status" role="status" aria-live="polite"></p>
    <div id="university-results">${universityResultsHtml()}</div>
  </details>`;
}
function universityResultsHtml(){
  const matches=universityMatches(universityBrowser.tier,universityBrowser.query);
  const maxPage=Math.max(0,Math.ceil(matches.length/UNIVERSITY_PAGE_SIZE)-1);
  universityBrowser.page=Math.min(Math.max(0,universityBrowser.page),maxPage);
  const page=matches.slice(universityBrowser.page*UNIVERSITY_PAGE_SIZE,(universityBrowser.page+1)*UNIVERSITY_PAGE_SIZE);
  const category=admissionsPlayer()?.rank.category||'physics';
  return `<p role="status">找到 ${matches.length} 所 · 第 ${universityBrowser.page+1} / ${maxPage+1} 页</p><div class="university-grid">${page.map(s=>`<article class="university-card"><h3>${escapeHtml(s.name)}</h3><p><span class="university-badge">${universityTier(s)}</span> ${admissionsSchoolTags(s)} ${escapeHtml(s.province)} · ${escapeHtml(s.city)}</p><p>${escapeHtml(universityCoverage(s.name,category))}</p><button type="button" class="ghost-button" data-university-pick="${escapeHtml(s.code)}">填入所选志愿</button></article>`).join('')||'<p>没有找到，试试学校全称或其他地区。</p>'}</div><div class="university-pagination"><button type="button" class="ghost-button" data-university-page="-1" ${universityBrowser.page===0?'disabled':''}>上一页</button><button type="button" class="ghost-button" data-university-page="1" ${universityBrowser.page===maxPage?'disabled':''}>下一页</button></div>`;
}
function refreshUniversityResults(){$('#university-results').innerHTML=universityResultsHtml()}
function fillUniversity(code){
  const s=UNIVERSITY_CATALOG.schools.find(s=>s.code===code);
  if(!s||!game?.completed||game.postExamPage!=='choices')return;
  const i=universityBrowser.target;
  $('#admissions-school-'+i).value=s.name;$('#admissions-major-'+i).value='';
  saveAdmissionsField({dataset:{admissionsIndex:String(i),admissionsField:'school'},value:s.name});
  saveAdmissionsField({dataset:{admissionsIndex:String(i),admissionsField:'major'},value:''});
  $('#university-fill-status').textContent=`已将 ${s.name} 填入第 ${i+1} 志愿，请填写专业。`;
}
document.addEventListener('click',e=>{const b=e.target.closest('button');if(!b||b.disabled)return;if(b.dataset.universityPick)fillUniversity(b.dataset.universityPick);if(b.dataset.universityPage){universityBrowser.page+=Number(b.dataset.universityPage);refreshUniversityResults()}});
document.addEventListener('input',e=>{if(e.target.id==='university-query'){universityBrowser.query=e.target.value.slice(0,100);universityBrowser.page=0;refreshUniversityResults()}});
document.addEventListener('change',e=>{if(e.target.id==='university-tier'){universityBrowser.tier=e.target.value;universityBrowser.page=0;refreshUniversityResults()}if(e.target.id==='university-target')universityBrowser.target=Math.max(0,Math.min(4,Number(e.target.value)||0))});
