const SAVE_KEY = "qinghe-game-v2";
const SETTINGS_KEY = "qinghe-game-settings-v1";
const TOTAL_DAYS = 1092;
const DAYS_PER_WEEK = 7;
const BASE_ATTR = 50;
const EXTRA_POINTS = 40;
const DEFAULT_SETTINGS = {
  largeText: false,
  compact: false,
  reducedMotion: false,
  actionsPerWeek: 4,
  autoEvents: true,
  confirmEarlyWeek: true,
  musicEnabled: true,
  eventMusic: true,
  musicVolume: 25,
};

const ATTRIBUTES = [
  ["insight", "学力", "影响学习效率与考试发挥"],
  ["stamina", "体质", "影响体能、压力和恢复"],
  ["mindset", "心态", "影响压力抵抗与关键选择"],
  ["charm", "魅力", "影响社交与人物关系"],
];

const PRESETS = {
  balanced: {insight: 60, stamina: 60, mindset: 60, charm: 60},
  scholar: {insight: 75, stamina: 50, mindset: 65, charm: 50},
  athlete: {insight: 50, stamina: 75, mindset: 65, charm: 50},
  social: {insight: 55, stamina: 55, mindset: 60, charm: 70},
};

const SUBJECTS = [
  ["chinese", "语文"],
  ["math", "数学"],
  ["english", "英语"],
  ["science", "理科"],
  ["humanities", "文科"],
];

const MUSIC_THEMES = {
  bright: {
    label: "美好 · 欢快",
    tracks: [
      ["bright-qinghuaci", "青花瓷"],
      ["bright-qingtian", "晴天"],
      ["bright-daoxiang", "稻香"],
      ["bright-summer-wind", "夏天的风"],
      ["bright-childhood", "童年"],
      ["bright-beautiful-wind", "最美的风"],
      ["bright-beauty-beat", "Beauty and Beat"],
    ],
  },
  love: {
    label: "恋爱",
    tracks: [
      ["love-us", "我们俩"],
      ["love-high-heels", "纯高跟鞋"],
      ["love-courage", "勇气"],
      ["love-friends", "普通朋友"],
      ["love-nothing-wrong", "有何不可"],
      ["love-love-song", "情歌"],
      ["love-like-you", "喜欢你"],
    ],
  },
  breakup: {
    label: "分手",
    tracks: [
      ["breakup-miss", "我怀念的"],
      ["breakup-quiet", "安静"],
      ["breakup-rain-love", "雨爱"],
      ["breakup-preference", "偏爱（痛）"],
      ["breakup-step-back", "退后"],
      ["breakup-serious-snow", "认真的雪"],
    ],
  },
  sad: {
    label: "忧伤",
    tracks: [
      ["sad-ten-years", "十年"],
      ["sad-see-you-again", "See You Again"],
    ],
  },
  calm: {
    label: "舒缓",
    tracks: [
      ["calm-mitsuha", "三葉のテーマ"],
      ["calm-sacred-place", "Sacred Play Secret Place"],
      ["calm-magnolia", "Magnolia"],
    ],
  },
  tense: {
    label: "紧张 · 轻快",
    tracks: [["tense-life-line", "Life Line"]],
  },
  focus: {
    label: "学习 · 专注",
    tracks: [["focus-life-line", "Life Line"]],
  },
  sadEn: {
    label: "忧伤 · 英文",
    tracks: [
      ["saden-memories", "Memories"],
      ["saden-free-lucky", "Free lucky"],
      ["saden-merry-christmas", "Merry Christmas…"],
    ],
  },
  pain: {
    label: "痛 · 心碎向",
    tracks: [
      ["pain-call-of-silence", "Call of Silence"],
      ["pain-born-a-stranger", "Born a Stranger"],
      ["pain-south-city-flowers", "城南花已开"],
    ],
  },
  regret: {
    label: "遗憾",
    tracks: [
      ["regret-hanabi", "Hanabi（烟火）"],
      ["regret-truth", "The truth that you leave"],
      ["regret-farewell", "诀别书"],
      ["regret-dont-talk", "We don't Talk Anymore"],
    ],
  },
};

const EVENT_MUSIC = {
  opening: "bright",
  military: "focus",
  monthly_1: "tense",
  class_election: "bright",
  midterm_1: "tense",
  sports_meet: "bright",
  final_1: "tense",
  direction: "calm",
  summer: "bright",
  midterm_2: "tense",
  arts_festival: "bright",
  midterm_3: "tense",
  stress: "sad",
  mock_1: "tense",
  pledge: "tense",
  mock_2: "tense",
  graduation: "regret",
  gaokao: "tense",
};

const WEEKEND_ACTIVITIES = [
  {
    title: "周末到了，时间交给你。",
    text: "不用赶路，也不用比较。选一件今天最想做的事。",
    choices: [
      {label: "去图书馆自习", hint: "成绩提高，但会消耗一些精力。", effects: {energy: -8, stress: 5, subjects: {math: 3, chinese: 2, english: 2}}, result: "安静的午后，你把错题重新梳理了一遍。"},
      {label: "和朋友去河边走走", hint: "放松心情，拉近关系。", effects: {energy: 5, stress: -14, mood: 14, charm: 1}, result: "风吹过河面，你们聊了很多没说出口的话。"},
      {label: "去球场出一身汗", hint: "恢复体力，缓解压力。", effects: {energy: 8, stress: -10, mood: 9}, result: "跑动和呼吸让脑子重新变得清醒。"},
      {label: "在家好好睡一觉", hint: "恢复大量体力。", effects: {energy: 28, stress: -18, mood: 5}, result: "没有闹钟的下午，疲惫慢慢散开。"},
    ],
  },
];

