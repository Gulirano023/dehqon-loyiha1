/**
 * riskEngine.js uchun unit testlar
 * Ishlatish: node tests/riskEngine.test.js
 */
"use strict";

const {
  getMoistureTip,
  getTemperatureTip,
  getPhTip,
  getNpkTip,
  getRiskLevel,
} = require("../riskEngine");

let passed = 0;
let failed = 0;

function assert(condition, message) {
  if (condition) {
    console.log(`  ✓ ${message}`);
    passed++;
  } else {
    console.error(`  ✗ ${message}`);
    failed++;
  }
}

function assertIncludes(str, substr, message) {
  assert(typeof str === "string" && str.includes(substr), message);
}

// ── getMoistureTip ──────────────────────────────────────────────────────────
console.log("\ngetMoistureTip:");
assertIncludes(getMoistureTip(10),  "juda past",   "10% → juda past");
assertIncludes(getMoistureTip(35),  "biroz past",  "35% → biroz past");
assertIncludes(getMoistureTip(55),  "me'yorida",   "55% → me'yorida");
assertIncludes(getMoistureTip(70),  "yuqoriroq",   "70% → yuqoriroq");
assertIncludes(getMoistureTip(80),  "juda nam",    "80% → juda nam");

// ── getTemperatureTip ───────────────────────────────────────────────────────
console.log("\ngetTemperatureTip:");
assertIncludes(getTemperatureTip(-2),  "Muzlash",  "-2°C → Muzlash xavfi");
assertIncludes(getTemperatureTip(3),   "Sovuq",    "3°C → Sovuq xavfi");
assertIncludes(getTemperatureTip(25),  "qulay",    "25°C → qulay");
assertIncludes(getTemperatureTip(38),  "38",       "38°C → Issiq stress");
assertIncludes(getTemperatureTip(41),  "40",       "41°C → Juda kuchli issiq");

// ── getPhTip ────────────────────────────────────────────────────────────────
console.log("\ngetPhTip:");
assertIncludes(getPhTip(4.5),  "kislotali",  "pH 4.5 → kislotali");
assertIncludes(getPhTip(6.5),  "qulay",      "pH 6.5 → qulay");
assertIncludes(getPhTip(8.2),  "ishqoriy",   "pH 8.2 → ishqoriy");
assert(getPhTip("") === null,              "bo'sh string → null");
assert(getPhTip(undefined) === null,       "undefined → null");
assert(getPhTip("noto'g'ri") === null,     "noto'g'ri matn → null");

// ── getNpkTip ───────────────────────────────────────────────────────────────
console.log("\getNpkTip:");
assertIncludes(getNpkTip("low"),    "past",      "low → past");
assertIncludes(getNpkTip("medium"), "me'yorida", "medium → me'yorida");
assertIncludes(getNpkTip("high"),   "yuqori",    "high → yuqori");
assert(getNpkTip("") === null,               "bo'sh string → null");
assert(getNpkTip(undefined) === null,        "undefined → null");

// ── getRiskLevel ────────────────────────────────────────────────────────────
console.log("\ngetRiskLevel:");

// Qulay sharoit → PAST
assertIncludes(getRiskLevel(25, 50, "bugdoy"), "PAST",   "25°C / 50% → PAST (bug'doy)");

// O'rtacha sharoit → O'RTA
assertIncludes(getRiskLevel(31, 60, "paxta"),  "O'RTA",  "31°C / 60% → O'RTA (paxta)");

// Juda og'ir umumiy sharoit → YUQORI
assertIncludes(getRiskLevel(35, 80, "pomidor"), "YUQORI", "35°C / 80% → YUQORI (pomidor)");

// Pomidorda Fitoftora sharoiti: 20°C, 78% namlik
assertIncludes(getRiskLevel(20, 78, "pomidor"), "Fitoftora", "20°C / 78% → Fitoftora (pomidor)");

// Bug'doyda Pas kasalligi: 18°C, 75%
assertIncludes(getRiskLevel(18, 75, "bugdoy"), "Zang", "18°C / 75% → Zang (bug'doy)");

// Ekin ko'rsatilmagan holat ham ishlashi kerak
assertIncludes(getRiskLevel(35, 80), "YUQORI", "crop ko'rsatilmagan → YUQORI");
assertIncludes(getRiskLevel(20, 50), "PAST",   "crop ko'rsatilmagan, qulay → PAST");

// ── Yakuniy natija ──────────────────────────────────────────────────────────
console.log(`\nNatija: ${passed} o'tdi, ${failed} muvaffaqiyatsiz\n`);
if (failed > 0) process.exit(1);
