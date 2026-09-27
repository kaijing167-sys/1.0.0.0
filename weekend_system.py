import random
from typing import Any, Dict

from fastapi import APIRouter
from pydantic import BaseModel

from activity_engine import SUBJECTS, clamp_attributes


weekend_router = APIRouter(prefix="/weekend", tags=["Weekend Street"])


class WeekendVisitRequest(BaseModel):
    location: str
    state: Dict[str, Any]


def apply_weekend_visit(
    location: str,
    state: Dict[str, Any],
    rng: random.Random | None = None,
) -> dict:
    rng = rng or random
    attrs = state["save_state"]["attributes"]
    message = "这个地点暂未开放。"
    item = None

    if location == "stationery":
        if attrs["money"] >= 30:
            attrs["money"] -= 30
            attrs["math"] += 3
            item = "高分辅导书"
            message = "购买了《高分指南》，数学能力上升！"
        else:
            message = "零花钱不足！"
    elif location == "milktea":
        if attrs["money"] >= 15:
            attrs["money"] -= 15
            attrs["stress"] -= 20
            attrs["stamina"] += 5
            message = "喝了杯热珍珠奶茶，心情大好，压力大幅降低！"
        else:
            message = "零花钱不足！"
    elif location == "old_bookstall":
        if attrs["money"] >= 8:
            attrs["money"] -= 8
            if rng.random() < 0.5:
                subject = rng.choice(sorted(SUBJECTS))
                attrs[subject] += 5
                item = "绝版考题"
                message = f"淘到一份绝版考题，{subject} 能力提高！"
            else:
                attrs["stress"] -= 35
                attrs["morality"] -= 2
                item = "不良漫画"
                message = "淘到一本不良漫画，压力一扫而空。"
        else:
            message = "零花钱不足！"
    elif location == "part_time_job":
        attrs["money"] += 80
        attrs["stamina"] -= 15
        attrs["stress"] += 10
        message = "在便利店收银打工 4 小时，赚到了 80 元！"

    clamp_attributes(attrs)
    return {"message": message, "item": item, "attributes": attrs}


@weekend_router.post("/visit_location")
async def visit_location(request: WeekendVisitRequest):
    return apply_weekend_visit(request.location, request.state)
