import asyncio
import os
import time
from contextlib import asynccontextmanager, suppress
from pathlib import Path

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from database import Base, engine
from save_router import save_router
from character_router import character_router
from chat_router import chat_router, warm_ollama_personas


@asynccontextmanager
async def lifespan(app):
    async with engine.begin() as connection:
        await connection.run_sync(Base.metadata.create_all)
    warm_task = None
    if os.getenv("OLLAMA_WARMUP_ON_STARTUP", "0") == "1":
        warm_task = asyncio.create_task(warm_ollama_personas())
    yield
    if warm_task:
        warm_task.cancel()
        with suppress(asyncio.CancelledError):
            await warm_task
    await engine.dispose()

from epilogue_sse import epilogue_router
from exam_router import exam_router
from ng_plus_router import ng_router
from social_system import social_router
from weekend_system import weekend_router


app = FastAPI(
    lifespan=lifespan,
    title="高中模拟器文字游戏后端 API Core Engine",
    version="2.0.0",
    description="快照存档、事件检定、考场排位、社交、多周目与毕业季 SSE",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.middleware("http")
async def add_process_time_header(request: Request, call_next):
    start_time = time.perf_counter()
    response = await call_next(request)
    response.headers["X-Process-Time"] = str(time.perf_counter() - start_time)
    return response


app.include_router(exam_router)
app.include_router(social_router)
app.include_router(weekend_router)
app.include_router(ng_router)
app.include_router(epilogue_router)
app.include_router(save_router)
app.include_router(character_router)
app.include_router(chat_router)
app.mount("/play", StaticFiles(directory=Path(__file__).parent / "frontend", html=True), name="play")


@app.get("/")
async def root():
    return {
        "status": "online",
        "system": "High School Simulator Engine",
        "version": "2.0.0",
    }


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(app, host="0.0.0.0", port=8000)

