import asyncio

from sqlalchemy import delete

from database import AsyncSessionLocal, Base, engine
from models import AchievementModel, EventModel


MAIN_EVENTS = [
    {
        "id": 1,
        "grade": 1,
        "week": 1,
        "title": "军训的下马威",
        "condition_dsl": {},
        "narrative": "烈日暴晒下的军姿，教官的哨声响彻操场。",
        "effects": {"stamina": -10, "stress": 10},
    },
    {
        "id": 2,
        "grade": 1,
        "week": 8,
        "title": "第一次月考考场",
        "condition_dsl": {},
        "narrative": "高中的第一次大考，试卷难度远超初中。",
        "effects": {"trigger": "exam_strategy"},
    },
    {
        "id": 3,
        "grade": 1,
        "week": 16,
        "title": "班委选举之争",
        "condition_dsl": {
            "any": [
                {"field": "attributes.chinese", "op": ">", "value": 70},
                {"field": "attributes.math", "op": ">", "value": 70},
                {"field": "attributes.english", "op": ">", "value": 70},
            ]
        },
        "narrative": "班主任宣布竞选班干部，苏若云向你投来鼓励的眼神。",
        "effects": {"npc_bonds.Su Ruoyun": 10, "stress": 5},
    },
    {
        "id": 4,
        "grade": 1,
        "week": 24,
        "title": "晚自习停电事件",
        "condition_dsl": {},
        "narrative": "教室骤然漆黑，四周一片欢呼，林婉儿在暗中偷偷递给你一块蛋糕。",
        "effects": {"npc_bonds.Lin Wan'er": 15, "stress": -15},
    },
    {
        "id": 5,
        "grade": 1,
        "week": 36,
        "title": "期末暴雨冲刷",
        "condition_dsl": {"field": "attributes.stamina", "op": "<", "value": 40},
        "narrative": "淋雨回家导致高烧，你躺在病床上看着堆积如山的复习资料。",
        "effects": {"stamina": -20, "flags.study_efficiency_modifier": 0.7},
    },
    {
        "id": 6,
        "grade": 2,
        "week": 40,
        "title": "命运的分水岭",
        "condition_dsl": {},
        "narrative": "高二文理分科表发了下来，这是决定未来方向的时刻。",
        "effects": {"trigger": "choose_track"},
    },
    {
        "id": 7,
        "grade": 2,
        "week": 48,
        "title": "运动会接力赛",
        "condition_dsl": {"field": "npc_bonds.Li Qiang", "op": ">=", "value": 30},
        "narrative": "李强在最后一棒交接时差点摔倒，你拼尽全力大声呼喊。",
        "effects": {"npc_bonds.Li Qiang": 15, "stamina": 5},
    },
    {
        "id": 8,
        "grade": 2,
        "week": 58,
        "title": "漫长的期中阴霾",
        "condition_dsl": {"field": "attributes.stress", "op": ">", "value": 80},
        "narrative": "连续的错题让你陷入严重的自我怀疑，窗外的雨下个不停。",
        "effects": {"flags.brain_fog": True, "flags.all_gain_modifier": 0.8},
    },
    {
        "id": 9,
        "grade": 2,
        "week": 64,
        "title": "艺术节的后台",
        "condition_dsl": {"field": "npc_bonds.Lin Wan'er", "op": ">=", "value": 40},
        "narrative": "林婉儿的吉他弦突然断了，你在后台疯狂帮她寻找备用弦。",
        "effects": {"npc_bonds.Lin Wan'er": 20, "money": -30},
    },
    {
        "id": 10,
        "grade": 2,
        "week": 80,
        "title": "跨年夜的誓言",
        "condition_dsl": {},
        "narrative": "零点钟声敲响，你们在天台上许下对未来高考的誓言。",
        "effects": {"npc_bonds.all": 10, "stress": -20},
    },
    {
        "id": 11,
        "grade": 3,
        "week": 90,
        "title": "百日誓师大会",
        "condition_dsl": {},
        "narrative": "巨型横幅挂在教学楼前，拼搏百天的呐喊声震耳欲聋。",
        "effects": {"flags.hundred_day_sprint": True, "flags.all_gain_modifier": 1.15},
    },
    {
        "id": 12,
        "grade": 3,
        "week": 108,
        "title": "篮球赛的危机",
        "condition_dsl": {},
        "narrative": "李强强行扣篮后惨叫倒地，右腿跟腱严重受损。",
        "effects": {"trigger": "li_qiang_redemption_check"},
    },
    {
        "id": 13,
        "grade": 3,
        "week": 120,
        "title": "模拟考涂卡错位",
        "condition_dsl": {"field": "attributes.luck", "op": "<", "value": 50},
        "narrative": "距离交卷还有五分钟，你突然发现答题卡卡号全涂错了一行。",
        "effects": {"stress": 30, "flags.exam_score_modifier": -20},
    },
    {
        "id": 14,
        "grade": 3,
        "week": 140,
        "title": "撕书狂欢节",
        "condition_dsl": {},
        "narrative": "最后一个晚自习结束，漫天试纸雪花般从教学楼飘落。",
        "effects": {"stress_set": 0, "stamina_set": 100},
    },
    {
        "id": 15,
        "grade": 3,
        "week": 156,
        "title": "终极决战：高考",
        "condition_dsl": {},
        "narrative": "走进考场，验证三年汗水与宿命的最终时刻。",
        "effects": {"trigger": "gaokao_finale"},
    },
]

