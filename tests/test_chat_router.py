import json

from fastapi import FastAPI
from fastapi.testclient import TestClient

import chat_router
import npc_personas
from chat_router import (
    ChatContext,
    ChatMessage,
    ChatRequest,
    build_ollama_messages,
    normalize_reply,
)


class FakeResponse:
    def raise_for_status(self):
        return None

    def json(self):
        return {"message": {"role": "assistant", "content": "先别急着一个人消化。你想先说哪一部分？"}}


class FakeClient:
    last_payload = None

    def __init__(self, timeout):
        self.timeout = timeout

    async def __aenter__(self):
        return self

    async def __aexit__(self, exc_type, exc, traceback):
        return None

    async def post(self, url, json, headers=None):
        type(self).last_payload = {"url": url, "json": json, "headers": headers}
        return FakeResponse()


def test_chat_prompt_uses_requested_persona_and_game_context():
    request = ChatRequest(
        npcId="lin",
        messages=[ChatMessage(role="user", content="今天画不出来")],
        context=ChatContext(
            playerName="小禾",
            day=731,
            grade="高三",
            relationship=42,
            mood=54,
            stress=68,
            recentEvents=["月考成绩退步"],
        ),
    )

    messages = build_ollama_messages(request)

    assert len(messages) == 3
    assert "林婉儿" in messages[0]["content"]
    assert "高三" in messages[1]["content"]
    assert "relationship" in messages[1]["content"]
    assert messages[-1] == {"role": "user", "content": "今天画不出来"}


def test_chat_history_is_trimmed_without_dropping_latest_message(monkeypatch):
    monkeypatch.setattr(chat_router, "CHAT_HISTORY_CHARS", 10)
    request = ChatRequest(
        npcId="su",
        messages=[
            ChatMessage(role="user", content="很早以前的消息"),
            ChatMessage(role="assistant", content="以前的回复"),
            ChatMessage(role="user", content="最新消息"),
        ],
    )

    messages = build_ollama_messages(request)

    assert messages[-2]["content"] == "以前的回复"
    assert messages[-1]["content"] == "最新消息"


def test_compact_server_prompt_keeps_persona_and_safety(monkeypatch):
    monkeypatch.setenv("NPC_PROMPT_MODE", "compact")

    prompt = npc_personas.get_npc_persona("lin")

    assert "林婉儿" in prompt
    assert "音乐和画画" in prompt
    assert "自残、轻生" in prompt
    assert len(prompt) < len(npc_personas.NPC_PERSONAS["lin"])


def test_su_persona_keeps_refined_voice_without_imported_chat_identity():
    prompt = npc_personas.NPC_PERSONAS["su"]

    assert "轻调侃" in prompt
    assert "不要主动提" in prompt
    assert "空泛" in prompt
    assert "梁晶晶" not in prompt
    assert "25智感" not in prompt


def test_generated_runtime_persona_overrides_builtin_character(tmp_path, monkeypatch):
    runtime_dir = tmp_path / "personas"
    su_dir = runtime_dir / "su"
    su_dir.mkdir(parents=True)
    (su_dir / "runtime_prompt.txt").write_text(
        "你是从聊天记录整理出的测试班长。说话简短而温和。",
        encoding="utf-8",
    )
    (su_dir / "compact_prompt.txt").write_text(
        "你是精简版测试班长。先听对方说完，再给一个轻建议。",
        encoding="utf-8",
    )
    monkeypatch.setenv("NPC_RUNTIME_DIR", str(runtime_dir))

    prompt = npc_personas.get_npc_persona("su")

    assert "从聊天记录整理出的测试班长" in prompt
    assert "不要声称自己是现实中的真人" in prompt
    assert "只输出角色对白" in prompt
    monkeypatch.setenv("NPC_PROMPT_MODE", "compact")
    compact_prompt = npc_personas.get_npc_persona("su")
    assert "精简版测试班长" in compact_prompt
    assert "从聊天记录整理出的测试班长" not in compact_prompt


def test_chat_route_calls_ollama_without_thinking_output(monkeypatch):
    app = FastAPI()
    app.include_router(chat_router.chat_router)
    client = TestClient(app)
    monkeypatch.setattr(chat_router.httpx, "AsyncClient", FakeClient)

    response = client.post(
        "/api/chat",
        json={
            "npcId": "liqiang",
            "messages": [{"role": "user", "content": "这次月考没考好"}],
            "context": {"playerName": "小禾", "relationship": 35, "stress": 72},
        },
    )

    assert response.status_code == 200
    assert response.json()["reply"] == "先别急着一个人消化。你想先说哪一部分？"
    payload = FakeClient.last_payload["json"]
    assert payload["model"] == chat_router.OLLAMA_MODEL
    assert payload["think"] is False
    assert payload["stream"] is False
    assert payload["keep_alive"] == "24h"
    assert payload["options"]["num_ctx"] == chat_router.OLLAMA_NUM_CTX
    assert "李强" in payload["messages"][0]["content"]


def test_chat_route_rejects_empty_model_reply(monkeypatch):
    class EmptyResponse(FakeResponse):
        def json(self):
            return {"message": {"content": ""}}

    class EmptyClient(FakeClient):
        async def post(self, url, json):
            return EmptyResponse()

    app = FastAPI()
    app.include_router(chat_router.chat_router)
    client = TestClient(app)
    monkeypatch.setattr(chat_router.httpx, "AsyncClient", EmptyClient)

    response = client.post(
        "/api/chat",
        json={
            "npcId": "su",
            "messages": [{"role": "user", "content": "在吗"}],
        },
    )

    assert response.status_code == 502
    assert response.json()["detail"] == "模型没有返回有效回复"


def test_reply_is_limited_to_three_sentences_and_one_question():
    reply = "先缓一缓。你还好吗？要不要去走走？我陪着你。"
    normalized = normalize_reply(reply)

    assert normalized == "先缓一缓。你还好吗？要不要去走走。"


def test_reply_removes_role_prefix_and_parenthetical_action():
    reply = "（把水递过去）苏若云：先喝点水吧。你想先复习哪一科？"

    normalized = normalize_reply(reply)

    assert normalized == "先喝点水吧。你想先复习哪一科？"


def test_streaming_route_emits_deltas_and_normalized_final_reply(monkeypatch):
    class StreamResponse:
        def raise_for_status(self):
            return None

        async def aiter_lines(self):
            for text in ("你还好", "吗？我听着", "呢？要不要说说？"):
                yield '{"message":{"content":' + json.dumps(text, ensure_ascii=False) + "}}"

    class StreamContext:
        async def __aenter__(self):
            return StreamResponse()

        async def __aexit__(self, exc_type, exc, traceback):
            return None

    class StreamClient(FakeClient):
        last_payload = None

        def stream(self, method, url, json):
            type(self).last_payload = {"method": method, "url": url, "json": json}
            return StreamContext()

    monkeypatch.setattr(chat_router.httpx, "AsyncClient", StreamClient)
    app = FastAPI()
    app.include_router(chat_router.chat_router)
    client = TestClient(app)

    response = client.post(
        "/api/chat/stream",
        json={
            "npcId": "su",
            "messages": [{"role": "user", "content": "在吗"}],
        },
    )

    assert response.status_code == 200
    assert "你还好" in response.text
    assert '"done":true' in response.text
    assert StreamClient.last_payload["json"]["stream"] is True
    assert StreamClient.last_payload["json"]["options"]["num_predict"] == 40
