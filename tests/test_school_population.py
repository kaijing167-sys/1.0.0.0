import json
import statistics
from pathlib import Path
from generate_school_roster import generate, SUBJECTS
from character_catalog import CHARACTERS
from school_catalog import CLASSES
import asyncio
from httpx import ASGITransport, AsyncClient
from main import app

ROOT=Path(__file__).resolve().parents[1]

def test_population_counts_and_reproducibility():
    data=json.loads((ROOT/'frontend/school-roster.json').read_text(encoding='utf-8'))
    assert data==generate()
    assert len(data['students'])==206
    assert len({p['id'] for p in data['students']})==206
    for c in CLASSES:
        assert c['size']==30
        generated=sum(p['class_id']==c['id'] for p in data['students'])
        supplied=sum(p['initial_state']['class_id']==c['id'] for p in CHARACTERS)
        assert generated+supplied==30
    for file in ['school-roster.json','school-roster-data.js','roster.js','index.html']:
        assert (ROOT/'frontend'/file).read_bytes()==(ROOT/'docs'/file).read_bytes()

def test_generated_attributes_follow_bounded_normal_parameters():
    data=generate()
    for advanced,mean,sd in [(True,75,10),(False,60,12)]:
        values=[]
        for p in data['students']:
            for key,value in p['subjects'].items():
                assert 0<=value<=(150 if key in SUBJECTS[:3] else 100)
                if (p['class_id'] in (2,11))==advanced:
                    values.append(value/(1.5 if key in SUBJECTS[:3] else 1))
            assert all(0<=v<=100 for v in p['attrs'].values())
        assert abs(statistics.mean(values)-mean)<2
        assert abs(statistics.stdev(values)-sd)<2

def test_classmate_api():
    async def request():
        async with AsyncClient(transport=ASGITransport(app=app),base_url='http://test') as client:
            return await client.get('/api/characters/classmates')
    response=asyncio.run(request())
    assert response.status_code==200
    data=response.json()
    assert data['total']==210
    assert data['given_characters']==CHARACTERS
