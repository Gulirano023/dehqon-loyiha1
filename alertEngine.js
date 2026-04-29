/**
 * Alert (ogohlantirish) tizimi
 * Bozor narxi va kasallik xavfi bo'yicha avtomatik signallar generatsiya qiladi.
 * SMS-tayyor qisqa xabar formati ham taqdim etiladi.
 */
"use strict";

const { analyzeTrend, cropPriceConfig } = require("./marketTrends");

// Narx o'zgarish praglar (%)
const PRICE_THRESHOLDS = {
  strongBuy:  5,   // +5% → sotish vaqti
  weakBuy:    2,   // +2% → bosqichma-bosqich sotuv
  weakSell:  -2,   // -2% → kuzatib turing
  strongSell:-5,   // -5% → sotuvni kechiktiring
};

// Kasallik xavfi daraja → alert turi
const RISK_ALERT_LEVELS = {
  YUQORI: "critical",
  "O'RTA": "warning",
  PAST:   "info",
};

/**
 * Berilgan ekin uchun bozor narx alertini generatsiya qiladi.
 */
function getPriceAlert(crop) {
  let trend;
  try { trend = analyzeTrend(crop); }
  catch { return null; }

  const pct = trend.changePercent;
  const cfg = cropPriceConfig[crop];
  if (!cfg) return null;

  let type, title, message, action;

  if (pct >= PRICE_THRESHOLDS.strongBuy) {
    type    = "success";
    title   = "Narx yaxshi o'smoqda!";
    message = `${cfg.nameUz} narxi ${pct >= 0 ? "+" : ""}${pct}% o'sdi (${trend.currentPrice.toLocaleString("uz")} so'm/kg). Sotuv uchun qulay payt.`;
    action  = "Bosqichma-bosqich sotuvni boshlang.";
  } else if (pct >= PRICE_THRESHOLDS.weakBuy) {
    type    = "info";
    title   = "Narx o'smoqda";
    message = `${cfg.nameUz} narxi ${pct >= 0 ? "+" : ""}${pct}% o'sdi. Joriy narx: ${trend.currentPrice.toLocaleString("uz")} so'm/kg.`;
    action  = "Narxni kuzatishda davom eting.";
  } else if (pct <= PRICE_THRESHOLDS.strongSell) {
    type    = "danger";
    title   = "Narx pasaymoqda!";
    message = `${cfg.nameUz} narxi ${pct}% tushdi (${trend.currentPrice.toLocaleString("uz")} so'm/kg). Saqlash imkoni bo'lsa kechiktiring.`;
    action  = "Sotuvni kechiktiring yoki saqlab qo'ying.";
  } else if (pct <= PRICE_THRESHOLDS.weakSell) {
    type    = "warning";
    title   = "Narx biroz tushmoqda";
    message = `${cfg.nameUz} narxi ${pct}% tushdi. Joriy narx: ${trend.currentPrice.toLocaleString("uz")} so'm/kg.`;
    action  = "Kuzatishni kuchaytiring.";
  } else {
    type    = "neutral";
    title   = "Narx barqaror";
    message = `${cfg.nameUz} narxi barqaror (${trend.currentPrice.toLocaleString("uz")} so'm/kg).`;
    action  = "Hozircha o'zgarish yo'q.";
  }

  return {
    type,
    title,
    message,
    action,
    crop,
    cropName: cfg.nameUz,
    changePercent: pct,
    currentPrice: trend.currentPrice,
    smsText: `[Dehqon] ${cfg.nameUz}: ${message} ${action}`,
  };
}

/**
 * Kasallik xavfi darajasiga asosida alert generatsiya qiladi.
 * @param {string} riskText - getRiskLevel() / getCalibratedRisk() natijasi
 * @param {string} cropName - Ekin nomi (ko'rsatish uchun)
 */
function getDiseaseAlert(riskText, cropName) {
  const isHigh   = riskText.includes("YUQORI");
  const isMedium = riskText.includes("O'RTA");

  if (isHigh) {
    return {
      type:    "critical",
      title:   "Kasallik xavfi YUQORI!",
      message: `${cropName} uchun kasallik xavfi juda yuqori. ${riskText.replace("Kasallik xavfi: YUQORI", "").trim()}`,
      action:  "Zudlik bilan fungitsid purkang va agronomb bilan maslahatlashing.",
      smsText: `[Dehqon] OGOHLANTIRISH: ${cropName} kasallik xavfi YUQORI! Fungitsid purkashni boshlang.`,
    };
  }
  if (isMedium) {
    return {
      type:    "warning",
      title:   "Kasallik xavfi O'RTA",
      message: `${cropName} uchun kasallik xavfi o'rtacha. ${riskText.replace("Kasallik xavfi: O'RTA", "").trim()}`,
      action:  "Ekinni muntazam kuzating va profilaktik choralar ko'ring.",
      smsText: `[Dehqon] Diqqat: ${cropName} kasallik xavfi O'RTA. Ekinni kuzating.`,
    };
  }
  return {
    type:    "info",
    title:   "Kasallik xavfi PAST",
    message: `${cropName} uchun sharoit qulay.`,
    action:  "Oddiy monitoring yetarli.",
    smsText: `[Dehqon] ${cropName}: kasallik xavfi past. Sharoit qulay.`,
  };
}

/**
 * Barcha ekinlar uchun narx alertlar panelini qaytaradi.
 */
function getAllPriceAlerts() {
  const alerts = [];
  for (const crop of Object.keys(cropPriceConfig)) {
    const alert = getPriceAlert(crop);
    if (alert && alert.type !== "neutral") alerts.push(alert);
  }
  // Muhimroq alertlarni oldinroq ko'rsatish
  const priority = { critical: 0, danger: 1, warning: 2, success: 3, info: 4 };
  return alerts.sort((a, b) => (priority[a.type] ?? 5) - (priority[b.type] ?? 5));
}

module.exports = { getPriceAlert, getDiseaseAlert, getAllPriceAlerts };
