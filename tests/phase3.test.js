/**
 * 3-bosqich modullari: diseaseHistory, irrigationSchedule, alertEngine
 * Ishlatish: node tests/phase3.test.js
 */
"use strict";

const { getCalibratedRisk, getMonthlyTrend, seasonalMultipliers } = require("../diseaseHistory");
const { generateIrrigationSchedule, calcET0, cropKc }            = require("../irrigationSchedule");
const { getPriceAlert, getDiseaseAlert, getAllPriceAlerts }       = require("../alertEngine");

let passed = 0, failed = 0;
function assert(cond, msg) {
  if (cond) { console.log(`  ✓ ${msg}`); passed++; }
  else       { console.error(`  ✗ ${msg}`); failed++; }
}
function assertIncludes(str, sub, msg) { assert(typeof str === "string" && str.includes(sub), msg); }

// ── diseaseHistory ─────────────────────────────────────────────────────────
console.log("\ndiseaseHistory — seasonalMultipliers:");
const crops = ["bugdoy","paxta","pomidor","bodring","uzum","kartoshka","piyoz"];
for (const c of crops) {
  assert(c in seasonalMultipliers, `${c}: multiplier mavjud`);
  assert(seasonalMultipliers[c].length === 12, `${c}: 12 oy`);
  assert(seasonalMultipliers[c].every((v) => v > 0), `${c}: barcha multiplierlar musbat`);
}

console.log("\ndiseaseHistory — getCalibratedRisk:");
const cr1 = getCalibratedRisk("pomidor","Kasallik xavfi: YUQORI", 35, 80);
assert(typeof cr1.level === "string",      "level string");
assert(typeof cr1.score === "number",      "score raqam");
assert(cr1.score >= 1 && cr1.score <= 3,   "score 1–3 oraliq");
assert(typeof cr1.confidence === "number", "confidence raqam");
assert(cr1.confidence >= 0,               "confidence >= 0");
assert(["YUQORI","O'RTA","PAST"].includes(cr1.level), "level to'g'ri qiymat");

const cr2 = getCalibratedRisk("bugdoy","Kasallik xavfi: PAST", 20, 40);
assert(cr2.level === "PAST" || cr2.level === "O'RTA", "qulay sharoit → PAST yoki O'RTA");

console.log("\ndiseaseHistory — getMonthlyTrend:");
for (const c of crops) {
  const trend = getMonthlyTrend(c);
  assert(Array.isArray(trend) && trend.length === 12, `${c}: 12 oylik trend`);
  for (const t of trend) {
    assert(typeof t.month === "string",        `${c}: month string`);
    assert(typeof t.multiplier === "number",   `${c}: multiplier raqam`);
    assert(typeof t.outbreakPct === "number",  `${c}: outbreakPct raqam`);
  }
}

// ── irrigationSchedule ─────────────────────────────────────────────────────
console.log("\nirrigationSchedule — calcET0:");
assert(calcET0(0)  === 0,    "0°C → ET0 = 0 (sovuq)");
assert(calcET0(20) > 0,      "20°C → ET0 > 0");
assert(calcET0(35) > calcET0(20), "35°C > 20°C");

console.log("\nirrigationSchedule — cropKc:");
for (const c of crops) {
  assert(c in cropKc, `${c}: Kc mavjud`);
  const kc = cropKc[c];
  assert(kc.initial < kc.mid, `${c}: initial < mid`);
}

console.log("\nirrigationSchedule — generateIrrigationSchedule:");
for (const c of crops) {
  const res = generateIrrigationSchedule({ crop: c, temperature: 30, moisture: 45 });
  assert(res.crop === c,                      `${c}: crop to'g'ri`);
  assert(Array.isArray(res.days) && res.days.length === 7, `${c}: 7 kunlik jadval`);
  assert(typeof res.totalIrrigMm === "number", `${c}: totalIrrigMm raqam`);
  assert(typeof res.summary === "string",      `${c}: summary string`);
  for (const d of res.days) {
    assert(typeof d.needsIrrigation === "boolean", `${c}/${d.day}: needsIrrigation boolean`);
    assert(d.soilMoisture >= 0 && d.soilMoisture <= 100, `${c}/${d.day}: namlik 0–100`);
    assert(d.irrigationMm >= 0, `${c}/${d.day}: irrigationMm >= 0`);
  }
}

// Quruq hudud ko'proq sug'orish talab qilishi kerak
const xorazmRes  = generateIrrigationSchedule({ crop:"pomidor", temperature:35, moisture:25, region:"Xorazm" });
const toshRes    = generateIrrigationSchedule({ crop:"pomidor", temperature:35, moisture:25, region:"Toshkent" });
assert(xorazmRes.irrigationFactor >= toshRes.irrigationFactor, "Xorazm irrigFactor >= Toshkent");

// Noto'g'ri ekin → xatolik
try { generateIrrigationSchedule({ crop:"noma'lum", temperature:25, moisture:50 }); assert(false,"Xatolik bo'lishi kerak edi"); }
catch (e) { assert(e instanceof Error, "Noto'g'ri ekin → Error"); }

// ── alertEngine ────────────────────────────────────────────────────────────
console.log("\nalertEngine — getPriceAlert:");
for (const c of crops) {
  const a = getPriceAlert(c);
  assert(a !== null,                           `${c}: alert qaytarildi`);
  assert(typeof a.type === "string",           `${c}: type string`);
  assert(typeof a.title === "string",          `${c}: title string`);
  assert(typeof a.message === "string",        `${c}: message string`);
  assert(typeof a.smsText === "string",        `${c}: smsText string`);
  assertIncludes(a.smsText, "[Dehqon]",        `${c}: smsText Dehqon brendi bor`);
}
assert(getPriceAlert("noma'lum") === null, "Noto'g'ri ekin → null");

console.log("\nalertEngine — getDiseaseAlert:");
const high = getDiseaseAlert("Kasallik xavfi: YUQORI (Fitoftora)", "Pomidor");
assert(high.type === "critical", "YUQORI → critical");
assertIncludes(high.smsText, "YUQORI", "smsText YUQORI o'z ichiga oladi");

const mid = getDiseaseAlert("Kasallik xavfi: O'RTA", "Bug'doy");
assert(mid.type === "warning", "O'RTA → warning");

const low = getDiseaseAlert("Kasallik xavfi: PAST", "Paxta");
assert(low.type === "info", "PAST → info");

console.log("\nalertEngine — getAllPriceAlerts:");
const all = getAllPriceAlerts();
assert(Array.isArray(all), "massiv qaytarildi");
// Muhimroq alertlar oldin turishi kerak
const priority = { critical:0, danger:1, warning:2, success:3, info:4, neutral:5 };
for (let i = 1; i < all.length; i++) {
  assert((priority[all[i-1].type] ?? 6) <= (priority[all[i].type] ?? 6), `Alert ${i} to'g'ri tartibda`);
}

console.log(`\nNatija: ${passed} o'tdi, ${failed} muvaffaqiyatsiz\n`);
if (failed > 0) process.exit(1);
