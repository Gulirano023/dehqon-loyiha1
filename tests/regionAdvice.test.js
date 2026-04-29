/**
 * regionAdvice.js uchun unit testlar
 * Ishlatish: node tests/regionAdvice.test.js
 */
"use strict";

const { getRegionTips, findRegionProfile, regionProfiles } = require("../regionAdvice");

let passed = 0;
let failed = 0;

function assert(condition, message) {
  if (condition) { console.log(`  ✓ ${message}`); passed++; }
  else           { console.error(`  ✗ ${message}`); failed++; }
}
function assertIncludes(str, substr, message) {
  assert(typeof str === "string" && str.includes(substr), message);
}

// ── regionProfiles strukturasi ──────────────────────────────────────────────
console.log("\nregionProfiles:");
const requiredRegions = ["toshkent", "samarqand", "buxoro", "xorazm", "namangan", "andijon", "surxondaryo"];
for (const reg of requiredRegions) {
  const profile = regionProfiles[reg] || regionProfiles["farg'ona"];
  assert(reg in regionProfiles || reg === "farg'ona", `${reg} profilda mavjud`);
}
for (const [key, p] of Object.entries(regionProfiles)) {
  assert(typeof p.nameUz === "string" && p.nameUz.length > 0, `${key}: nameUz mavjud`);
  assert(typeof p.annualRain === "number" && p.annualRain > 0, `${key}: annualRain musbat`);
  assert(p.irrigationFactor >= 1.0, `${key}: irrigationFactor >= 1`);
  assert(Array.isArray(p.recommendedCrops) && p.recommendedCrops.length > 0, `${key}: recommendedCrops bor`);
  assert(Array.isArray(p.tips) && p.tips.length > 0, `${key}: tips bor`);
}

// ── findRegionProfile ───────────────────────────────────────────────────────
console.log("\nfindRegionProfile:");
assert(findRegionProfile("Toshkent") !== null,          "Toshkent topildi");
assert(findRegionProfile("toshkent") !== null,          "kichik harf ham ishlaydi");
assert(findRegionProfile("SAMARQAND") !== null,         "katta harf ham ishlaydi");
assert(findRegionProfile("Farg'ona viloyati") !== null, "qisman mos: Farg'ona viloyati");
assert(findRegionProfile("Xorazm") !== null,            "Xorazm topildi");
assert(findRegionProfile("noma'lum_joy") === null,      "Noma'lum hudud → null");

// ── getRegionTips ───────────────────────────────────────────────────────────
console.log("\ngetRegionTips:");

// Toshkent
const tosh = getRegionTips("Toshkent");
assert(tosh !== null,                             "Toshkent natijalari bor");
assert(tosh.regionName === "Toshkent",            "regionName to'g'ri");
assert(typeof tosh.zone === "string",             "zone string");
assert(Array.isArray(tosh.tips) && tosh.tips.length > 0, "tips bo'sh emas");
assert(typeof tosh.irrigationFactor === "number", "irrigationFactor raqam");

// Xorazm — quruq hudud, irrigationFactor yuqori bo'lishi kerak
const xor = getRegionTips("Xorazm");
assert(xor !== null,                   "Xorazm natijalari bor");
assert(xor.irrigationFactor >= 1.3,    "Xorazm: irrigationFactor >= 1.3");
assert(xor.annualRain < 200,           "Xorazm: annualRain < 200 mm");
// Sug'orish og'ohlantiruv tipi mavjud bo'lishi kerak
const hasIrrigationTip = xor.tips.some((t) => t.includes("sug'or") || t.includes("Sug'or"));
assert(hasIrrigationTip, "Xorazm: sug'orish haqida tip bor");

// Surxondaryo — subtropik
const sur = getRegionTips("Surxondaryo");
assert(sur !== null, "Surxondaryo topildi");
assertIncludes(sur.zone, "subtropik", "Surxondaryo: subtropik zona");

// Noto'g'ri hudud → null
assert(getRegionTips("Marsdan kelgan") === null, "Noto'g'ri hudud → null");
assert(getRegionTips("") === null,               "Bo'sh string → null");

// ── Natija ──────────────────────────────────────────────────────────────────
console.log(`\nNatija: ${passed} o'tdi, ${failed} muvaffaqiyatsiz\n`);
if (failed > 0) process.exit(1);
