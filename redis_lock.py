import uuid

import redis.asyncio as aioredis


class DistributedLock:
    def __init__(self, redis_client: aioredis.Redis, key: str, timeout: int = 5):
        self.redis = redis_client
        self.key = f"lock:{key}"
        self.timeout = timeout
        self.token = str(uuid.uuid4())

    async def __aenter__(self):
        acquired = await self.redis.set(
            self.key,
            self.token,
            ex=self.timeout,
            nx=True,
        )
        if not acquired:
            raise RuntimeError("操作过于频繁，请稍后再试（分布式锁冲突）")
        return self

    async def __aexit__(self, exc_type, exc_val, exc_tb):
        lua_script = """
        if redis.call("get", KEYS[1]) == ARGV[1] then
            return redis.call("del", KEYS[1])
        else
            return 0
        end
        """
        await self.redis.eval(lua_script, 1, self.key, self.token)
