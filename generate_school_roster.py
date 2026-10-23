"""Generate stable fictional classmates; rerun explicitly when the character catalog changes."""
import json
import random
from pathlib import Path
from school_catalog import CLASSES

ROOT = Path(__file__).resolve().parent
SUBJECTS = ['chinese','math','english','physics','chemistry','biology','history','politics','geography']

def generate():
    characters=json.loads((ROOT/'frontend/characters/characters.json').read_text(encoding='utf-8'))
    rng=random.Random(20261017)
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
            students.append(dict(id=f"generated-{school['id']}-{index:02}",name=f"{school['id']}班同学{index:02}",
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
