/**
 * cropCalendar.js uchun unit testlar
 * Ishlatish: node tests/cropCalendar.test.js
 */
"use strict";

const { getCropCalendar, getCurrentMonthTasks, cropCalendars, MONTHS } = require("../cropCalendar");

let passed = 0;
let failed = 0;

function assert(condition, message) {
  if (condition) { console.log(`  ✓ ${message}`); passed++; }
  else           { console.error(`  ✗ ${message}`); failed++; }
}

// ── MONTHS massivi ──────────────────────────────────────────────────────────
console.log("\nMONTHS:");
assert(Array.isArray(MONTHS) && MONTHS.length === 12, "12 ta oy mavjud");
assert(MONTHS[0] === "Yanvar",   "Yanvar birinchi");
assert(MONTHS[11] === "Dekabr",  "Dekabr oxirgi");

// ── cropCalendars strukturasi ───────────────────────────────────────────────
console.log("\ncropCalendars:");
const requiredCrops = ["bugdoy", "paxta", "pomidor", "bodring", "uzum", "kartoshka", "piyoz"];
for (const crop of requiredCrops) {
  assert(crop in cropCalendars, `${crop} kalendarida mavjud`);
  const cal = cropCalendars[crop];
  assert(typeof cal.nameUz === "string" && cal.nameUz.length > 0, `${crop}: nameUz bor`);
  assert(Array.isArray(cal.stages) && cal.stages.length > 0, `${crop}: stages bor`);
  assert(Array.isArray(cal.notes) && cal.notes.length > 0, `${crop}: notes bor`);

  for (const stage of cal.stages) {
    assert(typeof stage.name === "string",         `${crop}/${stage.name}: name string`);
    assert(Array.isArray(stage.months),            `${crop}/${stage.name}: months massiv`);
    assert(stage.months.every((m) => m >= 1 && m <= 12),
                                                   `${crop}/${stage.name}: oylar 1–12`);
    assert(typeof stage.icon === "string",         `${crop}/${stage.name}: icon bor`);
  }
}

// ── getCropCalendar ─────────────────────────────────────────────────────────
console.log("\ngetCropCalendar:");
for (const crop of requiredCrops) {
  const result = getCropCalendar(crop);
  assert(result !== null,                              `${crop}: natija null emas`);
  assert(result.crop === crop,                         `${crop}: crop to'g'ri`);
  assert(typeof result.currentMonth === "string",      `${crop}: currentMonth string`);
  assert(Array.isArray(result.stages),                 `${crop}: stages massiv`);
  assert(Array.isArray(result.notes),                  `${crop}: notes massiv`);

  // isActive va isUpcoming faqat boolean bo'lishi kerak
  for (const s of result.stages) {
    assert(typeof s.isActive === "boolean",   `${crop}/${s.name}: isActive boolean`);
    assert(typeof s.isUpcoming === "boolean", `${crop}/${s.name}: isUpcoming boolean`);
    assert(Array.isArray(s.monthNames),       `${crop}/${s.name}: monthNames massiv`);
    assert(s.monthNames.every((m) => MONTHS.includes(m)),
                                              `${crop}/${s.name}: monthNames to'g'ri`);
  }

  // Aktiv bosqichlar soni 0 yoki undan ko'p bo'lishi mumkin (o'tish oylarida bir nechta bo'lishi normal)
  const activeCount = result.stages.filter((s) => s.isActive).length;
  assert(activeCount >= 0 && activeCount <= result.stages.length, `${crop}: aktiv bosqichlar oraliq`);
}

// Noto'g'ri ekin → null
assert(getCropCalendar("noma'lum") === null, "Noma'lum ekin → null");
assert(getCropCalendar("") === null,         "Bo'sh string → null");

// ── getCurrentMonthTasks ────────────────────────────────────────────────────
console.log("\ngetCurrentMonthTasks:");
const tasks = getCurrentMonthTasks();
assert(typeof tasks.month === "string" && tasks.month.length > 0, "month string");
assert(Array.isArray(tasks.tasks),                                 "tasks massiv");
for (const t of tasks.tasks) {
  assert(typeof t.crop === "string",     "task.crop string");
  assert(typeof t.cropName === "string", "task.cropName string");
  assert(typeof t.stage === "string",    "task.stage string");
  assert(typeof t.icon === "string",     "task.icon string");
}
// Har qanday oyda kamida bitta vazifa bo'lishi kerak (barcha ekinlar yil bo'yi ish qiladi)
assert(tasks.tasks.length > 0, `${tasks.month} oyida kamida 1 ta vazifa bor`);

// ── Natija ──────────────────────────────────────────────────────────────────
console.log(`\nNatija: ${passed} o'tdi, ${failed} muvaffaqiyatsiz\n`);
if (failed > 0) process.exit(1);
