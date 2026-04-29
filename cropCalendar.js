/**
 * Ekin kalendarı: ekish, parvarishlash va yig'im-terim muddatlari.
 * Oylar 1–12 raqamlar bilan ifodalangan.
 * O'zbekistonning o'rtacha iqlim sharoitiga asoslangan.
 */
const MONTHS = [
  "Yanvar", "Fevral", "Mart", "Aprel", "May", "Iyun",
  "Iyul", "Avgust", "Sentyabr", "Oktyabr", "Noyabr", "Dekabr",
];

const cropCalendars = {
  bugdoy: {
    nameUz: "Bug'doy",
    stages: [
      { name: "Ekish",             months: [10, 11],      color: "green",  icon: "🌱" },
      { name: "Tuplanish",         months: [11, 12, 1, 2],color: "blue",   icon: "💧" },
      { name: "Naychalash",        months: [3, 4],         color: "yellow", icon: "🌿" },
      { name: "Boshoqlash",        months: [5],            color: "orange", icon: "🌾" },
      { name: "Pishish & Yig'im",  months: [6, 7],         color: "red",    icon: "🚜" },
    ],
    notes: [
      "Kuzgi bug'doyni 1–20 oktyabrda ering.",
      "Bahorda azotli o'g'it bering (naychalash bosqichi).",
      "Yig'imni o'tkir olmosdan boshlamasdan avval donni tekshiring.",
    ],
  },
  paxta: {
    nameUz: "Paxta",
    stages: [
      { name: "Tuproq tayyorlash", months: [3],            color: "blue",   icon: "🔧" },
      { name: "Ekish",             months: [4, 5],         color: "green",  icon: "🌱" },
      { name: "Ko'karish & Parvarishlash", months: [5, 6], color: "blue",   icon: "💧" },
      { name: "Gullash",           months: [7, 8],         color: "yellow", icon: "🌸" },
      { name: "Ko'sak to'lishi",   months: [8, 9],         color: "orange", icon: "🌿" },
      { name: "Yig'im",            months: [9, 10, 11],   color: "red",    icon: "🚜" },
    ],
    notes: [
      "Tuproq harorati 12°C dan yuqori bo'lganda ering (aprel oxiri — may boshi).",
      "Gullash davrida sug'orishni kamaytirmang.",
      "Yig'imni kech kuzgacha cho'zmang — sovuq kosa ochilmagan qolsalar.",
    ],
  },
  pomidor: {
    nameUz: "Pomidor",
    stages: [
      { name: "Ko'chat yetishtirish", months: [2, 3],      color: "green",  icon: "🌱" },
      { name: "Ko'chat o'tkazish",    months: [4, 5],      color: "blue",   icon: "🔧" },
      { name: "O'sish & Parvarishlash",months: [5, 6],     color: "blue",   icon: "💧" },
      { name: "Gullash",              months: [6, 7],      color: "yellow", icon: "🌸" },
      { name: "Meva to'lishi",        months: [7, 8],      color: "orange", icon: "🍅" },
      { name: "Yig'im",               months: [8, 9, 10],  color: "red",    icon: "🚜" },
    ],
    notes: [
      "Ko'chatni issiqxonada fevral–mart oylarida yetishtirib, aprel oxirida dalaga o'tkazing.",
      "Gullash davrida kalsiy nitrat purkang (cho'lama kasalligini oldini olish).",
      "Ikkinchi ekish (iyul) uchun erta pishadigan navlarni tanlang.",
    ],
  },
  bodring: {
    nameUz: "Bodring",
    stages: [
      { name: "Ko'chat / To'g'ridan ekish", months: [4, 5], color: "green", icon: "🌱" },
      { name: "O'sish",             months: [5, 6],         color: "blue",   icon: "💧" },
      { name: "Gullash",            months: [6],            color: "yellow", icon: "🌸" },
      { name: "Meva berish",        months: [6, 7, 8],      color: "orange", icon: "🥒" },
      { name: "Yig'im tugaydi",     months: [9],            color: "red",    icon: "🚜" },
    ],
    notes: [
      "Tuproq harorati 15°C dan yuqori bo'lganda ering.",
      "Namlikning keskin o'zgarishi mevasini achchiq qiladi.",
      "Har 2 kunda yig'im qiling — o'sib ketgan bodring keyingi hosildorlikni kamaytiradi.",
    ],
  },
  uzum: {
    nameUz: "Uzum",
    stages: [
      { name: "Qishlash & Kesish", months: [2, 3],         color: "blue",   icon: "✂️" },
      { name: "Ko'karish",         months: [4],            color: "green",  icon: "🌱" },
      { name: "O'sish",            months: [5, 6],         color: "blue",   icon: "💧" },
      { name: "Gullash",           months: [6],            color: "yellow", icon: "🌸" },
      { name: "Gilos o'sishi",     months: [7, 8],         color: "orange", icon: "🍇" },
      { name: "Pishish & Yig'im",  months: [8, 9, 10],    color: "red",    icon: "🚜" },
      { name: "Qishlashga tayyorlik", months: [11, 12],    color: "blue",   icon: "🛡️" },
    ],
    notes: [
      "Bahorda shoxlarni kesish (mart) yangi novdalar o'sishini kuchaytiradi.",
      "Gullash davrida fungitsid purkang (mildyu va oidiumga qarshi).",
      "Sovuq viloyatlarda (Toshkent, Samarqand) qishda koptir bilan ko'mish tavsiya etiladi.",
    ],
  },
  kartoshka: {
    nameUz: "Kartoshka",
    stages: [
      { name: "Urug'lik tayyorlash", months: [3],          color: "blue",   icon: "🔧" },
      { name: "Ekish (bahorgi)",     months: [3, 4],        color: "green",  icon: "🌱" },
      { name: "Ko'karish",           months: [4, 5],        color: "blue",   icon: "💧" },
      { name: "Gullash",             months: [5, 6],        color: "yellow", icon: "🌸" },
      { name: "Tuganak to'lishi",    months: [6, 7],        color: "orange", icon: "🥔" },
      { name: "Yig'im (bahorgi)",    months: [7, 8],        color: "red",    icon: "🚜" },
      { name: "Ekish (kuzgi)",       months: [8],           color: "green",  icon: "🌱" },
      { name: "Yig'im (kuzgi)",      months: [10, 11],      color: "red",    icon: "🚜" },
    ],
    notes: [
      "Tuproq harorati 8–10°C bo'lganda ering.",
      "Fitoftoraga qarshi profilaktik purkashni ko'karish boshlanishida boshlang.",
      "Ikkinchi ekish uchun avgust boshi eng qulay — issiq pasayib, kasallik kamayadi.",
    ],
  },
  piyoz: {
    nameUz: "Piyoz",
    stages: [
      { name: "Urug' / Ko'chat ekish", months: [3, 4],     color: "green",  icon: "🌱" },
      { name: "O'sish",               months: [4, 5],      color: "blue",   icon: "💧" },
      { name: "Piyoz boshi shakllanishi", months: [5, 6],  color: "yellow", icon: "🌿" },
      { name: "Pishish",              months: [6, 7],      color: "orange", icon: "🧅" },
      { name: "Yig'im & Quritish",    months: [7, 8],      color: "red",    icon: "🚜" },
    ],
    notes: [
      "Mart oxirida urug' yoki ko'chat ering.",
      "Piyoz boshining og'irligi 200–300 g ga yetishi uchun fosfor-kaliy o'g'iti bering.",
      "Yig'im oldidan 2 hafta sug'orishni to'xtating — qurishni tezlashtiradi.",
    ],
  },
};

