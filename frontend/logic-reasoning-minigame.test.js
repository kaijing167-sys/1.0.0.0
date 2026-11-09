/*
 * 逻辑推理小游戏 · 单元测试（Node，无需浏览器）
 * 覆盖 P1 棋盘生成器、计分/评级纯函数，以及 P4 属性结算（直接调用 game.js 的 settleLogic）。
 * 运行：node frontend/logic-reasoning-minigame.test.js
 *
 * 说明：game.js 中的 let/const/function 处于脚本词法作用域，不会挂到 vm 的全局对象上，
 * 因此断言代码必须以同一段脚本执行（通过函数源码内联），才能访问 initialState / settleLogic / ratingFor / game 等。
 */
const fs = require("fs");
const vm = require("vm");
const path = require("path");

const ROOT = path.resolve(__dirname);
const logicCode = fs.readFileSync(path.join(ROOT, "logic-reasoning-minigame.js"), "utf8");
const gameCode = fs.readFileSync(path.join(ROOT, "game.js"), "utf8");
const rosterCode = fs.readFileSync(path.join(ROOT, "roster.js"), "utf8");

/* ===== 断言逻辑（源码会被内联进同一 vm 脚本，可直接引用 game.js 的词法绑定） ===== */
function assertions() {
  let failures = 0;
  function assert(cond, msg) {
    if (cond) console.log("  ✓ " + msg);
    else { console.log("  ✗ " + msg); failures++; }
  }
  function approx(a, b, tol) { return Math.abs(a - b) <= (tol || 0.05); }
  const LR = LogicReasoningMinigame;
  assert(!!LR && typeof LR.start === "function", "LogicReasoningMinigame 已暴露");

  /* ===== P1 棋盘生成器 ===== */
  console.log("\n[P1] 棋盘生成器");
  const N = 1500;
  let allValid = true, fps = new Set(), collision = 0;
  for (let i = 0; i < N; i++) {
    const b = LR.generateBoard();
    if (!LR.isValidBoard(b)) { allValid = false; break; }
    const fp = b.join(",");
    if (fps.has(fp)) collision++;
    fps.add(fp);
  }
  assert(allValid, "连续生成 " + N + " 局全部有效（1~25 唯一、无连续数字相邻）");
  assert(collision === 0, "连续生成 " + N + " 局指纹全部不同（近期去重生效）");

  let hardViolations = 0;
  for (let i = 0; i < 300; i++) { if (!LR.isValidBoard(LR.buildValidBoard())) hardViolations++; }
  assert(hardViolations === 0, "buildValidBoard ×300 全部满足硬规则");

  const bSorted = [1,2,3,4,5, 6,7,8,9,10, 11,12,13,14,15, 16,17,18,19,20, 21,22,23,24,25];
  assert(LR.softPenalty(bSorted) > LR.softPenalty(LR.generateBoard()), "顺排棋盘杂乱度惩罚高于随机生成盘");

  /* ===== 计分与评级 ===== */
  console.log("\n[计分] scoreGame / ratingFor");
  assert(LR.scoreGame(25, 0) === 100, "25s/0失误 => 100");
  assert(approx(LR.scoreGame(35, 0), 91, 0.001), "35s/0失误 => 100-10*0.9=91");
  assert(approx(LR.scoreGame(25, 10), 50, 0.001), "25s/10失误 => 100-50=50");
  assert(LR.scoreGame(200, 0) === 0, "超时严重封底 0");
  assert(approx(LR.scoreGame(25, 20), 0, 0.001), "失误过多封底 0");
  assert(ratingFor(100) === "S" && ratingFor(85) === "S", "S: 85~100");
  assert(ratingFor(84) === "A" && ratingFor(70) === "A", "A: 70~84");
  assert(ratingFor(69) === "B" && ratingFor(50) === "B", "B: 50~69");
  assert(ratingFor(49) === "C" && ratingFor(0) === "C", "C: 0~49");

  /* ===== P4 属性结算（直接调用 game.js 的 settleLogic） ===== */
  console.log("\n[P4] settleLogic 属性结算");
  function freshGame() {
    game = initialState("测试", PRESETS.balanced, "high1", "science");
    game.actionPoints = 3;
  }
  freshGame();
  let r1 = settleLogic("math", { seconds: 30, mistakes: 0, score: 100, rating: "S" });
  assert(game.actionPoints === 2, "消耗 1 行动点（3→2）");
  assert(approx(r1.subject, 0.80, 0.1), "学科成长 ≈ 0.80（实得 " + r1.subject + "）");
  assert(approx(r1.insight, 0.15, 0.001), "学力 +0.15（实得 " + r1.insight + "）");
  assert(approx(r1.mindset, 0.15, 0.001), "心态 +0.15（实得 " + r1.mindset + "）");
  assert(r1.energy === -4, "体力 -4（实得 " + r1.energy + "）");
  assert(r1.stress === -2, "压力 -2（实得 " + r1.stress + "）");
  assert(r1.mood === 8, "心情 +8（实得 " + r1.mood + "）");

  freshGame();
  let r2 = settleLogic("math", { seconds: 10, mistakes: 20, score: 0, rating: "C" });
  assert(approx(r2.subject, 0.30, 0.1), "低分学科成长 ≈ 0.30（实得 " + r2.subject + "）");
  assert(approx(r2.insight, 0.05, 0.001), "学力 +0.05（实得 " + r2.insight + "）");
  assert(r2.energy === -8, "体力 -8（实得 " + r2.energy + "）");
  assert(r2.stress === 6, "压力 +6（实得 " + r2.stress + "）");
  assert(r2.mood === 0, "心情 +0（实得 " + r2.mood + "）");

  freshGame();
  game.actionPoints = 1; // 首次结算后行动点归零，二次调用应被守卫拦截
  let r3a = settleLogic("math", { seconds: 30, mistakes: 0, score: 100, rating: "S" });
  let r3b = settleLogic("math", { seconds: 30, mistakes: 0, score: 100, rating: "S" });
  assert(r3a !== null && r3b === null, "行动点归零后重复结算被拦截（第二次返回 null）");
  assert(game.actionPoints === 0, "重复结算未二次扣行动点");

  console.log("\n==== " + (failures === 0 ? "全部通过 ✅" : failures + " 项失败 ❌") + " ====");
  globalThis.__failures = failures;
}

