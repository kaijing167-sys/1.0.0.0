from copy import deepcopy
from fastapi import APIRouter, HTTPException
from character_catalog import CHARACTERS, CHARACTER_BY_ID
from save_router import Snapshot
from school_catalog import CLASSES, CLASS_BY_ID
from pydantic import BaseModel, Field


class StartOptions(BaseModel):
    class_id: int | None = Field(default=None, strict=True)

character_router = APIRouter(prefix="/api/characters", tags=["角色选择"])


@character_router.get("")
async def list_characters():
    return {"characters": CHARACTERS}


@character_router.get("/classes")
async def list_classes():
    return {"classes": CLASSES}


@character_router.post("/{character_id}/start")
async def start_character(character_id: str, options: StartOptions | None = None):
    character = CHARACTER_BY_ID.get(character_id)
    if character is None:
        raise HTTPException(404, "角色不存在")
    state = deepcopy(character["initial_state"])
    if options and options.class_id is not None:
        school = CLASS_BY_ID.get(options.class_id)
        if school is None:
            raise HTTPException(422, "班级不存在")
        state.update(class_id=school["id"], subject_combination=school["subjects"], track=school["track"])
    return {"state": Snapshot.model_validate(state).model_dump(exclude_unset=True)}