/**
 * Berilgan ekin uchun to'liq kalendar ma'lumotini qaytaradi.
 * Joriy oyni hisobga olib, hozirgi va keyingi bosqichni ajratib ko'rsatadi.
 */
function getCropCalendar(crop) {
  const calendar = cropCalendars[crop];
  if (!calendar) return null;

  const currentMonth = new Date().getMonth() + 1; // 1–12

  const stagesWithStatus = calendar.stages.map((stage) => {
    const isActive = stage.months.includes(currentMonth);
    const nextMonth = currentMonth === 12 ? 1 : currentMonth + 1;
    const isUpcoming = stage.months.includes(nextMonth) && !isActive;

    return {
      ...stage,
      monthNames: stage.months.map((m) => MONTHS[m - 1]),
      isActive,
      isUpcoming,
    };
  });

  // Joriy bosqich
  const activeStage = stagesWithStatus.find((s) => s.isActive) || null;
  const upcomingStage = stagesWithStatus.find((s) => s.isUpcoming) || null;

  return {
    crop,
    cropName: calendar.nameUz,
    currentMonth: MONTHS[currentMonth - 1],
    stages: stagesWithStatus,
    activeStage,
    upcomingStage,
    notes: calendar.notes,
  };
}

/**
 * Joriy oyda bajariladigan vazifalar ro'yxatini barcha ekinlar bo'yicha qaytaradi.
 */
function getCurrentMonthTasks() {
  const currentMonth = new Date().getMonth() + 1;
  const tasks = [];

  for (const [cropKey, calendar] of Object.entries(cropCalendars)) {
    for (const stage of calendar.stages) {
      if (stage.months.includes(currentMonth)) {
        tasks.push({
          crop: cropKey,
          cropName: calendar.nameUz,
          stage: stage.name,
          icon: stage.icon,
        });
      }
    }
  }

  return { month: MONTHS[currentMonth - 1], tasks };
}

module.exports = {
  getCropCalendar,
  getCurrentMonthTasks,
  cropCalendars,
  MONTHS,
};
