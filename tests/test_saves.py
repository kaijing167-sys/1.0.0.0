import asyncio

import pytest
from fastapi.testclient import TestClient
from sqlalchemy.ext.asyncio import async_sessionmaker, create_async_engine

from database import Base, get_db
from main import app
from save_router import SaveSlot


def snapshot():
    return {
        "version": 1, "week": 40, "round": 2, "legacy": 123,
        "perks": ["家境优渥"], "track": "science",
        "attrs": dict(stamina=80, stress=30, money=80, action_points=2,
                      chinese=65, math=70, english=75, physics=50, chemistry=50,
                      biology=50, history=50, politics=50, geography=50),
        "bonds": [40, 20, 5], "locks": [True, False, False], "events": [1, 8],
        "logs": [{"week": 40, "text": "保存一段中文回忆"}],
        "tea": 4, "study": 2, "highStress": 1,
        "exam": {"week": 32, "score": 600, "rank": 25}, "graduated": False,
        "earned": [0, 1], "inventory": ["高分辅导书"],
    }


@pytest.fixture
def client(tmp_path):
    engine = create_async_engine("sqlite+aiosqlite:///" + str(tmp_path / "test.db"))
    factory = async_sessionmaker(engine, expire_on_commit=False)

    async def init():
        async with engine.begin() as connection:
            await connection.run_sync(Base.metadata.create_all)
    asyncio.run(init())

    async def session():
        async with factory() as db:
            yield db
    app.dependency_overrides[get_db] = session
    # Schema and engine are controlled by this fixture, not the production lifespan.
    client = TestClient(app, headers={"X-Save-Token": "a" * 64})
    yield client
    client.close()
    app.dependency_overrides.clear()
    asyncio.run(engine.dispose())


def put(client, slot=1, revision=0, state=None):
    return client.put(f"/api/saves/{slot}", json={
        "name": "中文存档", "expected_revision": revision,
        "state": state if state is not None else snapshot(),
    })


def test_complete_round_trip_and_slots(client):
    for slot in range(1, 6):
        assert put(client, slot).status_code == 200
    assert len(client.get("/api/saves").json()["slots"]) == 5
    data = client.get("/api/saves/3")
    assert data.headers["cache-control"] == "no-store"
    assert data.json()["state"] == snapshot()
    state = snapshot()
    state["week"] = 41
    assert put(client, 3, 1, state).json()["revision"] == 2
    assert client.get("/api/saves/3").json()["state"]["week"] == 41
    assert client.get("/api/saves/2").json()["state"]["week"] == 40


def test_conflicts_delete_and_recreate(client):
    assert put(client).status_code == 200
    assert put(client).status_code == 409
    assert client.delete("/api/saves/1?expected_revision=9").status_code == 409
    assert client.delete("/api/saves/1?expected_revision=1").status_code == 204
    assert client.get("/api/saves/1").status_code == 404
    assert put(client, revision=1).status_code == 409
    assert put(client, revision=0).status_code == 409
    row = client.get("/api/saves").json()["slots"][0]
    assert row["empty"] and row["revision"] == 2
    assert client.delete("/api/saves/1?expected_revision=2").status_code == 409
    assert put(client, revision=2).status_code == 200


def test_owner_isolation_and_missing_credentials(client):
    assert put(client).status_code == 200
    assert client.get("/api/saves/1", headers={"X-Save-Token": "b" * 64}).status_code == 404
    assert client.get("/api/saves", headers={"X-Save-Token": "b" * 64}).json()["slots"] == []
    assert client.get("/api/saves", headers={"X-Save-Token": ""}).status_code == 401
    assert client.delete("/api/saves/1?expected_revision=1",
                         headers={"X-Save-Token": "b" * 64}).status_code == 409


@pytest.mark.parametrize("slot", [0, 6, -1])
def test_invalid_slot(client, slot):
    assert put(client, slot).status_code == 422


@pytest.mark.parametrize("field,value", [
    ("version", 2), ("week", 157), ("week", "40"), ("bonds", [0]),
    ("attrs", {}), ("logs", [{"week": 1}]), ("exam", {"score": -1}),
    ("graduated", True),
])
def test_invalid_snapshot_does_not_overwrite(client, field, value):
    assert put(client).status_code == 200
    state = snapshot()
    state[field] = value
    assert put(client, revision=1, state=state).status_code == 422
    assert client.get("/api/saves/1").json()["state"] == snapshot()


def test_persists_after_engine_restart(tmp_path):
    path = "sqlite+aiosqlite:///" + str(tmp_path / "restart.db")
    async def cycle():
        first = create_async_engine(path)
        async with first.begin() as connection:
            await connection.run_sync(Base.metadata.create_all)
        async with async_sessionmaker(first)() as db:
            db.add(SaveSlot(owner="c" * 64, slot=1, name="重启", revision=1,
                            state=snapshot(), updated_at="2026-10-13T00:00:00+00:00"))
            await db.commit()
        await first.dispose()
        second = create_async_engine(path)
        async with async_sessionmaker(second)() as db:
            row = await db.get(SaveSlot, ("c" * 64, 1))
            assert row.state == snapshot()
        await second.dispose()
    asyncio.run(cycle())


def test_game_page_and_scripts(client):
    assert client.get("/play/").status_code == 200
    assert 'src="game.js?v=16"' in client.get("/play/").text
    assert 'src="roster.js?v=16"' in client.get("/play/").text
    assert 'data-campus-classes' in client.get("/play/game.js").text
    assert 'location.replace' in client.get("/play/characters/").text
    assert client.get("/play/journey-saves.js").status_code == 200
    for portrait in ('hao-kj-v1', 'hu-yy-v1', 'hu-zx-v2', 'zhang-z-v2'):
        response = client.get('/play/characters/portraits/' + portrait + '.png')
        assert response.status_code == 200
        assert response.content.startswith(b'\x89PNG')
    assert client.get("/docs").status_code == 200
