const express = require("express");
const path    = require("path");

const { getMoistureTip, getTemperatureTip, getPhTip, getNpkTip, getRiskLevel } = require("./riskEngine");
const { getWeatherByRegion }          = require("./weatherService");
const { analyzeTrend }                = require("./marketTrends");
const { getRegionTips }               = require("./regionAdvice");
const { getCropCalendar, getCurrentMonthTasks } = require("./cropCalendar");
const { getCalibratedRisk, getMonthlyTrend }    = require("./diseaseHistory");
const { generateIrrigationSchedule }  = require("./irrigationSchedule");
const { getPriceAlert, getDiseaseAlert, getAllPriceAlerts } = require("./alertEngine");

const app  = express();
const PORT = process.env.PORT || 3000;

app.use((req, res, next) => {
  const origin = req.headers.origin || "";
  const isLocal   = /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin);
  const isVercel  = origin.endsWith(".vercel.app") || origin.includes("dehqon");
  if (isLocal || isVercel) {
    res.setHeader("Access-Control-Allow-Origin", origin);
    res.setHeader("Vary", "Origin");
  }
  res.setHeader("Access-Control-Allow-Methods", "GET,POST,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") return res.sendStatus(204);
  return next();
});

app.use(express.json());
app.use(express.static(path.join(__dirname)));

const cropAdvice = {
  bugdoy:    "Bug'doy uchun azotli o'g'itni vegetatsiya bosqichlarida (tuplanish, naychalash) bo'lib bering.",
  paxta:     "Paxtada qator oralig'ini yumshatish tuproq namligini yaxshi ushlashga va havo aylanishiga yordam beradi.",
  pomidor:   "Pomidorda gullash davrida kalsiy yetishmasligini oldini olish uchun kalsiy nitrat purkang.",
  bodring:   "Bodringda namlikning keskin o'zgarishini oldini olish hosil sifatini va miqdorini oshiradi.",
  uzum:      "Uzumda ortiqcha novdalarni siyraklashtirish havo aylanishini yaxshilab kasallik xavfini kamaytiradi.",
  kartoshka: "Kartoshkada ko'karish oldidan tuproqni tekislang; o'sish davrida 2 marta azotli o'g'it bering.",
  piyoz:     "Piyozda urug' ekishdan avval tuproqni chuqur yumshating; piyoz bargini 3-4 ta bo'lganida birinchi oziqlantiring.",
};

const cropNames = {
  bugdoy:"Bug'doy", paxta:"Paxta", pomidor:"Pomidor",
  bodring:"Bodring", uzum:"Uzum", kartoshka:"Kartoshka", piyoz:"Piyoz",
};

// ── Sog'liqni tekshirish ─────────────────────────────────────────────────────
app.get("/api/health", (_req, res) => {
  res.json({ ok: true, crops: Object.keys(cropAdvice) });
});

// ── Ob-havo ──────────────────────────────────────────────────────────────────
app.get("/api/weather", async (req, res) => {
  const region = String(req.query.region || "").trim();
  if (!region) return res.status(400).json({ error: "region parametri talab qilinadi." });
  try {
    return res.json(await getWeatherByRegion(region));
  } catch (e) {
    return res.status(502).json({ error: e.message || "Ob-havo xizmati vaqtincha ishlamayapti." });
  }
});

// ── Bozor trendi ─────────────────────────────────────────────────────────────
app.get("/api/market-trend", (req, res) => {
  const crop = String(req.query.crop || "").trim().toLowerCase();
  if (!crop) return res.status(400).json({ error: "crop parametri talab qilinadi." });
  try {
    return res.json(analyzeTrend(crop));
  } catch (e) {
    return res.status(400).json({ error: e.message });
  }
});

// ── Barcha narx alertlar ─────────────────────────────────────────────────────
app.get("/api/alerts", (req, res) => {
  const crop = String(req.query.crop || "").trim().toLowerCase();
  if (crop) {
    const alert = getPriceAlert(crop);
    return alert ? res.json(alert) : res.status(404).json({ error: "Alert topilmadi." });
  }
  return res.json({ alerts: getAllPriceAlerts() });
});

// ── Ekin kalendarı ───────────────────────────────────────────────────────────
app.get("/api/calendar", (req, res) => {
  const crop = String(req.query.crop || "").trim().toLowerCase();
  if (!crop) return res.json(getCurrentMonthTasks());
  const cal = getCropCalendar(crop);
  return cal ? res.json(cal) : res.status(404).json({ error: "Bu ekin uchun kalendar topilmadi." });
});

