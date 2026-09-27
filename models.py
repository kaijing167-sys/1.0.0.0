from typing import Any, Dict, List, Optional

from pydantic import BaseModel, Field
from sqlalchemy import JSON, Boolean, Column, Integer, String, Text

from database import Base


class PlayerModel(Base):
    __tablename__ = "players"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(50), nullable=False)
    ng_level = Column(Integer, default=1, nullable=False)
    legacy_points = Column(Integer, default=0, nullable=False)
    perks = Column(JSON, default=list, nullable=False)
    save_state = Column(JSON, nullable=False)


class EventModel(Base):
    __tablename__ = "events"

    id = Column(Integer, primary_key=True)
    title = Column(String(100), nullable=False)
    grade = Column(Integer, default=1, nullable=False)
    week = Column(Integer, default=1, nullable=False)
    is_mainline = Column(Boolean, default=False, nullable=False)
    condition_dsl = Column(JSON, default=dict, nullable=False)
    narrative = Column(Text, nullable=False)
    effects = Column(JSON, default=dict, nullable=False)


class AchievementModel(Base):
    __tablename__ = "achievements"

    id = Column(Integer, primary_key=True)
    name = Column(String(50), nullable=False, unique=True)
    condition_dsl = Column(JSON, nullable=False)
    flavor_text = Column(String(200), nullable=False)


class AttributeSchema(BaseModel):
    stamina: int = Field(100, ge=0, le=100)
    stress: int = Field(0, ge=0, le=100)
    money: int = Field(100, ge=0)
    action_points: int = Field(4, ge=0)
    chinese: int = Field(60, ge=0, le=150)
    math: int = Field(60, ge=0, le=150)
    english: int = Field(60, ge=0, le=150)
    physics: int = Field(50, ge=0, le=150)
    chemistry: int = Field(50, ge=0, le=150)
    biology: int = Field(50, ge=0, le=150)
    history: int = Field(50, ge=0, le=150)
    politics: int = Field(50, ge=0, le=150)
    geography: int = Field(50, ge=0, le=150)
    luck: int = Field(50, ge=0, le=100)
    morality: int = Field(50, ge=0, le=100)
    karma: int = 0


class TimeSchema(BaseModel):
    grade: int = Field(1, ge=1, le=3)
    week: int = Field(1, ge=1, le=156)
    time_slot: int = Field(0, ge=0, le=4)
    is_science: Optional[bool] = None


class ActionRequest(BaseModel):
    player_id: int
    action_type: str
    target_npc: Optional[str] = None
    item_id: Optional[str] = None


class SaveStateSchema(BaseModel):
    attributes: AttributeSchema = Field(default_factory=AttributeSchema)
    time: TimeSchema = Field(default_factory=TimeSchema)
    npc_bonds: Dict[str, int] = Field(default_factory=dict)
    flags: Dict[str, Any] = Field(default_factory=dict)
    inventory: List[str] = Field(default_factory=list)
