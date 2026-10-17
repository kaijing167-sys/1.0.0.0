"""Single-player snapshots. The browser holds a random capability, not an account."""
import hashlib
import re
from datetime import datetime, timezone
from typing import Annotated, Literal

from fastapi import APIRouter, Depends, Header, HTTPException, Path, Query, Response
from pydantic import BaseModel, ConfigDict, Field, model_validator
from sqlalchemy import JSON, Column, Integer, String, select, update
from sqlalchemy.exc import IntegrityError
from sqlalchemy.ext.asyncio import AsyncSession

from database import Base, get_db
from character_catalog import CHARACTER_BY_ID
from school_catalog import CLASS_BY_ID


class SaveSlot(Base):
    __tablename__ = "save_slots"
    owner = Column(String(64), primary_key=True)
    slot = Column(Integer, primary_key=True)
    name = Column(String(60), nullable=False)
    state = Column(JSON(none_as_null=True), nullable=True)
    revision = Column(Integer, nullable=False)
    updated_at = Column(String(40), nullable=False)


class StrictModel(BaseModel):
    model_config = ConfigDict(extra="forbid", strict=True)


Stat = Annotated[float, Field(ge=0, le=150, allow_inf_nan=False)]
Counter = Annotated[int, Field(ge=0, le=1000000000)]
Text = Annotated[str, Field(max_length=2000)]


class Attributes(StrictModel):
    stamina: Annotated[int, Field(ge=0, le=100)]
    stress: Annotated[int, Field(ge=0, le=100)]
    money: Counter
    action_points: Annotated[int, Field(ge=0, le=4)]
    chinese: Stat
    math: Stat
    english: Stat
    physics: Stat
    chemistry: Stat
    biology: Stat
    history: Stat
    politics: Stat
    geography: Stat


class Log(StrictModel):
    week: Annotated[int, Field(ge=1, le=156)]
    text: Text


class Exam(StrictModel):
    score: Annotated[int, Field(ge=0, le=750)]
    rank: Annotated[int, Field(ge=1, le=1000)]
    week: Annotated[int, Field(ge=1, le=156)]


class Snapshot(StrictModel):
    version: Literal[1, 2]
    character_id: str | None = None
    class_id: int | None = None
    days_remaining: Annotated[int, Field(ge=0, le=100)] | None = None
    subject_combination: list[str] | None = None
    week: Annotated[int, Field(ge=1, le=156)]
    round: Annotated[int, Field(ge=1, le=1000000000)]
    legacy: Counter
    perks: Annotated[list[Literal["过目不忘", "家境优渥", "大心脏"]], Field(max_length=3)]
    track: Literal["all", "science", "arts"]
    attrs: Attributes
    bonds: Annotated[list[Annotated[int, Field(ge=0, le=100)]], Field(min_length=3, max_length=3)]
    locks: Annotated[list[bool], Field(min_length=3, max_length=3)]
    events: Annotated[list[Annotated[int, Field(ge=1, le=156)]], Field(max_length=156)]
    logs: Annotated[list[Log], Field(max_length=80)]
    tea: Counter
    study: Counter
    highStress: Counter
    exam: Exam | None
    graduated: bool
    earned: Annotated[list[Annotated[int, Field(ge=0, le=9)]], Field(max_length=10)]
    inventory: Annotated[list[Annotated[str, Field(max_length=100)]], Field(max_length=10000)]

    @model_validator(mode="before")
    @classmethod
    def migrate_class(cls, data):
        if isinstance(data, dict) and data.get("version") == 2 and data.get("class_id") is None:
            character = CHARACTER_BY_ID.get(data.get("character_id"))
            if character:
                data = dict(data)
                school = CLASS_BY_ID[character["initial_state"]["class_id"]]
                data.update(class_id=school["id"], subject_combination=school["subjects"], track=school["track"])
        return data

    @model_validator(mode="after")
    def check_graduation(self):
        if self.version == 2:
            character = CHARACTER_BY_ID.get(self.character_id)
            if character is None or self.days_remaining is None:
                raise ValueError("角色存档必须包含有效角色与高考倒计时")
            school = CLASS_BY_ID.get(self.class_id)
            if school is None or self.subject_combination != school["subjects"] or self.track != school["track"]:
                raise ValueError("选科组合必须与当前班级一致")
            if self.week != 156 - (self.days_remaining + 6) // 7:
                raise ValueError("周数与高考倒计时不一致")
            if any(getattr(self.attrs, key) > 100 for key in
                   ("physics", "chemistry", "biology", "history", "politics", "geography")):
                raise ValueError("选考学科满分为 100")
            if self.graduated and self.days_remaining != 0:
                raise ValueError("倒计时结束后才可完成高考")
        elif self.class_id is not None or self.character_id is not None or self.days_remaining is not None or self.subject_combination is not None:
            raise ValueError("角色存档必须使用版本 2")
        if self.graduated and (self.week != 156 or self.exam is None or self.exam.week != 156):
            raise ValueError("毕业存档必须包含第 156 周的高考成绩")
        return self


