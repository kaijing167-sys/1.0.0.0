from fastapi import APIRouter
from pydantic import BaseModel


ng_router = APIRouter(prefix="/ng_plus", tags=["New Game Plus"])

PERK_COSTS = {
    "过目不忘": 50,
    "家境优渥": 40,
    "大心脏": 30,
}


class NewGamePlusRequest(BaseModel):
    legacy_points: int
    selected_perks: list[str]


def build_new_game(request: NewGamePlusRequest) -> dict:
    unknown = [perk for perk in request.selected_perks if perk not in PERK_COSTS]
    if unknown:
        return {"status": "error", "message": f"未知天资：{', '.join(unknown)}"}

    total_cost = sum(PERK_COSTS[perk] for perk in request.selected_perks)
    if total_cost > request.legacy_points:
        return {"status": "error", "message": "遗产点数不足！"}

    initial_state = {
        "attributes": {
            "stamina": 100,
            "stress": 0,
            "money": 300 if "家境优渥" in request.selected_perks else 100,
            "action_points": 4,
            "chinese": 65,
            "math": 65,
            "english": 65,
            "physics": 50,
            "chemistry": 50,
            "biology": 50,
            "history": 50,
            "politics": 50,
            "geography": 50,
            "luck": 50,
            "morality": 50,
            "karma": 0,
        },
        "time": {"grade": 1, "week": 1, "time_slot": 0, "is_science": None},
        "npc_bonds": {"Li Qiang": 0, "Su Ruoyun": 0, "Lin Wan'er": 0},
        "flags": {},
        "inventory": [],
    }
    return {
        "status": "success",
        "remaining_points": request.legacy_points - total_cost,
        "perks": request.selected_perks,
        "initial_state": initial_state,
    }


@ng_router.post("/start_new_game")
async def start_new_game(request: NewGamePlusRequest):
    return build_new_game(request)
