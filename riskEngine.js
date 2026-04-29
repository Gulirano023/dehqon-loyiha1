// Ekin turiga xos kasallik profillari: harorat va namlik oraliqlarida faol bo'luvchi kasalliklar
const cropDiseaseProfiles = {
  bugdoy: [
    { name: "Pas kasalligi (Zang)",   minTemp: 15, maxTemp: 25, minHumidity: 70 },
    { name: "Unli shudring",           minTemp: 10, maxTemp: 22, minHumidity: 80 },
    { name: "Fuzarioz boshog'i",       minTemp: 20, maxTemp: 30, minHumidity: 75 },
  ],
  paxta: [
    { name: "Verticillium so'lishi",   minTemp: 20, maxTemp: 28, minHumidity: 65 },
    { name: "Alternaria yaprog' dog'i",minTemp: 25, maxTemp: 35, minHumidity: 68 },
    { name: "Gomoz",                   minTemp: 22, maxTemp: 35, minHumidity: 72 },
  ],
  pomidor: [
    { name: "Fitoftora",               minTemp: 10, maxTemp: 25, minHumidity: 75 },
    { name: "Botritis (kulrang chir.)",minTemp: 15, maxTemp: 23, minHumidity: 80 },
    { name: "Fusarium so'lishi",       minTemp: 25, maxTemp: 35, minHumidity: 60 },
  ],
  bodring: [
    { name: "Peronospora (Mildyu)",    minTemp: 15, maxTemp: 22, minHumidity: 80 },
    { name: "Unli shudring",           minTemp: 20, maxTemp: 30, minHumidity: 60 },
    { name: "Antraknoz",               minTemp: 22, maxTemp: 30, minHumidity: 72 },
  ],
  uzum: [
    { name: "Oidium (unli shudring)",  minTemp: 20, maxTemp: 30, minHumidity: 50 },
    { name: "Mildyu (plazmopara)",     minTemp: 12, maxTemp: 28, minHumidity: 75 },
    { name: "Botritis",                minTemp: 15, maxTemp: 25, minHumidity: 80 },
  ],
  kartoshka: [
    { name: "Fitoftora",               minTemp: 10, maxTemp: 22, minHumidity: 75 },
    { name: "Rizoktoniya",             minTemp: 15, maxTemp: 25, minHumidity: 70 },
    { name: "Alternaria dog'i",        minTemp: 20, maxTemp: 30, minHumidity: 65 },
  ],
  piyoz: [
    { name: "Peronospora (yolg'on unli shudring)", minTemp: 10, maxTemp: 20, minHumidity: 78 },
    { name: "Fuzarioz",                minTemp: 20, maxTemp: 30, minHumidity: 65 },
    { name: "Servisoz chirishi",       minTemp:  5, maxTemp: 20, minHumidity: 80 },
  ],
};

function getMoistureTip(moisture) {
  if (moisture < 30) {
    return "Tuproq namligi juda past (< 30%): tomchilatib sug'orishni zudlik bilan boshlang.";
  }
  if (moisture < 45) {
    return "Tuproq namligi biroz past (30–44%): sug'orish miqdorini biroz oshiring.";
  }
  if (moisture > 75) {
    return "Tuproq juda nam (> 75%): sug'orishni to'xtating va drenajni tekshiring.";
  }
  if (moisture > 65) {
    return "Tuproq namligi yuqoriroq (66–75%): sug'orish miqdorini kamaytiring.";
  }
  return "Tuproq namligi me'yorida (45–65%): hozirgi sug'orish rejimini saqlang.";
}

function getTemperatureTip(temp) {
  if (temp >= 40) {
    return "Juda kuchli issiq stress (≥ 40°C): soyabonlash va kechqurungi sug'orishni kuchaytiring.";
  }
  if (temp >= 38) {
    return "Issiq stress xavfi (38–39°C): ertalab yoki kechki payt sug'orishni tanlang.";
  }
  if (temp <= 0) {
    return "Muzlash xavfi (≤ 0°C): ekinlarni agroto'r bilan zudlik bilan himoyalang.";
  }
  if (temp <= 5) {
    return "Sovuq xavfi (1–5°C): nozik ekinlarni agroto'r bilan himoyalang.";
  }
  return "Harorat ekin rivoji uchun qulay diapazonda.";
}

function getPhTip(ph) {
  if (ph === null || ph === undefined || ph === "") return null;
  const val = Number(ph);
  if (Number.isNaN(val)) return null;
  if (val < 5.5) {
    return `Tuproq kislotali (pH ${val}): ohak (CaCO₃) solib kislotalilikni kamaytiring.`;
  }
  if (val > 7.8) {
    return `Tuproq ishqoriy (pH ${val}): organik o'g'it yoki oltingugurt qo'shib pH ni tushiring.`;
  }
  return `Tuproq pH darajasi qulay (pH ${val}).`;
}

function getNpkTip(nitrogen) {
  if (!nitrogen) return null;
  if (nitrogen === "low") {
    return "Azot darajasi past: urea yoki ammoniy selitra bilan oziqlantiring.";
  }
  if (nitrogen === "high") {
    return "Azot darajasi yuqori: azotli o'g'itni to'xtating, ildiz chirishi xavfini kamaytiring.";
  }
  return "Azot darajasi me'yorida: oziqlantirishni shu tarzda davom ettiring.";
}

/**
 * Kasallik xavfini baholaydi.
 * @param {number} temp - Harorat (°C)
 * @param {number} moisture - Tuproq namligi (%)
 * @param {string} [crop] - Ekin kaliti (bugdoy, paxta, ...)
 * @returns {string} Xavf darajasi va kasallik nomlari
 */
function getRiskLevel(temp, moisture, crop) {
  const activeRisks = [];

  if (crop && cropDiseaseProfiles[crop]) {
    for (const disease of cropDiseaseProfiles[crop]) {
      if (
        temp >= disease.minTemp &&
        temp <= disease.maxTemp &&
        moisture >= disease.minHumidity
      ) {
        activeRisks.push(disease.name);
      }
    }
  }

  // 2+ kasallik sharti yoki juda og'ir umumiy sharoit → YUQORI
  if (activeRisks.length >= 2 || (temp > 34 && moisture > 75)) {
    const list = activeRisks.length > 0 ? ` (${activeRisks.join(", ")})` : "";
    return `Kasallik xavfi: YUQORI${list}. Darhol fungitsid purkashni ko'rib chiqing.`;
  }

  // 1 kasallik yoki o'rtacha og'ir sharoit → O'RTA
  if (activeRisks.length === 1 || temp > 30 || moisture > 65) {
    const list = activeRisks.length > 0 ? ` (${activeRisks[0]})` : "";
    return `Kasallik xavfi: O'RTA${list}. Ekinni muntazam kuzatib boring.`;
  }

  return "Kasallik xavfi: PAST. Hozirgi shart-sharoit qulay.";
}

module.exports = {
  getMoistureTip,
  getTemperatureTip,
  getPhTip,
  getNpkTip,
  getRiskLevel,
  cropDiseaseProfiles,
};
