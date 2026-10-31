/*
 * 青禾纪事 · 课堂小测（专注学习限时小游戏）
 * 纯前端，不依赖后端。接入 game.js 的 settleStudy() 完成结算，复用现有 localStorage 存档。
 * 由 game.js 的 studySubject() 通过 window.StudyMinigame.start(subjectId, onComplete) 启动。
 */
(function () {
  "use strict";

  /* ===== 配置 ===== */
  const TOTAL_QUESTIONS = 10;     // 共 10 题
  const TOTAL_TIME_MS = 20000;    // 整局 20 秒限时
  const FEEDBACK_MS = 340;        // 作答后短暂反馈再进入下一题
  const MIN_VAL = 0, MAX_VAL = 20; // 题目与答案范围 0..20

  /* ===== 运行态 ===== */
  let state = null;

  /* ===== 工具 ===== */
  function randInt(min, max) { return Math.floor(Math.random() * (max - min + 1)) + min; }

  function shuffle(arr) {
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
  }

  // 近似标准正态（均值 0，范围约 -1..1）
  function gaussian() {
    return (Math.random() + Math.random() + Math.random() + Math.random() - 2) / 2;
  }

  /* ===== 题目生成 ===== */
  // 一道 20 以内加减法：加法结果 <=20；减法保证结果非负（0..20）。
  function makeQuestion() {
    const isAdd = Math.random() < 0.5;
    let a, b, answer, text;
    if (isAdd) {
      a = randInt(0, 19);
      b = randInt(0, MAX_VAL - a);   // 保证 a+b <= 20
      answer = a + b;
      text = a + " + " + b;
    } else {
      a = randInt(0, MAX_VAL);
      b = randInt(0, a);             // 保证 a-b >= 0
      answer = a - b;
      text = a + " − " + b;
    }
    return { text: text, answer: answer, options: makeOptions(answer) };
  }

  // 1 正确答案 + 3 干扰项：正态小偏移生成，限制 0..20，去重，
  // 并保证尽量落在不同区间（一个低于答案、一个高于答案、一个更远）。
  function makeOptions(answer) {
    const seen = new Set([answer]);
    const candidates = [];
    let spread = 3, guard = 0;
    while (candidates.length < 12 && guard < 500) {
      guard++;
      let v = answer + Math.round(gaussian() * spread);
      if (v < MIN_VAL) v = MIN_VAL;
      if (v > MAX_VAL) v = MAX_VAL;
      if (v === answer) { v += (v >= answer ? 1 : -1); if (v < MIN_VAL) v = MIN_VAL; if (v > MAX_VAL) v = MAX_VAL; }
      if (v === answer) { spread += 1; continue; }
      if (seen.has(v)) continue;
      seen.add(v);
      candidates.push(v);
    }
    // 兜底：正态偏移被边界压缩导致候选不足时，向两侧线性补齐
    let step = 1;
    while (candidates.length < 3) {
      const c = Math.max(MIN_VAL, Math.min(MAX_VAL, answer + (step % 2 === 0 ? step : -step)));
      if (c !== answer && !seen.has(c)) { seen.add(c); candidates.push(c); }
      step++;
      if (step > 20) break;
    }
    const below = candidates.filter(v => v < answer).sort((x, y) => y - x); // 近→远
    const above = candidates.filter(v => v > answer).sort((x, y) => x - y); // 近→远
    // 尽量保证落在不同区间：优先各取一个低于/高于答案的干扰项，再取剩余中离答案最远者补足 3 个
    const distractors = [];
    if (below.length) distractors.push(below[0]);
    if (above.length) distractors.push(above[0]);
    const remaining = candidates.filter(v => !distractors.includes(v))
      .sort((x, y) => Math.abs(y - answer) - Math.abs(x - answer));
    while (distractors.length < 3 && remaining.length) distractors.push(remaining.shift());
    return shuffle([answer].concat(distractors.slice(0, 3)));
  }

  /* ===== 渲染 ===== */
  function injectStyle() {
    if (document.getElementById("study-minigame-style")) return;
    const css = `
/* ===== 像素 skills 风（对齐 exercise-minigame）=====
   仅换视觉皮肤：题目数字/选项数值/计分逻辑一律不变。
   用 :has(.mg) 只在课堂小测弹出时覆盖弹窗皮肤，其他弹窗不受影响；不支持 :has 的浏览器回退原浅色卡片。 */
.mg{font-family:inherit}
/* 全屏容器：像素教室背景 + 暗化 + 扫描线 */
.game-dialog:has(.mg){
  background-image:linear-gradient(rgba(8,16,30,.66),rgba(8,16,30,.66)),url("assets/study-minigame-bg.png");
  background-size:cover,cover;background-position:center,center;
  backdrop-filter:none;
}
.game-dialog:has(.mg)::after{content:"";position:absolute;inset:0;pointer-events:none;
  background:repeating-linear-gradient(rgba(0,0,0,0) 0 2px,rgba(0,0,0,.10) 2px 3px);mix-blend-mode:multiply}
/* 卡片：方块描边 + 硬阴影 + 深色半透明，等宽清晰字体保证数字可读 */
.dialog-card:has(.mg){
  width:min(470px,100%);
  border:4px solid #6fd3c5;border-radius:0;
  background:rgba(16,26,44,.88);
  box-shadow:0 0 0 4px #0b1626,8px 8px 0 0 rgba(0,0,0,.45);
  padding:22px 22px 18px;
  color:#e8f6f2;
  image-rendering:pixelated;
  font-family:"Courier New",ui-monospace,"DejaVu Sans Mono",monospace;
}
.dialog-card:has(.mg) .eyebrow{color:#7fe0d2;font-weight:700}
.dialog-card:has(.mg) h2{font-family:inherit;font-size:19px;font-weight:700;color:#aef0e6;margin:2px 0 6px}
.dialog-card:has(.mg)>p{color:#9fc4c0;font-size:12px;line-height:1.6;margin:0}
.dialog-card:has(.mg) .dialog-close{color:#9fc4c0}
.dialog-card:has(.mg) .primary-button{border:3px solid #0b1626;border-radius:0;background:#2f8f86;color:#eafff9;
  padding:10px 24px;font-size:14px;font-weight:700;letter-spacing:1px;cursor:pointer;
  box-shadow:4px 4px 0 0 rgba(0,0,0,.45);font-family:inherit}
.dialog-card:has(.mg) .primary-button:hover{background:#3aa79c}
.dialog-card:has(.mg) .primary-button:active{transform:translate(2px,2px);box-shadow:2px 2px 0 0 rgba(0,0,0,.45)}
/* 小测内容区 */
.mg .mg-meta{display:flex;gap:14px;align-items:center;flex-wrap:wrap;margin:10px 0 12px;font-size:12px;color:#9fc4c0}
.mg .mg-meta b{color:#ffe27a;font-size:14px;font-variant-numeric:tabular-nums}
.mg .mg-time{margin-left:auto;font-variant-numeric:tabular-nums;color:#aef0e6;font-weight:700}
.mg .mg-bar{height:12px;border:3px solid #0b1626;background:#23424a;overflow:hidden;margin-bottom:18px;box-shadow:inset 0 0 0 1px rgba(111,211,197,.25)}
.mg .mg-bar>i{display:block;height:100%;width:100%;background:#ffd23f;transition:width .1s linear}
.mg .mg-prompt{text-align:center;font-family:inherit;font-size:40px;font-weight:700;color:#f2fffb;margin:8px 0 22px;letter-spacing:2px;text-shadow:3px 3px 0 #0b1626}
.mg .mg-opts{display:grid;grid-template-columns:1fr 1fr;gap:14px}
.mg .mg-opt{border:3px solid #6fd3c5;border-radius:0;background:#16324a;color:#eafff9;font-size:22px;font-weight:700;
  padding:18px 0;cursor:pointer;font-family:inherit;box-shadow:4px 4px 0 0 rgba(0,0,0,.45);
  transition:background .12s steps(2),border-color .12s steps(2)}
.mg .mg-opt:hover{background:#1d4260;border-color:#aef0e6}
.mg .mg-opt:active{transform:translate(2px,2px);box-shadow:2px 2px 0 0 rgba(0,0,0,.45)}
.mg .mg-opt:disabled{cursor:default;opacity:.92}
.mg .mg-opt.mg-right{background:#2f8f86;border-color:#ffd23f;color:#fff}
.mg .mg-opt.mg-wrong{background:#6b2a22;border-color:#ff7a6b;color:#ffd7d0}
.mg .mg-fb{text-align:center;min-height:20px;margin-top:16px;font-size:13px;font-weight:700;letter-spacing:1px}
.mg .mg-fb-ok{color:#ffd23f}
.mg .mg-fb-no{color:#ff7a6b}
.mg .mg-result{text-align:center;padding:14px 0 6px}
.mg .mg-result-num{font-family:inherit;font-size:58px;font-weight:700;color:#aef0e6;line-height:1;text-shadow:3px 3px 0 #0b1626}
.mg .mg-result-num small{font-size:20px;color:#9fc4c0;margin-left:6px}
.mg .mg-result-pct{margin-top:8px;font-size:14px;color:#aef0e6}
.mg .mg-result-sub{text-align:center;font-size:13px;color:#9fc4c0;margin:12px 0 0}
@media (max-width:560px){
  .dialog-card:has(.mg){padding:18px 16px 14px}
  .mg .mg-prompt{font-size:34px}
  .mg .mg-opt{font-size:20px;padding:16px 0}
}`;
    const style = document.createElement("style");
    style.id = "study-minigame-style";
    style.textContent = css;
    document.head.appendChild(style);
  }

  function renderShell(subjectLabel) {
    injectStyle();
    openModal(`
      <div class="mg" id="mg">
        <div class="eyebrow">QUIZ · 课堂小测</div>
        <h2>专注 20 秒 · 算出答案</h2>
        <p style="margin:0">${escapeText(subjectLabel)} · 10 道二十以内加减法，越快越准收获越多。</p>
        <div class="mg-meta">
          <span>第 <b id="mg-q">1</b>/${TOTAL_QUESTIONS} 题</span>
          <span>答对 <b id="mg-score">0</b></span>
          <span class="mg-time" id="mg-time">${(TOTAL_TIME_MS / 1000).toFixed(1)}s</span>
        </div>
        <div class="mg-bar"><i id="mg-bar"></i></div>
        <div class="mg-prompt" id="mg-prompt"></div>
        <div class="mg-opts" id="mg-opts"></div>
        <div class="mg-fb" id="mg-fb"></div>
      </div>
    `, false); // 非可关闭：锁定，不能中途退出
    renderQuestion();
  }

  function renderQuestion() {
    const q = state.questions[state.qIndex];
    const qEl = document.getElementById("mg-q");
    const pEl = document.getElementById("mg-prompt");
    const oEl = document.getElementById("mg-opts");
    const fbEl = document.getElementById("mg-fb");
    if (!q || !qEl || !pEl || !oEl) return;
    qEl.textContent = state.qIndex + 1;
    pEl.textContent = q.text + " = ?";
    oEl.innerHTML = q.options
      .map((o, i) => `<button class="mg-opt" data-mg-opt="${i}">${o}</button>`)
      .join("");
    if (fbEl) { fbEl.textContent = ""; fbEl.className = "mg-fb"; }
  }

  /* ===== 计时 ===== */
  function tick() {
    if (!state || state.finished) return;
    const elapsed = performance.now() - state.startTime;
    const left = Math.max(0, TOTAL_TIME_MS - elapsed);
    state.timeLeft = left;
    const bar = document.getElementById("mg-bar");
    const t = document.getElementById("mg-time");
    if (bar) bar.style.width = (left / TOTAL_TIME_MS * 100) + "%";
    if (t) t.textContent = (left / 1000).toFixed(1) + "s";
    if (left <= 0) { finish(); return; }
    state.timerId = requestAnimationFrame(tick);
  }

  /* ===== 作答 ===== */
  function onAnswer(optIndex) {
    if (!state || state.finished) return;
    const q = state.questions[state.qIndex];
    const chosen = q.options[optIndex];
    const isRight = chosen === q.answer;
    if (isRight) state.correct++;
    const scoreEl = document.getElementById("mg-score");
    if (scoreEl) scoreEl.textContent = state.correct;

    const optsEl = document.getElementById("mg-opts");
    if (optsEl) {
      const buttons = optsEl.querySelectorAll(".mg-opt");
      buttons.forEach(btn => {
        const val = q.options[Number(btn.dataset.mgOpt)];
        btn.disabled = true;
        if (val === q.answer) btn.classList.add("mg-right");
        else if (val === chosen) btn.classList.add("mg-wrong");
      });
    }
    const fb = document.getElementById("mg-fb");
    if (fb) {
      fb.textContent = isRight ? "答对啦 ✓" : ("答错了，正确答案是 " + q.answer);
      fb.className = "mg-fb " + (isRight ? "mg-fb-ok" : "mg-fb-no");
    }

    clearTimeout(state.fbTimer);
    state.fbTimer = setTimeout(() => {
      if (!state || state.finished) return;
      state.qIndex++;
      if (state.qIndex >= TOTAL_QUESTIONS) finish();
      else renderQuestion();
    }, FEEDBACK_MS);
  }

  /* ===== 结算 ===== */
  function finish() {
    if (!state || state.finished) return;
    state.finished = true;
    if (state.timerId) cancelAnimationFrame(state.timerId);
    clearTimeout(state.fbTimer);
    const correct = state.correct;
    const total = state.qIndex; // 已作答题数（超时则少于 10）
    showResult(correct, total);
  }

  function showResult(correct, total) {
    const acc = total > 0 ? correct / total : 0;
    const pct = Math.round(acc * 100);
    const root = document.getElementById("mg");
    if (!root) return;
    const comment = acc >= 0.8
      ? "专注而高效，状态不错！"
      : acc >= 0.5
        ? "稳扎稳打，继续保持。"
        : "有点分心，下次再来。";
    root.innerHTML = `
      <div class="eyebrow">QUIZ · 课堂小测</div>
      <h2>小测结束</h2>
      <div class="mg-result">
        <div class="mg-result-num">${correct}<small>/ ${total}</small></div>
        <div class="mg-result-pct">正确率 ${pct}%</div>
      </div>
      <p class="mg-result-sub">${comment}</p>
      <div class="dialog-footer"><button class="primary-button" data-mg-done>查看学习收获</button></div>
    `;
  }

  /* ===== 事件绑定 ===== */
  function bindHandlers() {
    const dlg = document.getElementById("game-dialog");
    if (!dlg || dlg._mgBound) return;
    dlg.addEventListener("click", onModalClick);
    dlg._mgBound = true;
  }

  function onModalClick(e) {
    if (!state) return;
    const optBtn = e.target.closest("[data-mg-opt]");
    if (optBtn && !state.finished) { onAnswer(Number(optBtn.dataset.mgOpt)); return; }
    const doneBtn = e.target.closest("[data-mg-done]");
    if (doneBtn) {
      const correct = state.correct, total = state.qIndex;
      closeModal(true);
      const cb = state.onComplete;
      state = null;
      if (typeof cb === "function") cb(correct, total);
    }
  }

  function escapeText(s) {
    return String(s == null ? "" : s).replace(/[&<>"']/g, ch =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[ch]));
  }

  /* ===== 入口 ===== */
  function start(subjectId, onComplete) {
    if (state && !state.finished) return; // 已有进行中的小测，忽略重复启动
    state = {
      subjectId: subjectId,
      onComplete: onComplete,
      qIndex: 0,
      correct: 0,
      questions: [],
      startTime: performance.now(),
      timeLeft: TOTAL_TIME_MS,
      timerId: null,
      fbTimer: null,
      finished: false,
    };
    for (let i = 0; i < TOTAL_QUESTIONS; i++) state.questions.push(makeQuestion());
    bindHandlers();
    renderShell(state.subjectId);
    tick();
  }

  window.StudyMinigame = { start: start };
})();
