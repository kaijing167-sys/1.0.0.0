(function(){
  if(!new URLSearchParams(location.search).has("review"))return;
  const key='qinghe-ui-reviews-v1';
  let reviews=load(),active=false,target=null,editingId=null;
  const $=s=>document.querySelector(s);

  function load(){
    try{return JSON.parse(localStorage.getItem(key))||[]}catch{return[]}
  }
  function save(){localStorage.setItem(key,JSON.stringify(reviews));render();applyMarkers()}
  function toast(text){const el=$('#review-toast');el.textContent=text;el.classList.add('show');clearTimeout(el._timer);el._timer=setTimeout(()=>el.classList.remove('show'),1800)}
  function escapeHtml(value){return String(value??'').replace(/[&<>"']/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]))}
  function currentPage(){return (location.hash.slice(1)||'home').split('?')[0]}
  function textOf(el){return (el.innerText||el.getAttribute('aria-label')||el.value||el.getAttribute('title')||el.tagName).trim().replace(/\s+/g,' ').slice(0,100)}
  function isOwn(el){return !!(el&&el.closest&&el.closest('#review-tool,#review-panel,#review-toast'))}
  function selectorFor(el){
    if(el.id)return '#'+CSS.escape(el.id);
    const data=['data-go','data-action','data-shop','data-gift','data-subject','data-track','data-remember'].find(name=>el.hasAttribute(name));
    if(data)return `${el.tagName.toLowerCase()}[${data}="${CSS.escape(el.getAttribute(data))}"]`;
    const path=[];
    while(el&&el.nodeType===1&&el!==document.body){
      let part=el.tagName.toLowerCase();
      const classes=[...el.classList].filter(name=>name&&!name.startsWith('review-')).slice(0,2);
      if(classes.length)part+='.'+classes.map(CSS.escape).join('.');
      const siblings=el.parentElement?[...el.parentElement.children].filter(x=>x.tagName===el.tagName):[];
      if(siblings.length>1)part+=`:nth-of-type(${siblings.indexOf(el)+1})`;
      path.unshift(part);
      if(el.id){path[0]='#'+CSS.escape(el.id);break}
      el=el.parentElement;
    }
    return path.join(' > ');
  }
  function findTarget(selector){
    try{return document.querySelector(selector)}catch{return null}
  }
  function applyMarkers(){
    document.querySelectorAll('.review-has-note').forEach(el=>{el.classList.remove('review-has-note');el.removeAttribute('data-review-count')});
    const counts={};
    for(const item of reviews){
      if(item.resolved||item.page!==currentPage())continue;
      counts[item.selector]=(counts[item.selector]||0)+1;
    }
    for(const [selector,count] of Object.entries(counts)){
      const el=findTarget(selector);if(!el||isOwn(el))continue;
      el.classList.add('review-has-note');el.dataset.reviewCount=String(count);
    }
  }
  function render(){
    $('#review-count').textContent=String(reviews.filter(x=>!x.resolved).length);
    $('#review-count').classList.toggle('has-notes',reviews.some(x=>!x.resolved));
    const list=$('#review-list');
    if(!reviews.length){list.innerHTML='<div id="review-empty">还没有批注。<br>开启批注模式后，点击页面上想调整的区域即可。</div>';return}
    list.innerHTML=reviews.map((item,index)=>`<article class="review-item" data-id="${item.id}"><div class="review-item-top"><b>#${index+1} · ${escapeHtml(item.page)}</b><span>${item.resolved?'已完成':'待处理'}</span></div><p>${escapeHtml(item.note)}</p><small>定位：${escapeHtml(item.selector)}</small><div class="review-item-actions"><button data-review-locate="${item.id}">定位</button><button data-review-resolve="${item.id}">${item.resolved?'重新打开':'标记完成'}</button><button data-review-delete="${item.id}">删除</button></div></article>`).join('');
  }
  function openEditor(el){
    target=el;editingId=null;
    $('#review-panel').classList.add('open');
    $('#review-target').textContent=`${currentPage()} · ${selectorFor(el)}\n${textOf(el)}`;
    $('#review-note').value='';$('#review-save').textContent='保存批注';$('#review-note').focus();
  }
  function editReview(item){
    target=findTarget(item.selector);editingId=item.id;
    $('#review-target').textContent=`${item.page} · ${item.selector}\n${item.elementText||''}`;
    $('#review-note').value=item.note;$('#review-save').textContent='更新批注';$('#review-note').focus();
  }
  function setMode(next){
    active=next;document.body.classList.toggle('review-mode',active);$('#review-tool').classList.toggle('active',active);$('#review-panel').classList.toggle('open',active);
    if(!active)clearHighlight();
    toast(active?'批注模式已开启，点击页面元素':'批注模式已关闭');
  }
  function clearHighlight(){document.querySelectorAll('.review-highlight').forEach(el=>el.classList.remove('review-highlight'))}
  function highlight(el){clearHighlight();if(el&&!isOwn(el))el.classList.add('review-highlight')}
  function markdown(){
    if(!reviews.length)return '# 界面批注\n\n暂无批注。';
    const open=reviews.filter(x=>!x.resolved);
    return '# 界面批注\n\n'+open.map((item,index)=>`${index+1}. **${item.page}**\n   - 位置：\`${item.selector}\`\n   - 原文：${item.elementText||'（无）'}\n   - 问题/建议：${item.note}`).join('\n\n');
  }
  async function copyText(text){
    try{await navigator.clipboard.writeText(text)}catch{
      const area=document.createElement('textarea');area.value=text;document.body.appendChild(area);area.select();document.execCommand('copy');area.remove();
    }
    toast('已复制，直接粘贴到对话里');
  }
  function download(){
    const blob=new Blob([JSON.stringify({exportedAt:new Date().toISOString(),reviews},null,2)],{type:'application/json'});
    const link=document.createElement('a');link.href=URL.createObjectURL(blob);link.download='qinghe-ui-reviews.json';link.click();setTimeout(()=>URL.revokeObjectURL(link.href),1000);
  }
  function build(){
    document.body.insertAdjacentHTML('beforeend',`<div id="review-tool"><button id="review-toggle" title="开启界面批注模式">✎ 批注</button><span id="review-count"></span></div><aside id="review-panel" aria-label="界面批注"><header><div><h2>界面批注</h2><small>点击元素，写下要优化的地方</small></div><button id="review-close" title="关闭批注面板">×</button></header><section id="review-editor"><div id="review-target">选择页面元素后，在这里填写建议。</div><textarea id="review-note" placeholder="例如：这个按钮太小，移动端不容易点；标题换行位置不自然……"></textarea><div id="review-actions"><button id="review-save">保存批注</button><button id="review-cancel">取消</button></div></section><div id="review-list"></div><footer><button id="review-copy" class="primary">复制给 Codex</button><button id="review-export">导出 JSON</button><button id="review-clear">清空</button></footer></aside><div id="review-toast"></div>`);
    $('#review-toggle').onclick=()=>setMode(!active);
    $('#review-close').onclick=()=>setMode(false);
    $('#review-cancel').onclick=()=>{target=null;editingId=null;$('#review-note').value='';$('#review-target').textContent='选择页面元素后，在这里填写建议。';clearHighlight()};
    $('#review-save').onclick=()=>{
      const note=$('#review-note').value.trim();if(!note)return toast('先写下要优化的地方');
      if(editingId){const item=reviews.find(x=>x.id===editingId);if(item)item.note=note;}
      else{
        if(!target)return toast('先在页面上点一个元素');
        reviews.unshift({id:Date.now().toString(36)+Math.random().toString(36).slice(2,6),page:currentPage(),selector:selectorFor(target),elementText:textOf(target),note,createdAt:new Date().toISOString(),resolved:false});
      }
      target=null;editingId=null;save();$('#review-note').value='';$('#review-target').textContent='批注已保存，继续点击页面元素。';toast('批注已保存');
    };
    $('#review-copy').onclick=()=>copyText(markdown());
    $('#review-export').onclick=download;
    $('#review-clear').onclick=()=>{if(confirm('清空全部批注？')){reviews=[];save();toast('批注已清空')}};
    $('#review-panel').addEventListener('click',e=>{
      const locate=e.target.closest('[data-review-locate]');if(locate){const item=reviews.find(x=>x.id===locate.dataset.reviewLocate);if(item){setMode(false);location.hash=item.page;setTimeout(()=>{const el=findTarget(item.selector);if(el){el.scrollIntoView({behavior:'smooth',block:'center'});highlight(el);setTimeout(clearHighlight,2200)}else toast('页面结构已变化，请重新定位')},80)}return}
      const resolve=e.target.closest('[data-review-resolve]');if(resolve){const item=reviews.find(x=>x.id===resolve.dataset.reviewResolve);if(item){item.resolved=!item.resolved;save();toast(item.resolved?'已标记完成':'已重新打开')}return}
      const del=e.target.closest('[data-review-delete]');if(del){reviews=reviews.filter(x=>x.id!==del.dataset.reviewDelete);save();toast('批注已删除');return}
      const edit=e.target.closest('.review-item p');if(edit){const item=reviews.find(x=>x.id===edit.closest('.review-item').dataset.id);if(item)editReview(item)}
    });
    document.addEventListener('mouseover',e=>{if(active&&!isOwn(e.target))highlight(e.target)},true);
    document.addEventListener('mouseout',e=>{if(active)clearHighlight()},true);
    document.addEventListener('click',e=>{
      if(!active||isOwn(e.target))return;
      e.preventDefault();e.stopImmediatePropagation();openEditor(e.target);
    },true);
    document.addEventListener('keydown',e=>{if(e.key==='Escape'){if(active)setMode(false);else $('#review-panel').classList.remove('open')}});
    const markerRoot=$('#game-root')||$('#main')||document.body;
    new MutationObserver(()=>requestAnimationFrame(applyMarkers)).observe(markerRoot,{childList:true,subtree:true});
    render();applyMarkers();
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',build);else build();
})();
