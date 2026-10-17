# 单人多槽存档

在原 FastAPI 后端上新增 5 个独立数据库存档槽。游戏行动仍使用现有前端模拟逻辑；本次完成的是完整进度持久化，不是账号系统或服务器权威游戏逻辑。

## 启动与使用

需要 Python 3.10+。在项目目录执行：

```powershell
python -m venv .venv
.\.venv\Scripts\Activate.ps1
python -m pip install -r requirements.txt
python -m uvicorn main:app --host 127.0.0.1 --port 8000
```

打开 http://127.0.0.1:8000/play/ ，点击左侧“保存这段时光”。

- 输入名称，选择任意存档槽保存；覆盖旧存档前需要确认。
- 读取时完整恢复周数、属性、羁绊、阶段锁、背包、日志、事件、考试、成就和多周目进度。
- 删除需要确认。删除不会清除当前正在玩的进度。
- 每次游戏行动仍自动保存到浏览器，数据库槽通过按钮手动保存。
- 启动时自动创建缺失的数据库表，无需先运行种子脚本。
- 默认使用启动目录的 `game.db`。重启时请保持同一工作目录，或设置固定的 `DATABASE_URL`；更换目录会使用另一份数据库。
- 此版本不需要 Redis。

## 旧页面迁移

`frontend/` 与 GitHub Pages 使用的 `docs/` 都已同步更新。静态页面不能直接运行 Python 后端：

1. 在旧页面点击“保存这段时光”，选择“导出当前进度”。
2. 启动后端，进入 `/play/characters/` 页面并打开存档面板。
3. 在“导入旧进度”选择 JSON 文件和目标槽；导入成功后点“读取”。

导入经过后端校验，失败不会覆盖原存档。也可在后端页面导出当前进度作为本地备份。

## 存档身份与数据

无需登录。浏览器生成 256 位随机凭证，保存在 localStorage 的 `qinghe-save-token-v1` 中，每个浏览器凭证各有 5 个槽。数据库只保存凭证的 SHA-256 摘要。请求通过 `X-Save-Token` 头识别归属。

这属于单人匿名存档，不提供账号找回或自动跨设备同步。清除网站数据、换浏览器或更换网站地址会失去原凭证，请提前导出进度。数据库文件需要由部署者备份；部署到服务器时需使用持久化磁盘。公开部署还需要 HTTPS、访问控制和流量限制，不建议直接暴露本地开发服务。

## API

所有请求均需 `X-Save-Token: <64 位小写十六进制随机值>`。

| 方法 | 路径 | 功能 |
|---|---|---|
| GET | /api/saves | 查询已有槽摘要（含删除槽的版本标记） |
| GET | /api/saves/{slot} | 读取完整快照 |
| PUT | /api/saves/{slot} | 新建或覆盖 |
| DELETE | /api/saves/{slot}?expected_revision=N | 删除 |

PUT 请求为 `{name, expected_revision, state}`。未使用过的槽版本为 0；更新或删除时必须传入最近读取的版本。版本不一致返回 409，前端提示刷新后重试。删除保留递增版本标记，避免旧标签页重新写回已删除的内容。槽编号仅允许 1–5；不支持的存档版本或无效数据返回 422；空槽读取返回 404；缺失凭证返回 401。

存档结构保留前端 `version: 1`，与旧后端 `SaveStateSchema` 分开，不会丢弃前端专有字段，也不改变旧接口。

## 验证

```powershell
python -m pip install pytest httpx
python -m pytest -q
node --check frontend/app.js
node --check frontend/saves.js
```

测试覆盖五槽读写、覆盖冲突、删除后重建、凭证隔离、无效输入拒绝、SQLite 引擎重启后读取、游戏页面资源及原有游戏规则。