/* ===== 浏览器环境 stub ===== */
function makeEl() {
  return {
    innerHTML: "", hidden: false, textContent: "", value: "",
    classList: { add() {}, remove() {}, toggle() {}, contains() { return false; } },
    style: {}, dataset: {},
    setAttribute() {}, getAttribute() { return null; }, focus() {}, appendChild() {}, removeChild() {},
    querySelector: () => makeEl(), querySelectorAll: () => [], addEventListener() {},
  };
}
const store = new Map();
const sandbox = {
  console,
  document: {
    body: { classList: { add() {}, remove() {}, toggle() {} } },
    head: makeEl(), querySelector: () => makeEl(), getElementById: () => makeEl(),
    createElement: () => makeEl(), addEventListener: () => {},
  },
  location: { hostname: "localhost", hash: "" },
  crypto: { randomUUID: () => "u-" + Math.random().toString(36).slice(2) },
  localStorage: {
    getItem: k => (store.has(k) ? store.get(k) : null),
    setItem: (k, v) => store.set(k, String(v)), removeItem: k => store.delete(k),
  },
  performance: { now: () => Date.now() },
  setInterval: () => 0, clearInterval: () => {},
  requestAnimationFrame: () => 0, cancelAnimationFrame: () => {},
  setTimeout, clearTimeout, Promise, Math, JSON, Date, Object, Array, Number, String, Boolean,
  isNaN, parseInt, parseFloat, Error, RegExp,
  Audio: function () { return { play() {}, pause() {}, load() {}, loop: false, volume: 0, src: "" }; },
};
sandbox.window = sandbox;
sandbox.globalThis = sandbox;
vm.createContext(sandbox);

const full = logicCode + "\n" + gameCode + "\n" + rosterCode + "\n;(function(){\n" + assertions.toString() + "\nassertions();\n})();";
try {
  vm.runInContext(full, sandbox, { filename: "bundle.js" });
} catch (e) {
  console.error("运行失败:", e.message);
  console.error(e.stack.split("\n").slice(0, 6).join("\n"));
  process.exit(1);
}
process.exit(sandbox.__failures ? sandbox.__failures : 0);
