/**
 * Aqlli sug'orish jadvali generatori
 * Ekin turi, o'sish bosqichi, harorat, namlik va hudud sug'orish omiliga
 * asosida 7 kunlik sug'orish jadvali tuzadi.
 */
"use strict";

const { cropCalendars } = require("./cropCalendar");
const { findRegionProfile } = require("./regionAdvice");

// Ekin o'sish bosqichlariga mos Kc (crop coefficient) qiymatlari
// FAO-56 standartiga asoslangan
const cropKc = {
  bugdoy:    { initial: 0.35, development: 0.75, mid: 1.10, late: 0.30 },
  paxta:     { initial: 0.40, development: 0.80, mid: 1.15, late: 0.70 },
  pomidor:   { initial: 0.45, development: 0.75, mid: 1.15, late: 0.80 },
  bodring:   { initial: 0.45, development: 0.75, mid: 1.00, late: 0.75 },
  uzum:      { initial: 0.30, development: 0.70, mid: 0.85, late: 0.45 },
  kartoshka: { initial: 0.45, development: 0.75, mid: 1.15, late: 0.75 },
  piyoz:     { initial: 0.50, development: 0.75, mid: 1.05, late: 0.75 },
};

// Bosqich nomi → Kc kategoriyasi
function stageToCategory(stageName) {
  const s = stageName.toLowerCase();
  if (s.includes("ekish") || s.includes("urug") || s.includes("ko'chat tayyorlash") || s.includes("tayyorlash")) return "initial";
  if (s.includes("ko'karish") || s.includes("o'sish") || s.includes("development")) return "development";
  if (s.includes("gullash") || s.includes("meva") || s.includes("boshoqlash") || s.includes("ko'sak") || s.includes("tuganak")) return "mid";
  if (s.includes("pishish") || s.includes("yig'im")) return "late";
  return "mid";
}

/**
 * Haroratga asosida kunlik referens evapotranspiratsiyanı (ET₀) hisoblaydi.
 * Soddalashtirilgan Blaney-Criddle yaqinlashuvi, mm/kun.
 */
function calcET0(tempC) {
  return Math.max(0, 0.46 * tempC - 0.5);
}

/**
 * Har bir kun uchun yog'ingarchilik ehtimoli asosida taxminiy yog'in (mm).
 * Hozircha statistik model — real API bo'lmaganda.
 */
function estimateRain(month, regionAnnualRain) {
  // Yog'inning oylik taqsimlanishi (taxminiy %): bahorda ko'proq
  const monthlyShare = [0.06,0.07,0.10,0.12,0.10,0.05,0.02,0.02,0.04,0.10,0.14,0.08];
  const dailyRain = (regionAnnualRain * monthlyShare[month]) / 30;
  return Number(dailyRain.toFixed(1));
}

/**
 * 7 kunlik sug'orish jadvali.
 * @param {object} params
 * @param {string} params.crop       - Ekin kaliti
 * @param {number} params.temperature - Joriy harorat (°C)
 * @param {number} params.moisture   - Joriy tuproq namligi (%)
 * @param {string} [params.region]   - Viloyat nomi (ixtiyoriy)
 * @returns {object} Jadval ma'lumoti
 */
function generateIrrigationSchedule({ crop, temperature, moisture, region }) {
  const kc = cropKc[crop];
  if (!kc) throw new Error("Bu ekin uchun sug'orish ma'lumoti topilmadi.");

  // Hududiy sug'orish omili
  const regionProfile = region ? findRegionProfile(region) : null;
  const irrigFactor   = regionProfile ? regionProfile.irrigationFactor : 1.0;

  // Joriy o'sish bosqichini aniqlash
  const calendar   = cropCalendars[crop];
  const currentMonth = new Date().getMonth(); // 0-based
  let activeStage  = null;
  if (calendar) {
    for (const s of calendar.stages) {
      if (s.months.includes(currentMonth + 1)) { activeStage = s; break; }
    }
  }
  const category  = activeStage ? stageToCategory(activeStage.name) : "mid";
  const kcValue   = kc[category];

  // ET₀ va ETc
  const et0 = calcET0(temperature);
  const etc = Number((et0 * kcValue).toFixed(2)); // mm/kun

  // Tuproq namligi defitsiti: qancha mm suv yetishmayapti
  const optimalMoisture = 60;  // optimal 60%
  const moistureDeficit = Math.max(0, optimalMoisture - moisture);
  const deficitMm = Number((moistureDeficit * 0.12).toFixed(1)); // 1% ≈ 0.12 mm/kun (30 sm qatlam)

  // 7 kunlik jadval
  const today = new Date();
  const days = [];
  let soilMoisture = moisture;

  for (let i = 0; i < 7; i++) {
    const date = new Date(today);
    date.setDate(today.getDate() + i);
    const dayName = ["Yak","Du","Se","Chor","Pay","Ju","Sha"][date.getDay()];
    const dateStr = `${date.getDate()}-${date.getMonth() + 1}`;

    // Bugungi harorat taxminiy o'zgarishi (±1°C sinusoidal)
    const tempToday = temperature + Math.sin(i * 0.8) * 1.5;
    const et0Today  = calcET0(tempToday);
    const etcToday  = Number((et0Today * kcValue * irrigFactor).toFixed(2));

    // Yog'in taxmini
    const rainToday = estimateRain(currentMonth, regionProfile?.annualRain || 300);

    // Namlik o'zgarishi
    soilMoisture = Math.max(0, Math.min(100, soilMoisture - etcToday * 0.8 + rainToday * 0.5));

    // Sug'orish kerakmi?
    const needsIrrigation = soilMoisture < 45;
    let irrigationMm = 0;
    let recommendation = "Sug'orish shart emas.";

    if (soilMoisture < 30) {
      irrigationMm = Number((etcToday * 2 * irrigFactor + deficitMm).toFixed(1));
      recommendation = "Zudlik bilan sug'orilsin!";
      soilMoisture = Math.min(70, soilMoisture + irrigationMm * 0.8);
    } else if (needsIrrigation) {
      irrigationMm = Number((etcToday * irrigFactor + deficitMm * 0.5).toFixed(1));
      recommendation = "Sug'orish tavsiya etiladi.";
      soilMoisture = Math.min(70, soilMoisture + irrigationMm * 0.8);
    }

    days.push({
      day: dayName,
      date: dateStr,
      tempC: Number(tempToday.toFixed(1)),
      etcMm: etcToday,
      rainMm: rainToday,
      soilMoisture: Number(soilMoisture.toFixed(0)),
      needsIrrigation,
      irrigationMm,
      recommendation,
    });
  }

  // Haftalik umumiy sug'orish miqdori
  const totalIrrigMm = Number(days.reduce((s, d) => s + d.irrigationMm, 0).toFixed(1));
  const irrigDays    = days.filter((d) => d.needsIrrigation).length;

  return {
    crop,
    region: regionProfile?.nameUz || region || "Noma'lum",
    stage: activeStage?.name || "Noma'lum bosqich",
    kcValue,
    et0Base: et0,
    etcBase: etc,
    irrigationFactor: irrigFactor,
    days,
    totalIrrigMm,
    irrigDays,
    summary:
      irrigDays === 0
        ? "Bu hafta sug'orish shart emas."
        : `Bu hafta ${irrigDays} kuni sug'orish kerak, jami ~${totalIrrigMm} mm.`,
  };
}

module.exports = { generateIrrigationSchedule, calcET0, cropKc };
