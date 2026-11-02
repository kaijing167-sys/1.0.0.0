"""FastAPI routes that connect in-game chat to a local Ollama service."""

from __future__ import annotations

import json
import os
import re
from typing import AsyncIterator, Literal

import httpx
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field, field_validator
from starlette.responses import StreamingResponse

from npc_personas import get_npc_persona


OLLAMA_URL = os.getenv("OLLAMA_URL", "http://127.0.0.1:11434").rstrip("/")
OLLAMA_MODEL = os.getenv("OLLAMA_MODEL", "qwen3.5:4b")
OLLAMA_TIMEOUT = float(os.getenv("OLLAMA_TIMEOUT_SECONDS", "90"))
OLLAMA_NUM_CTX = int(os.getenv("OLLAMA_NUM_CTX", "4096"))
OLLAMA_NUM_PREDICT = int(os.getenv("OLLAMA_NUM_PREDICT", "40"))
CHAT_HISTORY_CHARS = int(os.getenv("CHAT_HISTORY_CHARS", "300"))

chat_router = APIRouter(prefix="/api", tags=["NPC Chat"])


class ChatMessage(BaseModel):
    role: Literal["user", "assistant"]
    content: str = Field(min_length=1, max_length=2000)

    @field_validator("content")
    @classmethod
    def content_must_have_text(cls, value: str) -> str:
        value = value.strip()
        if not value:
            raise ValueError("消息不能为空")
        return value


class ChatContext(BaseModel):
    playerName: str | None = Field(default=None, max_length=40)
    day: int | None = Field(default=None, ge=1, le=5000)
    grade: str | None = Field(default=None, max_length=20)
    relationship: float | None = Field(default=None, ge=0, le=100)
    mood: float | None = Field(default=None, ge=0, le=100)
    stress: float | None = Field(default=None, ge=0, le=100)
    recentEvents: list[str] = Field(default_factory=list, max_length=10)

    @field_validator("recentEvents")
    @classmethod
    def limit_event_text(cls, values: list[str]) -> list[str]:
        return [value.strip()[:300] for value in values if value.strip()]


class ChatRequest(BaseModel):
    npcId: Literal["liqiang", "su", "lin"]
    messages: list[ChatMessage] = Field(min_length=1, max_length=20)
    context: ChatContext = Field(default_factory=ChatContext)

    @field_validator("messages")
    @classmethod
    def conversation_must_end_with_user(cls, values: list[ChatMessage]) -> list[ChatMessage]:
        if values[-1].role != "user":
            raise ValueError("最后一条消息必须来自玩家")
        return values


def build_ollama_messages(body: ChatRequest) -> list[dict[str, str]]:
    context = body.context.model_dump(exclude_none=True)
    context_json = json.dumps(context, ensure_ascii=False, separators=(",", ":"))
    history: list[ChatMessage] = []
    used_chars = 0
    for message in reversed(body.messages):
        if history and used_chars + len(message.content) > CHAT_HISTORY_CHARS:
            break
        history.append(message)
        used_chars += len(message.content)
    history.reverse()
    return [
        {"role": "system", "content": get_npc_persona(body.npcId)},
        {
            "role": "system",
            "content": f"当前游戏上下文数据：{context_json}",
        },
        *[message.model_dump() for message in history],
    ]


def normalize_reply(reply: str, max_sentences: int = 3) -> str:
    """Keep model output compact and cap follow-up questions."""
    compact = re.sub(r"\s+", " ", reply).strip()
    compact = re.sub(r"^(?:苏若云|李强|林婉儿)\s*[:：]\s*", "", compact)
    compact = re.sub(r"^(?:（[^）]{0,120}）|\([^)]{0,120}\))\s*", "", compact)
    compact = re.sub(r"^(?:苏若云|李强|林婉儿)\s*[:：]\s*", "", compact)
    sentences = re.findall(r"[^。！？!?]+[。！？!?]?", compact)
    compact = "".join(sentences[:max_sentences]).strip()
    if len(compact) > 600:
        cutoff = max(
            compact.rfind(mark, 0, 600) for mark in ("。", "！", "？", "!", "?")
        )
        compact = compact[: cutoff + 1] if cutoff >= 0 else compact[:600] + "。"

    result: list[str] = []
    seen_question = False
    for char in compact:
        if char in "？?":
            result.append("？" if not seen_question else "。")
            seen_question = True
        else:
            result.append(char)
    return "".join(result).strip()


