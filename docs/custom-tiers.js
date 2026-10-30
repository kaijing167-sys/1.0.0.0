const CUSTOM_STAGE_CAPS={high1:70,high2:75,high3:80,sprint100:Infinity};
const CUSTOM_SUBJECT_MAX={chinese:140,math:145,english:145,physics:95,chemistry:100,biology:100,history:95,politics:95,geography:95};
// Normal samples censored at stage/subject limits. Means are one grade lower;
// at most six full values across all attributes and all subjects combined.
const CUSTOM_TIERS=[
 {id:'t0',name:'拉完了',mean:.09,sd:.035,desc:'从很低的基础重新起步'},
 {id:'t1',name:'拉',mean:.16,sd:.055,desc:'基础偏弱，需要耐心积累'},
 {id:'t2',name:'NPC',mean:.29,sd:.055,desc:'平凡开场，慢慢书写故事'},
 {id:'t3',name:'一般',mean:.42,sd:.055,desc:'有些基础，仍需继续努力'},
 {id:'t4',name:'人上人',mean:.54,sd:.05,desc:'稳健起步，留足成长空间'},
 {id:'t5',name:'顶级',mean:.66,sd:.05,desc:'基础不错，长路仍在前方'},
 {id:'t6',name:'顶尖',mean:.77,sd:.045,desc:'实力领先，但远未满配'},
 {id:'t7',name:'夯',mean:.88,sd:.04,desc:'出色的起点，也需要成长'},
 {id:'t8',name:'夯爆了',mean:.978,sd:.0365,desc:'天赋出众，满值至多六项'}
];
function customAbilityMax(kind,key){return Math.min(CUSTOM_STAGE_CAPS[draft.stage]??70,kind==='attrs'?100:CUSTOM_SUBJECT_MAX[key]??campusMax(key));}
function customAbilityValue(kind,key,value){const n=Number(value),step=kind==='attrs'?1:2;return Math.max(0,Math.min(customAbilityMax(kind,key),Math.round((Number.isFinite(n)?n:0)*step)/step));}
function customNormal(random=Math.random){const u=Math.max(Number.EPSILON,random());return Math.sqrt(-2*Math.log(u))*Math.cos(2*Math.PI*random());}
function generateCustomTier(tier,random=Math.random){
  const abilities=[...ATTRIBUTES.map(([k])=>['attrs',k]),...CAMPUS_SUBJECTS.map(([k])=>['subjects',k])];
  let values;
  for(let attempt=0;attempt<128;attempt++){
    values={attrs:{},subjects:{}};
    for(const [kind,keys] of [['attrs',ATTRIBUTES],['subjects',CAMPUS_SUBJECTS]])for(const [key]of keys){
      const max=customAbilityMax(kind,key);
      values[kind][key]=customAbilityValue(kind,key,max*(tier.mean+tier.sd*customNormal(random)));
    }
    const full=abilities.filter(([kind,key])=>values[kind][key]===customAbilityMax(kind,key)).length;
    if(full<=6)return values;
  }
  // Never force full values. Lower only excess full values after bounded retries.
  const full=abilities.filter(([kind,key])=>values[kind][key]===customAbilityMax(kind,key));
  for(let i=full.length-1;i>0;i--){const j=Math.floor(random()*(i+1));[full[i],full[j]]=[full[j],full[i]];}
  for(const [kind,key]of full.slice(6)){const max=customAbilityMax(kind,key);values[kind][key]=customAbilityValue(kind,key,max-Math.max(1,max*(.02+.03*random())));}
  return values;
}
function prepareCustomAttributes(stage){
  if(!draft.custom_id||!START_STAGES[stage])return;
  draft.stage=stage;draft.customParameters=null;draft.customTier=null;
  draft.customRolls??={};menuScreen='custom-attributes';render();
}
function chooseCustomTier(id){
  const tier=CUSTOM_TIERS.find(t=>t.id===id);if(!tier||!draft.custom_id)return;
  const key=customRollKey(id);
  draft.customRolls??={};
  draft.customRolls[key]??=generateCustomTier(tier);
  draft.customParameters=JSON.parse(JSON.stringify(draft.customRolls[key]));draft.customTier=id;
  draft.attrs={...draft.customParameters.attrs};render();
}
function customReadOnlyAbility(kind,key,label){
  const value=draft.customParameters[kind][key],max=customAbilityMax(kind,key);
  return `<div class="custom-tier-stat"><span>${escapeHtml(label)}</span><b>${value}<small> / ${max}</small></b><div class="custom-tier-meter"><i style="width:${value/max*100}%"></i></div></div>`;
}
function customRollKey(id){return 'v4:'+draft.stage+':'+draft.class_id+':'+id+(id==='t8'?':r2':'');}
function customVisibleSignature(p){
  if(!p)return '';
  const selected=['chinese','math','english',...campusClass(draft.class_id).subjects];
  return JSON.stringify([...ATTRIBUTES.map(([key])=>p.attrs[key]),...selected.map(key=>p.subjects[key])]);
}
function refreshCustomTier(id){
  const tier=CUSTOM_TIERS.find(t=>t.id===id);if(!tier||!draft.custom_id)return;
  draft.customRolls??={};const key=customRollKey(id);
  const previous=new Set([customVisibleSignature(draft.customRolls[key]),customVisibleSignature(draft.customParameters)]);
  let next;
  for(let attempt=0;attempt<32;attempt++){next=generateCustomTier(tier);if(!previous.has(customVisibleSignature(next)))break;}
  if(previous.has(customVisibleSignature(next))){
    next=JSON.parse(JSON.stringify(next));
    const visible=[...ATTRIBUTES.map(([k])=>['attrs',k]),...['chinese','math','english',...campusClass(draft.class_id).subjects].map(k=>['subjects',k])];
    // Avoid identical rerolls even if randomness is stuck; decreasing cannot add full values.
    for(const [kind,k] of visible){const old=next[kind][k],step=kind==='attrs'?1:.5;next[kind][k]=customAbilityValue(kind,k,old>0?old-step:step);if(!previous.has(customVisibleSignature(next)))break;next[kind][k]=old;}
  }
  draft.customRolls[key]=next;chooseCustomTier(id);
  requestAnimationFrame(()=>document.querySelector(`[data-custom-tier-refresh="${id}"]`)?.focus({preventScroll:true}));
}
function renderCustomAttributes(){
  const cls=campusClass(draft.class_id),selected=['chinese','math','english',...cls.subjects],cap=CUSTOM_STAGE_CAPS[draft.stage],tier=CUSTOM_TIERS.find(t=>t.id===draft.customTier);
  $('#game-root').innerHTML=`<main class="custom-parameters-screen"><section class="custom-parameters-wrap"><button class="ghost-button" data-custom-param-back>← 重新选择年级</button><p class="menu-kicker">我的角色 · 九档开局</p><h1>这次，你想从哪一档开始？</h1><p>${escapeHtml(draft.name)} · ${cls.id}班 ${cls.combo} · ${START_STAGES[draft.stage].label}</p><p class="custom-cap-note">${Number.isFinite(cap)?`本起点每项能力上限 ${cap}。`:'100 天冲刺不设年级限制，人物属性上限 100；语文 140，数学与英语 145，物理/历史/政治/地理 95，化学与生物 100。'}人物属性与全部学科合计，开局满值能力最多 6 项。选择档次后，系统随机拟定能力，不能手动修改。档次越高，能力整体越强；同一档仍有随机差异。</p><div class="custom-tier-grid" role="group" aria-label="从低到高的九个能力档次">${CUSTOM_TIERS.map((t,i)=>`<div class="custom-tier-cell tier-${i}"><button type="button" class="custom-tier-option ${t.id===draft.customTier?'selected':''} tier-${i}" data-custom-tier="${t.id}" aria-pressed="${t.id===draft.customTier}"><small>第 ${i+1} 档</small><b>${t.name}</b><span>${t.desc}</span></button><button type="button" class="custom-tier-refresh" data-custom-tier-refresh="${t.id}" aria-label="刷新${t.name}档能力" title="重新生成${t.name}档能力"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M20 7v5h-5M4 17v-5h5M5.5 8A7 7 0 0 1 18 6l2 3M4 15l2 3a7 7 0 0 0 12.5-2"/></svg></button></div>`).join('')}</div>${tier?`<section class="custom-parameter-card custom-tier-preview tier-${CUSTOM_TIERS.indexOf(tier)}"><div class="custom-tier-preview-heading"><h2>${tier.name} · 你的开局能力</h2><span>已生成 · 只读预览</span></div><h3>人物属性</h3><div class="custom-tier-stats">${ATTRIBUTES.map(([k,l])=>customReadOnlyAbility('attrs',k,l)).join('')}</div><h3>学科能力</h3><div class="custom-tier-stats">${CAMPUS_SUBJECTS.filter(([k])=>selected.includes(k)).map(([k,l])=>customReadOnlyAbility('subjects',k,l)).join('')}</div><p>切换档次会保留已生成结果；点击档次旁的刷新图标，即可重新生成一组不同的数值并选中该档次。</p></section>`:'<p class="custom-tier-placeholder">选择一个档次，查看系统为你生成的开局能力。</p>'}<button class="primary-button custom-parameters-start ${tier?'tier-'+CUSTOM_TIERS.indexOf(tier):''}" data-custom-param-start ${tier?'':'disabled'}>以${tier?'“'+tier.name+'”':'所选档次'}开始高中生活 →</button></section></main>`;
}
function applyCustomParameters(g){
  const tier=CUSTOM_TIERS.find(t=>t.id===draft.customTier);if(!tier||!draft.customParameters)throw Error('请先选择开局档次');
  for(const [key]of ATTRIBUTES)g.attrs[key]=customAbilityValue('attrs',key,draft.customParameters.attrs[key]);
  for(const [key]of CAMPUS_SUBJECTS)g.subjects[key]=customAbilityValue('subjects',key,draft.customParameters.subjects[key]);
  g.initial_custom_parameters={stage:draft.stage,tier:tier.id,tier_name:tier.name,tier_revision:tier.id==='t8'?2:1,model:'normal-censored-v4',attrs:{...g.attrs},subjects:{...g.subjects}};
}
document.addEventListener('click',e=>{
  const b=e.target.closest('button');if(!b||b.disabled)return;
  if(b.dataset.customTierRefresh){refreshCustomTier(b.dataset.customTierRefresh);return;}
  if(b.dataset.customTier)chooseCustomTier(b.dataset.customTier);
  if(b.hasAttribute('data-custom-param-back')){menuScreen='stages';render();}
  if(b.hasAttribute('data-custom-param-start')&&draft.customTier)startGame();
});
