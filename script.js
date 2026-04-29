const menuBtn    = document.getElementById("menuBtn");
const menu       = document.getElementById("menu");
const aiForm     = document.getElementById("aiForm");
const resultBox  = document.getElementById("resultBox");
const weatherBtn = document.getElementById("weatherBtn");
const weatherStatus = document.getElementById("weatherStatus");
const marketForm    = document.getElementById("marketForm");
const marketResult  = document.getElementById("marketResult");
const historyList   = document.getElementById("historyList");
const clearHistoryBtn = document.getElementById("clearHistoryBtn");

const API_BASE_URL =
  window.location.protocol === "file:" || window.location.port !== "3000"
    ? "http://localhost:3000"
    : "";

const HISTORY_KEY  = "dehqon_history";
const HISTORY_LIMIT = 10;

// ─── Yordamchi: fetch + JSON tekshirish ────────────────────────────────────
async function fetchJsonOrThrow(url, options = {}) {
  const response = await fetch(url, options);
  const contentType = response.headers.get("content-type") || "";
  const isJson = contentType.includes("application/json");
  const data = isJson ? await response.json() : null;

  if (!response.ok) {
    throw new Error(
      data?.error ||
        "Serverdan noto'g'ri javob keldi. Sahifani http://localhost:3000 dan oching."
    );
  }
  if (!isJson) {
    throw new Error(
      "Server JSON qaytarmadi. Iltimos, http://localhost:3000 manzilidan qayta oching."
    );
  }
  return data;
}

// ─── Mobil menyu ───────────────────────────────────────────────────────────
menuBtn.addEventListener("click", () => {
  menu.classList.toggle("open");
});

// ─── Ob-havo avtomatik to'ldirish ─────────────────────────────────────────
async function fillWeatherByRegion() {
  const regionInput      = document.getElementById("region");
  const temperatureInput = document.getElementById("temperature");
  const moistureInput    = document.getElementById("moisture");
  const region = regionInput.value.trim();

  if (!region) {
    weatherStatus.textContent = "Avval hudud nomini kiriting.";
    return;
  }

  weatherBtn.disabled = true;
  weatherStatus.textContent = "Ob-havo ma'lumotlari olinmoqda...";

  try {
    const data = await fetchJsonOrThrow(
      `${API_BASE_URL}/api/weather?region=${encodeURIComponent(region)}`
    );
    temperatureInput.value = data.temperature;
    moistureInput.value    = data.humidity;
    weatherStatus.textContent =
      `${data.region} uchun ma'lumot to'ldirildi: ${data.temperature}°C, ${data.humidity}% namlik.`;
  } catch (error) {
    weatherStatus.textContent = error.message || "Xatolik yuz berdi. Qayta urinib ko'ring.";
  } finally {
    weatherBtn.disabled = false;
  }
}

weatherBtn.addEventListener("click", fillWeatherByRegion);

// ─── LocalStorage tarix ────────────────────────────────────────────────────
function loadHistory() {
  try {
    return JSON.parse(localStorage.getItem(HISTORY_KEY) || "[]");
  } catch {
    return [];
  }
}

function saveToHistory(entry) {
  const history = loadHistory();
  history.unshift(entry);          // yangi yozuv boshiga qo'shiladi
  if (history.length > HISTORY_LIMIT) history.splice(HISTORY_LIMIT);
  localStorage.setItem(HISTORY_KEY, JSON.stringify(history));
}

function renderHistory() {
  const history = loadHistory();
  if (!historyList) return;

  if (history.length === 0) {
    historyList.innerHTML = '<p class="muted">Hali maslahat olinmagan.</p>';
    return;
  }

  historyList.innerHTML = history
    .map(
      (item, idx) => `
      <div class="history-card">
        <div class="history-meta">
          <span class="history-num">#${idx + 1}</span>
          <span>${item.date}</span>
          <span>${item.region} | ${item.crop.toUpperCase()}</span>
          <span class="${riskClass(item.risk)}">${item.risk}</span>
        </div>
        <ul class="history-tips">
          ${item.tips.map((t) => `<li>${t}</li>`).join("")}
        </ul>
      </div>`
    )
    .join("");
}

function riskClass(riskText) {
  if (!riskText) return "";
  if (riskText.includes("YUQORI")) return "risk-high";
  if (riskText.includes("O'RTA"))  return "risk-medium";
  return "risk-low";
}

