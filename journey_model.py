"""Snapshots for the existing day-based game, including roster and class choices."""
import json
from typing import Annotated, Literal
from pydantic import BaseModel, ConfigDict, Field, model_validator
from school_catalog import CLASS_BY_ID
from character_catalog import CHARACTER_BY_ID

Number = Annotated[float, Field(ge=0, le=150, allow_inf_nan=False)]
class JourneySnapshot(BaseModel):
    model_config = ConfigDict(extra='allow', strict=True)
    version: Literal[2]
    name: Annotated[str, Field(min_length=1, max_length=60)]
    day: Annotated[int, Field(ge=1, le=1093)]
    attrs: dict[str, Number]
    subjects: dict[str, Number]
    actionPoints: Annotated[int, Field(ge=0, le=20)]
    energy: Annotated[float, Field(ge=0, le=100)]
    stress: Annotated[float, Field(ge=0, le=100)]
    mood: Annotated[float, Field(ge=0, le=100)]
    money: Annotated[float, Field(ge=0, allow_inf_nan=False)]
    character_id: str | None = None
    class_id: int | None = None
    track: str
    stage: str
    completed: bool
    pendingEvents: list[str]
    fired: list[str]
    achievements: list[str]
    log: list[dict]
    examResults: list[dict]
    relationships: dict[str, Number]

    @model_validator(mode='after')
    def check_game(self):
        if len(json.dumps(self.model_dump(), ensure_ascii=False)) > 200000:
            raise ValueError('存档过大')
        if not {'insight','stamina','mindset','charm'} <= self.attrs.keys():
            raise ValueError('缺少人物属性')
        if self.character_id and self.character_id not in CHARACTER_BY_ID:
            raise ValueError('无效人物')
        if self.class_id is not None:
            school=CLASS_BY_ID.get(self.class_id)
            if not school: raise ValueError('无效班级')
            required={'chinese','math','english','physics','chemistry','biology','history','politics','geography'}
            if not required <= self.subjects.keys(): raise ValueError('缺少学科')
            if any(self.subjects[k]>100 for k in required-{'chinese','math','english'}): raise ValueError('选科满分100')
            expected='science' if 'physics' in school['subjects'] else 'humanities'
            if self.track!=expected or self.model_extra.get('subject_combination')!=school['subjects']:
                raise ValueError('班级选科不一致')
        elif not {'chinese','math','english','science','humanities'} <= self.subjects.keys():
            raise ValueError('缺少学科')
        return self
