/*
 * exercise-minigame 单元测试（node 运行：node exercise-minigame.test.js）
 * 仅依赖模块暴露的纯函数 generateZone / judge，不触碰 DOM。
 */
const EM = require("./exercise-minigame.js");

let pass = 0, fail = 0;
function ok(name, cond) {
  if (cond) { pass++; console.log("  PASS  " + name); }
  else { fail++; console.log("  FAIL  " + name); }
}

console.log("== 判定区生成合法性 ==");
let zoneOk = true, bandOk = true, sepOk = true, prev = null;
const N = 100000;
for (let i = 0; i < N; i++) {
  const z = EM.generateZone(prev);
  if (z.center < -(90 - 20) || z.center > (90 - 20)) zoneOk = false;
  if (z.center - z.goodRadius < -90 || z.center + z.goodRadius > 90) bandOk = false;
  if (prev != null && Math.abs(z.center - prev) < 32 - 1e-6) sepOk = false;
  prev = z.center;
}
ok("center 落在 [-(90-GOOD_R), 90-GOOD_R] 内（" + N + " 次）", zoneOk);
ok("good 带不越量条边界（center±goodRadius ∈ [-90,90]）", bandOk);
ok("与上一轮中心间隔 >= MIN_SEPARATION(约32)", sepOk);

console.log("== 命中判定边界 ==");
const zone = { center: 0, excellentRadius: 8, goodRadius: 20 };
ok("judge(0) === excellent", EM.judge(0, zone) === "excellent");
ok("judge(8) === excellent（优边界内）", EM.judge(8, zone) === "excellent");
ok("judge(9) === good（优外良内）", EM.judge(9, zone) === "good");
ok("judge(20) === good（良边界）", EM.judge(20, zone) === "good");
ok("judge(21) === miss（界外）", EM.judge(21, zone) === "miss");
ok("judge(-15) === good（负向）", EM.judge(-15, zone) === "good");
ok("judge(-25) === miss（负向界外）", EM.judge(-25, zone) === "miss");

console.log("== 随机角度命中自洽 ==");
let selfOk = true;
for (let i = 0; i < 50000; i++) {
  const z = EM.generateZone(null);
  const a = (Math.random() * 180 - 90);
  const r = EM.judge(a, z);
  const d = Math.abs(a - z.center);
  if (r === "excellent" && d > z.excellentRadius) selfOk = false;
  if (r === "good" && (d > z.goodRadius || d <= z.excellentRadius)) selfOk = false;
  if (r === "miss" && d <= z.goodRadius) selfOk = false;
}
ok("随机角度下 judge 结果与距离自洽（50000 次）", selfOk);

console.log("\n结果：通过 " + pass + " / 失败 " + fail);
process.exit(fail === 0 ? 0 : 1);
