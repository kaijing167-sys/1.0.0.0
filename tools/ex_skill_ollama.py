#!/usr/bin/env python3
"""Turn exported chat material into a runtime persona using local Ollama."""

from __future__ import annotations

import argparse
import hashlib
import html
import json
import os
import re
from datetime import datetime, timezone
from pathlib import Path

import httpx


ROOT = Path(__file__).resolve().parents[1]
DEFAULT_SKILL_DIR = ROOT / "skills" / "ex-skill"
DEFAULT_OUTPUT_DIR = ROOT / "personas"


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description="Use the ex-skill prompts with a local Ollama model."
    )
    parser.add_argument("--source", action="append", required=True, help="Chat export or notes file")
    parser.add_argument("--target", required=True, help="Character name shown in chat")
    parser.add_argument("--description", required=True, help="One-line character description")
    parser.add_argument("--slug", required=True, help="Safe output slug, for example ex-xiaoming")
    parser.add_argument("--npc-id", help="Optional game NPC id to override: liqiang, su, or lin")
    parser.add_argument("--output-dir", default=str(DEFAULT_OUTPUT_DIR))
    parser.add_argument("--skill-dir", default=str(DEFAULT_SKILL_DIR))
    parser.add_argument("--ollama-url", default=os.getenv("OLLAMA_URL", "http://127.0.0.1:11434"))
    parser.add_argument("--model", default=os.getenv("OLLAMA_MODEL", "qwen3.5:4b"))
    parser.add_argument("--max-source-chars", type=int, default=12000)
    parser.add_argument("--timeout", type=float, default=300)
    return parser.parse_args()


def safe_slug(value: str) -> str:
    slug = re.sub(r"[^a-z0-9-]+", "-", value.lower()).strip("-")
    if not slug:
        raise ValueError("slug 不能为空，且只能包含字母、数字和连字符")
    return slug[:64]


def prepare_material(paths: list[str], max_chars: int) -> tuple[str, list[dict[str, str]]]:
    sections: list[str] = []
    sources: list[dict[str, str]] = []
    for raw_path in paths:
        path = Path(raw_path).expanduser().resolve()
        if not path.is_file():
            raise FileNotFoundError(path)
        content = path.read_text(encoding="utf-8", errors="ignore")
        if path.suffix.lower() in {".html", ".htm", ".mht", ".mhtml"}:
            content = html.unescape(re.sub(r"<[^>]+>", "\n", content))
            content = re.sub(r"\n{3,}", "\n\n", content)
        elif path.suffix.lower() == ".json":
            try:
                content = json.dumps(json.loads(content), ensure_ascii=False, indent=2)
            except json.JSONDecodeError:
                pass
        sections.append(f"### 来源：{path.name}\n{content.strip()}")
        sources.append(
            {
                "name": path.name,
                "sha256": hashlib.sha256(path.read_bytes()).hexdigest(),
            }
        )

    material = "\n\n".join(sections)
    if len(material) > max_chars:
        head = max_chars // 3
        tail = max_chars - head
        material = (
            material[:head]
            + "\n\n[中间内容因长度限制已省略]\n\n"
            + material[-tail:]
        )
    return material, sources


def read_skill_prompt(skill_dir: Path, *parts: str) -> str:
    path = skill_dir.joinpath(*parts)
    if not path.is_file():
        raise FileNotFoundError(f"ex-skill prompt missing: {path}")
    return path.read_text(encoding="utf-8")


