from copy import deepcopy

import pytest
from fastapi.testclient import TestClient
from pydantic import ValidationError

from character_catalog import CHARACTERS
from main import app
from save_router import Snapshot
from test_saves import client


@pytest.mark.parametrize("index,total", [(0,557), (1,594), (2,646.5), (3,566)])
def test_source_conversion(index, total):
    character = CHARACTERS[index]
    state = Snapshot.model_validate(character["initial_state"])
    fields = character["fields"]
    assert len(fields) == 95
    assert state.attrs.chinese == fields["语文水平"] * 1.5
    assert state.attrs.math == fields["数学水平"] * 1.5
    assert state.attrs.english == fields["英语水平"] * 1.5
    assert state.attrs.physics == fields["物理水平"]
    assert state.attrs.geography == fields["地理水平"]
    assert sum(getattr(state.attrs, key) for key in
               ["chinese", "math", "english"] + state.subject_combination) == total
    assert state.days_remaining == 100 and state.week == 141


def test_character_start_and_save_restore(client):
    characters = client.get("/api/characters").json()["characters"]
    assert len(characters) == 4
    for index, character in enumerate(characters):
        state = client.post(f"/api/characters/{character['id']}/start").json()["state"]
        assert state["exam"] is None
        slot = index + 1
        response = client.put(f"/api/saves/{slot}", json={
            "name": character["name"], "expected_revision": 0, "state": state})
        assert response.status_code == 200, response.text
        assert response.json()["character_name"] == character["name"]
        assert client.get(f"/api/saves/{slot}").json()["state"] == state
    assert client.get("/api/saves/1").json()["state"]["attrs"]["math"] == 112.5
    assert client.post("/api/characters/missing/start").status_code == 404


@pytest.mark.parametrize("mutation", [
    {"character_id": "missing"}, {"days_remaining": -1},
    {"days_remaining": 93}, {"subject_combination": ["physics", "chemistry", "biology"]},
    {"track": "arts"}, {"version": 1},
])
def test_invalid_character_save(mutation):
    state = deepcopy(CHARACTERS[0]["initial_state"])
    state.update(mutation)
    with pytest.raises(ValidationError):
        Snapshot.model_validate(state)


def test_subject_caps_and_countdown():
    state = deepcopy(CHARACTERS[0]["initial_state"])
    state["attrs"]["physics"] = 100.5
    with pytest.raises(ValidationError):
        Snapshot.model_validate(state)
    state["attrs"]["physics"] = 100
    state["attrs"]["chinese"] = 150
    for days in [93, 86, 9, 2, 0]:
        state["days_remaining"] = days
        state["week"] = 156 - (days + 6) // 7
        Snapshot.model_validate(state)
    state["graduated"] = True
    state["exam"] = {"score": 610, "rank": 15, "week": 156}
    Snapshot.model_validate(state)


def test_classes_and_all_transfers_round_trip(client):
    classes=client.get("/api/characters/classes").json()["classes"]
    assert [c["id"] for c in classes]==[2,4,7,8,11,13,14]
    assert sum(c["size"] for c in classes)==210
    assert classes[-1]["size"]==30
    revision=0
    for school in classes:
        response=client.post("/api/characters/hu-zx/start",json={"class_id":school["id"]})
        assert response.status_code==200
        state=response.json()["state"]
        assert state["subject_combination"]==school["subjects"]
        assert state["attrs"]["math"]==148.5
        saved=client.put("/api/saves/1",json={"name":"班级测试","expected_revision":revision,"state":state})
        assert saved.status_code==200
        revision=saved.json()["revision"]
        assert client.get("/api/saves/1").json()["state"]==state
    assert client.post("/api/characters/hu-zx/start",json={"class_id":3}).status_code==422
    assert client.post("/api/characters/hu-zx/start",json={"class_id":"2"}).status_code==422


def test_default_classes_and_legacy_migration():
    assert [c["initial_state"]["class_id"] for c in CHARACTERS]==[8,8,2,2]
    old=deepcopy(CHARACTERS[2]["initial_state"])
    del old["class_id"]
    old["attrs"]["money"]=456
    migrated=Snapshot.model_validate(old)
    assert migrated.class_id==2 and migrated.attrs.money==456
    invalid=deepcopy(CHARACTERS[0]["initial_state"])
    invalid["class_id"]=7
    with pytest.raises(ValidationError):
        Snapshot.model_validate(invalid)