class WriteSave(StrictModel):
    name: Annotated[str, Field(min_length=1, max_length=60)]
    expected_revision: Annotated[int, Field(ge=0)]
    state: Snapshot


def owner_key(x_save_token: Annotated[str | None, Header()] = None):
    if not x_save_token or not re.fullmatch(r"[0-9a-f]{64}", x_save_token):
        raise HTTPException(401, "缺少有效的存档凭证")
    return hashlib.sha256(x_save_token.encode()).hexdigest()


Slot = Annotated[int, Path(ge=1, le=5)]
Owner = Annotated[str, Depends(owner_key)]
DB = Annotated[AsyncSession, Depends(get_db)]
save_router = APIRouter(prefix="/api/saves", tags=["单人存档"])


def summary(row):
    return {
        "slot": row.slot, "name": row.name, "revision": row.revision,
        "updated_at": row.updated_at, "empty": row.state is None,
        "week": row.state["week"] if row.state else None,
        "round": row.state["round"] if row.state else None,
        "character_name": CHARACTER_BY_ID.get((row.state or {}).get("character_id"), {}).get("name"),
        "days_remaining": (row.state or {}).get("days_remaining"),
    }


@save_router.get("")
async def list_saves(owner: Owner, db: DB, response: Response):
    response.headers["Cache-Control"] = "no-store"
    rows = (await db.execute(select(SaveSlot).where(SaveSlot.owner == owner))).scalars()
    return {"slots": sorted([summary(row) for row in rows], key=lambda row: row["slot"])}


@save_router.get("/{slot}")
async def read_save(slot: Slot, owner: Owner, db: DB, response: Response):
    response.headers["Cache-Control"] = "no-store"
    row = await db.get(SaveSlot, (owner, slot))
    if row is None or row.state is None:
        raise HTTPException(404, "该存档槽为空")
    saved = Snapshot.model_validate(row.state).model_dump(exclude_unset=True)
    return {**summary(row), "state": saved}


@save_router.put("/{slot}")
async def write_save(slot: Slot, body: WriteSave, owner: Owner, db: DB):
    name = body.name.strip()
    if not name:
        raise HTTPException(422, "存档名称不能为空")
    values = dict(name=name, state=body.state.model_dump(exclude_unset=True),
                  revision=body.expected_revision + 1,
                  updated_at=datetime.now(timezone.utc).isoformat())
    if body.expected_revision == 0:
        db.add(SaveSlot(owner=owner, slot=slot, **values))
        try:
            await db.commit()
        except IntegrityError:
            await db.rollback()
            raise HTTPException(409, "存档已变化，请刷新列表后重试")
    else:
        result = await db.execute(
            update(SaveSlot).where(SaveSlot.owner == owner, SaveSlot.slot == slot,
                                   SaveSlot.revision == body.expected_revision).values(**values)
        )
        if result.rowcount != 1:
            await db.rollback()
            raise HTTPException(409, "存档已变化，请刷新列表后重试")
        await db.commit()
    row = await db.get(SaveSlot, (owner, slot))
    return summary(row)


@save_router.delete("/{slot}", status_code=204)
async def delete_save(slot: Slot, owner: Owner, db: DB,
                      expected_revision: Annotated[int, Query(ge=1)]):
    # Keep a tombstone revision so stale tabs cannot recreate a deleted save.
    result = await db.execute(
        update(SaveSlot).where(SaveSlot.owner == owner, SaveSlot.slot == slot,
                               SaveSlot.revision == expected_revision,
                               SaveSlot.state.is_not(None)).values(
            state=None, name="", revision=expected_revision + 1,
            updated_at=datetime.now(timezone.utc).isoformat())
    )
    if result.rowcount != 1:
        await db.rollback()
        raise HTTPException(409, "存档已变化，请刷新列表后重试")
    await db.commit()
    return Response(status_code=204)
