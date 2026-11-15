const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const source=file=>fs.readFileSync(path.join(__dirname,'../frontend',file),'utf8');
function dialogue(){
 const context=vm.createContext({});
 vm.runInContext(source('keyword-chat.js'),context);
 const reply=(id,text,rows=[])=>vm.runInContext('keywordReply('+JSON.stringify(id)+','+JSON.stringify([...rows,{role:'user',content:text}])+')',context);
 return {context,reply};
}
test('MBTI changes the response focus for the same exam, choice and conflict',()=>{
 const {reply}=dialogue();
 const exam=['liqiang','su','lin'].map(id=>reply(id,'这次没考好'));
 assert.equal(new Set(exam).size,3);
 assert.match(exam[0],/哪一科|哪.*题|一处/);
 assert.match(exam[1],/努力|价值|失落/);
 assert.match(exam[2],/喝.*水|安静|慢慢/);
 assert.match(reply('liqiang','两个活动我该怎么选'),/时间|代价|试/);
 assert.match(reply('su','两个活动我该怎么选'),/自己|在意|生活/);
 assert.match(reply('lin','两个活动我该怎么选'),/感受|体验|自在/);
 assert.match(reply('liqiang','跟朋友吵架了'),/发生|改变|说清楚/);
 assert.match(reply('su','跟朋友吵架了'),/尊重|底线|委屈/);
 assert.match(reply('lin','跟朋友吵架了'),/离开|缓缓|不舒服/);
});
test('every everyday topic has three voices, short dialogue, and no unsolicited personality labels',()=>{
 const {context,reply}=dialogue();
 for(const topic of vm.runInContext('Object.keys(KEYWORD_REPLIES)',context)){
   const voices=vm.runInContext('KEYWORD_REPLIES['+JSON.stringify(topic)+']',context);
   assert.equal(voices.length,3);
   assert.equal(new Set(voices.map(v=>v[0])).size,3,topic);
   for(const choices of voices)for(const text of choices){
     assert.ok((text.match(/[？?]/g)||[]).length<=1,topic+': '+text);
     assert.ok((text.match(/[。！？!?]/g)||[]).length<=3,topic+': '+text);
     if(topic!=='personality')assert.doesNotMatch(text,/INFP|ESTP|ISFP/);
   }
 }
 const first=reply('su','压力好大');
 const second=reply('su','压力好大',[{role:'user',content:'压力好大'},{role:'assistant',content:first}]);
 assert.notEqual(first,second);
 assert.match(reply('su','嗯'),/意味|理解/);
 assert.match(reply('lin','听音乐'),/旋律|音色/);
 assert.match(reply('su','听音乐'),/歌词|重要|说出口/);
 for(const [id,mbti] of [['liqiang','ESTP'],['su','INFP'],['lin','ISFP']])assert.match(reply(id,'你的MBTI是什么'),new RegExp(mbti));
 for(const id of ['liqiang','su','lin'])assert.match(reply(id,'我不想活了，怎么选'),/信任|可信任|家人|老师/);
});
test('chat style stays consistent with the MBTI displayed in profiles and mirrored website assets',()=>{
 const {context}=dialogue();
 const rosterContext=vm.createContext({document:{addEventListener(){}}});
 vm.runInContext(source('roster.js'),rosterContext);
 const npcs=JSON.parse(vm.runInContext('JSON.stringify(CAMPUS_NPCS)',rosterContext));
 for(const n of npcs)assert.equal(vm.runInContext('KEYWORD_PERSONALITIES['+JSON.stringify(n.id)+'].mbti',context),n.mbti);
 assert.equal(source('keyword-chat.js'),fs.readFileSync(path.join(__dirname,'../docs/keyword-chat.js'),'utf8'));
 assert.match(source('index.html'),/keyword-chat\.js\?v=3/);
});
function phoneHarness(mode){
 const elements=new Map();
 const el=id=>{if(!elements.has(id))elements.set(id,{value:'',classList:{add(){},remove(){}},focus(){}});return elements.get(id)};
 const context=vm.createContext({
  document:{addEventListener(){},querySelector:el},window:{},URL,AbortController,TextDecoder,
  settings:{chatMode:mode},escapeHtml:x=>String(x),closeModal(){},openModal(){},render(){},toast(){},
  gradeForDay:()=> '高三',relationshipLabel:()=> '普通同学',persist(){},applyEffects(){},addLog(){},
  clamp:(x,a,b)=>Math.max(a,Math.min(b,x)),setTimeout:()=>0,clearTimeout(){},
  fetch:async()=>{throw new TypeError('offline')}
 });
 vm.runInContext(source('roster.js'),context);
 vm.runInContext(source('keyword-chat.js'),context);
 vm.runInContext("var resolveSocialChoice;const FRIENDS=[{id:'liqiang',name:'李强',initial:'强',desc:''},{id:'su',name:'苏若云',initial:'云',desc:''},{id:'lin',name:'林婉儿',initial:'婉',desc:''}];var game={name:'小禾',day:993,actionPoints:4,relationships:{},log:[]}",context);
 vm.runInContext(source('phone-chat.js'),context);
 return {el,run:s=>vm.runInContext(s,context)};
}
test('real phone sends use MBTI voices locally, on the AI fast path, and after AI failure',async()=>{
 for(const mode of ['keyword','ai'])for(const [id,pattern] of [['liqiang',/哪一科|哪.*题|一处/],['su',/努力|价值|失落/],['lin',/喝.*水|安静|慢慢/]]){
   const h=phoneHarness(mode);
   h.run('openPhoneChat('+JSON.stringify(id)+')');h.el('#phone-message-input').value='这次没考好';
   await h.run('sendPhoneMessage()');
   assert.match(h.run('phoneHistory().at(-1).content'),pattern);
   assert.equal(h.run('game.actionPoints'),3);
   h.el('#phone-message-input').value='你好';
   await h.run('sendPhoneMessage()');
   assert.match(h.run('phoneHistory().at(-1).content'),id==='su'?/希望|想说/:id==='lin'?/耳机|歌|小事/:/新鲜|来了/);
   assert.equal(h.run('game.actionPoints'),3);
 }
});
