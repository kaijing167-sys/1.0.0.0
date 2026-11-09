/*
 * 青禾纪事 · 逻辑推理（专注学习第二种训练模式）
 * 5×5 数字顺序搜索：从 1 依次点到 25，越准越快收获越多。
 * 纯前端，不依赖后端。由 game.js 的 studyLogic() 通过
 *   window.LogicReasoningMinigame.start(label, onSettle, onExit)
 * 启动；onSettle(result) 结算属性收益（返回 gains），onExit() 关闭弹窗并触发周末流程。
 *
 * 棋盘生成（P1）：按 1→25 顺序贪心放置，每一步避开与前一数字的八邻域相邻，
 *   从而由构造保证“任意相邻/斜向相邻格不出现连续数字”；再以多候选取最低“杂乱度”惩罚，
 *   并按最近 100 局指纹去重（localStorage 持久化，刷新仍生效）。
 */
(function () {
  "use strict";

  /* ===== 配置 ===== */
  const SIDE = 5;
  const COUNT = SIDE * SIDE;            // 25
  const RECENT_KEY = "qinghe-logic-boards-v1";
  const RECENT_MAX = 100;               // 最近 100 局去重
  const CANDIDATES = 24;                // 每局生成多少候选取最优
  const FALLBACK = [1,12,23,8,19, 14,3,20,9,24, 21,6,15,2,17, 10,25,4,13,22, 7,18,11,16,5];

  /* ===== 运行态 ===== */
  let state = null;

  /* ===== 工具 ===== */
  function isNeighbor8(a, b) {
    if (a < 0 || b < 0) return false;
    const ar = Math.floor(a / SIDE), ac = a % SIDE;
    const br = Math.floor(b / SIDE), bc = b % SIDE;
    return Math.abs(ar - br) <= 1 && Math.abs(ac - bc) <= 1;
  }

  function shuffleInPlace(arr) {
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
  }

  function escapeText(s) {
    return String(s == null ? "" : s).replace(/[&<>"']/g, ch =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[ch]));
  }

  /* ===== 棋盘生成（纯函数，可单测）===== */
  // 按 1→25 顺序放置，每步避开与前一数字的八邻域相邻 => 构造保证无连续数字相邻
  function buildValidBoard(attempts) {
    attempts = attempts || 400;
    for (let a = 0; a < attempts; a++) {
      const board = new Array(COUNT).fill(0);
      const pos = new Array(COUNT + 1).fill(-1);
      let ok = true;
      for (let v = 1; v <= COUNT; v++) {
        const cands = [];
        for (let c = 0; c < COUNT; c++) {
          if (board[c] !== 0) continue;
          if (v > 1 && isNeighbor8(pos[v - 1], c)) continue;
          cands.push(c);
        }
        if (!cands.length) { ok = false; break; }
        const c = cands[Math.floor(Math.random() * cands.length)];
        board[c] = v; pos[v] = c;
      }
      if (ok) return board;
    }
    return null;
  }

  // 杂乱度惩罚：相邻（八邻域，去重）相差 2~3 计 1；行/列三连等差计 2、单调计 1
  function softPenalty(board) {
    let p = 0;
    const pairDirs = [[0, 1], [1, 0], [1, -1], [1, 1]];
    for (let r = 0; r < SIDE; r++) for (let c = 0; c < SIDE; c++) {
      const a = board[r * SIDE + c];
      for (const [dr, dc] of pairDirs) {
        const nr = r + dr, nc = c + dc;
        if (nr >= SIDE || nc >= SIDE) continue;
        const d = Math.abs(a - board[nr * SIDE + nc]);
        if (d === 2 || d === 3) p += 1;
      }
    }
    const triple = (x, y, z) => {
      if (y - x === z - y && y - x !== 0) return 2;
      if ((y > x && z > y) || (y < x && z < y)) return 1;
      return 0;
    };
    for (let r = 0; r < SIDE; r++)
      for (let c = 0; c < SIDE - 2; c++)
        p += triple(board[r * SIDE + c], board[r * SIDE + c + 1], board[r * SIDE + c + 2]);
    for (let c = 0; c < SIDE; c++)
      for (let r = 0; r < SIDE - 2; r++)
        p += triple(board[r * SIDE + c], board[(r + 1) * SIDE + c], board[(r + 2) * SIDE + c]);
    return p;
  }

  function getRecent() {
    try { const a = JSON.parse(localStorage.getItem(RECENT_KEY) || "[]"); return Array.isArray(a) ? a : []; }
    catch { return []; }
  }
  function pushRecent(fp) {
    const a = getRecent(); a.push(fp);
    while (a.length > RECENT_MAX) a.shift();
    try { localStorage.setItem(RECENT_KEY, JSON.stringify(a)); } catch { /* ignore */ }
  }

  // 生成一局：多候选取最低杂乱度且非近期重复；异常兜底
  function generateBoard() {
    const recent = new Set(getRecent());
    let best = null, bestPenalty = Infinity, bestFp = null;
    for (let i = 0; i < CANDIDATES; i++) {
      const b = buildValidBoard();
      if (!b) continue;
      const fp = b.join(",");
      const pen = softPenalty(b) + (recent.has(fp) ? 1e6 : 0);
      if (pen < bestPenalty) { bestPenalty = pen; best = b; bestFp = fp; }
    }
    if (!best) best = buildValidBoard(5000);
    if (!best) { best = FALLBACK.slice(); bestFp = best.join(","); }
    pushRecent(bestFp);
    return best;
  }

  // 校验棋盘是否满足硬规则（供测试）
  function isValidBoard(board) {
    if (!Array.isArray(board) || board.length !== COUNT) return false;
    const seen = new Set();
    for (const v of board) {
      if (!Number.isInteger(v) || v < 1 || v > COUNT || seen.has(v)) return false;
      seen.add(v);
    }
    for (let i = 0; i < COUNT; i++) {
      const r = Math.floor(i / SIDE), c = i % SIDE;
      for (let dr = -1; dr <= 1; dr++) for (let dc = -1; dc <= 1; dc++) {
        if (dr === 0 && dc === 0) continue;
        const nr = r + dr, nc = c + dc;
        if (nr < 0 || nr >= SIDE || nc < 0 || nc >= SIDE) continue;
        if (Math.abs(board[i] - board[nr * SIDE + nc]) === 1) return false;
      }
    }
    return true;
  }

  /* ===== 计分与评级（纯函数）===== */
  function scoreGame(seconds, mistakes) {
    const raw = 100 - Math.max(0, seconds - 25) * 0.9 - (mistakes || 0) * 5;
    return Math.max(0, Math.min(100, Math.round(raw * 100) / 100));
  }
  function ratingFor(score) {
    if (score >= 85) return "S";
    if (score >= 70) return "A";
    if (score >= 50) return "B";
    return "C";
  }

  /* ===== 渲染 ===== */
  function renderShell(label) {
    const board = state.board;
    openModal(`
      <div class="lr" id="lr">
        <div class="eyebrow">LOGIC · 逻辑推理</div>
        <h2>数字顺序搜索</h2>
        <p>${escapeText(label)} · 从 <b>1</b> 开始依次点完 1～25，相邻不能出现连续数字。点错会变红，不推进。</p>
        <div class="lr-hud">
          <span>目标 <b id="lr-target">1</b></span>
          <span>进度 <b id="lr-progress">0</b>/${COUNT}</span>
          <span>失误 <b id="lr-miss">0</b></span>
          <span class="lr-target">用时 <b id="lr-time">0.0s</b></span>
        </div>
        <div class="lr-grid" id="lr-grid">
          ${board.map((v, i) => `<button class="lr-cell" data-lr-cell="${i}">${v}</button>`).join("")}
        </div>
        <div class="lr-fb" id="lr-fb"></div>
      </div>
    `, false); // 非可关闭：结束前不能退出，避免免费获得收益
    renderGrid();
    startTimer();
  }

  function renderGrid() {
    const grid = document.getElementById("lr-grid");
    if (!grid) return;
    const cells = grid.querySelectorAll(".lr-cell");
    cells.forEach(cell => {
      const v = Number(cell.textContent);
      cell.classList.remove("lr-current", "lr-done", "lr-wrong", "lr-shake");
      if (v < state.target) cell.classList.add("lr-done");
      else if (v === state.target) cell.classList.add("lr-current");
    });
  }

  function updateHud() {
    const t = document.getElementById("lr-target");
    const p = document.getElementById("lr-progress");
    const m = document.getElementById("lr-miss");
    if (t) t.textContent = Math.min(state.target, COUNT);
    if (p) p.textContent = state.target - 1;
    if (m) m.textContent = state.mistakes;
  }

  function showFeedback(msg, ok) {
    const fb = document.getElementById("lr-fb");
    if (!fb) return;
    fb.textContent = msg;
    fb.className = "lr-fb " + (ok ? "lr-fb-ok" : "lr-fb-no");
  }

  function startTimer() {
    state.timerId = setInterval(() => {
      if (!state || state.finished) return;
      const sec = (performance.now() - state.startTime) / 1000;
      const el = document.getElementById("lr-time");
      if (el) el.textContent = sec.toFixed(1) + "s";
    }, 100);
  }

  /* ===== 作答 ===== */
  function onCellClick(cellIdx) {
    if (!state || state.finished || state.busy) return;
    const v = state.board[cellIdx];
    if (v < state.target) return; // 已完成，忽略
    if (v === state.target) {
      state.target++;
      updateHud();
      renderGrid();
      if (state.target > COUNT) win();
    } else {
      state.mistakes++;
      state.busy = true;
      updateHud();
      const cell = document.querySelector(`[data-lr-cell="${cellIdx}"]`);
      if (cell) {
        cell.classList.add("lr-wrong");
        void cell.offsetWidth;
        cell.classList.add("lr-shake");
      }
      showFeedback(`当前应点 ${state.target}，你点了 ${v}`, false);
      setTimeout(() => {
        if (cell) cell.classList.remove("lr-wrong", "lr-shake");
        if (state) state.busy = false;
      }, 450);
    }
  }

  /* ===== 结算 ===== */
  function win() {
    if (!state || state.finished) return;
    state.finished = true;
    if (state.timerId) clearInterval(state.timerId);
    const seconds = (performance.now() - state.startTime) / 1000;
    const score = scoreGame(seconds, state.mistakes);
    const rating = ratingFor(score);
    const result = { seconds: Math.round(seconds * 10) / 10, mistakes: state.mistakes, score, rating };
    let gains = {};
    if (typeof state.onSettle === "function") {
      const g = state.onSettle(result);
      if (g && typeof g === "object") gains = g;
    }
    showVictory(gains);
  }

  function showVictory(gains) {
    const root = document.getElementById("lr");
    if (!root) return;
    const g = gains || {};
    const gainLine = (label, val, suffix) => {
      if (val === undefined || val === null) return "";
      const num = (typeof val === "number") ? (val >= 0 ? "+" : "") + (Math.round(val * 100) / 100) : val;
      return `<div>${label} <b>${num}${suffix || ""}</b></div>`;
    };
    root.innerHTML = `
      <div class="eyebrow">LOGIC · 逻辑推理</div>
      <h2>全部点亮！</h2>
      <div class="lr-result">
        <div class="lr-result-rating">${g.rating || ratingFor(g.score || 0)}</div>
        <div class="lr-result-sub">用时 ${g.seconds != null ? g.seconds : "?"}s · 失误 ${g.mistakes != null ? g.mistakes : "?"} · 综合 ${g.score != null ? g.score : "?"} 分</div>
      </div>
      <div class="lr-gains">
        ${gainLine("学科 " + (g.subjectLabel || ""), g.subject, " 点")}
        ${gainLine("学力", g.insight)}
        ${gainLine("心态", g.mindset)}
        ${gainLine("体力", g.energy)}
        ${gainLine("压力", g.stress)}
        ${gainLine("心情", g.mood)}
      </div>
      <div class="dialog-footer"><button class="primary-button" data-lr-done>完成</button></div>
    `;
  }

  /* ===== 事件绑定 ===== */
  function bindHandlers() {
    const dlg = document.getElementById("game-dialog");
    if (!dlg || dlg._lrBound) return;
    dlg.addEventListener("click", onModalClick);
    dlg._lrBound = true;
  }

  function onModalClick(e) {
    if (!state) return;
    const cell = e.target.closest("[data-lr-cell]");
    if (cell && !state.finished) { onCellClick(Number(cell.dataset.lrCell)); return; }
    const done = e.target.closest("[data-lr-done]");
    if (done) {
      const onExit = state.onExit;
      state = null;
      if (typeof onExit === "function") onExit();
    }
  }

  /* ===== 入口 ===== */
  function start(label, onSettle, onExit) {
    if (state && !state.finished) return; // 已有进行中的小游戏，忽略重复启动
    state = {
      board: generateBoard(),
      target: 1,
      mistakes: 0,
      startTime: performance.now(),
      timerId: null,
      busy: false,
      finished: false,
      onSettle: onSettle,
      onExit: onExit,
    };
    bindHandlers();
    renderShell(label);
  }

  // 暴露接口与纯函数（便于单测与集成）
  window.LogicReasoningMinigame = {
    start: start,
    scoreGame: scoreGame,
    ratingFor: ratingFor,
    generateBoard: generateBoard,
    buildValidBoard: buildValidBoard,
    softPenalty: softPenalty,
    isValidBoard: isValidBoard,
  };
})();