def build_analysis_prompt(
    skill_dir: Path,
    target: str,
    description: str,
    material: str,
    kind: str,
) -> tuple[str, str]:
    if kind == "persona":
        analyzer = read_skill_prompt(skill_dir, "prompts", "persona_analyzer.md")
        builder = read_skill_prompt(skill_dir, "prompts", "persona_builder.md")
        output_name = "persona.md"
    elif kind == "memory":
        analyzer = read_skill_prompt(skill_dir, "prompts", "memory_analyzer.md")
        builder = read_skill_prompt(skill_dir, "prompts", "memory_builder.md")
        output_name = "memory.md"
    else:
        raise ValueError(kind)

    system = (
        "你正在执行 ex-skill 的离线人格蒸馏流程。只依据给出的材料，不补写没有证据的"
        "事实。信息不足时应明确写“信息不足”，不要美化或虚构。最终只输出 Markdown，"
        f"内容应可直接保存为 {output_name}。"
    )
    user = f"""# 目标角色
- 名称：{target}
- 简要描述：{description}

# ex-skill 分析提示
{analyzer}

# ex-skill 生成模板
{builder}

# 原材料
{material}

请严格依据原材料和模板生成完整的 {output_name}。不要输出解释、前言或代码围栏。
"""
    return system, user


def ollama_chat(
    base_url: str,
    model: str,
    system: str,
    user: str,
    timeout: float,
    max_predict: int = 1800,
) -> str:
    payload = {
        "model": model,
        "stream": False,
        "think": False,
        "messages": [
            {"role": "system", "content": system},
            {"role": "user", "content": user},
        ],
        "options": {
            "temperature": 0.35,
            "top_p": 0.9,
            "num_ctx": 8192,
            "num_predict": max_predict,
        },
    }
    with httpx.Client(timeout=timeout) as client:
        response = client.post(f"{base_url.rstrip('/')}/api/chat", json=payload)
        response.raise_for_status()
        data = response.json()
    content = str((data.get("message") or {}).get("content") or "").strip()
    if not content:
        raise RuntimeError("Ollama 没有返回有效内容")
    return content


def limit_compact_prompt(value: str, max_chars: int = 300) -> str:
    value = re.sub(r"\s+", " ", value).strip()
    value = re.sub(
        r"(?:我|你)(?:不是|并非)\s*(?:AI|人工智能|助手|机器人)[。；,，]?",
        "",
        value,
        flags=re.IGNORECASE,
    )
    sentences = re.findall(r"[^。！？!?]+[。！？!?]?", value)
    result = ""
    for sentence in sentences:
        if len(result) + len(sentence) > max_chars:
            break
        result += sentence
    return (result or value[:max_chars]).strip()


def build_runtime_prompt(target: str, persona: str, memory: str) -> str:
    return f"""你正在扮演基于聊天记录整理出的角色「{target}」。

你不是现实中的真人，也不要声称自己拥有现实身体、位置或能主动联系他人。
保持角色原本的表达习惯和棱角，不为了讨好玩家突然改变性格。
每次只回复1到3句话，最多一个问号，只输出角色说的话，不写角色名前缀或动作说明。
不要编造没有出现在关系记忆中的共同经历。

# PART A：关系记忆

{memory}

# PART B：人物性格

{persona}
""".strip()


def build_combined_skill(
    slug: str, target: str, description: str, persona: str, memory: str
) -> str:
    return f"""---
name: ex-{slug}
description: {description}
user-invocable: true
---

# {target}

{description}

## PART A：关系记忆

{memory}

## PART B：人物性格

{persona}
"""


def build_compact_prompt(target: str, persona: str, memory: str) -> tuple[str, str]:
    system = (
        "你是提示词压缩器。只保留能直接影响聊天表现的信息，不虚构事实。"
        "输出一段可直接作为 system prompt 的中文文本，不使用 Markdown 标题或代码围栏。"
    )
    user = f"""把下面的人格与关系记忆压缩成 220 到 300 个汉字。

必须保留：
- 角色名「{target}」
- 口头禅、句长、语气和标点习惯
- 关心方式、边界、争吵或回避模式
- 能被玩家自然引用的真实共同记忆
- 对信息不足或尚未发生的事不擅自补全

不要包含安全规则、分析过程、文件名、版本号或“你是AI”之类说明。
不要加入动作描写、舞台说明、分点列表或 Markdown。

# Persona
{persona}

# Memory
{memory}
"""
    return system, user


