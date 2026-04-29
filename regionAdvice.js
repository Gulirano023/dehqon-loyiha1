/**
 * O'zbekiston viloyatlari iqlim profillari va hududga xos tavsiyalar.
 * Har bir viloyat uchun: iqlim zonasi, asosiy xavflar, tavsiya etilgan ekinlar,
 * sug'orish normasi, va maxsus ogohlantirishlar.
 */
const regionProfiles = {
  // ── Shimoliy hududlar ──────────────────────────────────────────────────
  toshkent: {
    nameUz: "Toshkent",
    zone: "mo'tadil-kontinental",
    avgSummerTemp: 30,
    annualRain: 420,
    mainRisks: ["bahorgi sovuq", "quruq yoz"],
    recommendedCrops: ["bugdoy", "pomidor", "bodring", "uzum", "piyoz"],
    irrigationFactor: 1.0,   // standart sug'orish normasi
    tips: [
      "Bahor oylarida (mart–aprel) tungi sovuqqa qarshi ekinlarni himoyalang.",
      "Yozda (iyul–avgust) tomchilatib sug'orish suv tejashda eng samarali usul.",
      "Uzum va mevali daraxtlar Toshkent iqlimiga yaxshi moslashgan.",
    ],
  },
  samarqand: {
    nameUz: "Samarqand",
    zone: "yarim-quruq",
    avgSummerTemp: 32,
    annualRain: 340,
    mainRisks: ["quruqlik", "issiq shamollar"],
    recommendedCrops: ["bugdoy", "paxta", "uzum", "pomidor", "piyoz"],
    irrigationFactor: 1.15,
    tips: [
      "Issiq shamollar (garmsel) davrida ekinlarni qo'shimcha sug'oring.",
      "Uzum va o'rik uchun iqlim juda qulay — chidamli navlarni tanlang.",
      "Bug'doy ekish uchun oktyabr boshini tanlang.",
    ],
  },
  buxoro: {
    nameUz: "Buxoro",
    zone: "quruq cho'l",
    avgSummerTemp: 36,
    annualRain: 160,
    mainRisks: ["kuchli quruqlik", "haddan tashqari issiq", "tuproq sho'rlanishi"],
    recommendedCrops: ["paxta", "bugdoy", "piyoz", "bodring"],
    irrigationFactor: 1.4,
    tips: [
      "Sug'orish me'yorini oshiring: yillik yog'ingarchilik juda kam (160 mm).",
      "Tuproq sho'rlanishiga qarshi gipslantirishni amalga oshiring.",
      "Ertalab (06:00–09:00) va kechqurun (19:00–21:00) sug'orish tavsiya etiladi.",
      "Issiqqa chidamli paxta navlarini (Buxoro-6, Buxoro-8) tanlang.",
    ],
  },
  xorazm: {
    nameUz: "Xorazm",
    zone: "quruq cho'l",
    avgSummerTemp: 37,
    annualRain: 100,
    mainRisks: ["ekstrem issiq", "kuchli quruqlik", "sho'rlangan tuproq", "kech bahorda sovuq"],
    recommendedCrops: ["paxta", "bugdoy", "guruch", "pomidor", "piyoz"],
    irrigationFactor: 1.5,
    tips: [
      "Sug'orish normasini 50% oshiring — yillik yog'ingarchilik atigi 100 mm.",
      "Guruch ekish mumkin: Amudaryo suvi mavjud bo'lsa, may oyida boshlang.",
      "Tuproq sho'rlanishi jiddiy muammo: tuzni yuvish uchun kuz-qishda yuvish sug'orishi o'tkazing.",
      "Qovun va tarvuz bu iqlimda yuqori sifatli yetiladi.",
    ],
  },
  // ── Farg'ona vodiysi ───────────────────────────────────────────────────
  "farg'ona": {
    nameUz: "Farg'ona",
    zone: "mo'tadil vodiy",
    avgSummerTemp: 31,
    annualRain: 130,
    mainRisks: ["bahorgi sovuq", "quruq yoz", "zararkunandalar"],
    recommendedCrops: ["paxta", "uzum", "pomidor", "bodring", "kartoshka", "piyoz"],
    irrigationFactor: 1.2,
    tips: [
      "Farg'ona vodiysida paxta va uzum an'anaviy asosiy ekin.",
      "Bahor sovuqlari aprel oxirigacha davom etishi mumkin.",
      "Bodring va pomidor uchun issiqxona yoki plёnka ostida erta ekish mumkin.",
    ],
  },
  namangan: {
    nameUz: "Namangan",
    zone: "mo'tadil vodiy",
    avgSummerTemp: 31,
    annualRain: 135,
    mainRisks: ["bahorgi sovuq", "zararkunandalar"],
    recommendedCrops: ["paxta", "uzum", "pomidor", "bodring", "piyoz"],
    irrigationFactor: 1.2,
    tips: [
      "Namangan uzumi (Ko'k yelki, Toifi) mashhur — uzum plantatsiyalarini rivojlantiring.",
      "Ipakchilik uchun tut daraxti eking.",
      "Bahorgi sovuq aprel o'rtasigacha xavf tug'diradi.",
    ],
  },
  andijon: {
    nameUz: "Andijon",
    zone: "mo'tatil vodiy",
    avgSummerTemp: 30,
    annualRain: 145,
    mainRisks: ["bahorgi sovuq", "zararkunandalar"],
    recommendedCrops: ["paxta", "pomidor", "bodring", "kartoshka", "piyoz"],
    irrigationFactor: 1.15,
    tips: [
      "Andijon iqlimi sabzavotchilik uchun juda qulay.",
      "Kartoshka ekishda may oyini tanlang — tuproq 10°C ga yetganda.",
      "Piyoz Andijon bozorida yuqori talabga ega.",
    ],
  },
  // ── Janubiy hududlar ───────────────────────────────────────────────────
  surxondaryo: {
    nameUz: "Surxondaryo",
    zone: "subtropik",
    avgSummerTemp: 38,
    annualRain: 300,
    mainRisks: ["haddan tashqari issiq", "issiq shamollar"],
    recommendedCrops: ["paxta", "limon", "anor", "uzum", "pomidor"],
    irrigationFactor: 1.3,
    tips: [
      "O'zbekistondagi eng issiq viloyat — issiqqa bardoshli navlarni tanlang.",
      "Limon va anor bu yerda ochiq dalada o'sadi.",
      "Tushki paytda (12:00–16:00) sug'orishdan saqlaning — bug'lanish yuqori.",
    ],
  },
  qashqadaryo: {
    nameUz: "Qashqadaryo",
    zone: "yarim-quruq",
    avgSummerTemp: 34,
    annualRain: 300,
    mainRisks: ["quruqlik", "issiq shamollar"],
    recommendedCrops: ["bugdoy", "paxta", "uzum", "pomidor", "piyoz"],
    irrigationFactor: 1.2,
    tips: [
      "Don ekinlari Qashqadaryo uchun asosiy ekin.",
      "Tog' etaklarida bog'dorchilik yaxshi rivojlangan.",
      "Sug'orish uchun Qashqadaryo suv omboridan foydalaning.",
    ],
  },
  // ── Shimoliy cho'l hududlari ───────────────────────────────────────────
  navoiy: {
    nameUz: "Navoiy",
    zone: "quruq cho'l",
    avgSummerTemp: 36,
    annualRain: 150,
    mainRisks: ["quruqlik", "kuchli issiq", "sho'rlangan tuproq"],
    recommendedCrops: ["paxta", "bugdoy", "piyoz"],
    irrigationFactor: 1.4,
    tips: [
      "Sug'orish infratuzilmasiga alohida e'tibor bering.",
      "Sho'rlangan tuproqni melioratsiya qiling.",
      "Qishda tuproq yuviish sug'orishini o'tkazing.",
    ],
  },
  jizzax: {
    nameUz: "Jizzax",
    zone: "yarim-quruq",
    avgSummerTemp: 33,
    annualRain: 270,
    mainRisks: ["quruqlik", "kuchli issiq"],
    recommendedCrops: ["bugdoy", "paxta", "pomidor", "piyoz", "bodring"],
    irrigationFactor: 1.2,
    tips: [
      "Bug'doy va paxta Jizzax tekisligida asosiy ekin.",
      "Yangi o'zlashtirilgan yerlarni melioratsiya qilishni unutmang.",
      "Kanallar orqali sug'orish samarali foydalanish imkoniyatini tekshiring.",
    ],
  },
  sirdaryo: {
    nameUz: "Sirdaryo",
    zone: "yarim-quruq",
    avgSummerTemp: 32,
    annualRain: 280,
    mainRisks: ["quruqlik", "bahorgi toshqin xavfi"],
    recommendedCrops: ["bugdoy", "paxta", "pomidor", "piyoz"],
    irrigationFactor: 1.15,
    tips: [
      "Sirdaryo qirg'oqlaridagi yerlar hosildor.",
      "Bahorgi toshqin xavfiga qarshi ekinlarni balandroq joyga ering.",
      "Beda va em-xashak ekinlari uchun iqlim qulay.",
    ],
  },
};