// ─── AI maslahat formasi ───────────────────────────────────────────────────
aiForm.addEventListener("submit", async (event) => {
  event.preventDefault();

  const region      = document.getElementById("region").value.trim();
  const crop        = document.getElementById("crop").value;
  const moisture    = Number(document.getElementById("moisture").value);
  const temperature = Number(document.getElementById("temperature").value);
  const ph          = document.getElementById("ph")?.value || "";
  const nitrogen    = document.getElementById("nitrogen")?.value || "";

  if (!region || !crop || Number.isNaN(moisture) || Number.isNaN(temperature)) {
    resultBox.innerHTML = `
      <h3>Natija</h3>
      <p class="muted">Iltimos, barcha majburiy maydonlarni to'g'ri to'ldiring.</p>
    `;
    return;
  }

  resultBox.innerHTML = `
    <h3>Natija</h3>
    <p class="muted">AI maslahat olinmoqda...</p>
  `;

  try {
    const data = await fetchJsonOrThrow(`${API_BASE_URL}/api/advice`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ region, crop, moisture, temperature, ph, nitrogen }),
    });

    // Xavf darajasini tiplar ichidan topamiz
    const riskTip = data.tips.find((t) => t.startsWith("Kasallik xavfi:")) || "";

    resultBox.innerHTML = `
      <h3>AI Tavsiya Natijasi</h3>
      <p class="muted">Hudud: ${data.region} | Ekin: ${data.crop.toUpperCase()}</p>
      <ul class="result-list">
        ${data.tips.map((tip) => `<li class="${riskTipClass(tip)}">${tip}</li>`).join("")}
      </ul>
    `;

    // Tarixga saqlash
    const now = new Date();
    const dateStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")} ${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;
    saveToHistory({ date: dateStr, region: data.region, crop: data.crop, tips: data.tips, risk: riskTip });
    renderHistory();
  } catch (error) {
    resultBox.innerHTML = `
      <h3>Natija</h3>
      <p class="muted">${
        error.message ||
        "Xatolik yuz berdi. Sahifani localhost orqali ochib qayta urinib ko'ring."
      }</p>
    `;
  }
});

function riskTipClass(tip) {
  if (tip.includes("YUQORI")) return "tip-danger";
  if (tip.includes("O'RTA"))  return "tip-warning";
  return "";
}

// ─── Bozor trendi ─────────────────────────────────────────────────────────
if (marketForm && marketResult) {
  marketForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    const crop = document.getElementById("marketCrop").value;

    if (!crop) {
      marketResult.textContent = "Avval ekin turini tanlang.";
      return;
    }

    marketResult.innerHTML = '<p class="muted">Bozor trendi hisoblanmoqda...</p>';

    try {
      const data = await fetchJsonOrThrow(
        `${API_BASE_URL}/api/market-trend?crop=${encodeURIComponent(crop)}`
      );

      const trendEmoji =
        data.trend === "osmoqda"    ? "📈" :
        data.trend === "pasaymoqda" ? "📉" : "➡️";

      const priceBar = data.prices
        .map((p, i) => {
          const label = i === data.prices.length - 1 ? "<strong>Bugun</strong>" : `${data.prices.length - 1 - i}k oldin`;
          return `<div class="price-row"><span class="price-label">${label}</span><span class="price-val">${p.toLocaleString("uz")} so'm</span></div>`;
        })
        .slice(-7)   // faqat so'nggi 7 kunni ko'rsatamiz
        .join("");

      marketResult.innerHTML = `
        <div class="market-summary">
          <span class="trend-badge trend-${data.trend}">${trendEmoji} ${data.trend}</span>
          <span class="trend-pct">${data.changePercent >= 0 ? "+" : ""}${data.changePercent}%</span>
          <span class="current-price">Joriy: ${data.currentPrice.toLocaleString("uz")} so'm/kg</span>
        </div>
        <div class="price-history">${priceBar}</div>
        <p class="market-recommendation">${data.recommendation}</p>
      `;
    } catch (error) {
      marketResult.textContent = error.message || "Xatolik yuz berdi.";
    }
  });
}

// ─── Ekin kalendarı ───────────────────────────────────────────────────────
const calendarForm   = document.getElementById("calendarForm");
const calendarResult = document.getElementById("calendarResult");

