// Ekin narx konfiguratsiyasi: asosiy narx (so'm/kg), oraliq, kunlik o'zgaruvchanlik
const cropPriceConfig = {
  bugdoy:    { base: 3000, min: 2500, max: 3800, volatility: 0.018, nameUz: "Bug'doy" },
  paxta:     { base: 7800, min: 6800, max: 9200, volatility: 0.014, nameUz: "Paxta" },
  pomidor:   { base: 4500, min: 2800, max: 7500, volatility: 0.038, nameUz: "Pomidor" },
  bodring:   { base: 3300, min: 2200, max: 4800, volatility: 0.032, nameUz: "Bodring" },
  uzum:      { base: 6000, min: 4500, max: 8500, volatility: 0.022, nameUz: "Uzum" },
  kartoshka: { base: 2200, min: 1400, max: 3500, volatility: 0.028, nameUz: "Kartoshka" },
  piyoz:     { base: 1800, min: 1000, max: 3200, volatility: 0.042, nameUz: "Piyoz" },
};

// Deterministic pseudo-random (sine-based) — bir xil seed bilan har doim bir xil natija
function seededRand(seed) {
  const x = Math.sin(seed + 1) * 10000;
  return x - Math.floor(x);
}

/**
 * Kun asosidagi seed yordamida N kunlik narx tarixi generatsiya qiladi.
 * Har kun ichida narxlar barqaror (server restart ta'sir qilmaydi).
 * O'rtacha qaytish (mean reversion) narxni bazadan uzoq ketishini oldini oladi.
 */
function generatePriceHistory(cropKey, days = 14) {
  const config = cropPriceConfig[cropKey];
  if (!config) return null;

  const today = new Date();
  const dateSeed =
    today.getFullYear() * 10000 +
    (today.getMonth() + 1) * 100 +
    today.getDate();
  const cropSeed = cropKey
    .split("")
    .reduce((acc, ch) => acc + ch.charCodeAt(0), 0);

  const prices = [];
  let price = config.base;

  // i = days-1 (eng eski kun) → i = 0 (bugun)
  for (let i = days - 1; i >= 0; i--) {
    const rand = seededRand(dateSeed * 17 + cropSeed * 31 + i * 7);
    // O'rtacha qaytish: narxni bazaga qarab tortib turadi
    const reversion = 0.05 * (config.base - price) / config.base;
    const change = (rand - 0.5) * 2 * config.volatility + reversion;
    price = Math.max(
      config.min,
      Math.min(config.max, Math.round(price * (1 + change)))
    );
    prices.push(price);
  }

  return prices; // prices[0] = 14 kun oldin, prices[13] = bugun
}

// N ta oxirgi elementning o'rtacha qiymati
function movingAverage(arr, window) {
  const slice = arr.slice(Math.max(0, arr.length - window));
  return slice.reduce((a, b) => a + b, 0) / slice.length;
}

/**
 * Berilgan ekin uchun bozor trendini tahlil qiladi.
 * Oxirgi 3 kun va oldingi 7 kunning o'rtachasi taqqoslanadi (yanada ishonchli signal).
 */
function analyzeTrend(crop) {
  const config = cropPriceConfig[crop];
  if (!config) {
    throw new Error("Bu ekin uchun bozor ma'lumoti topilmadi.");
  }

  const prices = generatePriceHistory(crop, 14);
  const recentAvg  = movingAverage(prices, 3);          // so'nggi 3 kun
  const olderAvg   = movingAverage(prices.slice(0, 7), 7); // avvalgi 7 kun

  const deltaPct = Number((((recentAvg - olderAvg) / olderAvg) * 100).toFixed(2));
  const direction =
    deltaPct > 1.5  ? "osmoqda" :
    deltaPct < -1.5 ? "pasaymoqda" :
                      "barqaror";

  let recommendation = "Narxni kuzatishda davom eting.";
  if (deltaPct >= 5) {
    recommendation =
      "Narx yaxshi o'smoqda: bosqichma-bosqich sotuvni boshlash tavsiya etiladi.";
  } else if (deltaPct <= -5) {
    recommendation =
      "Narx pasaymoqda: agar saqlash imkoniyati bo'lsa, sotuvni kechiktiring.";
  }

  return {
    crop,
    cropName: config.nameUz,
    prices,                              // 14 kunlik narxlar
    currentPrice: prices[prices.length - 1], // bugungi narx
    changePercent: deltaPct,
    trend: direction,
    recommendation,
  };
}

module.exports = {
  analyzeTrend,
  cropPriceConfig,
};