ACHIEVEMENTS = [
    (1, "天台看客", {"field": "stats.high_stress_weeks", "op": ">=", "value": 3}, "上面的风很大，但你挺过来了。"),
    (2, "算圣", {"field": "attributes.math", "op": "==", "value": 150}, "导数压轴题在你眼里不过如此。"),
    (3, "一网情深", {"field": "stats.weekend_internet_count", "op": ">=", "value": 5}, "网管，再加两小时！"),
    (4, "卷王之王", {"field": "stats.weekly_study_count", "op": ">=", "value": 15}, "凌晨四点的高中，你见过吗？"),
    (5, "情感大师", {"field": "stats.npc_bonds_over_60", "op": ">=", "value": 3}, "学业与友情，我全都要。"),
    (6, "涂卡惊魂", {"field": "flags.misfill_but_passed", "op": "==", "value": True}, "虚惊一场，手抖是青春的特产。"),
    (7, "饮茶先啦", {"field": "stats.milktea_count", "op": ">", "value": 20}, "没有什么是一杯珍珠奶茶解决不了的。"),
    (8, "逆天改命", {"field": "flags.saved_liqiang", "op": "==", "value": True}, "这一次，我们谁都不许掉队。"),
    (9, "名落孙山", {"field": "results.gaokao_score", "op": "<", "value": 200}, "高中三年，快乐就完事了！"),
    (10, "象牙塔顶", {"field": "results.school_rank", "op": "==", "value": 1}, "千人之上，传奇永不熄灭。"),
]


async def seed_data() -> None:
    async with engine.begin() as connection:
        await connection.run_sync(Base.metadata.create_all)

    async with AsyncSessionLocal() as session:
        await session.execute(delete(EventModel))
        await session.execute(delete(AchievementModel))
        session.add_all(
            [EventModel(is_mainline=True, **event) for event in MAIN_EVENTS]
        )
        session.add_all(
            [
                AchievementModel(
                    id=item_id,
                    name=name,
                    condition_dsl=condition,
                    flavor_text=flavor,
                )
                for item_id, name, condition, flavor in ACHIEVEMENTS
            ]
        )
        await session.commit()
        print("15 个主线事件与 10 个成就种子填充完成。")


if __name__ == "__main__":
    asyncio.run(seed_data())