if (calendarForm && calendarResult) {
  calendarForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    const crop = document.getElementById("calendarCrop").value;
    if (!crop) { calendarResult.innerHTML = '<p class="muted">Ekin turini tanlang.</p>'; return; }

    calendarResult.innerHTML = '<p class="muted">Yuklanmoqda...</p>';

    try {
      const data = await fetchJsonOrThrow(`${API_BASE_URL}/api/calendar?crop=${encodeURIComponent(crop)}`);

      const stagesHtml = data.stages.map((s) => {
        const cls = s.isActive ? "stage-active" : s.isUpcoming ? "stage-upcoming" : "stage-normal";
        const badge = s.isActive ? '<span class="stage-badge">Hozir</span>' :
                      s.isUpcoming ? '<span class="stage-badge badge-soon">Keyingi</span>' : "";
        return `
          <div class="stage-card ${cls}">
            <span class="stage-icon">${s.icon}</span>
            <div class="stage-info">
              <strong>${s.name}</strong>${badge}
              <span class="stage-months">${s.monthNames.join(" – ")}</span>
            </div>
          </div>`;
      }).join("");

      const notesHtml = data.notes.map((n) => `<li>${n}</li>`).join("");

      calendarResult.innerHTML = `
        <h3>${data.cropName} kalendarı <span class="calendar-month">(${data.currentMonth})</span></h3>
        ${data.activeStage ? `<p class="active-stage-msg">${data.activeStage.icon} Hozir: <strong>${data.activeStage.name}</strong></p>` : ""}
        <div class="stages-grid">${stagesHtml}</div>
        <div class="calendar-notes">
          <strong>Muhim eslatmalar:</strong>
          <ul>${notesHtml}</ul>
        </div>`;
    } catch (error) {
      calendarResult.innerHTML = `<p class="muted">${error.message}</p>`;
    }
  });
}

// ─── Hudud ma'lumoti ──────────────────────────────────────────────────────
const regionForm       = document.getElementById("regionForm");
const regionInfoResult = document.getElementById("regionInfoResult");

if (regionForm && regionInfoResult) {
  regionForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    const region = document.getElementById("regionInfoInput").value.trim();
    if (!region) { regionInfoResult.textContent = "Viloyat nomini kiriting."; return; }

    regionInfoResult.innerHTML = '<p class="muted">Yuklanmoqda...</p>';

    try {
      const data = await fetchJsonOrThrow(
        `${API_BASE_URL}/api/region-info?region=${encodeURIComponent(region)}`
      );

      const risksHtml = data.mainRisks.map((r) => `<span class="risk-tag">${r}</span>`).join("");
      const tipsHtml  = data.tips.map((t) => `<li>${t}</li>`).join("");

      regionInfoResult.innerHTML = `
        <div class="region-header">
          <h3>${data.regionName}</h3>
          <span class="zone-badge">${data.zone}</span>
        </div>
        <div class="region-stats">
          <div class="rstat"><span class="rstat-label">Yillik yog'in</span><strong>${data.annualRain} mm</strong></div>
          <div class="rstat"><span class="rstat-label">Sug'orish +</span><strong>${Math.round((data.irrigationFactor - 1) * 100)}%</strong></div>
        </div>
        <div class="region-risks">${risksHtml}</div>
        <ul class="region-tips">${tipsHtml}</ul>`;
    } catch (error) {
      regionInfoResult.innerHTML = `<p class="muted">${error.message}</p>`;
    }
  });
}

// ─── Alertlar paneli ─────────────────────────────────────────────────────
const alertsPanel      = document.getElementById("alertsPanel");
const refreshAlertsBtn = document.getElementById("refreshAlertsBtn");

const ALERT_ICONS = { success: "📈", danger: "📉", warning: "⚠️", info: "ℹ️", neutral: "➡️" };