// ── Hudud ma'lumoti ──────────────────────────────────────────────────────────
app.get("/api/region-info", (req, res) => {
  const region = String(req.query.region || "").trim();
  if (!region) return res.status(400).json({ error: "region parametri talab qilinadi." });
  const info = getRegionTips(region);
  return info
    ? res.json(info)
    : res.status(404).json({ error: "Bu hudud uchun ma'lumot topilmadi. Viloyat nomini kiriting." });
});

// ── Kasallik tarixi trendi ───────────────────────────────────────────────────
app.get("/api/disease-trend", (req, res) => {
  const crop = String(req.query.crop || "").trim().toLowerCase();
  if (!crop) return res.status(400).json({ error: "crop parametri talab qilinadi." });
  const trend = getMonthlyTrend(crop);
  if (!trend) return res.status(404).json({ error: "Bu ekin uchun ma'lumot topilmadi." });
  return res.json({ crop, trend });
});

// ── Sug'orish jadvali ────────────────────────────────────────────────────────
app.post("/api/irrigation", (req, res) => {
  const { crop, temperature, moisture, region } = req.body;
  const temp = Number(temperature);
  const moist = Number(moisture);

  if (!crop || !Object.prototype.hasOwnProperty.call(cropAdvice, crop)
      || Number.isNaN(temp) || Number.isNaN(moist)) {
    return res.status(400).json({ error: "crop, temperature va moisture talab qilinadi." });
  }
  try {
    return res.json(generateIrrigationSchedule({ crop, temperature: temp, moisture: moist, region }));
  } catch (e) {
    return res.status(400).json({ error: e.message });
  }
});

// ── AI maslahat (to'liq) ─────────────────────────────────────────────────────
app.post("/api/advice", (req, res) => {
  const { region, crop, moisture, temperature, ph, nitrogen } = req.body;
  const moistureValue    = Number(moisture);
  const temperatureValue = Number(temperature);

  if (!region || !crop || !Object.prototype.hasOwnProperty.call(cropAdvice, crop)
      || Number.isNaN(moistureValue) || Number.isNaN(temperatureValue)) {
    return res.status(400).json({ error: "Yuborilgan ma'lumot noto'g'ri. Maydonlarni tekshirib qayta yuboring." });
  }

  // Asosiy xavf + kalibratsiya
  const baseRiskText = getRiskLevel(temperatureValue, moistureValue, crop);
  const calibrated   = getCalibratedRisk(crop, baseRiskText, temperatureValue, moistureValue);

  const tips = [
    `${region} hududi uchun tahlil tayyor.`,
    cropAdvice[crop],
    getMoistureTip(moistureValue),
    getTemperatureTip(temperatureValue),
  ];

  // Kalibrlangan xavf
  const riskLine = `Kasallik xavfi: ${calibrated.level} (ishonch: ${calibrated.confidence}%).`;
  tips.push(riskLine);
  if (calibrated.seasonNote) tips.push(calibrated.seasonNote);

  // pH / azot
  const phTip  = getPhTip(ph);
  const npkTip = getNpkTip(nitrogen);
  if (phTip)  tips.push(phTip);
  if (npkTip) tips.push(npkTip);

  // Hududiy maslahat (max 2 ta)
  const regionInfo = getRegionTips(region);
  if (regionInfo) regionInfo.tips.slice(0, 2).forEach((t) => tips.push(`[${regionInfo.regionName}] ${t}`));

  // Ekin kalendarı — joriy bosqich
  const calendar = getCropCalendar(crop);
  if (calendar?.activeStage) {
    tips.push(`Hozirgi bosqich (${calendar.currentMonth}): ${calendar.activeStage.icon} ${calendar.activeStage.name}.`);
  }
  if (calendar?.upcomingStage) {
    tips.push(`Keyingi bosqich: ${calendar.upcomingStage.icon} ${calendar.upcomingStage.name} (${calendar.upcomingStage.monthNames.join(", ")}).`);
  }

  // Bozor trendi
  try {
    const market = analyzeTrend(crop);
    tips.push(`Bozor trendi: ${market.trend} (${market.changePercent >= 0 ? "+" : ""}${market.changePercent}%). Joriy narx: ~${market.currentPrice.toLocaleString("uz")} so'm/kg.`);
    tips.push(market.recommendation);
  } catch (_) { /* trend yo'q bo'lsa o'tkazib yuboriladi */ }

  // Alert
  const diseaseAlert = getDiseaseAlert(riskLine, cropNames[crop] || crop);

  return res.json({
    region, crop, tips,
    regionInfo:    regionInfo || null,
    calibratedRisk: calibrated,
    diseaseAlert,
  });
});

// Lokal ishga tushirish (Vercel da bu kod chaqirilmaydi)
if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`Server ishga tushdi: http://localhost:${PORT}`); // eslint-disable-line no-console
  });
}

module.exports = app;