/**
 * Hudud nomini normallashtiradi (kichik harf, apostrof normalizatsiya).
 */
function normalizeRegion(name) {
  return name
    .toLowerCase()
    .replace(/'/g, "'")  // to'g'ri apostrof → standart
    .trim();
}

/**
 * Hudud nomiga mos profilni topadi.
 * To'liq mos kelmasasa, qisman mos qidiradi.
 */
function findRegionProfile(regionName) {
  if (!regionName) return null;
  const key = normalizeRegion(regionName);
  if (!key) return null;

  // To'g'ridan-to'g'ri kalit
  if (regionProfiles[key]) return regionProfiles[key];

  // Qisman mos (masalan, "Farg'ona viloyati" → "farg'ona")
  for (const [profileKey, profile] of Object.entries(regionProfiles)) {
    if (key.includes(profileKey) || profileKey.includes(key)) {
      return profile;
    }
  }

  return null;
}

/**
 * Berilgan hudud uchun iqlimga xos tavsiyalar qaytaradi.
 * Agar hudud topilmasa, null qaytaradi.
 */
function getRegionTips(regionName) {
  const profile = findRegionProfile(regionName);
  if (!profile) return null;

  const extraTips = [];

  // Sug'orish normasi haqida ogohlantiruv
  if (profile.irrigationFactor >= 1.3) {
    extraTips.push(
      `${profile.nameUz} iqlimi quruq: sug'orish me'yorini ${Math.round((profile.irrigationFactor - 1) * 100)}% oshiring.`
    );
  }

  // Asosiy tavsiya ekinlar
  const cropNames = {
    bugdoy: "bug'doy", paxta: "paxta", pomidor: "pomidor",
    bodring: "bodring", uzum: "uzum", kartoshka: "kartoshka", piyoz: "piyoz",
    guruch: "guruch", limon: "limon", anor: "anor",
  };
  const cropList = profile.recommendedCrops
    .map((c) => cropNames[c] || c)
    .join(", ");
  extraTips.push(`${profile.nameUz} uchun tavsiya etilgan ekinlar: ${cropList}.`);

  return {
    regionName: profile.nameUz,
    zone: profile.zone,
    annualRain: profile.annualRain,
    mainRisks: profile.mainRisks,
    tips: [...profile.tips, ...extraTips],
    irrigationFactor: profile.irrigationFactor,
  };
}

module.exports = {
  getRegionTips,
  findRegionProfile,
  regionProfiles,
};
