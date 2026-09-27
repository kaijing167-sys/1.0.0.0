import asyncio
import random

from activity_engine import ActivityEngine, evaluate_condition
from ending_system import calculate_legacy_points, determine_ending
from epilogue_sse import event_generator
from exam_router import ExamStrategyRequest, calculate_result_data
from ng_plus_router import NewGamePlusRequest, build_new_game
from social_system import GiftRequest, calculate_gift_result
from weekend_system import apply_weekend_visit


def initial_state():
    return build_new_game(
        NewGamePlusRequest(legacy_points=100, selected_perks=["过目不忘"])
    )["initial_state"]


def test_condition_dsl():
    state = {"attributes": {"stress": 85, "math": 55}, "time": {"grade": 2}}
    condition = {
        "all": [
            {"field": "attributes.stress", "op": ">=", "value": 75},
            {
                "any": [
                    {"field": "time.grade", "op": "==", "value": 2},
                    {"field": "attributes.math", "op": ">", "value": 100},
                ]
            },
        ]
    }
    assert evaluate_condition(condition, state)


def test_activity_and_clamping():
    state = {
        "perks": ["过目不忘"],
        "save_state": initial_state(),
    }
    result = ActivityEngine.process_study_action(state, "math")
    assert result["gain"] >= 0
    assert 0 <= result["current_attributes"]["stress"] <= 100
    assert result["time"]["time_slot"] == 1


def test_exam_is_deterministic_with_seeded_rng():
    request = ExamStrategyRequest(
        player_id=1,
        essay_strategy="safe",
        math_strategy="give_up",
        check_strategy="careful",
        player_attrs={"chinese": 100, "math": 100, "english": 100},
    )
    result = calculate_result_data(request, random.Random(7))
    assert 0 <= result["score"] <= 750
    assert 1 <= result["rank"] <= 1000


def test_social_phase_lock():
    result = calculate_gift_result(
        GiftRequest(
            npc_name="Li Qiang",
            gift_name="运动手套",
            current_bond=35,
        )
    )
    assert result["new_bond"] == 40
    assert result["is_locked_now"] is True


def test_weekend_and_endings():
    state = {"save_state": initial_state()}
    result = apply_weekend_visit("milktea", state)
    assert result["attributes"]["money"] == 85
    ending = determine_ending(660, {"name": "Su Ruoyun", "value": 80})
    assert ending["tier"] == "Top"
    assert "清北双璧" in ending["ending_title"]
    assert calculate_legacy_points(660, 3, 1) == 116


def test_new_game_plus_and_sse():
    result = build_new_game(
        NewGamePlusRequest(legacy_points=40, selected_perks=["家境优渥"])
    )
    assert result["initial_state"]["attributes"]["money"] == 300

    async def collect():
        chunks = []
        async for chunk in event_generator(
            {"name": "小明", "score": 620, "best_friend": "李强"},
            delay_seconds=0,
        ):
            chunks.append(chunk)
        return chunks

    chunks = asyncio.run(collect())
    assert chunks[-1] == "event: done\ndata: [DONE]\n\n"