async function loadAlerts() {
  if (!alertsPanel) return;
  alertsPanel.innerHTML = '<p class="muted">Yuklanmoqda...</p>';
  try {
    const data = await fetchJsonOrThrow(`${API_BASE_URL}/api/alerts`);
    if (!data.alerts || data.alerts.length === 0) {
      alertsPanel.innerHTML = '<p class="muted">Hozircha muhim signal yo\'q.</p>';
      return;
    }
    alertsPanel.innerHTML = data.alerts.map((a) => `
      <div class="alert-card alert-${a.type}">
        <div class="alert-top">
          <span class="alert-icon">${ALERT_ICONS[a.type] || "•"}</span>
          <span class="alert-title">${a.title}</span>
          <span class="alert-crop">${a.cropName}</span>
        </div>
        <p class="alert-msg">${a.message}</p>
        <p class="alert-action">${a.action}</p>
      </div>`).join("");
  } catch (e) {
    alertsPanel.innerHTML = `<p class="muted">${e.message}</p>`;
  }
}

if (refreshAlertsBtn) refreshAlertsBtn.addEventListener("click", loadAlerts);
loadAlerts();

// ─── Sug'orish jadvali ────────────────────────────────────────────────────
const irrigationForm   = document.getElementById("irrigationForm");
const irrigationResult = document.getElementById("irrigationResult");

if (irrigationForm && irrigationResult) {
  irrigationForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    const crop     = document.getElementById("irrigCrop").value;
    const temp     = document.getElementById("irrigTemp").value;
    const moisture = document.getElementById("irrigMoisture").value;
    const region   = document.getElementById("irrigRegion").value.trim();

    irrigationResult.innerHTML = '<p class="muted">Jadval tuzilmoqda...</p>';
    try {
      const data = await fetchJsonOrThrow(`${API_BASE_URL}/api/irrigation`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ crop, temperature: temp, moisture, region }),
      });

      const rows = data.days.map((d) => `
        <tr class="${d.needsIrrigation ? "row-irrigate" : ""}">
          <td><strong>${d.day}</strong> <span class="date-small">${d.date}</span></td>
          <td>${d.tempC}°C</td>
          <td>${d.etcMm} mm</td>
          <td class="moisture-cell">${d.soilMoisture}%</td>
          <td>${d.irrigationMm > 0 ? `<span class="irrig-mm">${d.irrigationMm} mm</span>` : "—"}</td>
          <td class="rec-cell">${d.recommendation}</td>
        </tr>`).join("");

      irrigationResult.innerHTML = `
        <div class="irrig-summary ${data.irrigDays > 3 ? "summary-warn" : "summary-ok"}">
          <strong>${data.summary}</strong>
          <span>Bosqich: ${data.stage} | ET₀: ${data.et0Base.toFixed(1)} mm/kun | Kc: ${data.kcValue}</span>
        </div>
        <div class="table-scroll">
          <table class="irrig-table">
            <thead><tr><th>Kun</th><th>Harorat</th><th>ETc</th><th>Namlik</th><th>Sug'orish</th><th>Tavsiya</th></tr></thead>
            <tbody>${rows}</tbody>
          </table>
        </div>`;
    } catch (err) {
      irrigationResult.innerHTML = `<p class="muted">${err.message}</p>`;
    }
  });
}

// ─── Kasallik mavsumiy trendi ─────────────────────────────────────────────
const diseaseTrendForm   = document.getElementById("diseaseTrendForm");
const diseaseTrendResult = document.getElementById("diseaseTrendResult");

if (diseaseTrendForm && diseaseTrendResult) {
  diseaseTrendForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    const crop = document.getElementById("diseaseTrendCrop").value;
    if (!crop) return;
    diseaseTrendResult.innerHTML = '<p class="muted">Yuklanmoqda...</p>';
    try {
      const data = await fetchJsonOrThrow(`${API_BASE_URL}/api/disease-trend?crop=${encodeURIComponent(crop)}`);
      const currentMonth = new Date().getMonth();
      const maxM = Math.max(...data.trend.map((t) => t.multiplier));

      const bars = data.trend.map((t, i) => {
        const pct    = Math.round((t.multiplier / maxM) * 100);
        const active = i === currentMonth ? "bar-active" : "";
        const level  = t.multiplier >= 2.0 ? "bar-high" : t.multiplier >= 1.3 ? "bar-mid" : "bar-low";
        return `
          <div class="trend-bar-col ${active}">
            <div class="trend-bar-wrap">
              <div class="trend-bar ${level}" style="height:${pct}%" title="${t.outbreakPct}% chiqish ehtimoli"></div>
            </div>
            <span class="trend-month">${t.month}</span>
          </div>`;
      }).join("");

      diseaseTrendResult.innerHTML = `
        <div class="trend-chart">${bars}</div>
        <div class="trend-legend">
          <span class="leg leg-high">Yuqori xavf</span>
          <span class="leg leg-mid">O'rta xavf</span>
          <span class="leg leg-low">Past xavf</span>
          <span class="leg leg-active">Joriy oy</span>
        </div>`;
    } catch (err) {
      diseaseTrendResult.innerHTML = `<p class="muted">${err.message}</p>`;
    }
  });
}

