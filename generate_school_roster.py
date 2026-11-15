"""Generate stable fictional classmates; rerun explicitly when the character catalog changes."""
import json
import random
from pathlib import Path
from school_catalog import CLASSES

ROOT = Path(__file__).resolve().parent
SUBJECTS = ['chinese','math','english','physics','chemistry','biology','history','politics','geography']

# Separate identity stream so names and genders never change academic attributes.
SURNAMES = '赵 钱 孙 李 周 吴 郑 王 冯 陈 褚 卫 蒋 沈 韩 杨 朱 秦 许 何 吕 施 张 孔 曹 严 华 金 魏 陶 姜 戚 谢 邹 喻 柏 窦 章 云 苏 潘 葛 奚 范 彭 鲁 韦 马 苗 方 俞 任 袁 柳 鲍 史 唐 费 薛 雷 贺 倪 汤 罗 毕 郝 安 常 傅 顾 孟 黄 萧 尹 姚 邵 汪 江 钟 廖 陆 叶 程 林 邓 徐 高 梁 宋 曾 杜 田'.split()
GIVEN_FIRST = {"男":"宇 浩 俊 奕 子 承 景 明 泽 逸 嘉 书 修 睿 远 博 亦 辰 一 文","女":"语 雨 诗 若 依 思 沐 清 安 晓 梦 婉 昕 知 佳 舒 可 以 韵 星"}
GIVEN_LAST = {"男":"轩 然 宇 航 辰 泽 霖 川 阳 铭 远 谦 哲 衡 熙 尧 硕 瑞 宁 凯","女":"涵 宁 桐 瑶 悦 妍 萱 晴 玥 怡 然 希 竹 音 岚 彤 芮 婧 夏 璇"}
def identity_generator(characters):
    seed = 20261115
    used = {c['name'] for c in characters}
    def pick(items):
        nonlocal seed
        seed = (1664525 * seed + 1013904223) & 0xffffffff
        return items[(seed * len(items)) // 4294967296]
    def next_identity():
        gender = pick(['男', '女'])
        while True:
            name = pick(SURNAMES) + pick(GIVEN_FIRST[gender].split()) + pick(GIVEN_LAST[gender].split())
            if name not in used:
                used.add(name)
                return name, gender
    return next_identity

def generate():
    characters=json.loads((ROOT/'frontend/characters/characters.json').read_text(encoding='utf-8'))
    rng=random.Random(20261017)
    next_identity=identity_generator(characters)
    def sample(mean, deviation):
        while True:
            value=rng.gauss(mean,deviation)
            if 0 <= value <= 100: return value
    students=[]
    for school in CLASSES:
        known=[c for c in characters if c['initial_state']['class_id']==school['id']]
        if len(known)>30: raise ValueError('给定人物超过班级人数')
        mean,sd=(75,10) if school['level']=='尖子班' else (60,12)
        for index in range(1,31-len(known)):
            name,gender=next_identity()
            students.append(dict(id=f"generated-{school['id']}-{index:02}",name=name,gender=gender,
                class_id=school['id'],generated=True,
                subjects={k:round(sample(mean,sd)*(1.5 if k in SUBJECTS[:3] else 1),2) for k in SUBJECTS},
                attrs={k:round(sample(60,12),2) for k in ['insight','stamina','mindset','charm']}))
    return dict(seed=20261017,distribution='truncated_normal',ordinary=dict(mean=60,sd=12),
                advanced=dict(mean=75,sd=10),attributes=dict(mean=60,sd=12),students=students)

if __name__=='__main__':
    data=generate()
    raw=json.dumps(data,ensure_ascii=False,indent=2)+'\n'
    for folder in ['frontend','docs']:
        (ROOT/folder/'school-roster.json').write_text(raw,encoding='utf-8')
        (ROOT/folder/'school-roster-data.js').write_text('const campusPopulation = '+raw.rstrip()+';\n',encoding='utf-8')
    print(f"Generated {len(data['students'])} fictional classmates; supplied characters remain unchanged.")
