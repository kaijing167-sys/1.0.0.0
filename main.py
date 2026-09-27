import time

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware

from epilogue_sse import epilogue_router
from exam_router import exam_router
from ng_plus_router import ng_router
from social_system import social_router
from weekend_system import weekend_router


app = FastAPI(
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
