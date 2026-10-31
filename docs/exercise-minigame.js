/*
 * 青禾纪事 · 运动锻炼（节奏训练小游戏原型）
 * 纯前端，自包含：自带全屏 overlay，不依赖 game.js，可在独立 demo 页直接试玩。
 * 由 game.js 后续通过 window.ExerciseMinigame.start(onComplete) 接入「运动锻炼」入口。
 *
 * 玩法：半圆形量条上指针按正弦曲线来回摆动；量条随机生成判定区（中心窄=优，两侧宽=良）。
 * 指针进入判定区时点击：命中中心=优(100)、命中边缘=良(60)、错失=失败(0)。
 * 单局约 20 秒（以时间为主要结束条件，不再按次数提前结束），最多 20 次判定（安全上限）。
 * 摆速阶梯形加快：开头最慢，每完成 5 次判定提速约 200ms，有安全下限（MIN_PERIOD_MS）不会无限加快。
 */
(function () {
  "use strict";

  /* ===== 配置 ===== */
  const CX = 150, CY = 150, R = 120;     // SVG 半圆几何
  const AMP_DEG = 86;                    // 指针摆幅（±86°，留边避免越界）
  const BASE_PERIOD_MS = 4400;           // 开头最慢（再降一档 / +400ms）
  const STEP_PERIOD_MS = 200;            // 每次提速减少的周期（指针变快 200ms）
  const SPEEDUP_EVERY = 5;               // 每完成 5 次判定提速一次
  const MIN_PERIOD_MS = 3000;            // 安全下限（实际最多到第 4 次提速→3600ms，远未触及）
  const TOTAL_TIME_MS = 20000;           // 单局约 20 秒（以时间为结束主条件）
  const MAX_ATTEMPTS = 20;               // 最多 20 次判定（安全上限，正常先于时间结束前达不到）
  const EXCELLENT_R = 8;                 // 中心窄区（优）半径（度）
  const GOOD_R = 20;                     // 中心两侧宽区（良）半径（度）
  const CENTER_MIN = -(90 - GOOD_R);     // 判定区中心范围下限，保证 good 带不越界
  const CENTER_MAX = (90 - GOOD_R);      // 上限
  const MIN_SEPARATION = GOOD_R + 12;    // 与上一轮中心的最小间隔，避免完全重叠
  const PREROLL_MS = 800;                // 开局准备（指针摆动但不计判定）
  const FEEDBACK_MS = 320;               // 反馈动画时长
  const CLICK_LOCK_MS = 110;             // 防同一动作重复触发
  const VERSION = "1.0.0";

  let state = null;

  /* ===== 工具 ===== */
  function randInt(min, max) { return Math.floor(Math.random() * (max - min + 1)) + min; }
  function clamp(v, lo, hi) { return Math.max(lo, Math.min(hi, v)); }

  // 角度（0=正上方，+向右，-向左）转成 SVG 坐标
  function pointOnArc(deg, r) {
    const rad = deg * Math.PI / 180;
    return { x: CX + r * Math.sin(rad), y: CY - r * Math.cos(rad) };
  }
  function polyline(degFrom, degTo, r, step) {
    step = step || 1;
    const pts = [];
    for (let d = degFrom; d <= degTo + 1e-6; d += step) {
      const p = pointOnArc(d, r);
      pts.push(p.x.toFixed(1) + "," + p.y.toFixed(1));
    }
    return pts.join(" ");
  }

  /* ===== 判定区生成（纯函数，可单测） ===== */
  // 返回 { center, excellentRadius, goodRadius }；center 落在 [-CENTER_MIN..CENTER_MAX]，
  // 且与上一轮 prevCenter 至少间隔 MIN_SEPARATION（避免完全重叠）。
  function generateZone(prevCenter) {
    let center, guard = 0;
    do {
      center = randInt(CENTER_MIN, CENTER_MAX);
      guard++;
    } while (prevCenter != null && Math.abs(center - prevCenter) < MIN_SEPARATION && guard < 300);
    return { center: center, excellentRadius: EXCELLENT_R, goodRadius: GOOD_R };
  }

  /* ===== 命中判定（纯函数，可单测） ===== */
  function judge(pointerAngle, zone) {
    const d = Math.abs(pointerAngle - zone.center);
    if (d <= zone.excellentRadius) return "excellent";
    if (d <= zone.goodRadius) return "good";
    return "miss";
  }

  /* ===== 浏览器自检（可在 demo 页点击运行） ===== */
  function runSelfTest() {
    const out = { passed: 0, failed: 0, cases: [] };
    function ok(name, cond) {
      if (cond) { out.passed++; out.cases.push("PASS " + name); }
      else { out.failed++; out.cases.push("FAIL " + name); }
    }
    // 1) 判定区生成合法性
    let zoneOk = true, bandOk = true, sepOk = true;
    let prev = null;
    for (let i = 0; i < 5000; i++) {
      const z = generateZone(prev);
      if (z.center < CENTER_MIN || z.center > CENTER_MAX) zoneOk = false;
      if (z.center - z.goodRadius < -90 || z.center + z.goodRadius > 90) bandOk = false;
      if (prev != null && Math.abs(z.center - prev) < MIN_SEPARATION - 1e-6) sepOk = false;
      prev = z.center;
    }
    ok("generateZone: center 在 [-" + (-CENTER_MIN) + "," + CENTER_MAX + "] 内", zoneOk);
    ok("generateZone: good 带不越量条边界", bandOk);
    ok("generateZone: 与上一轮间隔 >= MIN_SEPARATION", sepOk);
    // 2) 命中判定边界
    const zone = { center: 0, excellentRadius: EXCELLENT_R, goodRadius: GOOD_R };
    ok("judge(0)=excellent", judge(0, zone) === "excellent");
    ok("judge(8)=excellent (边界内)", judge(8, zone) === "excellent");
    ok("judge(9)=good (优外良内)", judge(9, zone) === "good");
    ok("judge(20)=good (良边界)", judge(20, zone) === "good");
    ok("judge(21)=miss (界外)", judge(21, zone) === "miss");
    ok("judge(-15)=good (负向)", judge(-15, zone) === "good");
    ok("judge(-25)=miss (负向界外)", judge(-25, zone) === "miss");
    return out;
  }

  /* ===== DOM 构建 ===== */
  function buildOverlay() {
    const root = document.createElement("div");
    root.className = "emg-overlay";
    root.id = "emg-overlay";
    root.innerHTML = `
      <div class="emg-card" id="emg-card">
        <div class="emg-eyebrow">EXERCISE · 运动锻炼</div>
        <h2 class="emg-title">节奏训练 · 看准时机出手</h2>
        <p class="emg-desc">指针进入判定区时点击。命中心区得「优」，命中边缘得「良」，错失记失败。</p>
        <div class="emg-meta">
          <span>第 <b id="emg-att">0</b>/${MAX_ATTEMPTS} 次</span>
          <span>优 <b id="emg-exc">0</b> · 良 <b id="emg-gd">0</b> · 失 <b id="emg-ms">0</b></span>
          <span class="emg-time" id="emg-time">${(TOTAL_TIME_MS / 1000).toFixed(1)}s</span>
        </div>
        <div class="emg-stage" id="emg-stage">
          <svg viewBox="0 0 300 180" class="emg-svg" id="emg-svg" shape-rendering="crispEdges" aria-hidden="true">
            <polyline class="emg-gauge" points="${polyline(-90, 90, R)}"></polyline>
            <polyline class="emg-rim" points="${polyline(-90, 90, R + 13)}"></polyline>
            <polyline class="emg-rim" points="${polyline(-90, 90, R - 13)}"></polyline>
            <polyline class="emg-zone-good" id="emg-zone-good" points=""></polyline>
            <polyline class="emg-zone-exc" id="emg-zone-exc" points=""></polyline>
            <line class="emg-pointer" id="emg-pointer" x1="${CX}" y1="${CY}" x2="${CX}" y2="${CY - R}"></line>
            <rect class="emg-head" id="emg-head" x="${CX - 4}" y="${CY - R - 4}" width="8" height="8"></rect>
            <rect class="emg-hub" x="${CX - 8}" y="${CY - 8}" width="16" height="16"></rect>
          </svg>
          <div class="emg-hint" id="emg-hint">准备…</div>
        </div>
        <div class="emg-fb" id="emg-fb"></div>
        <div class="emg-sub" id="emg-sub"></div>
      </div>`;
    document.body.appendChild(root);
    document.body.classList.add("emg-lock");
    return {
      root: root,
      card: root.querySelector("#emg-card"),
      stage: root.querySelector("#emg-stage"),
      zoneGood: root.querySelector("#emg-zone-good"),
      zoneExc: root.querySelector("#emg-zone-exc"),
      pointer: root.querySelector("#emg-pointer"),
      head: root.querySelector("#emg-head"),
      sub: root.querySelector("#emg-sub"),
      att: root.querySelector("#emg-att"),
      exc: root.querySelector("#emg-exc"),
      gd: root.querySelector("#emg-gd"),
      ms: root.querySelector("#emg-ms"),
      time: root.querySelector("#emg-time"),
      hint: root.querySelector("#emg-hint"),
      fb: root.querySelector("#emg-fb"),
    };
  }

  function renderZone(ui, zone) {
    ui.zoneGood.setAttribute("points", polyline(zone.center - zone.goodRadius, zone.center + zone.goodRadius, R));
    ui.zoneExc.setAttribute("points", polyline(zone.center - zone.excellentRadius, zone.center + zone.excellentRadius, R));
  }

  function updatePointer(ui, deg) {
    const tip = pointOnArc(deg, R);
    ui.pointer.setAttribute("x2", tip.x.toFixed(1));
    ui.pointer.setAttribute("y2", tip.y.toFixed(1));
    ui.head.setAttribute("x", (tip.x - 4).toFixed(1));
    ui.head.setAttribute("y", (tip.y - 4).toFixed(1));
  }

  function updateTime(ui, leftMs) {
    ui.time.textContent = (leftMs / 1000).toFixed(1) + "s";
  }

  function flash(ui, kind) {
    if (kind === "excellent") {
      ui.zoneExc.classList.add("hit-exc");
      ui.stage.classList.add("flash-gold");
      setTimeout(() => { ui.zoneExc.classList.remove("hit-exc"); ui.stage.classList.remove("flash-gold"); }, FEEDBACK_MS);
    } else if (kind === "good") {
      ui.zoneGood.classList.add("hit-good");
      ui.stage.classList.add("flash-blue");
      setTimeout(() => { ui.zoneGood.classList.remove("hit-good"); ui.stage.classList.remove("flash-blue"); }, FEEDBACK_MS);
    } else {
      ui.card.classList.add("shake");
      setTimeout(() => ui.card.classList.remove("shake"), FEEDBACK_MS);
    }
  }

  function setFeedback(ui, text, cls) {
    ui.fb.textContent = text;
    ui.fb.className = "emg-fb " + (cls || "");
  }

  function setSubtitle(ui, text, cls) {
    ui.sub.textContent = text;
    ui.sub.className = "emg-sub " + (cls || "");
  }

  // 微振动反馈（移动端生效；桌面端静默失败也无妨）
  function vibrate(ms) {
    try { if (navigator.vibrate) navigator.vibrate(ms); } catch (e) {}
  }

  /* ===== 动画循环 ===== */
  function frame() {
    if (!state || state.finished) return;
    const now = performance.now();
    if (state.pausedAt != null) { state.rafId = requestAnimationFrame(frame); return; }

    // 准备阶段：仅摆动指针，不计判定/计时（相位连续，不重置，避免开局跳变）
    if (state.phase === "ready") {
      const elapsed = now - state.startTime;
      advancePointer(now);
      if (elapsed >= PREROLL_MS) {
        state.phase = "playing";
        state.ui.hint.textContent = "点击屏幕 / 按空格 判定";
      }
      state.rafId = requestAnimationFrame(frame);
      return;
    }

    // 进行阶段：摆速随进程由慢渐快（有上限），时间到则结算
    advancePointer(now);
    const left = Math.max(0, TOTAL_TIME_MS - (now - state.playBase));
    updateTime(state.ui, left);
    if (left <= 0) { settle(); return; }

    state.rafId = requestAnimationFrame(frame);
  }

  // 按当前判定次数推进指针相位：阶梯形提速（每 SPEEDUP_EVERY 次判定快 STEP_PERIOD_MS），
  // 相位连续累积，提速瞬间不跳变。
  function currentPeriod(attempts) {
    const steps = Math.floor(attempts / SPEEDUP_EVERY);
    return Math.max(MIN_PERIOD_MS, BASE_PERIOD_MS - STEP_PERIOD_MS * steps);
  }
  function advancePointer(now) {
    const dt = clampDt(now - state.lastFrame);
    state.lastFrame = now;
    const omega = 2 * Math.PI / (currentPeriod(state.attempts) / 1000);
    state.phaseAngle += omega * dt;
    const ang = AMP_DEG * Math.sin(state.phaseAngle);
    state.pointerAngle = ang;
    updatePointer(state.ui, ang);
  }

  function clampDt(raw) {
    if (!isFinite(raw) || raw < 0) return 0;
    if (raw > 0.05) return 0.05; // 防止切后台/卡顿造成指针大跳变
    return raw;
  }

  /* ===== 点击/触摸/空格 判定 ===== */
  function trigger() {
    if (!state || state.finished || state.phase !== "playing") return;
    if (state.pausedAt != null) return;
    const now = performance.now();
    if (now - state.lastTrigger < CLICK_LOCK_MS) return;
    state.lastTrigger = now;

    const result = judge(state.pointerAngle, state.zone);
    if (result === "excellent") {
      state.excellent++;
      setFeedback(state.ui, "优！", "emg-fb-gold");
      setSubtitle(state.ui, "正中靶心 ✦", "emg-sub-gold");
      vibrate(25);
    } else if (result === "good") {
      state.good++;
      setFeedback(state.ui, "良！", "emg-fb-blue");
      setSubtitle(state.ui, "踩准节奏 ✓", "emg-sub-blue");
      vibrate(20);
    } else {
      state.miss++;
      setFeedback(state.ui, "失败", "emg-fb-red");
      setSubtitle(state.ui, "", "");
      vibrate(45);
    }
    flash(state.ui, result);

    state.attempts++;
    state.ui.att.textContent = state.attempts;
    state.ui.exc.textContent = state.excellent;
    state.ui.gd.textContent = state.good;
    state.ui.ms.textContent = state.miss;

    if (state.attempts >= MAX_ATTEMPTS) { settle(); return; }

    // 生成下一轮判定区（随机位置，避免与上一轮重叠），指针继续摆动
    state.zone = generateZone(state.zone.center);
    renderZone(state.ui, state.zone);
  }

  /* ===== 结算 ===== */
  function settle() {
    if (!state || state.finished) return;
    state.finished = true;
    if (state.rafId) cancelAnimationFrame(state.rafId);
    const attempts = state.attempts;
    const score = state.excellent * 100 + state.good * 60; // 失败 0 分
    const average = attempts > 0 ? Math.round(score / attempts) : 0;
    const result = {
      attempts: attempts,
      excellent: state.excellent,
      good: state.good,
      miss: state.miss,
      score: score,
      average: average,
    };
    state.result = result;
    showResult(result);
  }

  function showResult(result) {
    const ui = state.ui;
    const comment = result.average >= 80
      ? "节奏感拉满，运动效果事半功倍！"
      : result.average >= 60
        ? "稳扎稳打，身体轻松了不少。"
        : "有点不在状态，下次再战。";
    ui.card.innerHTML = `
      <div class="emg-eyebrow">EXERCISE · 训练结算</div>
      <h2 class="emg-title">本次训练完成</h2>
      <div class="emg-result">
        <div class="emg-result-num">${result.average}<small> 平均分</small></div>
        <div class="emg-result-row">优 ${result.excellent} · 良 ${result.good} · 失 ${result.miss} · 共 ${result.attempts} 次</div>
        <div class="emg-result-sub">${comment}</div>
      </div>
      <div class="emg-footer"><button class="emg-btn" id="emg-done">完成</button></div>`;
    const doneBtn = ui.card.querySelector("#emg-done");
    if (doneBtn) doneBtn.addEventListener("click", done);
  }

  /* ===== 结束并回调 ===== */
  function done() {
    if (!state) return;
    const cb = state.onComplete;
    const result = state.result;
    const root = state.ui.root;
    cleanupListeners();
    if (root && root.parentNode) root.parentNode.removeChild(root);
    document.body.classList.remove("emg-lock");
    state = null;
    if (typeof cb === "function") cb(result);
  }

  /* ===== 事件绑定（窗口级，结束时清理） ===== */
  function onPointerDown(e) { e.preventDefault(); trigger(); }
  function onKeyDown(e) {
    if (e.code === "Space" || e.key === " ") { e.preventDefault(); trigger(); }
  }
  function onBlur() { if (state && !state.finished && state.pausedAt == null) state.pausedAt = performance.now(); }
  function onFocus() {
    if (state && state.pausedAt != null) {
      const delta = performance.now() - state.pausedAt;
      state.startTime += delta;
      state.playBase += delta;
      state.lastFrame = performance.now();
      state.pausedAt = null;
    }
  }
  function cleanupListeners() {
    window.removeEventListener("keydown", onKeyDown);
    window.removeEventListener("blur", onBlur);
    window.removeEventListener("focus", onFocus);
    if (state && state.ui && state.ui.stage) state.ui.stage.removeEventListener("pointerdown", onPointerDown);
  }

  /* ===== 入口 ===== */
  function start(onComplete) {
    if (state && !state.finished) return; // 已有进行中的小游戏，忽略重复启动
    // 预加载像素背景，避免首帧背景图“弹出”造成开局卡顿
    const bg = new Image();
    let launched = false;
    const launch = function () { if (launched) return; launched = true; launchGame(onComplete); };
    bg.onload = launch;
    bg.onerror = launch;
    bg.src = "assets/exercise-minigame-bg.png";
    setTimeout(launch, 300); // 兜底：背景加载慢也直接进
  }

  function launchGame(onComplete) {
    const ui = buildOverlay();
    ui.stage.addEventListener("pointerdown", onPointerDown);
    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("blur", onBlur);
    window.addEventListener("focus", onFocus);

    const now = performance.now();
    state = {
      ui: ui,
      onComplete: typeof onComplete === "function" ? onComplete : null,
      phase: "ready",
      startTime: now,
      playBase: now + PREROLL_MS,   // 计时起点（准备结束后）
      pausedAt: null,
      phaseAngle: 0,                // 指针相位（连续累积，避免 ready→playing 跳变）
      pointerAngle: 0,
      lastFrame: now,
      zone: generateZone(null),
      attempts: 0,
      excellent: 0,
      good: 0,
      miss: 0,
      lastTrigger: 0,
      rafId: null,
      finished: false,
      result: null,
    };
    renderZone(ui, state.zone);
    updatePointer(ui, 0);
    setFeedback(ui, "", "");
    ui.hint.textContent = "准备…";
    state.rafId = requestAnimationFrame(frame);
  }

  const api = {
    start: start,
    generateZone: generateZone,
    judge: judge,
    runSelfTest: runSelfTest,
    VERSION: VERSION,
  };
  if (typeof module !== "undefined" && module.exports) module.exports = api;
  if (typeof window !== "undefined") window.ExerciseMinigame = api;
})();