def write_artifacts(
    output_dir: Path,
    runtime_dir: Path,
    slug: str,
    npc_id: str | None,
    target: str,
    description: str,
    persona: str,
    memory: str,
    compact_prompt: str,
    sources: list[dict[str, str]],
    model: str,
) -> Path:
    skill_dir = output_dir / slug
    skill_dir.mkdir(parents=True, exist_ok=True)
    persona = persona.strip() + "\n"
    memory = memory.strip() + "\n"
    runtime = build_runtime_prompt(target, persona, memory) + "\n"
    compact_prompt = compact_prompt.strip() + "\n"

    (skill_dir / "persona.md").write_text(persona, encoding="utf-8")
    (skill_dir / "memory.md").write_text(memory, encoding="utf-8")
    (skill_dir / "SKILL.md").write_text(
        build_combined_skill(slug, target, description, persona, memory), encoding="utf-8"
    )
    (skill_dir / "runtime_prompt.txt").write_text(runtime, encoding="utf-8")
    (skill_dir / "compact_prompt.txt").write_text(compact_prompt, encoding="utf-8")
    (skill_dir / "meta.json").write_text(
        json.dumps(
            {
                "name": target,
                "slug": slug,
                "description": description,
                "npc_id": npc_id,
                "model": model,
                "sources": sources,
                "created_at": datetime.now(timezone.utc).isoformat(),
            },
            ensure_ascii=False,
            indent=2,
        )
        + "\n",
        encoding="utf-8",
    )

    if npc_id:
        if npc_id not in {"liqiang", "su", "lin"}:
            raise ValueError("npc-id 必须是 liqiang、su 或 lin")
        runtime_target = runtime_dir / npc_id
        runtime_target.mkdir(parents=True, exist_ok=True)
        (runtime_target / "runtime_prompt.txt").write_text(runtime, encoding="utf-8")
        (runtime_target / "compact_prompt.txt").write_text(compact_prompt, encoding="utf-8")
        (runtime_target / "meta.json").write_text(
            json.dumps(
                {
                    "name": target,
                    "slug": slug,
                    "model": model,
                    "created_at": datetime.now(timezone.utc).isoformat(),
                },
                ensure_ascii=False,
                indent=2,
            )
            + "\n",
            encoding="utf-8",
        )
    return skill_dir


def main() -> None:
    args = parse_args()
    if args.npc_id and args.npc_id not in {"liqiang", "su", "lin"}:
        raise SystemExit("npc-id 必须是 liqiang、su 或 lin")
    slug = safe_slug(args.slug)
    skill_dir = Path(args.skill_dir).expanduser().resolve()
    output_dir = Path(args.output_dir).expanduser().resolve()
    runtime_dir = output_dir
    material, sources = prepare_material(args.source, args.max_source_chars)

    persona_system, persona_user = build_analysis_prompt(
        skill_dir, args.target, args.description, material, "persona"
    )
    memory_system, memory_user = build_analysis_prompt(
        skill_dir, args.target, args.description, material, "memory"
    )

    print(f"[1/3] 生成 {args.target} 的 persona.md ...")
    persona = ollama_chat(
        args.ollama_url, args.model, persona_system, persona_user, args.timeout
    )
    print("[2/3] 生成 memory.md ...")
    memory = ollama_chat(
        args.ollama_url, args.model, memory_system, memory_user, args.timeout
    )
    print("[3/3] 生成服务器精简提示词 ...")
    compact_system, compact_user = build_compact_prompt(args.target, persona, memory)
    compact_prompt = ollama_chat(
        args.ollama_url,
        args.model,
        compact_system,
        compact_user,
        min(args.timeout, 180),
        max_predict=420,
    )
    compact_prompt = limit_compact_prompt(compact_prompt)

    result_dir = write_artifacts(
        output_dir=output_dir,
        runtime_dir=runtime_dir,
        slug=slug,
        npc_id=args.npc_id,
        target=args.target,
        description=args.description,
        persona=persona,
        memory=memory,
        compact_prompt=compact_prompt,
        sources=sources,
        model=args.model,
    )
    print(f"完成：{result_dir}")
    if args.npc_id:
        print(f"运行时覆盖：{runtime_dir / args.npc_id / 'runtime_prompt.txt'}")


if __name__ == "__main__":
    main()
