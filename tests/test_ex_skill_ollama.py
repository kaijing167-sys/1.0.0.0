import json

from tools.ex_skill_ollama import (
    build_analysis_prompt,
    limit_compact_prompt,
    prepare_material,
    safe_slug,
    write_artifacts,
)


def test_prepare_material_strips_html_and_records_hashes(tmp_path):
    source = tmp_path / "chat.html"
    source.write_text("<div>我：在吗</div><div>ta：在。</div>", encoding="utf-8")

    material, sources = prepare_material([str(source)], max_chars=1000)

    assert "我：在吗" in material
    assert "<div>" not in material
    assert sources[0]["name"] == "chat.html"
    assert len(sources[0]["sha256"]) == 64


def test_ex_skill_prompts_and_runtime_artifacts_are_written(tmp_path):
    skill_dir = tmp_path / "ex-skill"
    prompts = skill_dir / "prompts"
    prompts.mkdir(parents=True)
    for name in ("persona_analyzer.md", "persona_builder.md"):
        (prompts / name).write_text(f"# {name}\n只依据原材料。", encoding="utf-8")

    system, user = build_analysis_prompt(
        skill_dir, "测试角色", "测试描述", "我：你好\nta：嗯。", "persona"
    )

    assert "不补写没有证据" in system
    assert "只依据原材料" in user
    assert "persona_builder.md" in user
    assert "ta：嗯" in user

    output_dir = tmp_path / "personas"
    result = write_artifacts(
        output_dir=output_dir,
        runtime_dir=output_dir,
        slug="sample",
        npc_id="su",
        target="测试角色",
        description="测试描述",
        persona="## Layer 0\n保持角色边界。",
        memory="## 关系概览\n信息不足。",
        compact_prompt="测试角色说话简短，保持边界。",
        sources=[],
        model="test-model",
    )

    assert (result / "persona.md").is_file()
    assert (result / "memory.md").is_file()
    assert (result / "SKILL.md").is_file()
    assert (result / "compact_prompt.txt").is_file()
    runtime = output_dir / "su" / "runtime_prompt.txt"
    assert runtime.is_file()
    assert "不是现实中的真人" in runtime.read_text(encoding="utf-8")
    meta = json.loads((result / "meta.json").read_text(encoding="utf-8"))
    assert meta["npc_id"] == "su"


def test_safe_slug_rejects_empty_names():
    assert safe_slug("Ex 小明 01") == "ex-01"
    try:
        safe_slug("小明")
    except ValueError:
        pass
    else:
        raise AssertionError("Expected ValueError")


def test_compact_prompt_removes_meta_claims_and_limits_length():
    text = "我不是AI。我是测试角色。先说具体哪里卡住？这句会被长度限制省略。"
    compact = limit_compact_prompt(text, max_chars=20)

    assert "AI" not in compact
    assert len(compact) <= 20
