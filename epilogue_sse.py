import asyncio

from fastapi import APIRouter, Query
from fastapi.responses import StreamingResponse


epilogue_router = APIRouter(
    prefix="/epilogue",
    tags=["LLM Graduation Epilogue"],
)


async def event_generator(player_summary: dict, delay_seconds: float = 0.05):
    paragraphs = [
        f"亲爱的 {player_summary['name']}：\n",
        "三年的时光如白驹过隙，教学楼前蝉鸣的夏天仿佛还在昨日。\n",
        "还记得你在高二时做出的选择，以及在每一晚灯下苦读的背影。\n",
        f"高考 {player_summary['score']} 分的成绩，是你青春最好的勋章。\n",
        f"特别是在那些挫折时刻，{player_summary['best_friend']} 一直陪伴在你的身旁。\n",
        "前路浩浩荡荡，万物皆可期待。祝你毕业快乐，前程似锦！\n",
    ]
    for paragraph in paragraphs:
        for char in paragraph:
            yield f"data: {char}\n\n"
            if delay_seconds:
                await asyncio.sleep(delay_seconds)
        if delay_seconds:
            await asyncio.sleep(delay_seconds * 6)
    yield "event: done\ndata: [DONE]\n\n"


@epilogue_router.get("/stream_letter")
async def stream_graduation_letter(
    player_name: str,
    score: int,
    best_friend: str,
    delay_ms: int = Query(50, ge=0, le=1000),
):
    summary = {
        "name": player_name,
        "score": score,
        "best_friend": best_friend,
    }
    return StreamingResponse(
        event_generator(summary, delay_ms / 1000),
        media_type="text/event-stream",
    )
