// A game-only historical-risk model, not calibrated real-world admission odds.
const ADMISSIONS_CHANCE_MODEL={version:'historical-risk-v2',buffer:8,commonSigma:12,schoolSigma:9,defaultMajorSigma:9,minMajorSigma:3,maxMajorSigma:25,maxSigma:30,minPeers:5};
let admissionsPendingSubmission=null;
function admissionsNormalCdf(x){const sign=x<0?-1:1,z=Math.abs(x)/Math.SQRT2,t=1/(1+.3275911*z);const erf=1-(((((1.061405429*t-1.453152027)*t)+1.421413741)*t-.284496736)*t+.254829592)*t*Math.exp(-z*z);return Math.max(0,Math.min(1,.5*(1+sign*erf)));}
function admissionsMedian(values){
 if(!values.length)return 0;
 const sorted=[...values].sort((a,b)=>a-b),middle=Math.floor(sorted.length/2);
 return sorted.length%2?sorted[middle]:(sorted[middle-1]+sorted[middle])/2;
}
function admissionsProgramRisk(program,school,category){
 const reference=admissionsHistoricalReference(school.name,category,program.degree);
 if(!reference)return null;
 const residuals=admissionsPrograms(school,category)
   .filter(peer=>peer!==program&&peer.degree===program.degree)
   .map(peer=>peer.minScore-reference.score);
 const peers=residuals.length;
 const correction=peers>=ADMISSIONS_CHANCE_MODEL.minPeers?Math.max(-20,Math.min(20,admissionsMedian(residuals))):0;
 const center=admissionsMedian(residuals);
 const majorSigma=peers>=ADMISSIONS_CHANCE_MODEL.minPeers
   ?Math.max(ADMISSIONS_CHANCE_MODEL.minMajorSigma,Math.min(ADMISSIONS_CHANCE_MODEL.maxMajorSigma,1.4826*admissionsMedian(residuals.map(value=>Math.abs(value-center)))))
   :ADMISSIONS_CHANCE_MODEL.defaultMajorSigma;
 const sigma=Math.max(6,Math.min(ADMISSIONS_CHANCE_MODEL.maxSigma,Math.hypot(ADMISSIONS_CHANCE_MODEL.commonSigma,ADMISSIONS_CHANCE_MODEL.schoolSigma,majorSigma)));
 return {reference,expectedScore:reference.score+correction,correction,sigma,majorSigma,peers};
}
function admissionsDraftChoices(){return Array.from({length:5},(_,i)=>({school:$('#admissions-school-'+i).value.trim().slice(0,100),major:$('#admissions-major-'+i).value.trim().slice(0,100),adjustment:$('#admissions-adjustment-'+i).value==='yes'}));}
function admissionsDraftErrors(choices){
 const errors=[],seen=new Set();if(!choices.some(c=>c.school||c.major))errors.push('至少填写 1 个完整志愿，其余位置可留空。');
 for(const [i,c]of choices.entries()){if(Boolean(c.school)!==Boolean(c.major))errors.push('第 '+(i+1)+' 志愿请同时填写大学和专业。');if(!c.school||!c.major)continue;const key=(admissionsSchool(c.school)?.name||admissionsNormalize(c.school))+'|'+admissionsNormalize(c.major);if(seen.has(key))errors.push('第 '+(i+1)+' 志愿与前面重复，请更换或留空。');seen.add(key);}return errors;
}
function estimateAdmissionsChances(player,choices){
 const score=Math.floor(player.total),category=player.rank?.category||(Object.hasOwn(player.subjects,'physics')?'physics':'history'),selected=Object.keys(player.subjects),model=ADMISSIONS_CHANCE_MODEL;
 const rows=choices.map((c,i)=>{
  const row={...c,index:i+1,probability:null,status:'unknown',reason:'历史参考数据不足，无法估算'};
  if(!c.school&&!c.major)return {...row,status:'blank',reason:'未填写'};
  const school=admissionsSchool(c.school),program=admissionsPrograms(school,category).find(p=>admissionsNormalize(p.major)===admissionsNormalize(c.major));
  if(!program){const wrong=school?.completeOrdinaryCatalog&&school.groups.some(g=>g.category!==category&&g.programs.some(([m])=>admissionsNormalize(m)===admissionsNormalize(c.major)));return wrong?{...row,probability:0,status:'ineligible',reason:'首选科目不符合要求'}:row;}
  const eligible=program.requires.every(k=>selected.includes(k));
  if(!eligible&&(!c.adjustment||!admissionsPrograms(school,category).some(p=>p.degree===program.degree&&p.requires.every(k=>selected.includes(k)))))return {...row,probability:0,status:'ineligible',reason:'选科不符合要求'};
  const risk=admissionsProgramRisk(program,school,category);if(!risk)return row;
  const margin=score-risk.expectedScore-model.buffer;
  return {...row,status:'estimated',probability:admissionsNormalCdf(margin/risk.sigma),margin,sigma:risk.sigma,expectedScore:risk.expectedScore,peerCount:risk.peers,institution:risk.reference.code||school.name,reason:`按 2024 院校线与同校 ${risk.peers} 个专业偏差估算${c.adjustment?'；调剂未单独加成':''}`};
 });
 // Shared annual movement makes choices correlated. Same-school choices share
 // one uncertainty term and never inflate the estimate by being counted twice.
 const institutions=new Map();for(const r of rows)if(r.status==='estimated'){
   const previous=institutions.get(r.institution);
   if(!previous||r.probability>previous.probability)institutions.set(r.institution,{margin:r.margin,sigma:Math.sqrt(Math.max(1,r.sigma*r.sigma-model.commonSigma*model.commonSigma)),probability:r.probability});
 }
 let probability=0,weight=0;
 for(let i=0;i<=240;i++){const z=-6+i*.05,w=Math.exp(-z*z/2);let failure=1;for(const institution of institutions.values())failure*=1-admissionsNormalCdf((institution.margin-model.commonSigma*z)/institution.sigma);probability+=(1-failure)*w;weight+=w;}
 const unknown=rows.filter(r=>r.status==='unknown').length,estimated=rows.some(r=>r.status==='estimated');
 return {model:model.version,rows,overall:estimated?probability/weight:unknown?null:0,incomplete:unknown>0,overallIsLowerBound:unknown>0&&estimated,score:player.total};
}
function formatAdmissionsChance(p){return p===null?'暂无估算':p===0?'0%':p<.01?'<1%':p>.99?'>99%':Math.round(p*100)+'%';}
function admissionsProbabilityHtml(report,confirming=false){
 return `<section class="admissions-chance-panel"><header><p class="eyebrow">${confirming?'提交前确认':'提交时的风险预估'}</p><h2>志愿录取成功率 <small>游戏估算</small></h2></header><div class="admissions-chance-total"><div><span>整体成功率 · 至少一个志愿录取</span><strong>${report.overallIsLowerBound?'至少 ':''}${formatAdmissionsChance(report.overall)}</strong></div><p>${report.incomplete?'部分志愿缺少历史数据，整体仅反映可估算部分。':'已按同校专业偏差校准不确定度，并考虑不同院校的共同波动；同校志愿不重复叠加。'}</p></div><ol class="admissions-chance-list">${report.rows.map(r=>`<li><div class="admissions-chance-row"><div><span>第 ${r.index} 志愿${r.status==='blank'?' · 留空':''}</span><h3>${escapeHtml(r.school||'未填写')}</h3>${r.major?`<p>${escapeHtml(r.major)}</p>`:''}</div><b>${r.status==='blank'?'—':formatAdmissionsChance(r.probability)}</b></div><p class="admissions-chance-reason">${escapeHtml(r.reason)}${r.school?' · '+(r.adjustment?'服从调剂':'不服从调剂'):''}</p></li>`).join('')}</ol><p class="admissions-chance-note">仅依据 2024 院校参考线、2025 同校专业偏差与游戏波动模型估算，不是真实录取概率，也不保证录取。估算不直接读取所选专业本次录取线，不参与录取结算。</p></section>`;
}
function previewAdmissionsSubmission(){
 if(!game?.completed||!admissionsPlayer())return;
 const choices=admissionsDraftChoices(),errors=admissionsDraftErrors(choices);
 if(errors.length){game.admissions={choices,errors};game.postExamPage='choices';persist();render();return;}
 const report=estimateAdmissionsChances(admissionsPlayer(),choices);
 admissionsPendingSubmission={game,choices,report};
 openModal(admissionsProbabilityHtml(report,true)+'<div class="dialog-footer admissions-chance-actions"><button type="button" class="ghost-button" data-chance-edit>返回修改</button><button type="button" class="primary-button" data-chance-confirm>确认提交，查看录取结果 →</button></div>');
}
function confirmAdmissionsSubmission(){
 const pending=admissionsPendingSubmission;if(!pending||game!==pending.game)return;
 if(JSON.stringify(admissionsDraftChoices())!==JSON.stringify(pending.choices)){admissionsPendingSubmission=null;closeModal(true);toast('志愿已修改，请重新提交查看估算');return;}
 admissionsPendingSubmission=null;
 const result=evaluateAdmissions(admissionsPlayer(),pending.choices);
 game.admissions={choices:pending.choices,probabilities:pending.report,...(result.status==='invalid'?{errors:result.errors}:{result})};game.postExamPage=result.status==='invalid'?'choices':'admission-result';
 persist();closeModal(true);render();window.scrollTo?.({top:0,behavior:'instant'});
}
document.addEventListener('click',e=>{const b=e.target.closest('button');if(!b||b.disabled)return;if(b.hasAttribute('data-chance-edit')){admissionsPendingSubmission=null;closeModal(true);}if(b.hasAttribute('data-chance-confirm'))confirmAdmissionsSubmission();});
