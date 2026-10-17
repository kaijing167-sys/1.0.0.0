from test_saves import client
from character_catalog import CHARACTER_BY_ID

def journey():
    c=CHARACTER_BY_ID['hu-zx']['initial_state']
    subjects={k:v for k,v in c['attrs'].items() if k not in ('stamina','stress','money','action_points')}
    subjects.update(science=120,humanities=114)
    return dict(version=2,name='虎zx',day=1000,attrs=dict(insight=70,stamina=55,mindset=72,charm=70),
                subjects=subjects,character_id='hu-zx',class_id=2,origin_class_id=2,
                subject_combination=['physics','chemistry','biology'],track='science',stage='sprint100',
                actionPoints=2,energy=75,stress=40,mood=60,money=70,completed=False,
                pendingEvents=['mock_exam'],fired=['military'],achievements=[],log=[dict(day=1000,text='继续旅程')],
                examResults=[],relationships=dict(liqiang=48,su=42,lin=28),
                tutoring=dict(decided=True,subject='math'),weekendCount=3,tutoringCount=2,
                tutoringDoneThisWeek=False,weekendResolved=False,finalScore=None,ending='')

def test_journey_round_trip_and_conflict(client):
    state=journey()
    body=dict(name='统一进度',expected_revision=0,state=state)
    assert client.put('/api/saves/1',json=body).status_code==200
    saved=client.get('/api/saves/1').json()['state']
    assert saved==state
    assert client.get('/api/saves').json()['slots'][0]['week']==143
    assert client.put('/api/saves/1',json=body).status_code==409

def test_journey_rejects_invalid_class_and_elective_scores(client):
    for change in [dict(class_id=99),dict(subject_combination=['physics','chemistry','politics']),dict(day=0)]:
        state=journey();state.update(change)
        assert client.put('/api/saves/1',json=dict(name='bad',expected_revision=0,state=state)).status_code==422
    state=journey();state['subjects']['physics']=101
    assert client.put('/api/saves/1',json=dict(name='bad',expected_revision=0,state=state)).status_code==422
