const fs=require('node:fs'),vm=require('node:vm'),zlib=require('node:zlib');
const ROOT=require('node:path').resolve(__dirname,'..');
const catalogContext=vm.createContext({});
vm.runInContext(fs.readFileSync(ROOT+'/frontend/university-catalog.js','utf8'),catalogContext);
const catalog=vm.runInContext('UNIVERSITY_CATALOG.schools',catalogContext);
const CACHE=process.env.HENAN_ADMISSIONS_CACHE||ROOT+'/work/admissions-import';
const RAW=CACHE+'/raw';
const manual=JSON.parse(fs.readFileSync(ROOT+'/data/manual-admissions-2025.json','utf8'));
const manifest=JSON.parse(fs.readFileSync(CACHE+'/manifest.json','utf8'));
const rankContext=vm.createContext({});
vm.runInContext(fs.readFileSync(ROOT+'/frontend/henan-2025-data.js','utf8')+'\n'+fs.readFileSync(ROOT+'/frontend/gaokao.js','utf8'),rankContext);
const norm=s=>String(s||'').replace(/\s+/g,'').replace(/\(/g,'（').replace(/\)/g,'）');
const category=s=>String(s).includes('物理')?'physics':String(s).includes('历史')?'history':null;
const group=s=>String(s||'').match(/\d+/)?.[0]||'';
const ordinary=p=>['普通本科批','普通高职(专科)批'].includes(p.batch)&&/^[19]\d\d$/.test(group(p.major_group_code))&&!/专项|预科|定向|公费|优师|中外|合作办学|少数民族|民族班/.test([p.major_name,p.major_group_remark,p.direction,p.major_remark].join(' '));
const records=[],skipped={},conflicts=[],fallbacks=[];
const skip=reason=>skipped[reason]=(skipped[reason]||0)+1;
function allCached(kind,code){
 let rows=[];for(let page=1;;page++){const f=`${RAW}/${kind}-${code}-${page}.json`;if(!fs.existsSync(f))break;const j=JSON.parse(fs.readFileSync(f));rows.push(...j.data.data);if(rows.length>=Number(j.data.nums))break;}return rows;
}
function requirements(p,cat){
 const raw=String(p.major_optional_require||'');
 if(!raw||/或|任选/.test(raw))return null;
 const labels={物理:'physics',历史:'history',化学:'chemistry',生物:'biology',思想政治:'politics',政治:'politics',地理:'geography'};
 let ids=[...new Set(Object.entries(labels).filter(([label])=>raw.includes(label)).map(([,id])=>id))];
 if(!raw.includes('不限')&&!ids.length)return null;
 if(ids.some(id=>['physics','history'].includes(id)&&id!==cat))return null;
 return ids.filter(id=>id!==cat);
}
for(const item of manifest.schools){
 if(!item.scoreRows||!item.planRows)continue;
 const plans=allCached('plan',item.code).filter(p=>Number(p.year)===2025&&ordinary(p));
 for(const s of allCached('score',item.code)){
  const cat=category(s.first_choice),score=Number(s.admission_score_min),code=String(s.major_enrollment_code),grp=group(s.major_group_code);
  if(s.year!=='2025'||!cat||!s.admission_score_min||!Number.isInteger(score)||score<185||score>750){skip('invalidOrUnpublishedScore');continue;}
  if(!['本科批','高职高专批'].includes(s.batch)||!/^[19]\d\d$/.test(grp)||/专项|预科|定向|公费|优师|中外|合作办学|少数民族|民族班/.test(s.school_name+' '+s.major_name)){skip('outsideOrdinaryScope');continue;}
  // Join on year, category, group, enrollment code AND exact normalized professional name.
  // Never join solely on enrollment code: medical divisions may reuse the same code.
  const matched=plans.filter(p=>category(p.first_choice)===cat&&group(p.major_group_code)===grp&&String(p.ZYDH)===code&&norm(p.major_name)===norm(s.major_name)&&((s.batch==='本科批')===(p.batch==='普通本科批')));
  if(!matched.length){skip('noExactPlanMatch');continue;}
  const reqSets=matched.map(p=>requirements(p,cat));
  if(reqSets.some(r=>r===null)||new Set(reqSets.map(r=>JSON.stringify(r))).size!==1){skip('ambiguousSubjectRequirements');continue;}
  const p=matched[0],degree=s.batch==='高职高专批'?'junior':'undergraduate';
  const root=catalog.find(c=>c.code.endsWith(item.code));
  const rank=vm.runInContext(`henanRank(${score},'${cat}')`,rankContext);
  let schoolName=String(s.school_name).replace(/\(/g,'（').replace(/\)/g,'）');
  // The provincial unit called 北京师范大学 here is the Beijing campus; Zhuhai is separately named.
  if(schoolName==='北京师范大学')schoolName='北京师范大学（北京校区）';
  let name=String(s.major_name).replace(/\(/g,'（').replace(/\)/g,'）');
  if(degree==='junior'&&root?.level==='本科')name+='（专科批）';
  records.push({school:schoolName,institutionCode:item.code,category:cat,group:grp,requires:reqSets[0],degree,name,minScore:score,source:`https://${item.code}.gaokao.haedu.cn/`,requirementsSource:`https://${item.code}.gaokao.haedu.cn/`,scoreId:s.id,planId:p.id,enrollmentCode:code,originalName:s.major_name,restriction:p.major_remark||'',tuition:p.tuition||'',minRank:rank?.cumulative||null,rankRange:rank?.end?[rank.start,rank.end]:null});
 }
}
const key=r=>norm(r.school)+'|'+r.category+'|'+norm(r.name);
const map=new Map();
const conflictingIds=new Set();
for(const r of records){const id=key(r)+'|'+r.group+'|'+r.degree+'|'+r.enrollmentCode;if(conflictingIds.has(id))continue;const old=map.get(id);if(old&&old.minScore!==r.minScore){conflicts.push({school:r.school,name:r.name,reason:'different cutoffs for same unit/major/group/enrollment code'});map.delete(id);conflictingIds.add(id);continue;}if(!old)map.set(id,r);}
let clean=[...map.values()];
// Preserve independently verified university sources where the public provincial data lacks a match.
for(const school of manual.schools)for(const g of school.groups)for(const [name,minScore]of g.programs){
 const found=clean.filter(r=>norm(r.school)===norm(school.name)&&r.category===g.category&&norm(r.name)===norm(name));
 if(found.length){
  if(found.length===1&&found[0].minScore!==minScore){conflicts.push({school:school.name,name,provincial:found[0].minScore,university:minScore,action:'retain university verified cutoff'});found[0].minScore=minScore;found[0].source=school.source;found[0].requirementsSource=school.requirementsSource||school.source;const rank=vm.runInContext(`henanRank(${minScore},'${g.category}')`,rankContext);found[0].minRank=rank.cumulative;found[0].rankRange=[rank.start,rank.end];}
  continue;
 }
 const rank=vm.runInContext(`henanRank(${minScore},'${g.category}')`,rankContext);
 const fallback={school:school.name,institutionCode:catalog.find(c=>[school.name,...school.aliases||[]].includes(c.name))?.code.slice(-5)||'',category:g.category,group:g.group||'',requires:g.requires,degree:'undergraduate',name,minScore,source:school.source,requirementsSource:school.requirementsSource||school.source,minRank:rank.cumulative,rankRange:[rank.start,rank.end]};
 clean.push(fallback);fallbacks.push({school:school.name,name,category:g.category});
}
const duplicates=new Map();for(const r of clean){const k=key(r);if(!duplicates.has(k))duplicates.set(k,[]);duplicates.get(k).push(r);}
for(const list of duplicates.values())if(list.length>1)for(const r of list)r.name+=`（第${r.group}组·专业代号${r.enrollmentCode||'原表'}）`;
const schools=new Map();
for(const r of clean){
 if(!schools.has(r.school)){const prev=manual.schools.find(s=>norm(s.name)===norm(r.school));schools.set(r.school,{name:r.school,institutionCode:r.institutionCode,aliases:prev?.aliases||[],source:r.source,requirementsSource:r.requirementsSource,groups:[]});}
 const school=schools.get(r.school),gkey=[r.category,r.group,r.degree,JSON.stringify(r.requires)].join('|');
 let g=school.groups.find(g=>g.key===gkey);if(!g){g={key:gkey,category:r.category,group:r.group||null,requires:r.requires,degree:r.degree,programs:[]};school.groups.push(g);}
 const metadata={minRank:r.minRank,rankRange:r.rankRange,source:r.source,requirementsSource:r.requirementsSource};
 if(r.scoreId){metadata.scoreId=r.scoreId;metadata.planId=r.planId;metadata.enrollmentCode=r.enrollmentCode;}
 if(r.restriction)metadata.restriction=r.restriction;
 if(r.tuition)metadata.tuition=r.tuition;
 g.programs.push([r.name,r.minScore,metadata]);
}
for(const s of schools.values())for(const g of s.groups)delete g.key;
const output=[...schools.values()].sort((a,b)=>a.name.localeCompare(b.name,'zh-CN'));
for(const entry of catalog){const units=output.filter(s=>s.institutionCode===entry.code.slice(-5));if(units.length===1&&norm(units[0].name)!==norm(entry.name)&&!units[0].aliases.includes(entry.name))units[0].aliases.push(entry.name);}
const codeSet=new Set(output.map(s=>s.institutionCode));
const stats={admissionUnits:output.length,institutions:codeSet.size,programs:clean.length,undergraduate:clean.filter(r=>r.degree==='undergraduate').length,junior:clean.filter(r=>r.degree==='junior').length,elite985:catalog.filter(c=>c.elite985&&codeSet.has(c.code.slice(-5))).length,elite211:catalog.filter(c=>c.elite211&&codeSet.has(c.code.slice(-5))).length,queried:manifest.schools.length};
const version='2025-provincial-professional-v2';
const data={year:2025,version,policy:manual.policy,source:'https://www.gaokao.haedu.cn/',stats,recordsUrl:'admissions-records-2025.json.gz?v=2',loaded:false,schools:[]};
fs.writeFileSync(ROOT+'/frontend/admissions-data.js','// Official Henan 2025 professional data; compressed records load only when entering admissions.\nconst HENAN_2025_ADMISSIONS = '+JSON.stringify(data)+';\n');
const payload=JSON.stringify({version,schools:output});
fs.writeFileSync(ROOT+'/frontend/admissions-records-2025.json.gz',zlib.gzipSync(payload,{level:9,mtime:0}));
fs.writeFileSync(ROOT+'/data/admissions-import-audit.json',JSON.stringify({year:2025,source:'https://www.gaokao.haedu.cn/',scoreEndpoint:'/api/zy_admission/index',planEndpoint:'/api/plan_zy/index',stats,skipped,conflicts,fallbacks,schools:manifest.schools,failed:manifest.failed},null,2));
console.log(JSON.stringify({stats,skipped,conflicts:conflicts.length,fallbacks:fallbacks.length,compressedBytes:fs.statSync(ROOT+'/frontend/admissions-records-2025.json.gz').size},null,2));

for(const file of ['admissions-data.js','admissions-records-2025.json.gz'])fs.copyFileSync(ROOT+'/frontend/'+file,ROOT+'/docs/'+file);
