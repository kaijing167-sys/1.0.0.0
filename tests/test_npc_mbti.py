import json
import os
import re
import tempfile
import unittest
from pathlib import Path
from unittest.mock import patch

import npc_personas

ROOT = Path(__file__).resolve().parents[1]


class NpcMbtiDialogueTests(unittest.TestCase):
    def test_all_prompt_modes_keep_their_style_safety_and_character(self):
        expected = {"liqiang": ("ESTP", "李强", "一小步"), "su": ("INFP", "苏若云", "个人价值"), "lin": ("ISFP", "林婉儿", "生活细节")}
        with tempfile.TemporaryDirectory(dir=ROOT) as folder:
            for mode in ("full", "compact"):
                for npc_id, (mbti, name, marker) in expected.items():
                    with patch.dict(os.environ, {"NPC_RUNTIME_DIR": folder, "NPC_PROMPT_MODE": mode}):
                        prompt = npc_personas.get_npc_persona(npc_id)
                    for text in (mbti, name, marker, "只", "自残、轻生", "除非玩家主动询问"):
                        self.assertIn(text, prompt)
            for npc_id, (mbti, name, marker) in expected.items():
                runtime = Path(folder) / npc_id
                runtime.mkdir()
                (runtime / "runtime_prompt.txt").write_text("测试运行时角色，不覆盖其他配置。", encoding="utf-8")
                (runtime / "compact_prompt.txt").write_text("测试精简运行时角色。", encoding="utf-8")
                for mode in ("full", "compact"):
                    with patch.dict(os.environ, {"NPC_RUNTIME_DIR": folder, "NPC_PROMPT_MODE": mode}):
                        prompt = npc_personas.get_npc_persona(npc_id)
                    for text in (mbti, name, marker, "运行时角色", "不要声称自己是现实中的真人", "只输出角色对白"):
                        self.assertIn(text, prompt)

    def test_backend_types_match_frontend_profiles_and_local_dialogue(self):
        source = (ROOT / "frontend" / "keyword-chat.js").read_text(encoding="utf-8")
        voices = json.loads(re.search(r"KEYWORD_PERSONALITIES=(\{.*?\});", source, re.S).group(1))
        roster = (ROOT / "frontend" / "roster.js").read_text(encoding="utf-8")
        npcs = json.loads(re.search(r"CAMPUS_NPCS = (\[.*?\]);", roster, re.S).group(1))
        for npc in npcs:
            self.assertEqual(voices[npc["id"]]["mbti"], npc["mbti"])
            self.assertIn(npc["mbti"], npc_personas.NPC_MBTI_STYLES[npc["id"]])


if __name__ == "__main__":
    unittest.main()
