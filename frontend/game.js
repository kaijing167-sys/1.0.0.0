const SAVE_KEY = "qinghe-game-v2";
const SETTINGS_KEY = "qinghe-game-settings-v1";
const MUSIC_OFF_MIGRATION_KEY = "qinghe-music-force-off-v1";
const MUSIC_REENABLE_KEY = "qinghe-music-reenabled-v1";
const MUSIC_FORCE_OFF = false;
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
  musicEnabled: false,
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

const START_STAGES = {
  high1: {
    label: "高一开学",
    day: 1,
    desc: "从零开始，距离高考 1092 天，时间最充足。",
    stress: 20,
    mood: 65,
    energy: 100,
    money: 300,
    subjects: {chinese: 60, math: 60, english: 60, science: 50, humanities: 50},
    relationshipBonus: {liqiang: 5, su: 2, lin: 0},
    difficulty: "标准",
    track: "undecided",
  },
  high2: {
    label: "高二开学",
    day: 366,
    desc: "已经适应高中节奏，但分科和排名压力开始出现。",
    stress: 30,
    mood: 63,
    energy: 95,
    money: 320,
    subjects: {chinese: 76, math: 78, english: 75, science: 68, humanities: 66},
    relationshipBonus: {liqiang: 18, su: 15, lin: 9},
    difficulty: "进阶",
    track: "choose",
  },
  high3: {
    label: "高三开学",
    day: 731,
    desc: "距离高考约一年，模拟考和冲刺安排会更密集。",
    stress: 45,
    mood: 58,
    energy: 88,
    money: 360,
    subjects: {chinese: 96, math: 100, english: 94, science: 90, humanities: 86},
    relationshipBonus: {liqiang: 32, su: 28, lin: 18},
    difficulty: "困难",
    track: "choose",
  },
  sprint100: {
    label: "百日冲刺",
    day: 993,
    desc: "距离高考只剩 100 天，压力更高，但能力也更接近考试状态。",
    stress: 60,
    mood: 52,
    energy: 72,
    money: 260,
    subjects: {chinese: 122, math: 126, english: 116, science: 120, humanities: 114},
    relationshipBonus: {liqiang: 48, su: 42, lin: 28},
    difficulty: "极难",
    track: "choose",
  },
};

const SUBJECTS = [
  ["chinese", "语文"],
  ["math", "数学"],
  ["english", "英语"],
  ["science", "理科"],
  ["humanities", "文科"],
];

