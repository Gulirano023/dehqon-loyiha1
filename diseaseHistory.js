/**
 * Kasallik xavfi - tarixiy kalibratsiya moduli
 * O'zbekiston iqlimidagi oylik kasallik bosimi multiplieri va
 * ekin-kasallik tarixiy statistikasiga asoslangan ishonch darajasi.
 */
"use strict";

// Oylik kasallik bosimi multiplieri (1.0 = o'rtacha, >1 = xavf ortadi)
// Indeks: 0=Yanvar ... 11=Dekabr
const seasonalMultipliers = {
  bugdoy: [0.3, 0.4, 0.9, 1.6, 2.2, 1.4, 0.2, 0.2, 0.4, 0.6, 0.4, 0.2],
  paxta:  [0.1, 0.1, 0.3, 0.8, 1.4, 2.0, 2.5, 2.3, 1.8, 0.8, 0.2, 0.1],
  pomidor:[0.1, 0.1, 0.4, 1.0, 1.6, 2.2, 2.8, 2.4, 1.6, 0.6, 0.2, 0.1],
  bodring:[0.1, 0.1, 0.3, 0.9, 1.5, 2.1, 2.6, 2.2, 1.5, 0.5, 0.2, 0.1],
  uzum:   [0.2, 0.2, 0.5, 1.0, 1.5, 1.8, 2.0, 2.2, 2.4, 1.4, 0.5, 0.2],
  kartoshka:[0.2,0.2,0.6, 1.2, 1.8, 2.0, 1.8, 1.6, 1.2, 0.6, 0.3, 0.2],
  piyoz:  [0.3, 0.4, 0.8, 1.4, 1.8, 1.6, 1.0, 0.8, 0.6, 0.4, 0.3, 0.3],
};

// Har bir ekin uchun tarixiy kasallik chiqish ehtimoli (%) — oy bo'yicha
// O'zbekiston qishloq xo'jaligi statistikasidan taxminiy qiymatlar
const historicalOutbreakRate = {
  bugdoy:    [2, 3, 8, 18, 28, 15, 2, 1, 4, 6, 4, 2],
  paxta:     [1, 1, 3, 9,  16, 24, 30, 26, 18, 8, 2, 1],
  pomidor:   [1, 1, 4, 11, 18, 26, 32, 28, 18, 7, 2, 1],
  bodring:   [1, 1, 3, 10, 17, 25, 30, 24, 16, 5, 2, 1],
  uzum:      [2, 2, 5, 11, 17, 20, 23, 26, 28, 14, 5, 2],
  kartoshka: [2, 2, 6, 13, 20, 22, 20, 18, 12, 6, 3, 2],
  piyoz:     [3, 4, 8, 15, 20, 18, 11, 8,  6,  4, 3, 3],
};

/**
 * Joriy oy va iqlim sharoitiga asosida kalibrlangan xavf darajasini qaytaradi.
 * @param {string} crop - Ekin kaliti
 * @param {string} baseRisk - getRiskLevel() natijasi ("PAST"|"O'RTA"|"YUQORI")
 * @param {number} temp - Harorat
 * @param {number} moisture - Namlik
 * @returns {{ level: string, score: number, confidence: number, seasonNote: string }}
 */
function getCalibratedRisk(crop, baseRisk, temp, moisture) {
  const month = new Date().getMonth(); // 0–11
  const multiplier = (seasonalMultipliers[crop] || seasonalMultipliers.pomidor)[month];
  const outbreakPct = (historicalOutbreakRate[crop] || historicalOutbreakRate.pomidor)[month];

  // Asosiy xavf ballini hisoblash (PAST=1, O'RTA=2, YUQORI=3)
  const baseScore = baseRisk.includes("YUQORI") ? 3
                  : baseRisk.includes("O'RTA")  ? 2 : 1;

  // Kalibrlangan ball: asosiy ball × mavsumiy multiplier
  const rawScore = baseScore * multiplier;

  // 1–3 oralig'iga normallashtirish
  const score = Math.min(3, Math.max(1, rawScore));

  // Ishonch darajasi: tarixiy chiqish ehtimoli va hozirgi sharoit kombinatsiyasi
  const tempFactor    = Math.min(1, Math.max(0, (temp - 10) / 30));
  const moistureFactor= Math.min(1, Math.max(0, (moisture - 30) / 50));
  const confidence    = Math.round(
    (outbreakPct * 0.4 + (tempFactor * 50) * 0.3 + (moistureFactor * 50) * 0.3)
  );

  // Mavsumiy izoh
  let seasonNote = "";
  if (multiplier >= 2.0) {
    seasonNote = "Joriy oy kasallik uchun eng xavfli mavsumga to'g'ri keladi.";
  } else if (multiplier >= 1.4) {
    seasonNote = "Joriy oy kasallik xavfi yuqori mavsumda.";
  } else if (multiplier <= 0.4) {
    seasonNote = "Joriy oy kasallik xavfi past mavsumda.";
  }

  // Kalibrlangan daraja
  const level = score >= 2.5 ? "YUQORI"
              : score >= 1.5 ? "O'RTA"
              : "PAST";

  return { level, score: Number(score.toFixed(2)), confidence, seasonNote, outbreakPct, multiplier };
}

/**
 * Oxirgi 30 kunlik tarixiy kasallik bosimi trendini qaytaradi (grafik uchun).
 */
function getMonthlyTrend(crop) {
  const series = seasonalMultipliers[crop] || seasonalMultipliers.pomidor;
  const outbreak = historicalOutbreakRate[crop] || historicalOutbreakRate.pomidor;
  const MONTHS = ["Yan","Fev","Mar","Apr","May","Iyu","Iyu","Avg","Sen","Okt","Noy","Dek"];
  return series.map((m, i) => ({
    month: MONTHS[i],
    multiplier: m,
    outbreakPct: outbreak[i],
  }));
}

module.exports = { getCalibratedRisk, getMonthlyTrend, seasonalMultipliers };
