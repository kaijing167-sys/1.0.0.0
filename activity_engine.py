import operator
import random
from typing import Any, Dict, Iterable, Optional


OPS = {
    "==": operator.eq,
    "!=": operator.ne,
    ">=": operator.ge,
    "<=": operator.le,
    ">": operator.gt,
    "<": operator.lt,
}

SUBJECTS = {
    "chinese",
    "math",
    "english",
    "physics",
    "chemistry",
    "biology",
    "history",
    "politics",
    "geography",
}


def get_nested_value(state: Dict[str, Any], field: str) -> Any:
    value: Any = state
    for key in field.split("."):
        if not isinstance(value, dict) or key not in value:
            return None
        value = value[key]
    return value


def evaluate_condition(condition: Dict[str, Any], state: Dict[str, Any]) -> bool:
    """递归解析白皮书定义的 all、any 与比较运算 DSL。"""
    if not condition:
        return True
    if "all" in condition:
        return all(evaluate_condition(item, state) for item in condition["all"])
    if "any" in condition:
        return any(evaluate_condition(item, state) for item in condition["any"])

    value = get_nested_value(state, condition.get("field", ""))
    operation = OPS.get(condition.get("op"))
    if value is None or operation is None:
        return False
    try:
        return bool(operation(value, condition.get("value")))
    except TypeError:
        return False


def calculate_event_weight(event: Dict[str, Any], state: Dict[str, Any]) -> float:
    """基础权重乘以修正因子；高压力使病痛和崩溃事件提高到 2.5 倍。"""
    weight = float(event.get("base_weight", 1.0))
    stress = get_nested_value(state, "attributes.stress") or 0
    if stress > 80 and event.get("category") in {"illness", "breakdown"}:
        weight *= 2.5
    for modifier in event.get("modifiers", []):
        if evaluate_condition(modifier.get("condition", {}), state):
            weight *= float(modifier.get("factor", 1.0))
    return max(0.0, weight)


def weighted_event_choice(
    events: Iterable[Dict[str, Any]],
    state: Dict[str, Any],
    rng: Optional[random.Random] = None,
) -> Optional[Dict[str, Any]]:
    eligible = [
        event
        for event in events
        if evaluate_condition(event.get("condition_dsl", {}), state)
    ]
    if not eligible:
        return None
    weights = [calculate_event_weight(event, state) for event in eligible]
    if sum(weights) <= 0:
        return None
    return (rng or random).choices(eligible, weights=weights, k=1)[0]


def clamp_attributes(attributes: Dict[str, Any]) -> Dict[str, Any]:
    for key in ("stamina", "stress", "luck", "morality"):
        if key in attributes:
            attributes[key] = max(0, min(100, int(attributes[key])))
    for key in SUBJECTS:
        if key in attributes:
            attributes[key] = max(0, min(150, int(attributes[key])))
    if "money" in attributes:
        attributes["money"] = max(0, int(attributes["money"]))
    if "action_points" in attributes:
        attributes["action_points"] = max(0, int(attributes["action_points"]))
    return attributes


class ActivityEngine:
    @staticmethod
    def process_study_action(state: dict, subject: str) -> dict:
        if subject not in SUBJECTS:
            raise ValueError(f"未知学科：{subject}")

        attrs = state["save_state"]["attributes"]
        time_data = state["save_state"]["time"]
        stress = attrs["stress"]
        stamina = attrs["stamina"]

        efficiency = (
            1 - max(0, stress - 60) / 100.0
        ) * (min(100, stamina + 20) / 120.0)
        base_gain = 3.0
        if "过目不忘" in state.get("perks", []):
            base_gain *= 1.2
        actual_gain = max(0, int(round(base_gain * efficiency)))

        attrs[subject] = attrs.get(subject, 0) + actual_gain
        attrs["stamina"] -= 5
        attrs["stress"] += 8
        attrs["action_points"] = max(0, attrs.get("action_points", 1) - 1)
        clamp_attributes(attrs)

        time_data["time_slot"] += 1
        if time_data["time_slot"] > 3:
            time_data["time_slot"] = 4

        return {
            "gain": actual_gain,
            "current_attributes": attrs,
            "time": time_data,
        }