def build_ollama_payload(body: ChatRequest, stream: bool) -> dict:
    return {
        "model": OLLAMA_MODEL,
        "messages": build_ollama_messages(body),
        "stream": stream,
        "think": False,
        "keep_alive": "24h",
        "options": {
            "temperature": 0.6,
            "top_p": 0.85,
            "num_ctx": OLLAMA_NUM_CTX,
            "num_predict": OLLAMA_NUM_PREDICT,
        },
    }


async def warm_ollama_personas() -> None:
    """Prime the model and its static persona prefixes after service startup."""
    async with httpx.AsyncClient(timeout=OLLAMA_TIMEOUT) as client:
        for npc_id in ("liqiang", "su", "lin"):
            payload = {
                "model": OLLAMA_MODEL,
                "messages": [
                    {"role": "system", "content": get_npc_persona(npc_id)},
                    {"role": "user", "content": "你好"},
                ],
                "stream": False,
                "think": False,
                "keep_alive": "24h",
                "options": {
                    "temperature": 0.6,
                    "num_ctx": OLLAMA_NUM_CTX,
                    "num_predict": 1,
                },
            }
            try:
                response = await client.post(f"{OLLAMA_URL}/api/chat", json=payload)
                response.raise_for_status()
            except httpx.HTTPError:
                continue


@chat_router.get("/chat/health")
async def chat_health():
    return {
        "status": "configured",
        "model": OLLAMA_MODEL,
        "provider": "ollama",
    }


@chat_router.post("/chat")
async def chat_with_npc(body: ChatRequest):
    try:
        async with httpx.AsyncClient(timeout=OLLAMA_TIMEOUT) as client:
            response = await client.post(
                f"{OLLAMA_URL}/api/chat",
                json=build_ollama_payload(body, stream=False),
            )
            response.raise_for_status()
            data = response.json()
    except httpx.TimeoutException as exc:
        raise HTTPException(status_code=504, detail="模型回复超时，请稍后重试") from exc
    except (httpx.HTTPError, ValueError) as exc:
        raise HTTPException(status_code=502, detail="本地模型服务暂不可用") from exc

    reply = normalize_reply(str((data.get("message") or {}).get("content") or ""))
    if not reply:
        raise HTTPException(status_code=502, detail="模型没有返回有效回复")
    return {"reply": reply[:6000], "provider": "ollama", "model": OLLAMA_MODEL}


async def stream_ollama_events(body: ChatRequest) -> AsyncIterator[str]:
    full_reply = ""
    try:
        async with httpx.AsyncClient(timeout=OLLAMA_TIMEOUT) as client:
            async with client.stream(
                "POST",
                f"{OLLAMA_URL}/api/chat",
                json=build_ollama_payload(body, stream=True),
            ) as response:
                response.raise_for_status()
                async for line in response.aiter_lines():
                    if not line.strip():
                        continue
                    data = json.loads(line)
                    delta = str((data.get("message") or {}).get("content") or "")
                    if not delta:
                        continue
                    full_reply += delta
                    yield f"data: {json.dumps({'delta': delta}, ensure_ascii=False)}\n\n"

        reply = normalize_reply(full_reply)
        if not reply:
            raise ValueError("empty reply")
        yield f"data: {json.dumps({'replace': reply, 'reply': reply}, ensure_ascii=False)}\n\n"
        yield 'data: {"done":true}\n\n'
    except httpx.TimeoutException:
        yield 'data: {"error":"模型回复超时，请稍后重试"}\n\n'
    except (httpx.HTTPError, ValueError, json.JSONDecodeError):
        yield 'data: {"error":"本地模型服务暂不可用"}\n\n'


@chat_router.post("/chat/stream")
async def stream_chat_with_npc(body: ChatRequest):
    return StreamingResponse(
        stream_ollama_events(body),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "X-Accel-Buffering": "no",
        },
    )
