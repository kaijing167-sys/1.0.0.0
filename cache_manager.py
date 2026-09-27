import json

import redis.asyncio as aioredis
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from models import PlayerModel


class CacheManager:
    def __init__(self, redis_client: aioredis.Redis):
        self.redis = redis_client

    async def get_player_state(self, player_id: int, db: AsyncSession) -> dict:
        cache_key = f"player_state:{player_id}"
        cached = await self.redis.get(cache_key)
        if cached:
            return json.loads(cached)

        result = await db.execute(
            select(PlayerModel).where(PlayerModel.id == player_id)
        )
        player = result.scalars().first()
        if not player:
            raise ValueError("Player not found")

        state = {
            "id": player.id,
            "name": player.name,
            "ng_level": player.ng_level,
            "legacy_points": player.legacy_points,
            "perks": player.perks or [],
            "save_state": player.save_state,
        }
        await self.redis.set(cache_key, json.dumps(state, ensure_ascii=False), ex=3600)
        return state

    async def save_player_state_writeback(
        self,
        player_id: int,
        state: dict,
        db: AsyncSession,
    ) -> None:
        cache_key = f"player_state:{player_id}"
        await self.redis.set(
            cache_key,
            json.dumps(state, ensure_ascii=False),
            ex=3600,
        )

        result = await db.execute(
            select(PlayerModel).where(PlayerModel.id == player_id)
        )
        player = result.scalars().first()
        if player:
            player.save_state = state["save_state"]
            player.legacy_points = state.get("legacy_points", player.legacy_points)
            player.perks = state.get("perks", player.perks)
            await db.commit()