const EVENTS = [
  {
    id: "opening",
    day: 1,
    title: "开学第一天",
    eyebrow: "主线 · 新的开始",
    text: "你背着新书包走进青禾高中的校门。公告栏前挤满新生，从今天起，距离高考还有 1092 天。",
    choices: [
      {label: "主动认识同桌", hint: "魅力提升，心情变好。", effects: {mood: 10, charm: 1}, result: "你率先打了招呼，陌生感少了一点。"},
      {label: "先整理学习计划", hint: "学习基础提升，压力略增。", effects: {stress: 5, subjects: {math: 2, chinese: 2}}, result: "你把三年目标写进笔记本，第一页很认真。"},
    ],
  },
  {
    id: "military",
    day: 8,
    title: "军训的下马威",
    eyebrow: "第 2 周 · 青春片段",
    text: "烈日下的军姿让所有人叫苦。教官说，坚持到最后的人可以先去休息。",
    choices: [
      {label: "咬牙坚持", hint: "体能提升，压力增加。", effects: {energy: -12, stress: 9, stamina: 1}, result: "你站到了最后，腿在发抖，但心里很稳。"},
      {label: "和同学互相打气", hint: "关系变好，体能略降。", effects: {energy: -6, stress: -3, mood: 12, charm: 1}, result: "有人悄悄递给你一瓶水，这三天变得没那么难熬。"},
    ],
  },
  {
    id: "monthly_1",
    day: 30,
    type: "exam",
    title: "第一次月考",
    eyebrow: "自动触发 · 考试",
    text: "高中的第一次正式考试到了。题型比初中更灵活，考场里只剩下笔尖摩擦答题卡的声音。",
    difficulty: 0,
  },
  {
    id: "class_election",
    day: 50,
    title: "班委选举",
    eyebrow: "第 8 周 · 校园事件",
    text: "班主任宣布开始竞选班委。你犹豫着要不要站起来。",
    choices: [
      {label: "竞选学习委员", hint: "学习与社交都会受到影响。", effects: {stress: 8, subjects: {chinese: 2, math: 1}, charm: 1}, result: "你站上讲台，磕磕绊绊地讲完了自己的计划。"},
      {label: "安静做自己的事", hint: "压力较低，专注自身。", effects: {energy: 3, stress: -4, mindset: 1}, result: "你把更多时间留给了自己。"},
    ],
  },
  {
    id: "midterm_1",
    day: 92,
    type: "exam",
    title: "高一期中考试",
    eyebrow: "自动触发 · 考试",
    text: "半个学期过去了。这次成绩将成为分班和老师判断的重要参考。",
    difficulty: 1,
  },
  {
    id: "sports_meet",
    day: 130,
    title: "秋季运动会",
    eyebrow: "第 19 周 · 校园事件",
    text: "班里报名还差一个人。操场上的呐喊声已经响了起来。",
    choices: [
      {label: "报名接力赛", hint: "体能和勇气提升。", effects: {energy: -15, stress: 6, mood: 16, stamina: 1}, result: "最后一棒冲线时，全班都在叫你的名字。"},
      {label: "负责后勤与拍照", hint: "轻松一些，关系提升。", effects: {energy: -4, mood: 10, charm: 1}, result: "你记下了许多笑脸，也拥有了第一张班级合照。"},
    ],
  },
  {
    id: "final_1",
    day: 175,
    type: "exam",
    title: "高一期末考试",
    eyebrow: "自动触发 · 考试",
    text: "一学年的第一次大考。你要带着这一年的积累，给出自己的答案。",
    difficulty: 2,
  },
  {
    id: "direction",
    day: 215,
    title: "文理分科意向",
    eyebrow: "主线 · 分岔路口",
    text: "分科表发到了手里。每个选择都会改变之后的学习重点。",
    choices: [
      {label: "选择理科", hint: "理科能力提升，文科略降。", effects: {subjects: {science: 10, humanities: -4, math: 4}}, result: "你选择了数字与公式，也选择了一条更漫长的路。"},
      {label: "选择文科", hint: "文科能力提升，理科略降。", effects: {subjects: {humanities: 10, science: -4, chinese: 4}}, result: "你决定沿着文字与历史继续追问世界。"},
      {label: "暂时保持均衡", hint: "压力略增，但保留更多可能。", effects: {stress: 8, mindset: 1}, result: "你没有急着定义自己，先把眼前的路走稳。"},
    ],
  },
  {
    id: "summer",
    day: 260,
    title: "暑假的岔路",
    eyebrow: "第 38 周 · 假期事件",
    text: "这个暑假没有老师盯着你，时间第一次真正属于自己。",
    choices: [
      {label: "参加竞赛集训", hint: "学业提升明显，压力增加。", effects: {energy: -18, stress: 15, subjects: {science: 8, math: 5}}, result: "最难的那道题终于有了答案。"},
      {label: "去便利店打工", hint: "赚到零花钱，理解生活。", effects: {energy: -12, money: 260, mood: 6}, result: "站了一整天后，你第一次认真计算每一笔钱。"},
      {label: "旅行或读书", hint: "放松心境，扩展视野。", effects: {energy: 10, stress: -20, mood: 18, charm: 1}, result: "你见了不一样的天空，也更清楚想去哪里。"},
    ],
  },
  {
    id: "midterm_2",
    day: 330,
    type: "exam",
    title: "高二第一次月考",
    eyebrow: "自动触发 · 考试",
    text: "新教室、新课程，一切重新开始。这次考试会检验你是否适应了新的节奏。",
    difficulty: 2,
  },
  {
    id: "arts_festival",
    day: 390,
    title: "校园艺术节",
    eyebrow: "第 56 周 · 校园事件",
    text: "舞台灯光亮起，台下坐满了同学。你被推到了报名表前。",
    choices: [
      {label: "上台表演", hint: "魅力大幅提升，压力增加。", effects: {energy: -10, stress: 10, mood: 20, charm: 2}, result: "你听见自己的心跳，也听见了掌声。"},
      {label: "留在幕后帮忙", hint: "稳定心情，关系提升。", effects: {energy: -5, stress: -3, mood: 9, charm: 1}, result: "一场顺利的演出，也有你安静的一份功劳。"},
    ],
  },
  {
    id: "midterm_3",
    day: 470,
    type: "exam",
    title: "高二期中考试",
    eyebrow: "自动触发 · 考试",
    text: "距离高考越来越近，成绩的每一次波动都变得具体。",
    difficulty: 3,
  },
  {
    id: "stress",
    day: 540,
    title: "低谷与雨夜",
    eyebrow: "主线 · 心态考验",
    text: "连续几次失误让你开始怀疑自己。晚自习结束后，雨还没有停。",
    choices: [
      {label: "独自留在教室复盘", hint: "成绩提升，但压力明显增加。", effects: {energy: -15, stress: 18, subjects: {math: 5, chinese: 3, english: 3}}, result: "你终于找到问题所在，也第一次感到疲惫如此真实。"},
      {label: "给朋友打电话", hint: "心情恢复，压力下降。", effects: {stress: -22, mood: 16, charm: 1}, result: "电话那头没有讲大道理，只是陪你沉默了一会儿。"},
    ],
  },
  {
    id: "mock_1",
    day: 660,
    type: "exam",
    title: "高三第一次模拟考",
    eyebrow: "自动触发 · 考试",
    text: "高三的第一次大规模模拟。排名会贴在走廊最显眼的位置。",
    difficulty: 4,
  },
  {
    id: "pledge",
    day: 760,
    title: "百日誓师大会",
    eyebrow: "主线 · 冲刺开始",
    text: "横幅挂满教学楼，所有人都在大声喊出自己的目标。你站在人群里，听见自己的心跳。",
    choices: [
      {label: "写下最高目标", hint: "压力提升，学习动力增强。", effects: {stress: 15, mindset: 2, subjects: {math: 3, chinese: 3, english: 3}}, result: "你把目标写得很高，也决定为此承担代价。"},
      {label: "写下稳稳的目标", hint: "心态提升，保持节奏。", effects: {stress: -5, mindset: 2, mood: 10}, result: "你决定不追逐别人的速度，只跑好自己的路。"},
    ],
  },
  {
    id: "mock_2",
    day: 860,
    type: "exam",
    title: "高考二模",
    eyebrow: "自动触发 · 考试",
    text: "最后一次大规模排位。你需要在压力里找到最稳定的自己。",
    difficulty: 5,
  },
  {
    id: "graduation",
    day: 1015,
    title: "毕业典礼",
    eyebrow: "主线 · 告别",
    text: "教室里的书本被一摞摞搬走。黑板上留下所有人的名字，窗外蝉鸣很响。",
    choices: [
      {label: "和每个人认真告别", hint: "心情和魅力提升。", effects: {stress: -10, mood: 25, charm: 2}, result: "你记住了很多张脸，也认真说了再见。"},
      {label: "再看一遍错题本", hint: "成绩提升，留下一点遗憾。", effects: {energy: -8, stress: 8, subjects: {math: 3, chinese: 2, english: 2}}, result: "你把最后几页翻完，才慢慢合上笔记本。"},
    ],
  },
  {
    id: "gaokao",
    day: 1092,
    type: "gaokao",
    title: "高考",
    eyebrow: "最终决战",
    text: "你走进考场。三年的清晨、深夜、笑声和眼泪，都将在这里写下答案。",
    difficulty: 6,
  },
];

