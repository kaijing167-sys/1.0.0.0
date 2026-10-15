# 青禾纪事 · 高中模拟器

一款以高中三年为背景的校园文字模拟游戏。在通往高考的 1092 天里，安排学习与生活、认识同学、积累成长经历，走向属于自己的青春结局。

项目包含可独立运行的原生 JavaScript 前端，以及 FastAPI 后端原型。**当前游戏使用浏览器本地模拟逻辑，尚未接入后端 API。**

## 游戏特色

- **四种开局**：高一开学、高二开学、高三开学、百日冲刺；输入姓名并分配 40 点初始属性，不同阶段拥有不同的初始状态。
- **每周生活安排**：默认每周 4 次行动，在学习、休息、锻炼和社交之间分配时间，管理成绩、体力、压力与心情。
- **校园关系**：与李强、苏若云、林婉儿交流，查看羁绊进度，周末邀请朋友前往不同地点。
- **高中成长路线**：展示高一开学、文理分科、高三冲刺和高考四个节点，按日期触发考试与校园事件。
- **周末与家庭**：安排补课、兼职、家庭活动、兴趣、自习和外出，体验不同选择的收益与代价。
- **青春纪念册**：查看全部 10 项成长目标及进度，记录属性、关系、补课和考试表现。
- **考试与多结局**：经历阶段考试和高考；前端根据最终分数与魅力属性进入不同结局。
- **本地存档与个性设置**：自动保存进度，支持存档导入导出、大字体、紧凑布局、减少动态效果及游戏节奏调整。
- **场景音乐与移动端布局**：支持背景音乐开关、音量控制和本地音乐替换，适配桌面与手机屏幕。

## 快速体验

下载或克隆仓库后，用 Edge 或 Chrome 打开 [frontend/index.html](frontend/index.html)，无需安装 Node.js 或启动后端。

也可以在仓库根目录启动静态服务器：

```powershell
python -m http.server 8080
```

然后访问 <http://127.0.0.1:8080/frontend/>。主要玩法无需联网；默认音乐引用外部音频，需要网络，也可以导入自己有授权的本地音频。

存档保存在当前浏览器的 localStorage 中。更换浏览器、切换访问地址或清理站点数据后，原进度可能不可用，建议先在“设置”中导出存档。

详细说明见 [前端使用说明](前端使用说明.md) 和 [音乐配置清单](音乐配置清单.md)。

## 本次合并更新

[PR #1](https://github.com/kaijing167-sys/1.0.0.0/pull/1) 已于 2026 年 10 月 15 日合并至 `main`：

- 新增三名同学的校园关系面板、羁绊进度与直接交流入口。
- 新增四阶段高中路线，完善首页的游戏流程介绍。
- 将成就面板扩展为可查看全部 10 项目标的成长档案。
- 保留天空河流主题、行动场景、音乐、周末、补课、考试及存档系统。
- 同步 `frontend/` 与 `docs/`，页面资源缓存版本更新为 `v14`。
- 开发批注工具默认隐藏，在页面地址后添加 `?review=1` 可启用。
- 在 [docs/upstream/](docs/upstream/) 保留上游页面的独立静态快照，便于对照。

感谢 [@zhaangzee](https://github.com/zhaangzee) 在本次合并中对校园关系、成长路线和页面体验的贡献。

## 静态站点部署

`frontend/` 是本地体验与前端开发目录，`docs/` 是同步的静态部署目录。修改当前游戏时，应同步对应文件及资源引用。

本仓库目前尚未启用 GitHub Pages。如需部署，可由仓库管理员在 **Settings → Pages → Deploy from a branch** 中选择 `main` 分支的 `/docs` 目录。

部署后主站入口为站点根路径，上游快照位于 `/upstream/`。该快照用于对照，不是当前游戏主入口。

## 后端原型

后端版本为 `2.0.0`，使用 FastAPI、SQLAlchemy 2.0 异步模型和 SQLite，另提供 PostgreSQL、Redis 相关组件。

已有模块包括条件 DSL 与事件收益、考场策略和排位、NPC 送礼及关系阶段锁、结局矩阵、多周目遗产点、周末商业街与 SSE 毕业信。种子数据包含 15 个主线事件和 10 个成就；这些后端能力与当前独立前端的规则、数据不完全相同。

### 启动后端

需要 Python 3.10 或更高版本。在仓库根目录执行：

```powershell
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
python seed_database.py
uvicorn main:app --reload
```

启动后访问 <http://127.0.0.1:8000/docs> 查看接口文档。默认数据库为当前目录的 `game.db`；使用 PostgreSQL 时，参考 [.env.example](.env.example) 设置 `DATABASE_URL`。当前基础接口不会在启动时强制连接 Redis。

### 已开放接口

| 方法 | 路径 | 用途 |
|---|---|---|
| POST | `/exam/calculate_result` | 计算考场策略对应的成绩与校排名 |
| POST | `/social/send_gift` | NPC 送礼、好感变化与阶段锁 |
| POST | `/weekend/visit_location` | 周末商业街行动 |
| POST | `/ng_plus/start_new_game` | 使用遗产点选择天资并开始新周目 |
| GET | `/epilogue/stream_letter` | 通过 SSE 输出逐字毕业信 |

## 项目结构

| 路径 | 内容 |
|---|---|
| `frontend/index.html` | 当前游戏入口 |
| `frontend/game.js`、`frontend/game.css` | 当前游戏逻辑、状态与响应式界面 |
| `frontend/annotate.js`、`frontend/annotate.css` | 开发评审批注工具 |
| `docs/` | 与前端同步的静态部署目录 |
| `docs/upstream/` | 上游版本静态快照 |
| `main.py` | FastAPI 应用入口 |
| `database.py`、`models.py` | 异步数据库连接与模型 |
| `activity_engine.py` | 条件判断、事件权重与行动收益 |
| `exam_router.py`、`social_system.py` | 考试与社交接口 |
| `ending_system.py`、`ng_plus_router.py` | 结局与多周目逻辑 |
| `weekend_system.py`、`epilogue_sse.py` | 周末行动与毕业信 |
| `seed_database.py` | 主线事件与成就种子数据 |
| `tests/test_core.py` | 后端核心逻辑测试 |

仓库仍保留旧版 `app.js`、样式与音乐脚本；当前游戏首页加载的是 `game.js` 和 `game.css`。

## 参与贡献

欢迎通过 Issue 提出问题或提交 Pull Request。请说明修改内容与验证方式。

- 修改当前前端时，同步 `frontend/` 与 `docs/` 中的对应文件；`docs/upstream/` 作为对照快照单独维护。
- 前端改动应检查角色创建、日常行动、周末、考试、存档及桌面和手机布局。
- 后端核心逻辑可使用 `python -m unittest discover -s tests` 运行测试。
- 提交代码或素材前，请确认不包含个人存档、凭据或未获授权的资源。

## 当前边界与后续方向

当前没有账号、服务器存档、排行榜或真实院校录取数据库。高考成绩与事件效果属于游戏模拟，不能用于真实成绩预测。毕业信目前为确定性文本，尚未接入大模型；NPC 阶段契约任务与李强救赎线也有待继续完善。

可继续推进前后端接入、完整剧情、生产部署与院校志愿数据。音乐默认曲目引用 Kevin MacLeod 的 CC BY 4.0 授权资源；实际使用时请保留对应署名与许可信息。
