/**
 * marketTrends.js uchun unit testlar
 * Ishlatish: node tests/marketTrends.test.js
 */
"use strict";

const { analyzeTrend, cropPriceConfig } = require("../marketTrends");

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

// ── cropPriceConfig strukturasi ─────────────────────────────────────────────
console.log("\ncropPriceConfig:");
const requiredCrops = ["bugdoy", "paxta", "pomidor", "bodring", "uzum", "kartoshka", "piyoz"];
for (const crop of requiredCrops) {
  assert(crop in cropPriceConfig, `${crop} konfiguratsiyada mavjud`);
  const cfg = cropPriceConfig[crop];
  assert(cfg.base > 0 && cfg.min > 0 && cfg.max > cfg.min, `${crop}: base/min/max mantiqiy`);
  assert(cfg.volatility > 0 && cfg.volatility < 1, `${crop}: volatility oralig'ida`);
  assert(typeof cfg.nameUz === "string" && cfg.nameUz.length > 0, `${crop}: nameUz mavjud`);
}

// ── analyzeTrend qaytargan ob'ekt ───────────────────────────────────────────
console.log("\nanalyzeTrend — qaytargan ob'ekt tuzilishi:");
for (const crop of requiredCrops) {
  const result = analyzeTrend(crop);

  assert(result.crop === crop, `${crop}: crop to'g'ri`);
  assert(typeof result.cropName === "string", `${crop}: cropName string`);
  assert(Array.isArray(result.prices) && result.prices.length === 14, `${crop}: 14 kunlik prices`);
  assert(typeof result.currentPrice === "number" && result.currentPrice > 0, `${crop}: currentPrice musbat`);
  assert(typeof result.changePercent === "number", `${crop}: changePercent raqam`);
  assert(["osmoqda", "pasaymoqda", "barqaror"].includes(result.trend), `${crop}: trend qiymati to'g'ri`);
  assert(typeof result.recommendation === "string" && result.recommendation.length > 0, `${crop}: recommendation mavjud`);
}

// ── Narxlar konfiguratsiya oralig'ida ──────────────────────────────────────
console.log("\nNarxlar oralig'i:");
for (const crop of requiredCrops) {
  const { prices } = analyzeTrend(crop);
  const cfg = cropPriceConfig[crop];
  const allInRange = prices.every((p) => p >= cfg.min && p <= cfg.max);
  assert(allInRange, `${crop}: barcha narxlar [${cfg.min}–${cfg.max}] oralig'ida`);
}

// ── Determinizm: bir xil kun ikki marta chaqirilsa bir xil natija ──────────
console.log("\nDeterminizm:");
for (const crop of ["pomidor", "kartoshka"]) {
  const r1 = analyzeTrend(crop);
  const r2 = analyzeTrend(crop);
  assert(
    JSON.stringify(r1.prices) === JSON.stringify(r2.prices),
    `${crop}: ikki chaqiruv bir xil narxlar`
  );
}

// ── Noto'g'ri ekin → xatolik ───────────────────────────────────────────────
console.log("\nXato holatlari:");
try {
  analyzeTrend("noma'lum_ekin");
  assert(false, "Noto'g'ri ekin xatolik chiqarishi kerak edi");
} catch (err) {
  assertIncludes(err.message, "topilmadi", "Noto'g'ri ekin → xatolik xabari to'g'ri");
}

try {
  analyzeTrend("");
  assert(false, "Bo'sh ekin xatolik chiqarishi kerak edi");
} catch (err) {
  assert(err instanceof Error, "Bo'sh ekin → Error obyekti");
}

// ── Yakuniy natija ──────────────────────────────────────────────────────────
console.log(`\nNatija: ${passed} o'tdi, ${failed} muvaffaqiyatsiz\n`);
if (failed > 0) process.exit(1);
