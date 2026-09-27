import math
import random
from typing import Dict

from fastapi import APIRouter
from pydantic import BaseModel


exam_router = APIRouter(prefix="/exam", tags=["Exam Simulator"])


class ExamStrategyRequest(BaseModel):
    player_id: int
    essay_strategy: str
    math_strategy: str
    check_strategy: str
    player_attrs: Dict[str, int]


def calculate_result_data(
    request: ExamStrategyRequest,
    rng: random.Random | None = None,
) -> dict:
    rng = rng or random
    attrs = request.player_attrs
    base_score = attrs["chinese"] + attrs["math"] + attrs["english"]

    modifier = 0
    if request.essay_strategy == "risky":
        modifier += rng.choice([30, -20])
    else:
        modifier += 10

    if request.math_strategy == "force":
        modifier += 25 if attrs["math"] > 100 else -15

    if request.check_strategy == "careful":
        modifier += 5
    elif rng.random() < 0.15:
        modifier -= 40

    raw_score = max(
        0,
        min(750, int(base_score * 2.5 + modifier + rng.gauss(0, 15))),
    )
    mu, sigma = 450.0, 80.0
    z = (raw_score - mu) / (sigma * math.sqrt(2))
    cdf = 0.5 * (1.0 + math.erf(z))
    rank = max(1, int(math.floor((1.0 - cdf) * 1000)))
    return {
        "score": raw_score,
        "rank": rank,
        "total_students": 1000,
        "percentile": round(cdf * 100, 2),
    }


@exam_router.post("/calculate_result")
async def calculate_exam_result(request: ExamStrategyRequest):
    return calculate_result_data(request)