// ─── Tarixni tozalash ─────────────────────────────────────────────────────
if (clearHistoryBtn) {
  clearHistoryBtn.addEventListener("click", () => {
    localStorage.removeItem(HISTORY_KEY);
    renderHistory();
  });
}

// ─── Sahifa yuklanganda tarixni ko'rsatish ────────────────────────────────
renderHistory();

// ═══════════════════════════════════════════════════════════════════════════
// PHASE 4 — UX POLISH
// ═══════════════════════════════════════════════════════════════════════════

// ─── Toast bildirishnoma tizimi ────────────────────────────────────────────
(function setupToast() {
  const container = document.createElement("div");
  container.id = "toast-container";
  document.body.appendChild(container);

  window.showToast = function(msg, type = "info", duration = 3500) {
    const icons = { success: "✓", error: "✕", info: "ℹ", warning: "⚠" };
    const toast = document.createElement("div");
    toast.className = `toast toast-${type}`;
    toast.innerHTML = `<span class="toast-icon">${icons[type] || "•"}</span><span class="toast-msg">${msg}</span>`;
    container.appendChild(toast);
    setTimeout(() => {
      toast.classList.add("hide");
      toast.addEventListener("animationend", () => toast.remove());
    }, duration);
  };
})();

// ─── Scroll reveal (Intersection Observer) ────────────────────────────────
(function setupReveal() {
  const sections = document.querySelectorAll(".reveal");
  if (!sections.length) return;
  const obs = new IntersectionObserver((entries) => {
    entries.forEach((e) => {
      if (e.isIntersecting) {
        e.target.classList.add("visible");
        obs.unobserve(e.target);
      }
    });
  }, { threshold: 0, rootMargin: "0px 0px 0px 0px" });
  sections.forEach((s) => obs.observe(s));

  // Sahifa yuklanganda ko'rinadigan sectionlarni darhol ko'rsatish
  requestAnimationFrame(() => {
    sections.forEach((s) => {
      const r = s.getBoundingClientRect();
      if (r.top < window.innerHeight) s.classList.add("visible");
    });
  });
})();

// ─── Stats counter animatsiyasi ───────────────────────────────────────────
(function setupCounters() {
  const nums = document.querySelectorAll(".stats strong");
  if (!nums.length) return;

  function countUp(el) {
    const raw = el.textContent.replace(/\s/g, "").replace(",", ".");
    const isPercent = raw.includes("%");
    const target = parseFloat(raw);
    if (isNaN(target)) return;
    const duration = 1400;
    const start = performance.now();
    function tick(now) {
      const elapsed = now - start;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3); // ease-out cubic
      const current = Math.round(eased * target);
      el.textContent = isPercent
        ? current + "%"
        : current.toLocaleString("uz");
      if (progress < 1) requestAnimationFrame(tick);
    }
    requestAnimationFrame(tick);
  }

  const obs = new IntersectionObserver((entries) => {
    entries.forEach((e) => {
      if (e.isIntersecting) {
        nums.forEach(countUp);
        obs.disconnect();
      }
    });
  }, { threshold: 0.5 });

  const statsEl = document.querySelector(".stats");
  if (statsEl) obs.observe(statsEl);
})();

// ─── Active nav link on scroll ────────────────────────────────────────────
(function setupActiveNav() {
  const navLinks = document.querySelectorAll(".menu a[href^='#']");
  if (!navLinks.length) return;

  const sectionIds = Array.from(navLinks).map((a) => a.getAttribute("href").slice(1));

  function updateActive() {
    let current = "";
    sectionIds.forEach((id) => {
      const el = document.getElementById(id);
      if (!el) return;
      if (window.scrollY >= el.offsetTop - 100) current = id;
    });
    navLinks.forEach((a) => {
      a.classList.toggle("nav-active", a.getAttribute("href") === "#" + current);
    });
  }

  window.addEventListener("scroll", updateActive, { passive: true });
  updateActive();
})();

