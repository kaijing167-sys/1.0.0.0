from fastapi import APIRouter
from pydantic import BaseModel


social_router = APIRouter(prefix="/social", tags=["Social System"])

GIFT_PREFERENCES = {
    "Li Qiang": {"冰镇汽水": 5, "运动手套": 12, "错题集": -5},
    "Su Ruoyun": {"精装笔记本": 8, "划线重点": 10, "游戏卡带": -10},
    "Lin Wan'er": {"进口画笔": 15, "摇滚唱片": 10, "补习班讲义": -8},
}


class GiftRequest(BaseModel):
    npc_name: str
    gift_name: str
    current_bond: int
    is_locked: bool = False


def calculate_gift_result(request: GiftRequest) -> dict:
    if request.is_locked:
        return {
            "status": "locked",
            "message": "已达到阶段锁上限，请先完成阶段契约任务！",
            "bond": request.current_bond,
        }

    gain = GIFT_PREFERENCES.get(request.npc_name, {}).get(request.gift_name, 2)
    new_bond = max(0, min(100, request.current_bond + gain))
    locked = False
    if request.current_bond < 40 <= new_bond:
        new_bond = 40
        locked = True
    elif request.current_bond < 80 <= new_bond:
        new_bond = 80
        locked = True
    return {
        "status": "success",
        "gain": gain,
        "new_bond": new_bond,
        "is_locked_now": locked,
    }


@social_router.post("/send_gift")
async def send_gift(request: GiftRequest):
    return calculate_gift_result(request)