const ACTION_IMAGES = {
  study: "assets/action-study.jpg",
  rest: "assets/action-rest.jpg",
  exercise: "assets/action-exercise.jpg",
  social: "assets/action-social.jpg",
};

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
      ["builtin-bright-morning", "Morning · Kevin MacLeod", "https://incompetech.com/music/royalty-free/mp3-royaltyfree/Morning.mp3"],
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
      ["builtin-love-heartwarming", "Heartwarming · Kevin MacLeod", "https://incompetech.com/music/royalty-free/mp3-royaltyfree/Heartwarming.mp3"],
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
      ["builtin-breakup-bittersweet", "Bittersweet · Kevin MacLeod", "https://incompetech.com/music/royalty-free/mp3-royaltyfree/Bittersweet.mp3"],
    ],
  },
  sad: {
    label: "忧伤",
    tracks: [
      ["sad-ten-years", "十年"],
      ["sad-see-you-again", "See You Again"],
      ["builtin-sad-heavy-heart", "Heavy Heart · Kevin MacLeod", "https://incompetech.com/music/royalty-free/mp3-royaltyfree/Heavy%20Heart.mp3"],
    ],
  },
  calm: {
    label: "舒缓",
    tracks: [
      ["calm-mitsuha", "三葉のテーマ"],
      ["calm-sacred-place", "Sacred Play Secret Place"],
      ["calm-magnolia", "Magnolia"],
      ["builtin-calm-dreamer", "Dreamer · Kevin MacLeod", "https://incompetech.com/music/royalty-free/mp3-royaltyfree/Dreamer.mp3"],
    ],
  },
  tense: {
    label: "紧张 · 轻快",
    tracks: [
      ["tense-life-line", "Life Line"],
      ["builtin-tense-highlight-reel", "Highlight Reel · Kevin MacLeod", "https://incompetech.com/music/royalty-free/mp3-royaltyfree/Highlight%20Reel.mp3"],
    ],
  },
  focus: {
    label: "学习 · 专注",
    tracks: [
      ["focus-life-line", "Life Line"],
      ["builtin-focus-fresh-air", "Fresh Air · Kevin MacLeod", "https://incompetech.com/music/royalty-free/mp3-royaltyfree/Fresh%20Air.mp3"],
    ],
  },
  sadEn: {
    label: "忧伤 · 英文",
    tracks: [
      ["saden-memories", "Memories"],
      ["saden-free-lucky", "Free lucky"],
      ["saden-merry-christmas", "Merry Christmas…"],
      ["builtin-saden-promises", "Promises to Keep · Kevin MacLeod", "https://incompetech.com/music/royalty-free/mp3-royaltyfree/Promises%20to%20Keep.mp3"],
    ],
  },
  pain: {
    label: "痛 · 心碎向",
    tracks: [
      ["pain-call-of-silence", "Call of Silence"],
      ["pain-born-a-stranger", "Born a Stranger"],
      ["pain-south-city-flowers", "城南花已开"],
      ["builtin-pain-disquiet", "Disquiet · Kevin MacLeod", "https://incompetech.com/music/royalty-free/mp3-royaltyfree/Disquiet.mp3"],
    ],
  },
  regret: {
    label: "遗憾",
    tracks: [
      ["regret-hanabi", "Hanabi（烟火）"],
      ["regret-truth", "The truth that you leave"],
      ["regret-farewell", "诀别书"],
      ["regret-dont-talk", "We don't Talk Anymore"],
      ["builtin-regret-sincerely", "Sincerely · Kevin MacLeod", "https://incompetech.com/music/royalty-free/mp3-royaltyfree/Sincerely.mp3"],
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
  spring_final_mock: "tense",
  graduation: "regret",
  last_study_week: "calm",
  before_exam: "calm",
  gaokao: "tense",
};

const FRIENDS = [
  {id: "liqiang", name: "李强", initial: "强", desc: "篮球场上的少年"},
  {id: "su", name: "苏若云", initial: "云", desc: "认真温柔的班长"},
  {id: "lin", name: "林婉儿", initial: "婉", desc: "喜欢音乐和画画的女孩"},
];

const DEFAULT_RELATIONSHIPS = {liqiang: 5, su: 2, lin: 0};

const TUTORING_SUBJECTS = [
  {id: "chinese", label: "语文"},
  {id: "math", label: "数学"},
  {id: "english", label: "英语"},
  {id: "science", label: "理科"},
  {id: "humanities", label: "文科"},
];

const OUTING_PLACES = [
  {id: "river", name: "河边散步", cost: 0, effects: {energy: 4, stress: -9, mood: 11}, likedBy: ["lin"], result: "你们沿着河边慢慢走，风把一周的疲惫吹散了一些。"},
  {id: "bookstore", name: "书店和文具店", cost: 20, effects: {stress: -5, mood: 8, subjects: {chinese: 2}}, likedBy: ["su"], result: "你们在书架间挑了很久，最后各自买了一本喜欢的书。"},
  {id: "court", name: "去球场打球", cost: 0, effects: {energy: -8, stress: -12, mood: 13, stamina: 1}, likedBy: ["liqiang"], result: "跑动和汗水让心情重新亮了起来。"},
  {id: "arcade", name: "逛电玩城", cost: 45, effects: {energy: -4, stress: -13, mood: 16}, likedBy: ["liqiang", "lin"], result: "你们在嘈杂的音乐里笑得很开心，暂时忘掉了作业。"},
  {id: "gallery", name: "看展或画画", cost: 25, effects: {stress: -8, mood: 11, charm: 1}, likedBy: ["lin", "su"], result: "安静的展厅里，时间走得比平时慢了一些。"},
];

const WEEKEND_OPTIONS = [
  {id: "outing", label: "和朋友出去玩", hint: "选择朋友和地点，关系越熟，相处越自然。"},
  {id: "part_time", label: "做半天兼职", hint: "零花钱增加，但体力和压力会受影响。"},
  {id: "family", label: "陪家人逛街做饭", hint: "心情恢复，压力下降，也能得到一点零花钱。"},
  {id: "hobby", label: "发展兴趣爱好", hint: "提升魅力与心情，缓解学习压力。"},
  {id: "exercise", label: "运动或打球", hint: "提升体质，释放压力。"},
  {id: "sleep", label: "在家睡个懒觉", hint: "大量恢复体力，降低压力。"},
  {id: "study", label: "自己安静自习", hint: "提升成绩，但会增加一点压力。"},
];

const ACHIEVEMENTS = [
  {id: "balanced", name: "六边形少年", desc: "学力、体质、心态、魅力全部达到 65", test: g => Object.values(g.attrs).every(value => value >= 65), progress: g => Math.min(...Object.values(g.attrs)) / 65},
  {id: "scholar", name: "题海航行", desc: "学力达到 75，且数学达到 100", test: g => g.attrs.insight >= 75 && g.subjects.math >= 100, progress: g => Math.min(g.attrs.insight / 75, g.subjects.math / 100)},
  {id: "athlete", name: "奔跑的人", desc: "体质达到 75，且心情达到 70", test: g => g.attrs.stamina >= 75 && g.mood >= 70, progress: g => Math.min(g.attrs.stamina / 75, g.mood / 70)},
  {id: "steady", name: "稳住能赢", desc: "心态达到 75，且压力不高于 35", test: g => g.attrs.mindset >= 75 && g.stress <= 35, progress: g => Math.min(g.attrs.mindset / 75, (100 - g.stress) / 65)},
  {id: "social", name: "人群中心", desc: "魅力达到 70，且朋友关系总和达到 100", test: g => g.attrs.charm >= 70 && Object.values(g.relationships).reduce((a, b) => a + b, 0) >= 100, progress: g => Math.min(g.attrs.charm / 70, Object.values(g.relationships).reduce((a, b) => a + b, 0) / 100)},
  {id: "close_friend", name: "真正的朋友", desc: "任意一位朋友关系达到 60", test: g => Object.values(g.relationships).some(value => value >= 60), progress: g => Math.max(...Object.values(g.relationships)) / 60},
  {id: "weekend_planner", name: "周末规划家", desc: "完整度过 8 个周末", test: g => g.weekendCount >= 8, progress: g => g.weekendCount / 8},
  {id: "tutor", name: "补课自律", desc: "完成 10 次周末补课", test: g => g.tutoringCount >= 10, progress: g => g.tutoringCount / 10},
  {id: "balance", name: "劳逸结合", desc: "心情达到 80，压力不高于 30", test: g => g.mood >= 80 && g.stress <= 30 && g.weekendCount >= 2, progress: g => Math.min(g.mood / 80, (100 - g.stress) / 70, g.weekendCount / 2)},
  {id: "exam_top", name: "年级第一", desc: "任意一次考试达到 650 分", test: g => g.examResults.some(result => result.score >= 650), progress: g => (g.examResults.length ? Math.max(...g.examResults.map(result => result.score)) : 0) / 650},
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
      {label: "选择理科", hint: "物理、化学、生物成为重点，理科能力提升。", track: "science", effects: {subjects: {science: 12, humanities: -4, math: 5}}, result: "你选择了物理、化学和生物，也选择了一条更漫长的路。"},
      {label: "选择文科", hint: "历史、政治、地理成为重点，文科能力提升。", track: "humanities", effects: {subjects: {humanities: 12, science: -4, chinese: 5}}, result: "你决定沿着历史、政治和地理继续追问世界。"},
      {label: "暂时保持均衡", hint: "压力略增，但保留更多可能。", track: "undecided", effects: {stress: 8, mindset: 1}, result: "你没有急着定义自己，先把眼前的路走稳。"},
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
    id: "spring_final_mock",
    day: 930,
    type: "exam",
    title: "高考前最后一次月考",
    eyebrow: "自动触发 · 考试",
    text: "距离高考越来越近。这次考试不会决定一切，却能暴露最后需要补救的地方。",
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
    id: "last_study_week",
    day: 1060,
    title: "最后冲刺周",
    eyebrow: "主线 · 最后调整",
    text: "教室比平时安静。有人继续刷题，也有人开始调整作息。你知道剩下的时间必须用在最重要的地方。",
    choices: [
      {label: "查漏补缺", hint: "成绩小幅提升，压力增加。", effects: {energy: -12, stress: 14, subjects: {math: 4, chinese: 3, english: 3}}, result: "你放弃难题，把最容易丢分的地方重新整理了一遍。"},
      {label: "调整作息和心态", hint: "状态更稳定，成绩提升较少。", effects: {energy: 10, stress: -20, mood: 15, mindset: 2}, result: "你决定让大脑在考试时保持清醒，而不是提前耗尽。"},
    ],
  },
  {
    id: "before_exam",
    day: 1085,
    title: "走进考场之前",
    eyebrow: "主线 · 高考前夜",
    text: "明天就是高考。你最后一次检查准考证和文具，窗外很安静。",
    choices: [
      {label: "再看一遍错题", hint: "获得一点安心，但压力略增。", effects: {stress: 6, subjects: {math: 2, chinese: 2, english: 2}}, result: "你把熟悉的题型再扫了一遍，心里踏实了一些。"},
      {label: "早点休息", hint: "体力与心情恢复。", effects: {energy: 20, stress: -18, mood: 12}, result: "你关掉台灯，告诉自己已经做了能做的一切。"},
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

const STAGE_OPENINGS = {
  high2: {
    id: "high2_opening",
    day: 366,
    title: "高二开学",
    eyebrow: "学期起点 · 新的节奏",
    text: "高一已经成为过去式。课程更深，排名更具体，你也需要决定接下来把精力放在哪里。",
    choices: [
      {label: "把薄弱科目补起来", hint: "基础能力提升，压力略增。", effects: {stress: 6, subjects: {chinese: 4, math: 5, english: 4}}, result: "你重新整理了错题本，决定先补齐短板。"},
      {label: "继续发挥优势科目", hint: "优势更突出，但弱项压力仍在。", effects: {mood: 8, subjects: {math: 6, science: 5}}, result: "你决定把长板拉得更长，让优势成为真正的底气。"},
    ],
  },
  high3: {
    id: "high3_opening",
    day: 731,
    title: "高三开学",
    eyebrow: "冲刺起点 · 时间开始加速",
    text: "走廊里的倒计时牌被重新挂起。从现在开始，每一次模拟考都会更接近真正的高考。",
    choices: [
      {label: "制定严格冲刺计划", hint: "成绩明显提升，压力大幅增加。", effects: {stress: 15, energy: -8, subjects: {chinese: 5, math: 6, english: 5, science: 4}}, result: "你把每天的时间切成小块，几乎没有浪费。"},
      {label: "先稳住身体和心态", hint: "压力下降，长期状态更稳。", effects: {stress: -10, mood: 12, mindset: 2}, result: "你决定不在一开始就把自己逼到极限。"},
    ],
  },
  sprint100: {
    id: "sprint100_opening",
    day: 993,
    title: "百日冲刺",
    eyebrow: "最后一百天 · 全力一战",
    text: "黑板角落写下了“距高考 100 天”。你站在人群里，忽然觉得时间变得很具体。",
    choices: [
      {label: "全力冲刺弱项", hint: "分数潜力提高，压力很高。", effects: {stress: 18, energy: -12, subjects: {chinese: 5, math: 6, english: 5, science: 5, humanities: 4}}, result: "你把最不愿意碰的题型重新摊开，一题一题啃过去。"},
      {label: "保持节奏，稳住发挥", hint: "压力下降，考试状态更稳定。", effects: {stress: -12, mood: 10, mindset: 3}, result: "你决定把最后一百天当成一段长跑，而不是一次赌博。"},
    ],
  },
};

let settings = loadSettings();
let game = loadGame();
let menuScreen = "home";
let selectedCharacter = null;
const CHARACTER_SAVES_KEY = "qinghe-character-journeys-v1";
let draft = {
  name: "",
  attrs: {...PRESETS.balanced},
  preset: "balanced",
  stage: "high1",
  track: "science",
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
let musicPlaybackToken = 0;
let currentWeekendFriend = null;

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
    if(!Array.isArray(data.achievements))data.achievements=[];
    if(!data.relationships||typeof data.relationships!=="object")data.relationships={...DEFAULT_RELATIONSHIPS};
    data.relationships={...DEFAULT_RELATIONSHIPS,...data.relationships};
    if(!data.tutoring||typeof data.tutoring!=="object")data.tutoring={decided:false,subject:"none"};
    data.tutoring={decided:false,subject:"none",...data.tutoring};
    data.weekendCount=Number(data.weekendCount)||0;
    data.tutoringCount=Number(data.tutoringCount)||0;
    data.tutoringDoneThisWeek=!!data.tutoringDoneThisWeek;
    if(!data.track)data.track="undecided";
    if(!data.stage)data.stage="high1";
    if(data.class_id)campusValidate(data);
    return data;
  }catch{return null}
}
function loadSettings(){
  let saved={};
  try{
    saved=JSON.parse(localStorage.getItem(SETTINGS_KEY)||"{}");
  }catch{saved={}}
  const merged={...DEFAULT_SETTINGS,...saved};
  if(!localStorage.getItem(MUSIC_REENABLE_KEY)){
    merged.musicEnabled=true;
    localStorage.setItem(MUSIC_REENABLE_KEY,"1");
  }
  localStorage.setItem(MUSIC_OFF_MIGRATION_KEY,"1");
  localStorage.setItem(SETTINGS_KEY,JSON.stringify(merged));
  return merged;
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
function musicAvailableCount(){
  const ids=new Set(musicCache.keys());
  for(const theme of Object.values(MUSIC_THEMES)){
    for(const [id,,src] of theme.tracks)if(src)ids.add(id);
  }
  return ids.size;
}
function musicButtonLabel(){
  if(!settings.musicEnabled)return "♫ 音乐关";
  if(!musicAvailableCount())return "♫ 待导入";
  return "♫ 音乐开";
}
function trackSource(trackId){
  if(musicUrlCache.has(trackId))return musicUrlCache.get(trackId);
  const track=trackById(trackId);
  return track?.[2]||null;
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
  return theme.tracks.filter(([id,,src])=>musicCache.has(id)||!!src);
}
function unlockMusic(){
  if(MUSIC_FORCE_OFF||!settings.musicEnabled)return;
  const audio=musicAudio[activeAudioIndex];
  if(audio?.src)audio.play().catch(()=>{});
}
async function pauseMusic(){
  musicPlaybackToken++;
  for(const audio of musicAudio){
    try{
      audio.pause();
      audio.currentTime=0;
      audio.removeAttribute("src");
      audio.load();
    }catch{}
  }
  currentMusicTrack=null;
}
async function playTheme(themeId,{force=false}={}){
  if(MUSIC_FORCE_OFF||!settings.musicEnabled)return;
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
  await crossfadeTo(trackSource(trackId),label);
}
async function crossfadeTo(url,label){
  const token=++musicPlaybackToken;
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
  if(token!==musicPlaybackToken){
    nextAudio.pause();
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
    if(token!==musicPlaybackToken){
      nextAudio.pause();
      return;
    }
    const progress=Math.max(0,Math.min(1,(now-start)/duration));
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
  if(game){
    checkAchievements();
    localStorage.setItem(SAVE_KEY,JSON.stringify(game));
    if(game.character_id){const rows=readCharacterSaves();rows[game.character_id]=JSON.parse(JSON.stringify(game));localStorage.setItem(CHARACTER_SAVES_KEY,JSON.stringify(rows));}
  }
}
function gradeForDay(day){
  if(day>=1020)return "高三冲刺";
  if(day>=730)return "高三";
  if(day>=365)return "高二";
  return "高一";
}
function trackLabel(){
  if(game.class_id){const c=campusClass(game.class_id);return c.id+"班 · "+c.combo+c.level;}
  if(game.track==="science")return "理科方向";
  if(game.track==="humanities")return "文科方向";
  return "尚未分科";
}
function stageModifiers(){
  if(game.stage==="sprint100")return {studyBonus:2,stressGain:4,weeklyRecovery:0.62};
  if(game.stage==="high3")return {studyBonus:1,stressGain:2,weeklyRecovery:0.78};
  if(game.stage==="high2")return {studyBonus:0,stressGain:1,weeklyRecovery:0.9};
  return {studyBonus:0,stressGain:0,weeklyRecovery:1};
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
function achievementProgress(achievement){
  try{return clamp(Number(achievement.progress(game))||0,0,1)}catch{return 0}
}
function checkAchievements(){
  if(!game)return;
  for(const achievement of ACHIEVEMENTS){
    if(game.achievements.includes(achievement.id))continue;
    let unlocked=false;
    try{unlocked=achievement.test(game)}catch{}
    if(!unlocked)continue;
    game.achievements.push(achievement.id);
    addLog(`解锁成就：${achievement.name}`);
    toast(`成就解锁：${achievement.name}`);
  }
}
function achievementPanelHtml(){
  const ranked=ACHIEVEMENTS.map(achievement=>{
    const unlocked=game.achievements.includes(achievement.id);
    return {achievement,unlocked,progress:achievementProgress(achievement)};
  }).sort((a,b)=>Number(b.unlocked)-Number(a.unlocked)||b.progress-a.progress);
  return `
    <section class="game-panel">
      <div class="panel-heading"><h2>属性成就</h2><button class="text-button" data-action="all-achievements">${game.achievements.length} / ${ACHIEVEMENTS.length} 查看全部</button></div>
      <div class="achievement-list">
        ${ranked.slice(0,5).map(({achievement,unlocked,progress})=>`
          <div class="achievement-item ${unlocked?"unlocked":""}">
            <div class="achievement-title"><span>${unlocked?"✦":"◇"}</span><b>${achievement.name}</b></div>
            <p>${achievement.desc}</p>
            ${unlocked?'<small>已解锁</small>':`<div class="mini-bar"><i style="width:${Math.round(progress*100)}%"></i></div>`}
          </div>`).join("")}
      </div>
    </section>`;
}
function favoritePlace(friendId){
  return OUTING_PLACES.find(place=>place.likedBy.includes(friendId));
}
function relationshipPanelHtml(){
  const values=Object.values(game.relationships||{});
  const average=values.length?Math.round(values.reduce((sum,value)=>sum+value,0)/values.length):0;
  return `
    <section class="game-panel">
      <div class="panel-heading"><h2>校园关系</h2><small>平均 ${average} / 100</small></div>
      <div class="relationship-list">
        ${FRIENDS.map(friend=>{
          const relationship=game.relationships[friend.id]||0;
          const place=favoritePlace(friend.id);
          const placeName=place&&place.name.startsWith("去")?place.name.slice(1):place?.name;
          return `
            <div class="relationship-item">
              <div class="relationship-top">
                <span class="relationship-avatar">${friend.initial}</span>
                <span class="relationship-copy">
                  <strong>${friend.name} · ${relationshipLabel(relationship)}</strong>
                  <small>${friend.desc}${placeName?` · 喜欢去${placeName}`:""}</small>
                </span>
                <button class="relationship-chat" data-social-friend="${friend.id}" ${game.actionPoints<=0?"disabled":""}>聊聊</button>
              </div>
              <div class="mini-bar"><i style="width:${clamp(relationship,0,100)}%"></i></div>
              <span class="relationship-value">羁绊 ${relationship} / 100</span>
            </div>`;
        }).join("")}
      </div>
    </section>`;
}
function roadmapPanelHtml(){
  const steps=[
    {label:"高一开学",day:1},
    {label:"文理分科",day:215},
    {label:"高三冲刺",day:731},
    {label:"高考",day:TOTAL_DAYS},
  ];
  return `<div class="roadmap">${steps.map(step=>{
    const stepState=game.day>=step.day?"done":game.day>=step.day-90?"active":"";
    return `<span class="roadmap-step ${stepState}"><i></i><b>${step.label}</b><small>第 ${step.day} 天</small></span>`;
  }).join("")}</div>`;
}
function allAchievementsHtml(){
  return `
    <div class="eyebrow">GROWTH ARCHIVE · ${game.achievements.length} / ${ACHIEVEMENTS.length}</div>
    <h2>青春纪念册</h2>
    <p>每一次行动、每一次遇见和每一次考试，都会慢慢改变这三年。</p>
    <div class="achievement-book">
      ${ACHIEVEMENTS.map(achievement=>{
        const unlocked=game.achievements.includes(achievement.id);
        const progress=achievementProgress(achievement);
        return `<article class="achievement-book-item ${unlocked?"unlocked":""}">
          <span class="achievement-seal">${unlocked?"✓":"◇"}</span>
          <div><strong>${achievement.name}</strong><small>${achievement.desc}</small><div class="mini-bar"><i style="width:${Math.round(progress*100)}%"></i></div></div>
          <b>${Math.round(progress*100)}%</b>
        </article>`;
      }).join("")}
    </div>
    <div class="dialog-footer"><button class="primary-button" data-modal-close>合上纪念册</button></div>
  `;
}
function initialState(name,attrs,stageId="high1",track="science"){
  const stage=START_STAGES[stageId]||START_STAGES.high1;
  const relationships={...DEFAULT_RELATIONSHIPS,...stage.relationshipBonus};
  return {
    version:2,
    name,
    attrs:{...attrs},
    stage:stageId,
    track:stageId==="high1"?"undecided":track,
    day:stage.day,
    actionPoints:settings.actionsPerWeek,
    energy:stage.energy,
    stress:stage.stress,
    mood:stage.mood,
    money:stage.money,
    subjects:{...stage.subjects},
    fired:EVENTS.filter(event=>event.day<stage.day).map(event=>event.id),
    pendingEvents:[],
    achievements:[],
    relationships,
    tutoring:{decided:false,subject:"none"},
    weekendCount:0,
    tutoringCount:0,
    tutoringDoneThisWeek:false,
    weekendResolved:false,
    log:[{day:stage.day,text:`${name}从${stage.label}开始新的高中阶段。`}],
    completed:false,
    finalScore:null,
    ending:"",
    examResults:[],
  };
}
function usedPoints(){return Object.values(draft.attrs).reduce((sum,value)=>sum+value-BASE_ATTR,0)}
function remainingPoints(){return EXTRA_POINTS-usedPoints()}

function render(){
  if(menuScreen!=="play"){renderLanding();return;}
  if(game?.completed){
    if(['choices','admission-result'].includes(game.postExamPage)&&game.gaokaoReport&&!HENAN_2025_ADMISSIONS.loaded){openAdmissions(game.postExamPage);return;}
    if(game.postExamPage==='admission-result'&&game.gaokaoReport&&game.admissions?.result){renderAdmissionsResult();return;}
    if(game.postExamPage==='choices'&&game.gaokaoReport){renderAdmissions();return;}
    renderFinal();
    return;
  }
  if(game){
    renderGame();
    return;
  }
  renderLanding();
}

function readCharacterSaves(){
  try{const rows=JSON.parse(localStorage.getItem(CHARACTER_SAVES_KEY)||'{}');return rows&&typeof rows==='object'&&!Array.isArray(rows)?rows:{};}catch{return {};}
}
function characterSave(id){
  if(game?.character_id===id)return game;
  return readCharacterSaves()[id]||null;
}
function saveDate(value){
  if(!value||!Number.isFinite(new Date(value).getTime()))return '旧存档未记录建档日期';
  return new Date(value).toLocaleString('zh-CN',{hour12:false});
}
function renderLanding(){
  const settingsButton='<button class="menu-settings" data-action="settings" aria-label="设置">⚙ <span>设置</span></button>';
  let content='';
  if(menuScreen==='stages'){
    content=`<section class="menu-stage"><button class="menu-back" data-menu="home">← 返回首页</button><p class="menu-kicker">第二页 · 选择起点</p><h1>从哪一天开始？</h1><p class="menu-subtitle">${escapeHtml(draft.name)}，把接下来的日子交给自己。</p><div class="menu-stages">${Object.entries(START_STAGES).map(([id,s])=>`<button data-menu-stage="${id}"><span>${id==='sprint100'?'100':s.label.slice(0,2)}</span><b>${id==='sprint100'?'天冲刺':'开学'}</b><small>距离高考 ${daysLeft(s.day)} 天</small></button>`).join('')}</div><p class="menu-footnote">选择起点后，进入第三页，正式开始高中生活。</p></section>`;
  }else{
    content=`<div class="school-doodles" aria-hidden="true"><svg class="doodle-sun" viewBox="0 0 120 120"><g fill="none" stroke="#edb844" stroke-width="3.5" stroke-linecap="round"><circle cx="60" cy="60" r="23" fill="#ffe597"/><path d="M60 12v10m0 76v10M12 60h10m76 0h10M26 26l7 7m54 54 7 7M26 94l7-7m54-54 7-7"/><path d="M50 63q10 11 20 0" stroke="#bd8740"/></g></svg><svg class="doodle-plane" viewBox="0 0 240 160"><path d="M8 137c68 6 105-29 72-43-28-12-28 38 12 32 36-6 47-34 60-53" fill="none" stroke="#7fb7d3" stroke-width="2" stroke-dasharray="5 7" stroke-linecap="round"/><path d="m143 46 79-27-38 66-13-27-28-12Z" fill="#fffdf5" stroke="#4684aa" stroke-width="2.5" stroke-linejoin="round"/><path d="m171 58 51-39-40 50" fill="none" stroke="#4684aa" stroke-width="2"/></svg><span class="doodle-star star-one">✦</span><span class="doodle-star star-two">✧</span><span class="doodle-note">今天也要闪闪发光！</span></div><section class="menu-hero"><p class="menu-kicker">叮——你的青春已上线 ☀</p><h1>青禾纪事<span>有点热血，有点犯傻，刚好是我们。</span></h1><p class="cover-caption">下一页，去过一个超有意思的高中！</p><p class="menu-footnote">河南 2025 志愿版 · ${HENAN_2025_ADMISSIONS.stats.institutions} 所院校 · ${HENAN_2025_ADMISSIONS.stats.programs} 条专业录取数据</p><div class="menu-primary-actions"><button class="menu-start" data-menu="start">开始游戏 <span>→</span></button><button class="menu-save" data-menu="saves">存档</button></div></section><p class="menu-corner">试卷会写完，夏天还很长。</p>`;
  }
  $('#game-root').innerHTML=`<main class="quiet-menu ${menuScreen==='home'?'home-cover':''}">${settingsButton}${content}</main>`;
}
function openCharacterSaves(id=selectedCharacter||draft.character_id||characterCatalog[0].id){
  selectedCharacter=id;
  const c=characterCatalog.find(c=>c.id===id)||characterCatalog[0],saved=characterSave(c.id);
  let slots=[];try{slots=JSON.parse(localStorage.getItem('qinghe-journey-slots-v1')||'[]');}catch{}
  if(!Array.isArray(slots))slots=[];
  openModal(`<p class="menu-kicker">青春存档</p><h2>选择你的故事</h2><div class="save-characters">${characterCatalog.map(p=>`<button class="save-character ${p.id===c.id?'selected':''}" data-save-character="${p.id}" aria-pressed="${p.id===c.id}"><img src="${campusPortrait(p.id)}" alt=""><b>${escapeHtml(p.name)}</b><small>${characterSave(p.id)?'已有进度':'尚未建档'}</small></button>`).join('')}</div><section class="save-profile"><h3>${escapeHtml(c.name)} <small>${escapeHtml(c.nickname||'')}</small></h3><p>${escapeHtml(c.fields['班级'])} · ${escapeHtml(c.fields['选科组合'])} · 目标 ${escapeHtml(c.fields['目标大学'])}</p><div class="save-date"><span>建档日期</span><b>${saved?saveDate(saved.createdAt):'尚未建立存档'}</b></div>${saved?`<p>当前进度：${gradeForDay(saved.day)} · 距离高考 ${daysLeft(saved.day)} 天</p><div class="profile-stats">${ATTRIBUTES.map(([key,label])=>`<div><span>${label}</span><b>${escapeHtml(saved.attrs[key])}</b></div>`).join('')}</div>`:''}<details class="profile-details"><summary>查看人物完整属性面板</summary><dl>${Object.entries(c.fields).map(([key,value])=>`<div><dt>${escapeHtml(key)}</dt><dd>${escapeHtml(value)}</dd></div>`).join('')}</dl></details>${saved?`<details class="profile-details"><summary>查看当前存档学科属性</summary><dl>${CAMPUS_SUBJECTS.filter(([key])=>Number.isFinite(saved.subjects[key])).map(([key,label])=>`<div><dt>${label}</dt><dd>${saved.subjects[key]}</dd></div>`).join('')}</dl></details>`:''}<div class="dialog-footer">${saved?`<button class="primary-button" data-character-load="${c.id}">继续此存档 →</button>`:''}<button class="${saved?'ghost-button':'primary-button'}" data-character-start="${c.id}">以此人物开始</button></div></section>${game&&!game.character_id?'<button class="ghost-button" data-action="resume" data-menu-close>继续原有自定义人物存档</button>':''}${slots.some(r=>!r.empty&&r.state)?`<details class="profile-details"><summary>其他进度存档槽</summary>${slots.filter(r=>!r.empty&&r.state).map(r=>`<p>${escapeHtml(r.name)} · ${saveDate(r.state.createdAt||r.createdAt)} <button class="ghost-button" data-menu-slot="${Number(r.slot)}">读取</button></p>`).join('')}</details>`:''}`);
}


function renderGame(){
  const next=nextEvent();
  $("#game-root").innerHTML=`
    <div class="game-shell">
      <header class="topbar">
        <div class="hud-brand-row">
          <div class="top-brand"><i>青</i><span>青禾纪事</span></div>
          <div class="top-player">
            <span class="player-avatar">${game.character_id?`<img src="${campusPortrait(game.character_id)}" alt="${escapeHtml(game.name)}">`:escapeHtml(game.name.slice(0,1)||"我")}</span>
            <span>${escapeHtml(game.name)}</span>
            <strong>${gradeForDay(game.day)} · ${trackLabel()}</strong>
          </div>
          <div class="top-actions"><button class="ghost-button" data-menu="home">首页</button><button class="ghost-button" data-campus-classes>我的班级</button>
            <button class="ghost-button music-button" data-action="toggle-music">${musicButtonLabel()}</button>
            <button class="ghost-button settings-button" data-action="settings">⚙ 设置</button>
          </div>
        </div>
        <div class="hud-progress-row">
          <div class="hud-days">
            <small>距离高考</small>
            <strong>${daysLeft(game.day)}</strong>
            <span>天</span>
          </div>
          <div class="hud-progress-main">
            <div class="hud-stage">${gradeForDay(game.day)} · 第 ${weekForDay(game.day)} 周 <span>当前第 ${game.day} 天 / 共 ${TOTAL_DAYS} 天</span></div>
            <div class="progress-track">
              <i style="width:${progressForDay(game.day)}%"></i>
              <b class="progress-now" style="left:${progressForDay(game.day)}%"></b>
            </div>
            <div class="progress-markers"><span>高一开学</span><span>高二</span><span>高三</span><span>高考</span></div>
          </div>
        </div>
      </header>
      <main id="main" class="game-main">
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
              <div class="panel-heading"><h2>学业状态</h2><small>${trackLabel()}</small></div>
              ${(campusOptions(game)||SUBJECTS).map(([id,label])=>subjectRow(id,label)).join("")}
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

            ${achievementPanelHtml()}
            ${relationshipPanelHtml()}

            <section class="game-panel">
              <p class="hint">${learningSummary(game)}</p>
              <div class="panel-heading"><h2>下一件大事</h2><small>${next?`${next.day-game.day} 天后`:"等待高考"}</small></div>
              <div class="next-event">
                <span>MAIN EVENT</span>
                <h3>${next?escapeHtml(next.title):"高考已经临近"}</h3>
                <p>${next?escapeHtml(next.text.slice(0,52))+"……":"全力以赴，完成最后的答卷。"}</p>
              </div>
              ${roadmapPanelHtml()}
            </section>

            <section class="game-panel">
              <div class="panel-heading"><h2>最近记录</h2><small>${game.log.length} 条</small></div>
              ${game.log.length?`<div class="log-list">${game.log.slice(0,4).map(item=>`<div class="log-item"><time>第 ${item.day} 天</time><span>${escapeHtml(item.text)}</span></div>`).join("")}</div>`:'<div class="empty-copy">新的故事还没有开始。</div>'}
            </section>
          </aside>
        </div>
      </main>
      <footer class="music-credit">Music: Kevin MacLeod (incompetech.com) · Creative Commons BY 4.0 · 部分曲目为游戏内嵌授权替代音乐</footer>
    </div>`;
}

function actionCard(action,icon,title,text){
  const image=ACTION_IMAGES[action];
  return `<button class="action-card ${image?"has-image":""}" data-action="${action}" ${game.actionPoints<=0?"disabled":""} ${image?`style="--action-photo:url('${image}')"`:""}><i>${icon}</i><h3>${title}</h3><p>${text}</p></button>`;
}
function statBox(label,value,max,unit=""){
  const shown=label==="零花钱"?value:`${value}`;
  return `<div class="stat-box"><span>${label}</span><strong>${shown}${unit?" "+unit:""}</strong><div class="mini-bar"><i style="width:${clamp(value/max*100,0,100)}%"></i></div></div>`;
}
function subjectRow(id,label){
  const value=game.subjects[id];
  return `<div class="subject-row"><span>${label}</span><div class="mini-bar"><i style="width:${clamp(value/campusMax(id)*100,0,100)}%"></i></div><b>${value}</b></div>`;
}
function studyOptions(){
  if(game.class_id)return campusOptions(game);
  if(game.track==="science")return SUBJECTS.filter(([id])=>["chinese","math","english","science"].includes(id));
  if(game.track==="humanities")return SUBJECTS.filter(([id])=>["chinese","math","english","humanities"].includes(id));
  return SUBJECTS;
}

function renderFinal(){
  if(!game.gaokaoReport){
    game.gaokaoReport=buildGaokaoReport(game);
    game.finalScore=game.gaokaoReport.rows.find(p=>p.active).total;
    persist();
  }
  const best=Math.max(...Object.values(game.gaokaoReport.rows.find(p=>p.active).subjects));
  const bestRelationship=Math.max(...Object.values(game.relationships||{}));
  $("#game-root").innerHTML=`
    <main id="main" class="final-screen celebration-screen">
      <div class="final-wrap">
        <div class="celebration-streamers" aria-hidden="true"><span>✦</span><span>✧</span><span>✦</span><span>✧</span><span>✦</span><span>✧</span></div>
        <header class="score-good-news"><p class="eyebrow">青春有答卷 · 努力有回响</p><h1>喜报</h1><p class="good-news-name">${escapeHtml(game.name)} · 高考出分啦</p><p>一路的坚持，终于写成今天的成绩。</p><div class="final-score"><strong>${game.finalScore}</strong><small>/ 750 分</small></div><span class="good-news-seal">青春纪念</span></header>
        ${gaokaoResultsTable(game.gaokaoReport)}
        <div class="final-grid">
          <section class="final-card">
            <h2>三年记录</h2>
            <p>${escapeHtml(game.ending)}</p>
            <div class="final-facts">
              <div class="final-fact"><span>单科最高实考分</span><strong>${best}</strong></div>
              <div class="final-fact"><span>心态</span><strong>${game.attrs.mindset}</strong></div>
              <div class="final-fact"><span>魅力</span><strong>${game.attrs.charm}</strong></div>
              <div class="final-fact"><span>最高羁绊</span><strong>${bestRelationship}</strong></div>
              <div class="final-fact"><span>成长成就</span><strong>${game.achievements.length} / ${ACHIEVEMENTS.length}</strong></div>
            </div>
          </section>
          <section class="final-card">
            <h2>接下来</h2>
            <p>成绩已经公布，下一页填写 5 个大学与专业志愿，查看模拟录取结果。</p>
            <button class="primary-button" data-admissions-page="choices">下一页：志愿填报 →</button>
            <button class="ghost-button" data-journey-slots>进度存档槽</button>
            <button class="primary-button" data-action="new-game">重新开始新周目 →</button>
          </section>
        </div>
      </div>
    </main>`;
}

function changeAttribute(id,delta){
  if(draft.character_id)return toast("此人物使用填写表属性；可切换自定义人物分配属性");
  const current=draft.attrs[id];
  if(delta>0&&(remainingPoints()<=0||current>=80))return toast(current>=80?"单项属性最高 80":"没有剩余点数了");
  if(delta<0&&current<=BASE_ATTR)return;
  draft.attrs[id]=current+delta;
  draft.preset="";
  renderLanding();
}

function applyPreset(id){
  if(draft.character_id)return toast("此人物使用填写表属性");
  draft.preset=id;
  draft.attrs={...PRESETS[id]};
  renderLanding();
}

function applyStage(id){
  if(!START_STAGES[id])return;
  draft.stage=id;
  renderLanding();
}

function applyTrack(id){
  draft.track=id==="humanities"?"humanities":"science";
  renderLanding();
}

function startGame(){
  const name=$("#player-name")?.value.trim()||draft.name;
  if(!name)return toast("先给自己取一个名字");
  if(!draft.character_id&&remainingPoints()!==0)return toast(`还有 ${remainingPoints()} 点属性没有分配`);
  draft.name=name;
  if(game)persist();
  game=campusStart(initialState(name,draft.attrs,draft.stage,draft.track),draft);
  learningState(game);
  game.createdAt=new Date().toISOString();
  menuScreen="play";
  persist();
  render();
  const opening=draft.stage==="high1"?EVENTS[0]:STAGE_OPENINGS[draft.stage];
  setTimeout(()=>openEvent(opening),260);
}

function performAction(type){
  if(game.actionPoints<=0)return toast("本周行动已经用完");
  if(type==="study"){
    playTheme("focus",{force:true});
    openModal(`
      <div class="eyebrow">LEARNING · 专注学习</div>
      <h2>今天学什么？</h2>
      <p>学习可能进步、持平或暂时退步，学力、体力和压力影响概率。长期不复习会增加遗忘风险。每次消耗 1 次行动。</p>
      <div class="choice-list">${studyOptions().map(([id,label])=>`<button class="choice-button" data-study="${id}"><strong>${label}</strong><small>当前能力 ${game.subjects[id]} / ${campusMax(id)} · 本周遗忘风险约 ${Math.round(learningRisk(game,id,game.day+7)*100)}%</small></button>`).join("")}</div>
      <div class="dialog-footer"><button class="ghost-button" data-modal-close>取消</button></div>
    `);
    return;
  }
  if(type==="social"){
    showSocialOptions();
    return;
  }
  const effects={
    rest:{energy:24,stress:-18,mood:8,text:"你放下书本，好好休息了一会儿。"},
    exercise:{energy:7,stress:-10,mood:12,text:"运动之后，身体和心情都轻松了一点。"},
  }[type];
  if(!effects)return;
  learningRecord(game,type);
  game.actionPoints--;
  game.energy=clamp(game.energy+(effects.energy||0),0,100);
  game.stress=clamp(game.stress+(effects.stress||0),0,100);
  game.mood=clamp(game.mood+(effects.mood||0),0,100);
  if(effects.charm)game.attrs.charm=clamp(game.attrs.charm+campusGrowth(effects.charm),0,100);
  addLog(effects.text);
  persist();
  render();
  toast(effects.text);
  if(game.actionPoints===0&&!game.weekendResolved)setTimeout(openWeekend,320);
}

function showSocialOptions(){
  if(game.actionPoints<=0)return toast("本周行动已经用完");
  openModal(`
    <div class="eyebrow">CAMPUS CONNECTION · 同窗羁绊</div>
    <h2>今天想和谁聊聊？</h2>
    <p>主动交流可以拉近关系、缓解压力，也会消耗 1 次行动。关系越熟，之后的周末相处越自然。</p>
    <div class="choice-list">
      ${FRIENDS.map(friend=>{
        const relationship=game.relationships[friend.id]||0;
        const place=favoritePlace(friend.id);
        const placeName=place&&place.name.startsWith("去")?place.name.slice(1):place?.name;
        return `<button class="choice-button" data-social-friend="${friend.id}">
          <strong>${friend.name} · ${relationshipLabel(relationship)}</strong>
          <small>${friend.desc} · 羁绊 ${relationship} / 100${placeName?` · 喜欢去${placeName}`:""}</small>
        </button>`;
      }).join("")}
    </div>
    <div class="dialog-footer"><button class="ghost-button" data-modal-close>先不去了</button></div>
  `);
}

function resolveSocialChoice(friendId){
  const friend=FRIENDS.find(item=>item.id===friendId);
  if(!friend||game.actionPoints<=0)return;
  const before=game.relationships[friend.id]||0;
  const moodBonus=game.mood>=70?1:0;
  const gain=Math.max(2,Math.round(2+game.attrs.charm*0.035+game.weekendCount*0.18+moodBonus));
  game.relationships[friend.id]=clamp(before+gain,0,100);
  game.actionPoints--;
  applyEffects({energy:-3,stress:-5,mood:7,charm:1});
  const text=`你和${friend.name}聊了很久，彼此又熟悉了一点。羁绊 +${game.relationships[friend.id]-before}。`;
  addLog(text);
  persist();
  closeModal(true);
  render();
  toast(text);
  if(game.actionPoints===0&&!game.weekendResolved)setTimeout(openWeekend,320);
}

function studySubject(id){
  if(game.actionPoints<=0)return toast("本周行动已经用完");
  const option=studyOptions().find(item=>item[0]===id);if(!option)return;
  const label=option[1];
  const modifiers=stageModifiers();
  const before=game.subjects[id];
  learningStudy(game,id);
  game.actionPoints--;
  game.energy=clamp(game.energy-8,0,100);
  game.stress=clamp(game.stress+7+modifiers.stressGain,0,100);
  game.mood=clamp(game.mood-2,0,100);
  addLog(`专注学习${label}，能力变化 ${Math.round((game.subjects[id]-before)*100)/100} 点（学习不保证立即进步，已记录复习）。`);
  persist();
  closeModal();
  render();
  toast(`${label} ${game.subjects[id]>=before?"+":""}${Math.round((game.subjects[id]-before)*100)/100}`);
  if(game.actionPoints===0&&!game.weekendResolved)setTimeout(openWeekend,320);
}

function openWeekend(){
  if(game.weekendResolved||game.actionPoints>0)return;
  playTheme("bright",{force:true});
  if(!game.tutoring.decided){
    showTutoringDecision();
    return;
  }
  if(game.tutoring.subject!=="none"&&!game.tutoringDoneThisWeek){
    showMandatoryTutoring();
    return;
  }
  showWeekendOptions();
}

function showTutoringDecision(){
  openModal(`
    <div class="eyebrow">FAMILY MEETING · 家庭商量</div>
    <h2>要不要安排周末补课？</h2>
    <p>爸妈把几张辅导班宣传单放在桌上。选择一门课后，之后的每个周末都会先完成一次必选补课；也可以先不补。</p>
    <div class="choice-list">
      <button class="choice-button" data-tutoring="none"><strong>暂时不补课</strong><small>保留完整周末，但成绩提升更依赖自己学习。</small></button>
      ${(game.class_id?campusOptions(game).map(([id,label])=>({id,label})):TUTORING_SUBJECTS).map(subject=>`<button class="choice-button" data-tutoring="${subject.id}"><strong>补${subject.label}</strong><small>每周复习${subject.label}，效果有波动，也会消耗体力和增加压力。</small></button>`).join("")}
    </div>
  `, false);
}

function resolveTutoringChoice(subjectId){
  game.tutoring={decided:true,subject:subjectId};
  if(subjectId==="none"){
    addLog("和父母商量后，决定暂时不安排周末补课。");
    persist();
    closeModal(true);
    showWeekendOptions();
    return;
  }
  showMandatoryTutoring();
}

function showMandatoryTutoring(){
  const subject=[...TUTORING_SUBJECTS,...CAMPUS_SUBJECTS.map(([id,label])=>({id,label}))].find(item=>item.id===game.tutoring.subject);
  if(!subject){
    game.tutoring.subject="none";
    showWeekendOptions();
    return;
  }
  if(game.tutoringDoneThisWeek){
    showWeekendOptions();
    return;
  }
  game.tutoringDoneThisWeek=true;
  game.tutoringCount++;
  const gain=learningStudy(game,subject.id);
  applyEffects({energy:-10,stress:9,mood:-3});
  addLog(`周末参加${subject.label}补课，能力变化 ${gain} 点。`);
  persist();
  render();
  openModal(`
    <div class="eyebrow">TUTORING · 必选安排</div>
    <h2>${subject.label}补课结束</h2>
    <div class="result-copy">这周的${subject.label}补习完成了。你在笔记上又补上了几页重点，接下来可以自由安排周末。</div>
    <div class="final-facts">
      <div class="final-fact"><span>${subject.label}变化</span><strong>${gain>=0?"+":""}${gain}</strong></div>
      <div class="final-fact"><span>体力</span><strong>−10</strong></div>
      <div class="final-fact"><span>压力</span><strong>+9</strong></div>
      <div class="final-fact"><span>补课次数</span><strong>${game.tutoringCount}</strong></div>
    </div>
    <div class="dialog-footer"><button class="primary-button" data-action="continue-tutoring">继续安排周末 →</button></div>
  `, false);
}

function showWeekendOptions(){
  openModal(`
    <div class="eyebrow">WEEKEND · 自由时间</div>
    <h2>剩下的周末时间，想怎么过？</h2>
    <p>${game.tutoring.subject!=="none"?`本周补课已经完成。`:"这个周末没有补课。"}选一项安排，会直接影响状态。</p>
    <div class="choice-list">
      ${WEEKEND_OPTIONS.map(option=>`<button class="choice-button" data-weekend-option="${option.id}"><strong>${option.label}</strong><small>${option.hint}</small></button>`).join("")}
    </div>
    <div class="dialog-footer"><button class="ghost-button" data-action="tutoring-plan">调整补课计划</button></div>
  `, false);
}

function resolveWeekendOption(optionId){
  if(optionId==="outing"){
    showFriendSelect();
    return;
  }
  const results={
    part_time:{effects:{energy:-18,stress:8,money:180},text:"你做了半天兼职，第一次觉得赚钱比想象中更累。"},
    family:{effects:{energy:-5,stress:-12,mood:13,money:30},text:"你和家人一起买菜做饭，普通的一天也变得温暖。"},
    hobby:{effects:{energy:-4,stress:-12,mood:14,charm:1},text:"你把时间花在喜欢的事情上，找回了自己的节奏。"},
    exercise:{effects:{energy:8,stress:-12,mood:11,stamina:1},text:"运动之后，身体和心情都轻了不少。"},
    sleep:{effects:{energy:30,stress:-18,mood:6},text:"你睡到自然醒，积攒的疲惫慢慢散开。"},
    study:{effects:{energy:-9,stress:6,subjects:{chinese:2,math:2,english:2}},text:"安静的周末自习让几门主科都向前推进了一点。"},
  };
  const result=results[optionId];
  if(!result)return;
  applyEffects(result.effects);
  finishWeekend(result.text);
}

function relationshipLabel(value){
  if(value>=60)return "好朋友";
  if(value>=35)return "熟悉";
  if(value>=15)return "普通同学";
  return "还不太熟";
}

function showFriendSelect(){
  openModal(`
    <div class="eyebrow">OUTING · 选择同行的人</div>
    <h2>想和谁一起出去？</h2>
    <p>关系越熟，相处时越放松；跟不太熟的同学出去，可能会有一点压力。</p>
    <div class="choice-list">
      ${FRIENDS.map(friend=>{
        const relationship=game.relationships[friend.id]||0;
        return `<button class="choice-button" data-outing-friend="${friend.id}"><strong>${friend.name} · ${relationshipLabel(relationship)}</strong><small>${friend.desc} · 关系 ${relationship} / 100</small></button>`;
      }).join("")}
    </div>
    <div class="dialog-footer"><button class="ghost-button" data-action="weekend-back">返回</button></div>
  `, false);
}

function resolveFriendChoice(friendId){
  currentWeekendFriend=FRIENDS.find(friend=>friend.id===friendId)||null;
  if(!currentWeekendFriend)return;
  showPlaceSelect();
}

function showPlaceSelect(){
  const friend=currentWeekendFriend;
  if(!friend)return showFriendSelect();
  openModal(`
    <div class="eyebrow">OUTING · 选择地点</div>
    <h2>和${friend.name}去哪里？</h2>
    <p>不同朋友喜欢的地方不同，去对地方时心情和关系提升会更明显。</p>
    <div class="choice-list">
      ${OUTING_PLACES.map(place=>`<button class="choice-button" data-outing-place="${place.id}"><strong>${place.name}</strong><small>${place.cost?`花费 ¥${place.cost} · `:""}${place.likedBy.includes(friend.id)?"对方会很喜欢这里":"普通选择"}</small></button>`).join("")}
    </div>
    <div class="dialog-footer"><button class="ghost-button" data-action="choose-friend-again">换个朋友</button></div>
  `, false);
}

function resolvePlaceChoice(placeId){
  const friend=currentWeekendFriend;
  const place=OUTING_PLACES.find(item=>item.id===placeId);
  if(!friend||!place)return;
  if(game.money<place.cost)return toast("零花钱不够，换一个地方吧。");
  const relationship=game.relationships[friend.id]||0;
  const factor=relationship>=60?1.15:relationship>=35?1:relationship>=15?.8:.6;
  const affinity=place.likedBy.includes(friend.id);
  const effects={...place.effects};
  effects.mood=Math.round((effects.mood||0)*factor+(affinity?5:0));
  effects.stress=Math.round((effects.stress||0)*(affinity?1.15:factor));
  if(affinity)effects.charm=(effects.charm||0)+1;
  if(place.cost)game.money-=place.cost;
  const relationGain=Math.round(3+relationship/18+(affinity?2:0));
  game.relationships[friend.id]=clamp(relationship+relationGain,0,100);
  applyEffects(effects);
  const familiarity=relationshipLabel(relationship);
  const result=affinity
    ? `${friend.name}很喜欢${place.name}。你们相处得比平时更自然，关系提升 ${relationGain}。`
    : `你和${friend.name}去了${place.name}。你们现在是「${familiarity}」，这次相处${relationship>=35?"很轻松":"还需要一点时间熟悉"}，关系提升 ${relationGain}。`;
  finishWeekend(result);
}

function finishWeekend(result){
  currentWeekendFriend=null;
  game.weekendResolved=true;
  game.weekendCount++;
  addLog(result);
  persist();
  render();
  closeModal(true);
  toast(result);
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
  if(game.completed||game.day>=TOTAL_DAYS)return;
  const previous=game.day;
  const toDay=Math.min(TOTAL_DAYS,game.day+DAYS_PER_WEEK);
  const losses=learningSettle(game,toDay);
  if(losses.length)addLog(`本周知识保持：${losses.map(([id,n])=>`${[...CAMPUS_SUBJECTS,...SUBJECTS].find(s=>s[0]===id)?.[1]||id} −${n}`).join("、")}。轮换复习可降低后续遗忘风险。`);
  game.day=toDay;
  game.actionPoints=settings.actionsPerWeek;
  game.energy=clamp(game.energy+15,0,100);
  game.stress=clamp(game.stress-Math.round(8*stageModifiers().weeklyRecovery),0,100);
  game.weekendResolved=false;
  game.tutoringDoneThisWeek=false;
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
  const theme=EVENT_MUSIC[event.id]||"calm";
  if(settings.eventMusic&&theme!==currentMusicTheme)playTheme(theme,{force:true});
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
  if(choice.track){if(game.class_id)campusAssign(game,choice.track==="science"?4:13);else game.track=choice.track;}
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
  if(event.type==="gaokao")return calculateGaokao(event);
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
  if(event.type==="gaokao")return calculateGaokao(event);
  const base=(game.subjects.chinese+game.subjects.math+game.subjects.english+game.subjects.science+game.subjects.humanities)/5;
  const ability=(game.attrs.insight*0.8+game.attrs.mindset*0.45+base*1.75);
  const difficulty=event.difficulty*13;
  const styleMod=style==="sprint"?28:style==="check"?10:0;
  const pressureMod=style==="sprint"?-Math.max(0,game.stress-45)*0.75:0;
  const random=Math.round((Math.random()-.5)*70);
  const raw=game.class_id?campusOptions(game).reduce((sum,[id])=>sum+game.subjects[id],0)+(game.attrs.insight-60)*0.3+(game.attrs.mindset-60)*0.2-difficulty+styleMod+pressureMod+random:ability*1.95+80-difficulty+styleMod+pressureMod+random;
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
  if(effects.charm)game.attrs.charm=clamp(game.attrs.charm+campusGrowth(effects.charm),0,100);
  if(effects.stamina)game.attrs.stamina=clamp(game.attrs.stamina+campusGrowth(effects.stamina),0,100);
  if(effects.mindset)game.attrs.mindset=clamp(game.attrs.mindset+campusGrowth(effects.mindset),0,100);
  if(effects.subjects){
    for(const [id,value] of Object.entries(effects.subjects)){
      campusEffect(id,value);
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
  playTheme(settings.menuMusicTheme||"calm");
}
function openSettings(){
  openModal(`<div class="eyebrow">声音设置</div><h2>留一点安静给青春</h2>
    <label class="setting-row"><span><b>背景音乐</b><small>随时开启或暂停</small></span><input class="setting-toggle" type="checkbox" data-setting="musicEnabled" ${settings.musicEnabled?'checked':''}></label>
    <label class="setting-row"><span><b>音量</b><small id="volume-value">${settings.musicVolume}%</small></span><input id="settings-volume" type="range" min="0" max="100" value="${settings.musicVolume}" aria-label="音乐音量"></label>
    <label class="setting-row"><span><b>背景音乐主题</b></span><select id="simple-music-theme" aria-label="背景音乐主题">${Object.entries(MUSIC_THEMES).map(([id,t])=>`<option value="${id}" ${(settings.menuMusicTheme||'calm')===id?'selected':''}>${t.label}</option>`).join('')}</select></label>
    <label class="setting-row"><span><b>剧情自动切换音乐</b></span><input class="setting-toggle" type="checkbox" data-setting="eventMusic" ${settings.eventMusic?'checked':''}></label>
    <div class="dialog-footer"><button class="ghost-button" data-action="music-library">选择本地音乐</button><button class="primary-button" data-modal-close>完成</button></div>`);
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
    if(value)playTheme(settings.menuMusicTheme||"calm",{force:true});
    else pauseMusic();
  }
  if(name==="eventMusic"){
    playTheme(value&&currentModal?.event?(EVENT_MUSIC[currentModal.event.id]||"calm"):"calm",{force:true});
  }
  if(name==="musicVolume"&&$("#volume-value"))$("#volume-value").textContent=settings.musicVolume+"%";
  if(game)render();
  if(name==="autoEvents"&&value&&game?.pendingEvents.length){
    closeModal(true);
    setTimeout(showNextEvent,220);
  }
}

function toggleMusic(){
  if(MUSIC_FORCE_OFF){
    pauseMusic();
    return toast("当前版本已强制关闭背景音乐");
  }
  if(settings.musicEnabled&&!musicAvailableCount()){
    openMusicLibrary();
    return toast("请先导入本地音乐文件");
  }
  if(settings.musicEnabled){
    settings.musicEnabled=false;
    persistSettings();
    pauseMusic();
    toast("背景音乐已关闭");
  }else{
    settings.musicEnabled=true;
    persistSettings();
    if(!musicAvailableCount()){
      openMusicLibrary();
      toast("请先导入本地音乐文件");
    }else{
      playTheme(currentMusicTheme,{force:true});
      toast("背景音乐已开启");
    }
  }
  if(game)render();
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
    game=campusValidate(imported);
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
        ${theme.tracks.map(([trackId,title,src])=>{
          const local=musicCache.has(trackId),builtIn=!!src,available=local||builtIn;
          return `<div class="music-track ${available?"loaded":""}">
            <div><b>${escapeHtml(title)}</b><small>${local?"已导入本地文件":builtIn?"内置授权音乐，可直接播放":"尚未导入音频文件"}</small></div>
            <div class="music-track-actions">
              <button class="ghost-button" data-preview-track="${trackId}" ${available?"":"disabled"}>试听</button>
              <label class="ghost-button file-button">${available?"替换":"选择文件"}<input type="file" accept="audio/*,.mp3,.m4a,.ogg,.wav,.flac" data-music-file="${trackId}" hidden></label>
              ${local?`<button class="ghost-button danger-button" data-clear-track="${trackId}">移除本地文件</button>`:""}
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
        <span>${musicAvailableCount()} / ${musicTrackCount()} 首可播放</span>
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
  if(game)render();
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
  if(game)render();
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
  if(MUSIC_FORCE_OFF)return toast("当前版本已强制关闭背景音乐");
  const url=trackSource(trackId);
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
  menuScreen="home";
  closeModal(true);
  draft={name:"",attrs:{...PRESETS.balanced},preset:"balanced",stage:"high1",track:"science"};
  render();
}

document.addEventListener("click",event=>{
  const button=event.target.closest("button");
  if(!button||button.disabled)return;
  if(button.dataset.action!=="toggle-music")unlockMusic();
  if(button.dataset.preset)return applyPreset(button.dataset.preset);
  if(button.dataset.stage)return applyStage(button.dataset.stage);
  if(button.dataset.track)return applyTrack(button.dataset.track);
  if(button.dataset.attr)return changeAttribute(button.dataset.attr,Number(button.dataset.delta));
  if(button.dataset.study)return studySubject(button.dataset.study);
  if(button.dataset.socialFriend)return resolveSocialChoice(button.dataset.socialFriend);
  if(button.dataset.tutoring)return resolveTutoringChoice(button.dataset.tutoring);
  if(button.dataset.weekendOption)return resolveWeekendOption(button.dataset.weekendOption);
  if(button.dataset.outingFriend)return resolveFriendChoice(button.dataset.outingFriend);
  if(button.dataset.outingPlace)return resolvePlaceChoice(button.dataset.outingPlace);
  if(button.dataset.eventChoice!==undefined)return resolveEventChoice(Number(button.dataset.eventChoice));
  if(button.dataset.exam)return calculateExam(currentModal.event,button.dataset.exam);
  if(button.hasAttribute("data-modal-close"))return closeModal();
  if(button.hasAttribute("data-continue-event"))return continueAfterEvent();
  if(button.hasAttribute("data-confirm-week")){closeModal();return advanceWeek()}
  if(button.hasAttribute("data-confirm-new"))return resetGame();
  if(button.dataset.action==="toggle-music")return toggleMusic();
  if(button.dataset.action==="settings")return openSettings();
  if(button.dataset.action==="all-achievements")return openModal(allAchievementsHtml());
  if(button.dataset.action==="music-library")return openMusicLibrary();
  if(button.dataset.action==="back-settings")return openSettings();
  if(button.dataset.previewTrack)return previewMusicTrack(button.dataset.previewTrack);
  if(button.dataset.clearTrack)return removeMusicTrack(button.dataset.clearTrack);
  if(button.dataset.action==="save-name")return saveCharacterName();
  if(button.dataset.action==="export-save")return exportSave();
  if(button.dataset.action==="show-pending")return showNextEvent();
  if(button.dataset.action==="continue-tutoring"){closeModal(true);return showWeekendOptions()}
  if(button.dataset.action==="tutoring-plan")return showTutoringDecision();
  if(button.dataset.action==="weekend-back")return showWeekendOptions();
  if(button.dataset.action==="choose-friend-again")return showFriendSelect();
  if(button.dataset.action==="resume"){
    game=loadGame();
    menuScreen="play";
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

function prepareMenuStart(id){
  const characterId=id||draft.character_id||game?.character_id||characterCatalog[0].id;
  if(characterSave(characterId)&&!confirm('此人物已有存档。开始新故事将替换此人物的自动存档，继续吗？'))return;
  const stage=draft.stage||'high1';
  campusDraft(characterId);
  draft.stage=stage;
  menuScreen='stages';closeModal(true);render();
}
document.addEventListener('click',event=>{
  const b=event.target.closest('button');if(!b||b.disabled)return;
  if(b.dataset.menu==='home'){if(game)persist();menuScreen='home';closeModal(true);render();}
  if(b.dataset.menu==='start')prepareMenuStart();
  if(b.dataset.menu==='saves')openCharacterSaves();
  if(b.dataset.saveCharacter)openCharacterSaves(b.dataset.saveCharacter);
  if(b.dataset.characterStart){
    prepareMenuStart(b.dataset.characterStart);
  }
  if(b.dataset.menuStage){draft.stage=b.dataset.menuStage;startGame();}
  if(b.dataset.characterLoad){
    try{game=campusValidate(JSON.parse(JSON.stringify(characterSave(b.dataset.characterLoad))));menuScreen='play';persist();closeModal(true);render();}catch{toast('这个存档无法读取，请检查存档数据');}
  }
  if(b.hasAttribute('data-menu-close'))closeModal(true);
  if(b.dataset.menuSlot){
    try{const row=JSON.parse(localStorage.getItem('qinghe-journey-slots-v1')||'[]').find(r=>r.slot===Number(b.dataset.menuSlot));game=campusValidate(JSON.parse(JSON.stringify(row.state)));menuScreen='play';persist();closeModal(true);render();}catch{toast('这个存档无法读取');}
  }
});
document.addEventListener('change',event=>{
  if(event.target.id==='simple-music-theme'){settings.menuMusicTheme=event.target.value;persistSettings();if(settings.musicEnabled)playTheme(settings.menuMusicTheme,{force:true});}
});

render();
if(location.hash==="#classes"&&game)campusShowClasses();
initializeMusicLibrary().then(()=>{
  pauseMusic();
  if(!MUSIC_FORCE_OFF&&game&&!game.completed)playTheme("calm",{force:true});
  if(game)render();
});