// ─── "Yuqoriga" tugmasi ───────────────────────────────────────────────────
(function setupScrollTop() {
  const btn = document.createElement("button");
  btn.id = "scrollTopBtn";
  btn.title = "Yuqoriga";
  btn.innerHTML = "↑";
  document.body.appendChild(btn);

  window.addEventListener("scroll", () => {
    btn.classList.toggle("visible", window.scrollY > 400);
  }, { passive: true });

  btn.addEventListener("click", () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  });
})();

// ─── Service Worker ro'yxatdan o'tkazish ─────────────────────────────────
if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("/sw.js").catch(() => {});
  });
}

// ─── Skeleton loader yordamchi funksiya ───────────────────────────────────
function skeletonHTML(lines = 3) {
  return `
    <span class="skeleton skeleton-line w60"></span>
    ${"<span class=\"skeleton skeleton-line\"></span>".repeat(lines - 1)}
    <span class="skeleton skeleton-line w40"></span>
  `;
}

// ─── Toast + skeleton integratsiyasi ──────────────────────────────────────

// Ob-havo tugmasi toast
weatherBtn.addEventListener("click", () => {
  const region = document.getElementById("region").value.trim();
  if (!region) {
    showToast("Avval hudud nomini kiriting", "warning");
    return;
  }
  weatherStatus.innerHTML = skeletonHTML(1);
});

// AI maslahat — skeleton + toast
aiForm.addEventListener("submit", () => {
  resultBox.innerHTML = `<h3>Natija</h3>${skeletonHTML(4)}`;
}, { capture: true });

// Alertlar yangilash toast
if (refreshAlertsBtn) {
  refreshAlertsBtn.addEventListener("click", () => {
    showToast("Signallar yangilanmoqda...", "info", 2000);
  });
}

// Tarix tozalash toast
if (clearHistoryBtn) {
  clearHistoryBtn.addEventListener("click", () => {
    showToast("Tarix tozalandi", "success", 2000);
  });
}

// ─── Sug'orish jadvali — chop etish tugmasi ───────────────────────────────
if (irrigationResult) {
  irrigationResult.addEventListener("click", (e) => {
    if (e.target.classList.contains("print-btn")) {
      window.print();
    }
  });
}

// Sug'orish natijasiga print tugmasi qo'shish
const origIrrigHandler = irrigationForm?.onsubmit;
if (irrigationForm) {
  irrigationForm.addEventListener("submit", () => {
    setTimeout(() => {
      const table = irrigationResult.querySelector(".table-scroll");
      if (table && !irrigationResult.querySelector(".print-btn")) {
        const btnWrap = document.createElement("div");
        btnWrap.style.cssText = "display:flex;gap:10px;margin-top:12px";

        const printBtn = document.createElement("button");
        printBtn.className = "btn btn-outline btn-sm print-btn";
        printBtn.textContent = "🖨 Chop etish";

        const csvBtn = document.createElement("button");
        csvBtn.className = "btn btn-outline btn-sm csv-btn";
        csvBtn.textContent = "⬇ CSV yuklash";

        btnWrap.append(printBtn, csvBtn);
        irrigationResult.appendChild(btnWrap);
      }
    }, 600);
  }, { capture: true });
}

// ─── Menyu — outside click yopish ─────────────────────────────────────────
document.addEventListener("click", (e) => {
  if (!menu.contains(e.target) && !menuBtn.contains(e.target)) {
    menu.classList.remove("open");
  }
});

// ─── Onboarding modal ─────────────────────────────────────────────────────
(function setupOnboarding() {
  const overlay   = document.getElementById("onboarding-overlay");
  const closeBtn  = document.getElementById("onboardCloseBtn");
  const dontShow  = document.getElementById("onboardDontShow");
  if (!overlay || !closeBtn) return;

  const SEEN_KEY = "dehqon_onboarded";
  if (!localStorage.getItem(SEEN_KEY)) {
    overlay.classList.remove("hidden");
  }

  function close() {
    if (dontShow?.checked) localStorage.setItem(SEEN_KEY, "1");
    overlay.classList.add("hidden");
  }

  closeBtn.addEventListener("click", close);
  overlay.addEventListener("click", (e) => { if (e.target === overlay) close(); });
})();