let settings = loadSettings();
let game = loadGame();
let draft = {
  name: "",
  attrs: {...PRESETS.balanced},
  preset: "balanced",
};
let currentModal = null;
let modalLocked = false;
const musicAudio = [new Audio(), new Audio()];
let musicCache = new Map();
let musicUrlCache = new Map();
let activeAudioIndex = 0;
let currentMusicTrack = null;
let currentMusicTheme = "calm";
let musicRotation = {};

applyPreferences();
musicAudio.forEach(audio=>{audio.loop=true;audio.preload="auto";audio.volume=0});

function $(selector){return document.querySelector(selector)}
function clamp(value,min=0,max=100){return Math.max(min,Math.min(max,value))}
function escapeHtml(value){return String(value??"").replace(/[&<>"']/g,ch=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[ch]))}
function loadGame(){
  try{
    const data=JSON.parse(localStorage.getItem(SAVE_KEY));
    if(!data||data.version!==2)return null;
    if(!Array.isArray(data.pendingEvents))data.pendingEvents=[];
    return data;
  }catch{return null}
}
function loadSettings(){
  try{
    return {...DEFAULT_SETTINGS,...JSON.parse(localStorage.getItem(SETTINGS_KEY)||"{}")};
  }catch{return {...DEFAULT_SETTINGS}}
}
function persistSettings(){
  localStorage.setItem(SETTINGS_KEY,JSON.stringify(settings));
  applyPreferences();
}
function applyPreferences(){
  document.body.classList.toggle("pref-large",!!settings.largeText);
  document.body.classList.toggle("pref-compact",!!settings.compact);
  document.body.classList.toggle("pref-reduced-motion",!!settings.reducedMotion);
}
function musicTrackCount(){
  return Object.values(MUSIC_THEMES).reduce((total,theme)=>total+theme.tracks.length,0);
}
function openMusicDB(){
  return new Promise((resolve,reject)=>{
    const request=indexedDB.open("qinghe-music-v2",1);
    request.onupgradeneeded=()=>{
      if(!request.result.objectStoreNames.contains("files"))request.result.createObjectStore("files",{keyPath:"id"});
    };
    request.onsuccess=()=>resolve(request.result);
    request.onerror=()=>reject(request.error);
  });
}
async function putMusicFile(id,file){
  const db=await openMusicDB();
  await new Promise((resolve,reject)=>{
    const tx=db.transaction("files","readwrite");
    tx.objectStore("files").put({id,blob:file,name:file.name,updatedAt:Date.now()});
    tx.oncomplete=resolve;
    tx.onerror=()=>reject(tx.error);
  });
  const oldUrl=musicUrlCache.get(id);
  if(oldUrl)URL.revokeObjectURL(oldUrl);
  musicCache.set(id,file);
  musicUrlCache.set(id,URL.createObjectURL(file));
}
async function deleteMusicFile(id){
  const db=await openMusicDB();
  await new Promise((resolve,reject)=>{
    const tx=db.transaction("files","readwrite");
    tx.objectStore("files").delete(id);
    tx.oncomplete=resolve;
    tx.onerror=()=>reject(tx.error);
  });
  musicCache.delete(id);
  const url=musicUrlCache.get(id);
  if(url)URL.revokeObjectURL(url);
  musicUrlCache.delete(id);
}
async function initializeMusicLibrary(){
  try{
    const db=await openMusicDB();
    const records=await new Promise((resolve,reject)=>{
      const tx=db.transaction("files","readonly");
      const request=tx.objectStore("files").getAll();
      request.onsuccess=()=>resolve(request.result||[]);
      request.onerror=()=>reject(request.error);
    });
    musicCache=new Map(records.map(record=>[record.id,record.blob]));
    musicUrlCache=new Map(records.map(record=>[record.id,URL.createObjectURL(record.blob)]));
  }catch{
    musicCache=new Map();
    musicUrlCache=new Map();
  }
}
function availableMusic(themeId){
  const theme=MUSIC_THEMES[themeId];
  if(!theme)return [];
  return theme.tracks.filter(([id])=>musicCache.has(id));
}
function unlockMusic(){
  const audio=musicAudio[activeAudioIndex];
  if(audio?.src)audio.play().catch(()=>{});
}
async function pauseMusic(){
  for(const audio of musicAudio){
    try{audio.pause()}catch{}
  }
}
async function playTheme(themeId,{force=false}={}){
  if(!settings.musicEnabled)return;
  if(!force&&themeId===currentMusicTheme&&currentMusicTrack)return;
  currentMusicTheme=themeId;
  const available=availableMusic(themeId);
  if(!available.length){
    currentMusicTrack=null;
    return;
  }
  const rotation=musicRotation[themeId]||0;
  const [trackId,label]=available[rotation%available.length];
  musicRotation[themeId]=(rotation+1)%available.length;
  if(!force&&trackId===currentMusicTrack&&musicAudio[activeAudioIndex]?.src)return;
  currentMusicTrack=trackId;
  await crossfadeTo(musicUrlCache.get(trackId),label);
}
async function crossfadeTo(url,label){
  const nextIndex=1-activeAudioIndex;
  const oldAudio=musicAudio[activeAudioIndex];
  const nextAudio=musicAudio[nextIndex];
  if(!url)return;
  nextAudio.pause();
  nextAudio.src=url;
  nextAudio.currentTime=0;
  nextAudio.volume=0;
  try{
    await nextAudio.play();
  }catch{
    return;
  }
  const target=settings.musicVolume/100;
  const oldVolume=oldAudio.volume;
  const start=performance.now();
  const duration=settings.reducedMotion?0:1100;
  activeAudioIndex=nextIndex;
  if(!duration){
    nextAudio.volume=target;
    oldAudio.pause();
    return;
  }
  const fade=now=>{
    const progress=Math.min(1,(now-start)/duration);
    nextAudio.volume=target*progress;
    oldAudio.volume=oldVolume*(1-progress);
    if(progress<1)requestAnimationFrame(fade);
    else oldAudio.pause();
  };
  requestAnimationFrame(fade);
}
function normalizeMusicName(value){
  return value.toLowerCase().replace(/\.[a-z0-9]+$/,"").replace(/[\s_\-—·.,，。()（）[\]【】'’"]/g,"");
}
function matchTrackIds(filename){
  const normalized=normalizeMusicName(filename);
  const matches=[];
  for(const theme of Object.values(MUSIC_THEMES)){
    for(const [id,title] of theme.tracks){
      const target=normalizeMusicName(title);
      if((normalized.includes(target)||target.includes(normalized))&&!matches.includes(id))matches.push(id);
    }
  }
  return matches;
}
function trackById(trackId){
  for(const theme of Object.values(MUSIC_THEMES)){
    const match=theme.tracks.find(([id])=>id===trackId);
    if(match)return match;
  }
  return null;
}
function persist(){
  if(game)localStorage.setItem(SAVE_KEY,JSON.stringify(game));
}
function gradeForDay(day){
  if(day>=1020)return "高三冲刺";
  if(day>=730)return "高三";
  if(day>=365)return "高二";
  return "高一";
}
function weekForDay(day){return Math.floor((day-1)/DAYS_PER_WEEK)+1}
function daysLeft(day){return Math.max(0,TOTAL_DAYS-day+1)}
function progressForDay(day){return clamp((day-1)/(TOTAL_DAYS-1)*100,0,100)}
function nextEvent(){
  const pending=game.pendingEvents.map(id=>EVENTS.find(event=>event.id===id)).find(Boolean);
  if(pending)return pending;
  return EVENTS.find(event=>!game.fired.includes(event.id)&&event.day>game.day)||null;
}
function toast(text){
  const el=$("#game-toast");
  el.textContent=text;
  el.classList.add("show");
  clearTimeout(el._timer);
  el._timer=setTimeout(()=>el.classList.remove("show"),2200);
}
function addLog(text){
  game.log.unshift({day:game.day,text});
  game.log=game.log.slice(0,30);
}
function markEventResolved(id){
  game.pendingEvents=game.pendingEvents.filter(eventId=>eventId!==id);
  if(!game.fired.includes(id))game.fired.push(id);
}
function initialState(name,attrs){
  return {
    version:2,
    name,
    attrs:{...attrs},
    day:1,
    actionPoints:4,
    energy:100,
    stress:0,
    mood:70,
    money:300,
    subjects:{chinese:60,math:60,english:60,science:50,humanities:50},
    fired:[],
    pendingEvents:[],
    weekendResolved:false,
    log:[{day:1,text:`${name}走进了青禾高中，新的三年从今天开始。`}],
    completed:false,
    finalScore:null,
    ending:"",
    examResults:[],
  };
}
function usedPoints(){return Object.values(draft.attrs).reduce((sum,value)=>sum+value-BASE_ATTR,0)}
function remainingPoints(){return EXTRA_POINTS-usedPoints()}

function render(){
  if(game?.completed){
    renderFinal();
    return;
  }
  if(game){
    renderGame();
    return;
  }
  renderLanding();
}

function renderLanding(){
  $("#game-root").innerHTML=`
    <main id="main" class="game-landing">
      <section class="landing-copy">
        <div class="landing-mark">QINGHE HIGH SCHOOL · 1092 DAYS</div>
        <h1>青禾纪事</h1>
        <h2>用三年时间，成为你想成为的人。</h2>
        <p>没有固定路线，也没有唯一答案。你会学习、遇见朋友、经历考试，也会在一次次选择里慢慢长大。</p>
        <div class="landing-tags"><span>自由养成</span><span>角色创建</span><span>自动事件</span><span>高考倒计时</span></div>
      </section>
      <form class="setup-panel" id="setup-form">
        <div class="setup-heading">
          <div><h2>创建你的角色</h2><p>先写下名字，再分配初始属性。</p></div>
          <span class="point-pill">剩余 ${remainingPoints()} 点</span>
        </div>
        <label class="field">
          <span>你的名字</span>
          <input id="player-name" maxlength="12" autocomplete="off" placeholder="请输入名字" value="${escapeHtml(draft.name)}">
        </label>
        <div class="preset-list">
          ${[
            ["balanced","均衡"],
            ["scholar","学霸"],
            ["athlete","体育"],
            ["social","社团"],
          ].map(([id,label])=>`<button type="button" data-preset="${id}" class="${draft.preset===id?"selected":""}">${label}</button>`).join("")}
        </div>
        <div class="attribute-list">
          ${ATTRIBUTES.map(([id,label,hint])=>`
            <div class="attribute-row" title="${hint}">
              <span>${label}</span>
              <strong>${draft.attrs[id]}</strong>
              <button type="button" data-attr="${id}" data-delta="-1" aria-label="${label}减少">−</button>
              <button type="button" data-attr="${id}" data-delta="1" aria-label="${label}增加">+</button>
            </div>`).join("")}
        </div>
        <button class="start-game" type="submit">开始游戏 →</button>
        ${game?`<div class="resume-row"><button type="button" data-action="resume">继续上次进度</button></div>`:""}
      </form>
    </main>`;
}

function renderGame(){
  const next=nextEvent();
  $("#game-root").innerHTML=`
    <div class="game-shell">
      <header class="topbar">
        <div class="top-brand"><i>青</i><span>青禾纪事</span></div>
        <div class="top-player">
          <span class="player-avatar">${escapeHtml(game.name.slice(0,1)||"我")}</span>
          <span>${escapeHtml(game.name)}</span>
          <strong>${gradeForDay(game.day)}</strong>
        </div>
        <div class="top-actions">
          <button class="ghost-button music-button" data-action="toggle-music">${settings.musicEnabled?"♫ 音乐开":"♫ 音乐关"}</button>
          <button class="ghost-button settings-button" data-action="settings">⚙ 设置</button>
        </div>
      </header>
      <main id="main" class="game-main">
        <section class="countdown">
          <div class="countdown-top">
            <div>
              <div class="countdown-label">DISTANCE TO GAOKAO</div>
              <div><strong>${daysLeft(game.day)}</strong><span class="countdown-unit">天</span></div>
            </div>
            <div class="countdown-stage">
              <b>${gradeForDay(game.day)} · 第 ${weekForDay(game.day)} 周</b>
              当前第 ${game.day} 天 / 共 ${TOTAL_DAYS} 天
            </div>
          </div>
          <div class="progress-track">
            <i style="width:${progressForDay(game.day)}%"></i>
            <b class="progress-now" style="left:${progressForDay(game.day)}%"></b>
          </div>
          <div class="progress-markers"><span>高一开学</span><span>高二</span><span>高三</span><span>高考</span></div>
        </section>

        <div class="dashboard">
          <div class="dashboard-column">
            <section class="game-panel">
              <div class="panel-heading">
                <h2>本周行动</h2>
                <small>剩余 ${game.actionPoints} / ${settings.actionsPerWeek} 次</small>
              </div>
              <div class="action-grid">
                ${actionCard("study","▤","专注学习","选择一门课程，提升对应成绩。")}
                ${actionCard("rest","◌","好好休息","恢复体力和心情，降低压力。")}
                ${actionCard("exercise","♙","运动锻炼","身体状态变好，压力下降。")}
                ${actionCard("social","♧","与人相处","和朋友聊天，改善心情与关系。")}
              </div>
              <div class="week-footer">
                <p>${game.pendingEvents.length?`有 ${game.pendingEvents.length} 个事件等待处理。`:game.actionPoints===0?"本周行动已经用完，结束后进入下一周。":"行动不必全部用完，你也可以提前结束本周。"}</p>
                <div class="week-actions">
                  ${game.pendingEvents.length?`<button class="ghost-button pending-event-button" data-action="show-pending">处理待触发事件 (${game.pendingEvents.length})</button>`:""}
                  <button class="primary-button" data-action="end-week">结束本周 →</button>
                </div>
              </div>
            </section>

            <section class="game-panel">
              <div class="panel-heading"><h2>学业状态</h2><small>能力值并非最终成绩</small></div>
              ${SUBJECTS.map(([id,label])=>subjectRow(id,label)).join("")}
            </section>
          </div>

          <aside class="dashboard-column">
            <section class="game-panel">
              <div class="panel-heading"><h2>我的状态</h2><small>自动保存</small></div>
              <div class="stat-grid">
                ${statBox("体力",game.energy,100)}
                ${statBox("压力",game.stress,100)}
                ${statBox("心情",game.mood,100)}
                ${statBox("零花钱",game.money,600,"元")}
              </div>
            </section>

            <section class="game-panel">
              <div class="panel-heading"><h2>下一件大事</h2><small>${next?`${next.day-game.day} 天后`:"等待高考"}</small></div>
              <div class="next-event">
                <span>MAIN EVENT</span>
                <h3>${next?escapeHtml(next.title):"高考已经临近"}</h3>
                <p>${next?escapeHtml(next.text.slice(0,52))+"……":"全力以赴，完成最后的答卷。"}</p>
              </div>
            </section>

            <section class="game-panel">
              <div class="panel-heading"><h2>最近记录</h2><small>${game.log.length} 条</small></div>
              ${game.log.length?`<div class="log-list">${game.log.slice(0,4).map(item=>`<div class="log-item"><time>第 ${item.day} 天</time><span>${escapeHtml(item.text)}</span></div>`).join("")}</div>`:'<div class="empty-copy">新的故事还没有开始。</div>'}
            </section>
          </aside>
        </div>
      </main>
    </div>`;
}

function actionCard(action,icon,title,text){
  return `<button class="action-card" data-action="${action}" ${game.actionPoints<=0?"disabled":""}><i>${icon}</i><h3>${title}</h3><p>${text}</p></button>`;
}
function statBox(label,value,max,unit=""){
  const shown=label==="零花钱"?value:`${value}`;
  return `<div class="stat-box"><span>${label}</span><strong>${shown}${unit?" "+unit:""}</strong><div class="mini-bar"><i style="width:${clamp(value/max*100,0,100)}%"></i></div></div>`;
}
function subjectRow(id,label){
  const value=game.subjects[id];
  return `<div class="subject-row"><span>${label}</span><div class="mini-bar"><i style="width:${clamp(value/150*100,0,100)}%"></i></div><b>${value}</b></div>`;
}

function renderFinal(){
  const best=Math.max(game.subjects.chinese,game.subjects.math,game.subjects.english,game.subjects.science,game.subjects.humanities);
  $("#game-root").innerHTML=`
    <main id="main" class="final-screen">
      <div class="final-wrap">
        <div class="eyebrow">FINAL REPORT · ${escapeHtml(game.name)}</div>
        <h1>${escapeHtml(game.ending)}</h1>
        <p>高中三年到这里结束了。分数只是一部分，你所做的选择也塑造了另一个自己。</p>
        <div class="final-score"><strong>${game.finalScore}</strong><small>/ 750</small></div>
        <div class="final-grid">
          <section class="final-card">
            <h2>三年记录</h2>
            <div class="final-facts">
              <div class="final-fact"><span>学业最高能力</span><strong>${best}</strong></div>
              <div class="final-fact"><span>心态</span><strong>${game.attrs.mindset}</strong></div>
              <div class="final-fact"><span>魅力</span><strong>${game.attrs.charm}</strong></div>
              <div class="final-fact"><span>经历事件</span><strong>${game.fired.length}</strong></div>
            </div>
          </section>
          <section class="final-card">
            <h2>接下来</h2>
            <p>这一周目已经完成。你可以重新创建角色，尝试另一种高中生活。</p>
            <button class="primary-button" data-action="new-game">重新开始新周目 →</button>
          </section>
        </div>
      </div>
    </main>`;
}

function changeAttribute(id,delta){
  const current=draft.attrs[id];
  if(delta>0&&(remainingPoints()<=0||current>=80))return toast(current>=80?"单项属性最高 80":"没有剩余点数了");
  if(delta<0&&current<=BASE_ATTR)return;
  draft.attrs[id]=current+delta;
  draft.preset="";
  renderLanding();
}

function applyPreset(id){
  draft.preset=id;
  draft.attrs={...PRESETS[id]};
  renderLanding();
}

function startGame(){
  const name=$("#player-name")?.value.trim();
  if(!name)return toast("先给自己取一个名字");
  if(remainingPoints()!==0)return toast(`还有 ${remainingPoints()} 点属性没有分配`);
  draft.name=name;
  game=initialState(name,draft.attrs);
  persist();
  render();
  playTheme("bright",{force:true});
  setTimeout(()=>openEvent(EVENTS[0]),260);
}

function performAction(type){
  if(game.actionPoints<=0)return toast("本周行动已经用完");
  if(type==="study"){
    playTheme("focus",{force:true});
    openModal(`
      <div class="eyebrow">LEARNING · 专注学习</div>
      <h2>今天学什么？</h2>
      <p>学习效率会受到学力和当前压力影响。每次行动消耗 1 点行动机会。</p>
      <div class="choice-list">${SUBJECTS.map(([id,label])=>`<button class="choice-button" data-study="${id}"><strong>${label}</strong><small>当前能力 ${game.subjects[id]} / 150</small></button>`).join("")}</div>
      <div class="dialog-footer"><button class="ghost-button" data-modal-close>取消</button></div>
    `);
    return;
  }
  const effects={
    rest:{energy:24,stress:-18,mood:8,text:"你放下书本，好好休息了一会儿。"},
    exercise:{energy:7,stress:-10,mood:12,text:"运动之后，身体和心情都轻松了一点。"},
    social:{energy:-4,stress:-7,mood:16,charm:1,text:"你主动和大家聊了聊，关系近了一点。"},
  }[type];
  if(!effects)return;
  game.actionPoints--;
  game.energy=clamp(game.energy+(effects.energy||0),0,100);
  game.stress=clamp(game.stress+(effects.stress||0),0,100);
  game.mood=clamp(game.mood+(effects.mood||0),0,100);
  if(effects.charm)game.attrs.charm=clamp(game.attrs.charm+effects.charm,0,100);
  addLog(effects.text);
  persist();
  render();
  toast(effects.text);
  if(game.actionPoints===0&&!game.weekendResolved)setTimeout(openWeekend,320);
}

function studySubject(id){
  if(game.actionPoints<=0)return toast("本周行动已经用完");
  const label=SUBJECTS.find(item=>item[0]===id)[1];
  const stressPenalty=Math.max(0,game.stress-60)*0.04;
  const gain=Math.max(1,Math.round(3.6+game.attrs.insight*0.035-stressPenalty));
  const before=game.subjects[id];
  game.subjects[id]=Math.min(150,game.subjects[id]+gain);
  game.actionPoints--;
  game.energy=clamp(game.energy-8,0,100);
  game.stress=clamp(game.stress+7,0,100);
  game.mood=clamp(game.mood-2,0,100);
  addLog(`专注学习${label}，能力提升 ${game.subjects[id]-before} 点。`);
  persist();
  closeModal();
  render();
  toast(`${label} +${game.subjects[id]-before}`);
  if(game.actionPoints===0&&!game.weekendResolved)setTimeout(openWeekend,320);
}

function openWeekend(){
  if(game.weekendResolved||game.actionPoints>0)return;
  playTheme("bright",{force:true});
  const weekend=WEEKEND_ACTIVITIES[0];
  openModal(`
    <div class="eyebrow">WEEKEND · 自动触发</div>
    <h2>${weekend.title}</h2>
    <p>${weekend.text}</p>
    <div class="choice-list">
      ${weekend.choices.map((choice,index)=>`<button class="choice-button" data-weekend="${index}"><strong>${choice.label}</strong><small>${choice.hint}</small></button>`).join("")}
    </div>
  `, false);
}

function resolveWeekend(index){
  const choice=WEEKEND_ACTIVITIES[0].choices[index];
  applyEffects(choice.effects);
  game.weekendResolved=true;
  addLog(choice.result);
  persist();
  render();
  closeModal(true);
  toast(choice.result);
}

function endWeek(){
  if(game.actionPoints>0&&settings.confirmEarlyWeek){
    openModal(`
      <div class="eyebrow">NEXT WEEK</div>
      <h2>现在就结束本周吗？</h2>
      <p>你还有 ${game.actionPoints} 次行动没有使用。提前结束不会保留这些机会。</p>
      <div class="dialog-footer"><button class="ghost-button" data-modal-close>再想想</button><button class="primary-button" data-confirm-week>结束本周 →</button></div>
    `);
    return;
  }
  if(game.actionPoints===0&&!game.weekendResolved){
    openWeekend();
    return;
  }
  advanceWeek();
}

function advanceWeek(){
  const previous=game.day;
  game.day=Math.min(TOTAL_DAYS,game.day+DAYS_PER_WEEK);
  game.actionPoints=settings.actionsPerWeek;
  game.energy=clamp(game.energy+15,0,100);
  game.stress=clamp(game.stress-8,0,100);
  game.weekendResolved=false;
  addLog(`进入第 ${weekForDay(game.day)} 周，距离高考还有 ${daysLeft(game.day)} 天。`);
  const due=EVENTS.filter(event=>!game.fired.includes(event.id)&&event.day>previous&&event.day<=game.day);
  game.pendingEvents.push(...due.map(event=>event.id));
  persist();
  render();
  if(settings.autoEvents&&game.pendingEvents.length)setTimeout(showNextEvent,300);
}

function showNextEvent(){
  if(currentModal||!game.pendingEvents.length)return;
  const event=EVENTS.find(item=>item.id===game.pendingEvents[0]);
  if(!event){
    game.pendingEvents.shift();
    persist();
    return showNextEvent();
  }
  openEvent(event);
}

function openEvent(event){
  currentModal={type:"event",event};
  if(settings.eventMusic)playTheme(EVENT_MUSIC[event.id]||"calm",{force:true});
  if(event.type==="exam"||event.type==="gaokao"){
    openExam(event);
    return;
  }
  openModal(`
    <div class="eyebrow">${event.eyebrow}</div>
    <h2>${event.title}</h2>
    <p>${event.text}</p>
    <div class="choice-list">${event.choices.map((choice,index)=>`<button class="choice-button" data-event-choice="${index}"><strong>${choice.label}</strong><small>${choice.hint}</small></button>`).join("")}</div>
  `, false);
}

function resolveEventChoice(index){
  if(!currentModal?.event)return;
  const event=currentModal.event;
  const choice=event.choices[index];
  applyEffects(choice.effects);
  markEventResolved(event.id);
  addLog(`${event.title}：${choice.result}`);
  persist();
  currentModal=null;
  openModal(`
    <div class="eyebrow">${event.eyebrow}</div>
    <h2>${event.title}</h2>
    <div class="result-copy">${choice.result}</div>
    <div class="dialog-footer"><button class="primary-button" data-continue-event>继续 →</button></div>
  `, false);
}

function openExam(event){
  currentModal={type:"exam",event};
  openModal(`
    <div class="eyebrow">${event.eyebrow} · 自动触发</div>
    <h2>${event.title}</h2>
    <p>${event.text}</p>
    <div class="choice-list">
      <button class="choice-button" data-exam="steady"><strong>稳扎稳打</strong><small>优先保证基础题，稳定发挥。</small></button>
      <button class="choice-button" data-exam="sprint"><strong>全力冲刺</strong><small>高风险高回报，压力会影响结果。</small></button>
      <button class="choice-button" data-exam="check"><strong>仔细检查</strong><small>减少失误，但不会追求超常发挥。</small></button>
    </div>
  `, false);
}

function calculateExam(event,style){
  const base=(game.subjects.chinese+game.subjects.math+game.subjects.english+game.subjects.science+game.subjects.humanities)/5;
  const ability=(game.attrs.insight*0.8+game.attrs.mindset*0.45+base*1.75);
  const difficulty=event.difficulty*13;
  const styleMod=style==="sprint"?28:style==="check"?10:0;
  const pressureMod=style==="sprint"?-Math.max(0,game.stress-45)*0.75:0;
  const random=Math.round((Math.random()-.5)*70);
  const raw=ability*1.95+80-difficulty+styleMod+pressureMod+random;
  const score=clamp(Math.round(raw),120,750);
  game.examResults.push({day:game.day,title:event.title,score});
  applyEffects({energy:style==="sprint"?-14:-6,stress:style==="sprint"?16:7,mood:score>=500?10:-5});
  markEventResolved(event.id);
  addLog(`${event.title}成绩：${score} 分。`);
  if(settings.eventMusic)playTheme(score>=650?"bright":score<460?"sad":"calm",{force:true});
  persist();
  currentModal={type:"exam-result",event};
  openModal(`
    <div class="eyebrow">${event.eyebrow}</div>
    <h2>${event.title}结果</h2>
    <div class="result-score"><strong>${score}</strong><span>/ 750</span></div>
    <div class="result-copy">${score>=650?"这次发挥非常出色，你已经站在最前面。":score>=560?"成绩稳定，继续按自己的节奏前进。":score>=460?"还有明显空间，但基础正在逐渐牢固。":"这次结果不理想，先把错题找回来。"}</div>
    <div class="dialog-footer"><button class="primary-button" data-continue-event>${event.type==="gaokao"?"查看最终结果 →":"继续 →"}</button></div>
  `, false);
}

function continueAfterEvent(){
  if(currentModal?.type==="exam-result"&&currentModal.event.type==="gaokao"){
    completeGame(game.examResults.at(-1)?.score||0);
    return;
  }
  currentModal=null;
  closeModal(true);
  render();
  if(settings.autoEvents&&game.pendingEvents.length)setTimeout(showNextEvent,280);
}

function completeGame(score){
  const bestSubject=Math.max(...Object.values(game.subjects));
  const relation=game.attrs.charm;
  game.completed=true;
  game.finalScore=score;
  if(score>=650&&relation>=65)game.ending="顶峰相见：你们把青春写成了答案";
  else if(score>=650)game.ending="孤独的顶峰：一个人也走到了很远的地方";
  else if(score>=560&&relation>=65)game.ending="并肩远航：答案之外，还有同行的人";
  else if(score>=560)game.ending="平稳抵达：认真走过的人不会迷路";
  else if(score>=460)game.ending="平凡之路：每种青春都有自己的方向";
  else game.ending="重新出发：这一页结束，不是故事结束";
  game.mood=clamp(game.mood+(bestSubject>=100?8:0),0,100);
  const endingTheme=score>=650&&relation>=65?"love":score>=650?"bright":score>=560?"calm":score>=460?"sad":"pain";
  persist();
  closeModal(true);
  render();
  if(settings.eventMusic)playTheme(endingTheme,{force:true});
}

function applyEffects(effects={}){
  if(effects.energy)game.energy=clamp(game.energy+effects.energy,0,100);
  if(effects.stress)game.stress=clamp(game.stress+effects.stress,0,100);
  if(effects.mood)game.mood=clamp(game.mood+effects.mood,0,100);
  if(effects.money)game.money=Math.max(0,game.money+effects.money);
  if(effects.charm)game.attrs.charm=clamp(game.attrs.charm+effects.charm,0,100);
  if(effects.stamina)game.attrs.stamina=clamp(game.attrs.stamina+effects.stamina,0,100);
  if(effects.mindset)game.attrs.mindset=clamp(game.attrs.mindset+effects.mindset,0,100);
  if(effects.subjects){
    for(const [id,value] of Object.entries(effects.subjects)){
      game.subjects[id]=clamp(game.subjects[id]+value,0,150);
    }
  }
}

function openModal(html, closable=true){
  const dialog=$("#game-dialog");
  modalLocked=!closable;
  dialog.hidden=false;
  dialog.innerHTML=`<section class="dialog-card">${closable?'<button class="dialog-close" data-modal-close aria-label="关闭">×</button>':""}${html}</section>`;
  document.body.classList.add("modal-open");
}
function closeModal(force=false){
  if(modalLocked&&!force)return;
  const dialog=$("#game-dialog");
  dialog.hidden=true;
  dialog.innerHTML="";
  document.body.classList.remove("modal-open");
  currentModal=null;
  modalLocked=false;
  playTheme("calm");
}
function openSettings(){
  const toggle=(name,title,text)=>`
    <label class="setting-row">
      <span><b>${title}</b><small>${text}</small></span>
      <input class="setting-toggle" type="checkbox" data-setting="${name}" ${settings[name]?"checked":""}>
    </label>`;
  openModal(`
    <div class="eyebrow">SETTINGS</div>
    <h2>设置</h2>
    <p>把显示、游戏节奏和存档操作集中在这里。所有设置会自动保存在当前浏览器。</p>
    <div class="settings-content">
      <section class="settings-section">
        <h3>角色</h3>
        <div class="settings-inline">
          <input id="settings-name" maxlength="12" value="${escapeHtml(game.name)}" aria-label="角色名称">
          <button class="ghost-button" data-action="save-name">保存名称</button>
        </div>
      </section>
      <section class="settings-section">
        <h3>显示</h3>
        ${toggle("largeText","大字体模式","放大正文与按钮文字，方便阅读。")}
        ${toggle("compact","紧凑布局","减少面板间距，在同一屏里显示更多内容。")}
        ${toggle("reducedMotion","减少动态效果","关闭过渡动画和移动效果。")}
      </section>
      <section class="settings-section">
        <h3>游戏节奏</h3>
        <label class="setting-row">
          <span><b>每周行动次数</b><small>调整每星期可以安排的行动数量。</small></span>
          <select id="settings-actions" aria-label="每周行动次数">
            ${[3,4,5].map(value=>`<option value="${value}" ${settings.actionsPerWeek===value?"selected":""}>${value} 次</option>`).join("")}
          </select>
        </label>
        ${toggle("autoEvents","自动触发事件","考试、周末和主线事件到期后自动弹出。")}
        ${toggle("confirmEarlyWeek","提前结束确认","还有行动时，结束本周前先确认。")}
      </section>
      <section class="settings-section">
        <h3>音乐</h3>
        ${toggle("musicEnabled","开启背景音乐","关闭后所有场景音乐都会暂停。")}
        ${toggle("eventMusic","启用事件专属音乐","考试、低谷、毕业和结局会切换到对应主题。")}
        <label class="setting-row music-volume-row">
          <span><b>音乐音量</b><small>当前 ${settings.musicVolume}% · ${musicCache.size} / ${musicTrackCount()} 首已导入</small></span>
          <input id="settings-volume" type="range" min="0" max="100" value="${settings.musicVolume}" aria-label="音乐音量">
        </label>
        <div class="settings-buttons">
          <button class="ghost-button" data-action="music-library">管理本地音乐库</button>
        </div>
      </section>
      <section class="settings-section">
        <h3>存档</h3>
        <p class="settings-note">${game.pendingEvents.length?`当前还有 ${game.pendingEvents.length} 个待处理事件。`:"当前进度已自动保存。"}</p>
        <div class="settings-buttons">
          <button class="ghost-button" data-action="export-save">导出存档</button>
          <label class="ghost-button file-button">导入存档<input id="import-save" type="file" accept="application/json,.json" hidden></label>
          <button class="ghost-button danger-button" data-action="new-game">重新开始</button>
        </div>
      </section>
    </div>
  `);
}

function updateSetting(name,value){
  if(name==="actionsPerWeek"){
    const next=Number(value);
    if(game){
      const delta=next-settings.actionsPerWeek;
      game.actionPoints=clamp(game.actionPoints+delta,0,next);
      persist();
    }
    settings.actionsPerWeek=next;
  }else if(name==="musicVolume"){
    settings.musicVolume=Number(value);
    for(const audio of musicAudio)audio.volume=settings.musicVolume/100;
  }else{
    settings[name]=value;
  }
  persistSettings();
  if(name==="musicEnabled"){
    if(value)playTheme(currentMusicTheme,{force:true});
    else pauseMusic();
  }
  if(name==="eventMusic"){
    playTheme(value&&currentModal?.event?(EVENT_MUSIC[currentModal.event.id]||"calm"):"calm",{force:true});
  }
  if(game)render();
  if(name==="autoEvents"&&value&&game?.pendingEvents.length){
    closeModal(true);
    setTimeout(showNextEvent,220);
  }
}

function saveCharacterName(){
  const input=$("#settings-name");
  const name=input?.value.trim();
  if(!name)return toast("名字不能为空");
  game.name=name;
  persist();
  render();
  toast("角色名称已更新");
}

function exportSave(){
  const payload={exportedAt:new Date().toISOString(),game,settings};
  const blob=new Blob([JSON.stringify(payload,null,2)],{type:"application/json"});
  const link=document.createElement("a");
  link.href=URL.createObjectURL(blob);
  link.download=`qinghe-save-${game.name||"player"}-day-${game.day}.json`;
  link.click();
  setTimeout(()=>URL.revokeObjectURL(link.href),1000);
  toast("存档已经导出");
}

async function importSave(file){
  try{
    const parsed=JSON.parse(await file.text());
    const imported=parsed.game||parsed;
    if(!imported||imported.version!==2||!imported.attrs||!imported.subjects)throw new Error("invalid");
    if(!Array.isArray(imported.pendingEvents))imported.pendingEvents=[];
    game=imported;
    if(parsed.settings)settings={...DEFAULT_SETTINGS,...parsed.settings};
    persist();
    persistSettings();
    closeModal(true);
    render();
    toast("存档导入成功");
  }catch{
    toast("无法读取这个存档文件");
  }
}

function openMusicLibrary(){
  const sections=Object.entries(MUSIC_THEMES).map(([themeId,theme])=>`
    <details class="music-theme" open>
      <summary><b>${theme.label}</b><span>${theme.tracks.filter(([id])=>musicCache.has(id)).length} / ${theme.tracks.length}</span></summary>
      <div class="music-track-list">
        ${theme.tracks.map(([trackId,title])=>{
          const loaded=musicCache.has(trackId);
          return `<div class="music-track ${loaded?"loaded":""}">
            <div><b>${escapeHtml(title)}</b><small>${loaded?"已导入，可在对应场景播放":"尚未导入音频文件"}</small></div>
            <div class="music-track-actions">
              <button class="ghost-button" data-preview-track="${trackId}" ${loaded?"":"disabled"}>试听</button>
              <label class="ghost-button file-button">${loaded?"替换":"选择文件"}<input type="file" accept="audio/*,.mp3,.m4a,.ogg,.wav,.flac" data-music-file="${trackId}" hidden></label>
              ${loaded?`<button class="ghost-button danger-button" data-clear-track="${trackId}">移除</button>`:""}
            </div>
          </div>`;
        }).join("")}
      </div>
    </details>`).join("");
  openModal(`
    <div class="eyebrow">LOCAL MUSIC LIBRARY</div>
    <h2>本地音乐库</h2>
    <p>音乐文件只保存在当前浏览器。可以逐个选择，也可以直接选择存放这些歌曲的文件夹，系统会按文件名自动匹配。</p>
    <div class="music-library">
      <div class="music-library-tools">
        <label class="primary-button file-button">批量导入音乐文件夹<input id="music-folder-import" type="file" accept="audio/*,.mp3,.m4a,.ogg,.wav,.flac" webkitdirectory multiple hidden></label>
        <span>${musicCache.size} / ${musicTrackCount()} 首已导入</span>
      </div>
      ${sections}
    </div>
    <div class="dialog-footer"><button class="ghost-button" data-action="back-settings">返回设置</button></div>
  `);
}

async function saveMusicTrack(trackId,file){
  if(!file)return;
  await putMusicFile(trackId,file);
  openMusicLibrary();
  toast(`${trackById(trackId)?.[1]||"音乐"} 已导入`);
  playTheme(currentMusicTheme,{force:true});
}

function isAudioFile(file){
  return file.type.startsWith("audio/")||/\.(mp3|m4a|ogg|wav|flac)$/i.test(file.name);
}

async function importMusicFolder(fileList){
  const files=[...fileList].filter(isAudioFile);
  if(!files.length)return toast("这个文件夹里没有找到音频文件");
  let matched=0;
  for(const file of files){
    const trackIds=matchTrackIds(file.name);
    for(const trackId of trackIds){
      await putMusicFile(trackId,file);
      matched++;
    }
  }
  openMusicLibrary();
  toast(`扫描 ${files.length} 首，匹配并导入 ${matched} 首`);
  playTheme(currentMusicTheme,{force:true});
}

async function removeMusicTrack(trackId){
  await deleteMusicFile(trackId);
  if(currentMusicTrack===trackId){
    currentMusicTrack=null;
    await pauseMusic();
    currentMusicTheme="calm";
    playTheme("calm",{force:true});
  }
  openMusicLibrary();
  toast("已从本地音乐库移除");
}

function previewMusicTrack(trackId){
  const url=musicUrlCache.get(trackId);
  if(!url)return toast("请先导入这个音频文件");
  currentMusicTheme="preview";
  currentMusicTrack=trackId;
  crossfadeTo(url,trackById(trackId)?.[1]);
}

function confirmNewGame(){
  openModal(`
    <div class="eyebrow">NEW GAME</div>
    <h2>重新开始一段高中生活？</h2>
    <p>当前进度会被清除。这个操作无法撤销。</p>
    <div class="dialog-footer"><button class="ghost-button" data-modal-close>取消</button><button class="primary-button" data-confirm-new>确定重新开始</button></div>
  `);
}
function resetGame(){
  localStorage.removeItem(SAVE_KEY);
  game=null;
  closeModal(true);
  draft={name:"",attrs:{...PRESETS.balanced},preset:"balanced"};
  render();
}

document.addEventListener("click",event=>{
  const button=event.target.closest("button");
  unlockMusic();
  if(!button||button.disabled)return;
  if(button.dataset.preset)return applyPreset(button.dataset.preset);
  if(button.dataset.attr)return changeAttribute(button.dataset.attr,Number(button.dataset.delta));
  if(button.dataset.study)return studySubject(button.dataset.study);
  if(button.dataset.weekend!==undefined)return resolveWeekend(Number(button.dataset.weekend));
  if(button.dataset.eventChoice!==undefined)return resolveEventChoice(Number(button.dataset.eventChoice));
  if(button.dataset.exam)return calculateExam(currentModal.event,button.dataset.exam);
  if(button.hasAttribute("data-modal-close"))return closeModal();
  if(button.hasAttribute("data-continue-event"))return continueAfterEvent();
  if(button.hasAttribute("data-confirm-week")){closeModal();return advanceWeek()}
  if(button.hasAttribute("data-confirm-new"))return resetGame();
  if(button.dataset.action==="toggle-music")return updateSetting("musicEnabled",!settings.musicEnabled);
  if(button.dataset.action==="settings")return openSettings();
  if(button.dataset.action==="music-library")return openMusicLibrary();
  if(button.dataset.action==="back-settings")return openSettings();
  if(button.dataset.previewTrack)return previewMusicTrack(button.dataset.previewTrack);
  if(button.dataset.clearTrack)return removeMusicTrack(button.dataset.clearTrack);
  if(button.dataset.action==="save-name")return saveCharacterName();
  if(button.dataset.action==="export-save")return exportSave();
  if(button.dataset.action==="show-pending")return showNextEvent();
  if(button.dataset.action==="resume"){
    game=loadGame();
    if(game)render();
    return;
  }
  if(button.dataset.action==="new-game")return confirmNewGame();
  if(button.dataset.action==="end-week")return endWeek();
  if(["study","rest","exercise","social"].includes(button.dataset.action))return performAction(button.dataset.action);
});

document.addEventListener("submit",event=>{
  if(event.target.id!=="setup-form")return;
  event.preventDefault();
  startGame();
});

document.addEventListener("input",event=>{
  if(event.target.id==="player-name")draft.name=event.target.value;
  if(event.target.id==="settings-volume")updateSetting("musicVolume",event.target.value);
});

document.addEventListener("change",event=>{
  if(event.target.matches("[data-setting]"))return updateSetting(event.target.dataset.setting,event.target.checked);
  if(event.target.id==="settings-actions")return updateSetting("actionsPerWeek",event.target.value);
  if(event.target.id==="import-save"&&event.target.files?.[0])return importSave(event.target.files[0]);
  if(event.target.matches("[data-music-file]")&&event.target.files?.[0])return saveMusicTrack(event.target.dataset.musicFile,event.target.files[0]);
  if(event.target.id==="music-folder-import"&&event.target.files?.length)return importMusicFolder(event.target.files);
});

document.addEventListener("keydown",event=>{
  if(event.key==="Escape"&&!$("#game-dialog").hidden)closeModal();
});

render();
initializeMusicLibrary().then(()=>{
  if(game&&!game.completed)playTheme("calm",{force:true});
});
