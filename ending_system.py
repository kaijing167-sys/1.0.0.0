ENDING_MATRIX = {
    "Top": {
        "Li Qiang": "兄弟双雄：一起撕碎命运的考卷",
        "Su Ruoyun": "清北双璧：象牙塔顶峰相见",
        "Alone": "顶峰孤鹰：孤独的学霸传说",
    },
    "Upper": {
        "Li Qiang": "绿荫回忆：运动场上的余晖",
        "Su Ruoyun": "沪上花开：平行时空的约定",
        "Alone": "平实学子：迈向未来的第一步",
    },
    "Mid": {
        "Li Qiang": "烟火人生：小镇啤酒与烧烤",
        "Su Ruoyun": "异地相望：渐行渐远的青春",
        "Alone": "平凡之路：踏实也是一种答案",
    },
    "Low": {
        "Li Qiang": "创业搭档：后街的摊位",
        "Su Ruoyun": "遗憾错过：再见，班长",
        "Alone": "复读岁月：明年再战",
    },
}


def determine_ending(total_score: int, highest_npc_bond: dict) -> dict:
    npc_name = highest_npc_bond.get("name")
    bond_value = highest_npc_bond.get("value", 0)

    if total_score >= 650:
        tier = "Top"
    elif total_score >= 580:
        tier = "Upper"
    elif total_score >= 480:
        tier = "Mid"
    else:
        tier = "Low"

    selected_npc = npc_name if bond_value >= 60 else "Alone"
    ending_title = ENDING_MATRIX[tier].get(
        selected_npc,
        ENDING_MATRIX[tier]["Alone"],
    )
    return {
        "tier": tier,
        "ending_title": ending_title,
        "score": total_score,
    }


def calculate_legacy_points(
    total_score: int,
    achievement_count: int,
    max_bond_count: int,
) -> int:
    return total_score // 10 + achievement_count * 10 + max_bond_count * 20