// ─── Network status indikator ─────────────────────────────────────────────
(function setupNetworkStatus() {
  const badge = document.getElementById("net-badge");
  if (!badge) return;

  function update() {
    const online = navigator.onLine;
    badge.className = online ? "show online" : "show offline";
    badge.innerHTML = online ? "● Online" : "● Offline";
    if (online) {
      setTimeout(() => badge.classList.remove("show"), 3000);
    }
  }

  window.addEventListener("online",  () => { update(); showToast("Internet aloqasi tiklandi", "success"); });
  window.addEventListener("offline", () => { update(); showToast("Internet aloqasi uzildi", "error", 5000); });
})();

// ─── Keyboard shortcuts ───────────────────────────────────────────────────
(function setupKeyboard() {
  const modal      = document.getElementById("shortcuts-modal");
  const closeBtn   = document.getElementById("shortcutsCloseBtn");
  if (!modal || !closeBtn) return;

  function openModal()  { modal.classList.remove("hidden"); }
  function closeModal() { modal.classList.add("hidden"); }

  closeBtn.addEventListener("click", closeModal);
  modal.addEventListener("click", (e) => { if (e.target === modal) closeModal(); });

  const GOTO = {
    a: "#assistant", m: "#market", i: "#irrigation",
    c: "#calendar",  r: "#region-info", h: "#history"
  };
  let gPressed = false, gTimer = null;

  document.addEventListener("keydown", (e) => {
    const tag = e.target.tagName;
    if (tag === "INPUT" || tag === "SELECT" || tag === "TEXTAREA") return;

    // Esc — modalni yopish
    if (e.key === "Escape") { closeModal(); return; }

    // ? — yorliqlar modali
    if (e.key === "?") { modal.classList.toggle("hidden"); return; }

    // Home — tepaga
    if (e.key === "Home") { window.scrollTo({ top: 0, behavior: "smooth" }); return; }

    // R — alertlarni yangilash
    if (e.key === "r" || e.key === "R") { loadAlerts(); showToast("Signallar yangilanmoqda...", "info", 1500); return; }

    // G + harf — navigatsiya
    if (e.key === "g" || e.key === "G") {
      gPressed = true;
      clearTimeout(gTimer);
      gTimer = setTimeout(() => { gPressed = false; }, 1500);
      return;
    }
    if (gPressed) {
      const target = GOTO[e.key.toLowerCase()];
      if (target) {
        document.querySelector(target)?.scrollIntoView({ behavior: "smooth" });
        showToast(`${target.replace("#", "").toUpperCase()} bo'limiga o'tildi`, "info", 1500);
      }
      gPressed = false;
    }
  });
})();

// ─── CSV export (sug'orish jadvali) ──────────────────────────────────────
(function setupCSVExport() {
  if (!irrigationResult) return;
  irrigationResult.addEventListener("click", (e) => {
    if (!e.target.classList.contains("csv-btn")) return;
    const table = irrigationResult.querySelector(".irrig-table");
    if (!table) return;

    const rows = [];
    table.querySelectorAll("tr").forEach((tr) => {
      const cells = Array.from(tr.querySelectorAll("th,td")).map((c) =>
        `"${c.textContent.trim().replace(/"/g, '""')}"`
      );
      rows.push(cells.join(","));
    });

    const bom    = "\uFEFF";
    const blob   = new Blob([bom + rows.join("\n")], { type: "text/csv;charset=utf-8;" });
    const url    = URL.createObjectURL(blob);
    const link   = document.createElement("a");
    link.href     = url;
    link.download = `dehqon_sugoriш_${new Date().toISOString().slice(0,10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
    showToast("CSV fayl yuklandi!", "success");
  });
})();

// ─── AI maslahat muvaffaqiyatida toast ────────────────────────────────────
// fetch natijasini kuzatish uchun original submit handler ni wrap qilamiz
(function wrapAdviceToast() {
  const origSubmit = aiForm.onsubmit;
  const _observer = new MutationObserver(() => {
    const list = resultBox.querySelector(".result-list");
    if (list && list.children.length > 0) {
      showToast("AI tavsiya tayyor!", "success", 3000);
      _observer.disconnect();
    }
  });
  _observer.observe(resultBox, { childList: true, subtree: true });
})();
