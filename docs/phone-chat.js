// Local test chat scene. AI secrets belong to the local relay, never the save.
let phoneChat=null;
let phoneRequest=null;
let phoneSequence=0;
function resolveChatEndpoint(value){
  const currentLocation=window.location||globalThis.location||{};
  const base=currentLocation.href||`${currentLocation.protocol||'https:'}//${currentLocation.host||'localhost'}${currentLocation.pathname||'/'}`;
  const endpoint=new URL(value||'/api/chat',base);
  const localHosts=['localhost','127.0.0.1','[::1]'];
  const currentOrigin=currentLocation.origin||`${currentLocation.protocol||'https:'}//${currentLocation.host||'localhost'}`;
  if(!['http:','https:'].includes(endpoint.protocol)||(endpoint.origin!==currentOrigin&&!localHosts.includes(endpoint.hostname)))throw Error('请输入同源后台或本机 HTTP 服务地址');
  return endpoint;
}
function phoneHistory(){
  if(!game.chatHistory||typeof game.chatHistory!=='object'||Array.isArray(game.chatHistory))game.chatHistory={};
  const id=phoneChat.friend.id;
  if(!Array.isArray(game.chatHistory[id]))game.chatHistory[id]=[];
  return game.chatHistory[id];
}
function openPhoneChat(id){
  const friend=FRIENDS.find(f=>f.id===id);
  if(!game||!friend)return;
  if(game.actionPoints<=0)return toast('本周行动已经用完');
  if(phoneRequest)phoneRequest.abort();
  phoneChat={friend,owner:game,charged:false,draft:'',error:'',busy:false,sequence:++phoneSequence};
  closeModal(true);renderPhoneChat();
}
function phoneTime(time){return new Date(time).toLocaleTimeString('zh-CN',{hour:'2-digit',minute:'2-digit',hour12:false});}
function renderPhoneChat(){
  if(!phoneChat)return;
  const f=phoneChat.friend,rows=phoneHistory(),last=rows.at(-1);
  if(last?.role==='user'&&!phoneChat.error&&!phoneChat.busy)phoneChat.error='上一条消息还没收到回复，点击重试即可继续。';
  const history=rows.map(row=>`<div class="phone-message ${row.role==='user'?'from-me':'from-npc'}"><span class="phone-avatar">${row.role==='user'?'我':escapeHtml(f.initial)}</span><div><p>${escapeHtml(row.content)}</p><time>${phoneTime(row.time)}</time></div></div>`).join('');
  openModal(`<div class="phone-screen"><div class="phone-status"><span>${phoneTime(Date.now())}</span><span>▮▮▮ Wi-Fi ▰</span></div><header class="phone-heading"><button data-phone-back aria-label="返回游戏">‹</button><div><b>${escapeHtml(f.name)}</b><small>${phoneChat.busy?'对方正在输入…':'校园好友 · '+relationshipLabel(game.relationships[f.id]||0)}</small></div><button data-phone-config aria-label="AI 接口设置">⚙</button></header><div class="phone-channel">青禾聊天 <span>${settings.chatMode==='ai'?(phoneChat.connected?'AI 已连接':'AI 待连接'):'本地关键词回复'}</span></div><div class="phone-messages" role="log" aria-live="polite"><div class="phone-day">${gradeForDay(game.day)} · 第 ${game.day} 天</div>${rows.length?'':`<div class="phone-empty"><span class="phone-empty-avatar">${escapeHtml(f.initial)}</span><b>和${escapeHtml(f.name)}聊聊吧</b><p>${escapeHtml(f.desc)}<br>从今天发生的小事开始也可以。</p><small>${settings.chatMode==='ai'?'当前使用服务器 AI 回复。':'当前使用本地规则匹配回复，并非 AI。'}</small></div>`}${history}${phoneChat.busy?'<div class="phone-typing">正在想怎么回复你…</div>':''}${phoneChat.error?`<div class="phone-error" role="alert">${escapeHtml(phoneChat.error)}${last?.role==='user'?'<button data-phone-retry>重试回复</button>':''}<button data-phone-config>配置接口</button></div>`:''}</div><form id="phone-chat-form" class="phone-compose"><label class="sr-only" for="phone-message-input">给${escapeHtml(f.name)}发消息</label><textarea id="phone-message-input" maxlength="1500" rows="1" placeholder="想说什么都可以…" ${phoneChat.busy?'disabled':''}>${escapeHtml(phoneChat.draft)}</textarea><button type="submit" ${phoneChat.busy?'disabled':''}>发送</button></form><footer class="phone-footnote">${phoneChat.charged?'本次聊天已计入行动，可继续聊':'首次收到回复后消耗 1 次行动'} · 消息随存档保存</footer></div>`,false);
  document.querySelector('#game-dialog').classList.add('phone-dialog');
  const pane=document.querySelector('.phone-messages');if(pane)pane.scrollTop=pane.scrollHeight;
}
function leavePhoneChat(){
  if(phoneRequest)phoneRequest.abort();
  phoneRequest=null;phoneChat=null;++phoneSequence;
  document.querySelector('#game-dialog').classList.remove('phone-dialog');
  closeModal(true);render();
  if(game?.actionPoints===0&&!game.weekendResolved)setTimeout(openWeekend,320);
}
function configurePhoneChat(){
  if(!phoneChat)return;
  if(phoneChat.busy)return toast('等待回复完成，或先返回游戏');
  openModal(`<h2>聊天设置</h2><p>当前模式：${settings.chatMode==='ai'?'AI 接口':'本地关键词回复'}。关键词模式无需密钥或网络，按话题和人物性格匹配预设回复，理解范围有限。</p><div class="dialog-footer"><button class="primary-button" data-phone-local>使用关键词回复</button><button class="ghost-button" data-phone-ai>使用 AI 接口</button></div><p>AI 模式需要游戏后台提供聊天服务，再由后台调用 Ollama；模型地址和密钥不会发送到浏览器。</p><label class="field"><span>后台聊天服务地址</span><input id="phone-endpoint" value="${escapeHtml(settings.chatEndpoint||'/api/chat')}" placeholder="/api/chat"></label><p>默认使用当前站点的 <code>/api/chat</code>。也可填写本机调试服务地址，但不会写入存档。</p><div class="dialog-footer"><button class="ghost-button" data-phone-config-back>返回聊天</button><button class="primary-button" data-phone-config-save>保存地址</button></div>`,false);
  document.querySelector('#game-dialog').classList.remove('phone-dialog');
}
async function sendPhoneMessage(retry=false){
  if(!phoneChat||phoneChat.busy)return;
  const session=phoneChat,owner=game,rows=phoneHistory();
  if(!retry){
    const text=(document.querySelector('#phone-message-input')?.value||session.draft).trim();
    if(!text)return;
    if(text.length>1500)return toast('每条消息最多 1500 字');
    if(rows.at(-1)?.role==='user')return toast('上一条还未得到回复，请点击重试');
    rows.push({role:'user',content:text,time:Date.now()});session.draft='';persist();
  }else if(rows.at(-1)?.role!=='user')return;
  session.busy=true;session.error='';renderPhoneChat();
  const controller=new AbortController();phoneRequest=controller;
  const timer=setTimeout(()=>controller.abort(),45000);
  try{
    let data;
    if(settings.chatMode!=='ai'){data={reply:keywordReply(session.friend.id,rows)};}else{
    const endpoint=resolveChatEndpoint(settings.chatEndpoint);
    const response=await fetch(endpoint.href,{method:'POST',headers:{'Content-Type':'application/json'},signal:controller.signal,body:JSON.stringify({npcId:session.friend.id,messages:rows.slice(-20).map(r=>({role:r.role,content:r.content})),context:{playerName:owner.name,day:owner.day,grade:gradeForDay(owner.day),relationship:owner.relationships[session.friend.id]||0,mood:owner.mood,stress:owner.stress,recentEvents:owner.log.slice(0,5).map(r=>r.text)}})});
    data=await response.json();
    if(!response.ok)throw Error(data.error||'AI 服务暂时不可用');
    }
    if(typeof data.reply!=='string'||!data.reply.trim())throw Error('AI 接口未返回有效回复');
    if(phoneChat!==session||game!==owner)return;
    rows.push({role:'assistant',content:data.reply.trim().slice(0,6000),time:Date.now()});
    if(rows.length>100)rows.splice(0,rows.length-100);
    session.connected=settings.chatMode==='ai';
    if(!session.charged){
      game.actionPoints=Math.max(0,game.actionPoints-1);
      game.relationships[session.friend.id]=clamp((game.relationships[session.friend.id]||0)+3,0,100);
      applyEffects({energy:-3,stress:-5,mood:7,charm:1});
      addLog('你在手机上和'+session.friend.name+'聊了聊。');session.charged=true;
    }
    persist();
  }catch(e){
    if(phoneChat===session)session.error=e.name==='AbortError'?'回复等待超时，请重试。':e instanceof TypeError?'还没连上本地 AI 服务。消息已保留；配置接口后可重试。':e.message;
  }finally{
    clearTimeout(timer);
    if(phoneRequest===controller)phoneRequest=null;
    if(phoneChat===session&&game===owner){session.busy=false;renderPhoneChat();}
  }
}
// Existing social buttons now enter the phone scene instead of an instant result.
resolveSocialChoice=openPhoneChat;
document.addEventListener('click',event=>{
  const b=event.target.closest('button');if(!b||b.disabled)return;
  if(b.hasAttribute('data-phone-back'))leavePhoneChat();
  if(b.hasAttribute('data-phone-local')||b.hasAttribute('data-phone-ai')){settings.chatMode=b.hasAttribute('data-phone-local')?'keyword':'ai';persistSettings();phoneChat.error='';renderPhoneChat();}
  if(b.hasAttribute('data-phone-config'))configurePhoneChat();
  if(b.hasAttribute('data-phone-config-back'))renderPhoneChat();
  if(b.hasAttribute('data-phone-config-save')){
    try{const value=document.querySelector('#phone-endpoint').value.trim();resolveChatEndpoint(value);settings.chatEndpoint=value||'/api/chat';persistSettings();phoneChat.error='';renderPhoneChat();}catch{toast('请输入同源后台或本机 HTTP 服务地址');}
  }
  if(b.hasAttribute('data-phone-retry'))sendPhoneMessage(true);
});
document.addEventListener('input',event=>{if(event.target.id==='phone-message-input'&&phoneChat)phoneChat.draft=event.target.value;});
document.addEventListener('submit',event=>{if(event.target.id==='phone-chat-form'){event.preventDefault();sendPhoneMessage();}});
document.addEventListener('keydown',event=>{
  if(event.target.id==='phone-message-input'&&event.key==='Enter'&&!event.shiftKey&&!event.isComposing){event.preventDefault();sendPhoneMessage();}
  if(event.key==='Escape'&&phoneChat)leavePhoneChat();
});
