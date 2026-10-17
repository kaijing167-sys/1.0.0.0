// Five slots for the same game object. Static hosting stores slots locally.
let journeySlotRows=[];
let journeySlotsBusy=false;
const JOURNEY_SLOTS_KEY='qinghe-journey-slots-v1';
function journeyServer(){return location.pathname.startsWith('/play/')&&/^https?:$/.test(location.protocol)}
async function journeyRequest(path='',options={}){
  let token=localStorage.getItem('qinghe-journey-token-v1');
  if(!/^[a-f0-9]{64}$/.test(token||'')){token=Array.from(crypto.getRandomValues(new Uint8Array(32)),v=>v.toString(16).padStart(2,'0')).join('');localStorage.setItem('qinghe-journey-token-v1',token);}
  const r=await fetch('/api/saves'+path,{...options,headers:{'Content-Type':'application/json','X-Save-Token':token}});
  if(!r.ok)throw Error(r.status===409?'存档已变化，请重新打开列表':'存档请求失败（'+r.status+'）');
  return r.status===204?null:r.json();
}
async function journeySlots(){
  if(!game)return;
  try{
    journeySlotRows=journeyServer()?(await journeyRequest()).slots:JSON.parse(localStorage.getItem(JOURNEY_SLOTS_KEY)||'[]');
    openModal(`<h2>进度存档槽</h2><p>${journeyServer()?'数据库保存':'当前浏览器保存，可另行导出JSON备份'} · 人物、班级与剧情统一保存</p>${[1,2,3,4,5].map(slot=>{const row=journeySlotRows.find(r=>r.slot===slot);return `<section class="class-row"><b>存档 ${slot} · ${escapeHtml(row&&!row.empty?row.name:'空')}</b><p><button data-journey-save="${slot}">保存当前进度</button> <button data-journey-load="${slot}" ${!row||row.empty?'disabled':''}>恢复</button> <button data-journey-delete="${slot}" ${!row||row.empty?'disabled':''}>删除</button></p></section>`;}).join('')}`);
  }catch(e){toast(e.message);}
}
async function journeySlotAction(action,slot){
  if(journeySlotsBusy)return;
  const row=journeySlotRows.find(r=>r.slot===slot);
  if(!confirm(action==='save'?'将当前进度保存到此槽？已有内容会被替换。':action==='load'?'恢复此槽并替换当前进度？':'删除此槽？'))return;
  journeySlotsBusy=true;
  try{
    if(action==='load'){
      const saved=journeyServer()?await journeyRequest('/'+slot):row;
      const next=campusValidate(JSON.parse(JSON.stringify(saved.state)));
      localStorage.setItem(SAVE_KEY,JSON.stringify(next));game=next;closeModal(true);render();toast('已恢复人物、班级和旅程进度');
    }else{
      const revision=row?.revision||0;
      const name=game.name+' · 第'+game.day+'天';
      if(journeyServer())await journeyRequest('/'+slot+(action==='delete'?'?expected_revision='+revision:''),{method:action==='save'?'PUT':'DELETE',...(action==='save'?{body:JSON.stringify({name,expected_revision:revision,state:campusValidate(JSON.parse(JSON.stringify(game)))})}:{})});
      else{
        const rows=journeySlotRows.filter(r=>r.slot!==slot);
        rows.push({slot,name,revision:revision+1,empty:action==='delete',state:action==='save'?campusValidate(JSON.parse(JSON.stringify(game))):null});
        localStorage.setItem(JOURNEY_SLOTS_KEY,JSON.stringify(rows));
      }
      await journeySlots();toast(action==='save'?'进度已保存':'存档已删除');
    }
  }catch(e){toast(e.message);}finally{journeySlotsBusy=false;}
}
document.addEventListener('click',e=>{
  const b=e.target.closest('button');if(!b||b.disabled)return;
  if(b.hasAttribute('data-journey-slots'))journeySlots();
  for(const action of ['save','load','delete']){const value=b.getAttribute('data-journey-'+action);if(value)journeySlotAction(action,Number(value));}
});
