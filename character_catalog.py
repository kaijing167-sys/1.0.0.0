"""Source values are preserved separately from converted gameplay attributes."""
import json
from pathlib import Path

CHARACTERS = json.loads((Path(__file__).parent / "frontend" / "characters" / "characters.json").read_text(encoding="utf-8"))
CHARACTER_BY_ID = {character["id"]: character for character in CHARACTERS}
