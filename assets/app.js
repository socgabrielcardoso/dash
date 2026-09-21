(() => {
  "use strict";

  const STORAGE_KEY = "socdash.v1.records";
  const VIEWS = {
    overview: "Visão geral",
    cases: "Case register",
    analytics: "Analytics"
  };

  const SEVERITY = {
    Critical: { color: "#ff4d6d", weight: 40 },
    High: { color: "#ff9466", weight: 25 },
    Medium: { color: "#f2c75c", weight: 12 },
    Low: { color: "#4aa8ff", weight: 5 },
    Info: { color: "#8ea4bb", weight: 1 }
  };

  const STATUS_COLORS = {
    New: "#8ea4bb",
    Investigating: "#4aa8ff",
    Contained: "#42d49d",
    Closed: "#546479"
  };

  const $ = (selector, root = document) => root.querySelector(selector);
  const $$ = (selector, root = document) => Array.from(root.querySelectorAll(selector));

  const dom = {
    viewTitle: $("#viewTitle"),
    navItems: $$(".nav-item"),
    views: $$(".view"),
    openCaseButton: $("#openCaseButton"),
    caseDialog: $("#caseDialog"),
    detailDialog: $("#detailDialog"),
    caseForm: $("#caseForm"),
    closeCaseButton: $("#closeCaseButton"),
    cancelCaseButton: $("#cancelCaseButton"),
    closeDetailButton: $("#closeDetailButton"),
    formError: $("#formError"),
    loadDemoButton: $("#loadDemoButton"),
    exportButton: $("#exportButton"),
    importButton: $("#importButton"),
    csvButton: $("#csvButton"),
    importFile: $("#importFile"),
    toast: $("#toast"),
    liveClock: $("#liveClock"),
    liveDate: $("#liveDate"),
    riskGauge: $("#riskGauge"),
    riskScore: $("#riskScore"),
    riskLabel: $("#riskLabel"),
    criticalQueue: $("#criticalQueue"),
    criticalQueueBadge: $("#criticalQueueBadge"),
    metricOpen: $("#metricOpen"),
    metricOpenMeta: $("#metricOpenMeta"),
    metricHigh: $("#metricHigh"),
    metricHighMeta: $("#metricHighMeta"),
    metricClosed: $("#metricClosed"),
    metricClosedMeta: $("#metricClosedMeta"),
    metricMttr: $("#metricMttr"),
    metricMttrMeta: $("#metricMttrMeta"),
    trendChart: $("#trendChart"),
    severityChart: $("#severityChart"),
    donutTotal: $("#donutTotal"),
    severityLegend: $("#severityLegend"),
    recentCasesBody: $("#recentCasesBody"),
    recentEmpty: $("#recentEmpty"),
    allCasesBody: $("#allCasesBody"),
    allCasesEmpty: $("#allCasesEmpty"),
    caseSearch: $("#caseSearch"),
    severityFilter: $("#severityFilter"),
    statusFilter: $("#statusFilter"),
    sourceFilter: $("#sourceFilter"),
    sourceBars: $("#sourceBars"),
    mitreBars: $("#mitreBars"),
    statusFlow: $("#statusFlow"),
    qualityScore: $("#qualityScore"),
    qualityBar: $("#qualityBar"),
    qualityText: $("#qualityText"),
    detailContent: $("#detailContent"),
    installAppButton: $("#installAppButton")
  };

  let records = loadRecords();
  let installPrompt = null;
  let resizeTimer = null;

  function sanitizeText(value, max = 1200) {
    if (typeof value !== "string") return "";
    return value.trim().slice(0, max);
  }

  function normalizeRecord(value) {
    if (!value || typeof value !== "object") return null;

    const severity = Object.prototype.hasOwnProperty.call(SEVERITY, value.severity)
      ? value.severity
      : "Medium";
    const allowedStatus = ["New", "Investigating", "Contained", "Closed"];
    const allowedType = ["Detection", "Incident", "Hunt", "Case"];

    const detectedAt = validDateString(value.detectedAt) ? value.detectedAt : new Date().toISOString();
    const createdAt = validDateString(value.createdAt) ? value.createdAt : detectedAt;
    const updatedAt = validDateString(value.updatedAt) ? value.updatedAt : createdAt;
    const status = allowedStatus.includes(value.status) ? value.status : "New";

    return {
      id: sanitizeText(value.id, 80) || createId(),
      title: sanitizeText(value.title, 100) || "Untitled event",
      type: allowedType.includes(value.type) ? value.type : "Detection",
      severity,
      source: sanitizeText(value.source, 80) || "Other",
      status,
      asset: sanitizeText(value.asset, 80),
      identity: sanitizeText(value.identity, 100),
      mitre: sanitizeText(value.mitre, 80),
      detectedAt,
      ioc: sanitizeText(value.ioc, 180),
      analyst: sanitizeText(value.analyst, 80),
      notes: sanitizeText(value.notes, 1200),
      createdAt,
      updatedAt,
      closedAt: validDateString(value.closedAt) ? value.closedAt : (status === "Closed" ? updatedAt : "")
    };
  }

  function validDateString(value) {
    return typeof value === "string" && !Number.isNaN(new Date(value).getTime());
  }

  function loadRecords() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return [];
      const parsed = JSON.parse(raw);
      if (!Array.isArray(parsed)) return [];
      return parsed.map(normalizeRecord).filter(Boolean).sort(sortNewest);
    } catch {
      return [];
    }
  }

  function saveRecords() {
    records = records.map(normalizeRecord).filter(Boolean).sort(sortNewest);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(records));
  }

  function createId() {
    if (window.crypto && typeof window.crypto.randomUUID === "function") {
      return window.crypto.randomUUID();
    }
    return "case-" + Date.now().toString(36) + "-" + Math.random().toString(36).slice(2, 9);
  }

  function sortNewest(a, b) {
    return new Date(b.detectedAt).getTime() - new Date(a.detectedAt).getTime();
  }

  function pad(number) {
    return String(number).padStart(2, "0");
  }

  function localDateTimeValue(date = new Date()) {
    return [
      date.getFullYear(),
      "-",
      pad(date.getMonth() + 1),
      "-",
      pad(date.getDate()),
      "T",
      pad(date.getHours()),
      ":",
      pad(date.getMinutes())
    ].join("");
  }

  function formatDate(value, includeTime = true) {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "N/A";
    return new Intl.DateTimeFormat("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "2-digit",
      ...(includeTime ? { hour: "2-digit", minute: "2-digit" } : {})
    }).format(date);
  }

  function relativeTime(value) {
    const delta = Date.now() - new Date(value).getTime();
    if (!Number.isFinite(delta)) return "";
    const minutes = Math.max(0, Math.round(delta / 60000));
    if (minutes < 60) return minutes <= 1 ? "agora" : minutes + " min";
    const hours = Math.round(minutes / 60);
    if (hours < 24) return hours + "h";
    return Math.round(hours / 24) + "d";
  }

  function showToast(message) {
    dom.toast.textContent = message;
    dom.toast.classList.add("show");
    window.clearTimeout(showToast.timer);
    showToast.timer = window.setTimeout(() => dom.toast.classList.remove("show"), 2600);
  }

  function setView(name) {
    if (!VIEWS[name]) return;
    dom.navItems.forEach((item) => item.classList.toggle("active", item.dataset.view === name));
    dom.views.forEach((view) => view.classList.toggle("active", view.id === "view-" + name));
    dom.viewTitle.textContent = VIEWS[name];
    history.replaceState(null, "", "#" + name);

    if (name === "analytics") {
      renderAnalytics();
    }
    if (name === "cases") {
      renderCases();
    }
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function openCaseDialog() {
    dom.formError.textContent = "";
    dom.caseForm.reset();
    $("#caseSeverity").value = "Medium";
    $("#caseStatus").value = "New";
    $("#caseDetectedAt").value = localDateTimeValue();
    dom.caseDialog.showModal();
    requestAnimationFrame(() => $("#caseTitle").focus());
  }

  function closeCaseDialog() {
    dom.caseDialog.close();
  }

  function closeDetailDialog() {
    dom.detailDialog.close();
  }

  function createBadge(text, color, className = "") {
    const badge = document.createElement("span");
    badge.className = ("badge " + className).trim();
    badge.textContent = text;
    badge.style.setProperty("--badge-color", color);
    return badge;
  }

  function appendCell(row, content) {
    const cell = document.createElement("td");
    if (content instanceof Node) {
      cell.append(content);
    } else {
      cell.textContent = content || "N/A";
    }
    row.append(cell);
    return cell;
  }

  function createCaseCell(record) {
    const wrap = document.createElement("div");
    wrap.className = "case-cell";

    const title = document.createElement("strong");
    title.textContent = record.title;

    const id = document.createElement("small");
    id.textContent = record.id.slice(0, 8).toUpperCase();

    wrap.append(title, id);
    return wrap;
  }

  function renderTableRows(tbody, list, extended = false) {
    tbody.replaceChildren();

    list.forEach((record) => {
      const row = document.createElement("tr");
      row.tabIndex = 0;
      row.setAttribute("role", "button");
      row.setAttribute("aria-label", "Abrir " + record.title);
      row.addEventListener("click", () => openDetail(record.id));
      row.addEventListener("keydown", (event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          openDetail(record.id);
        }
      });

      appendCell(row, createCaseCell(record));

      if (extended) {
        appendCell(row, record.type);
      }

      appendCell(row, createBadge(record.severity, SEVERITY[record.severity].color));
      appendCell(row, record.source);
      appendCell(row, record.asset || "N/A");

      if (extended) {
        appendCell(row, record.mitre || "Unclassified");
      }

      appendCell(row, createBadge(record.status, STATUS_COLORS[record.status], "status-badge"));
      appendCell(row, formatDate(record.detectedAt));
      tbody.append(row);
    });
  }

  function renderRecentCases() {
    const list = records.slice(0, 6);
    renderTableRows(dom.recentCasesBody, list, false);
    dom.recentEmpty.classList.toggle("hidden", list.length > 0);
  }

  function renderCases() {
    populateSourceFilter();

    const query = dom.caseSearch.value.trim().toLowerCase();
    const severity = dom.severityFilter.value;
    const status = dom.statusFilter.value;
    const source = dom.sourceFilter.value;

    const filtered = records.filter((record) => {
      const haystack = [
        record.title,
        record.type,
        record.source,
        record.asset,
        record.identity,
        record.mitre,
        record.ioc,
        record.analyst,
        record.notes
      ].join(" ").toLowerCase();

      return (!query || haystack.includes(query))
        && (severity === "all" || record.severity === severity)
        && (status === "all" || record.status === status)
        && (source === "all" || record.source === source);
    });

    renderTableRows(dom.allCasesBody, filtered, true);
    dom.allCasesEmpty.classList.toggle("hidden", filtered.length > 0);
  }

  function populateSourceFilter() {
    const current = dom.sourceFilter.value || "all";
    const sources = Array.from(new Set(records.map((record) => record.source))).sort();

    dom.sourceFilter.replaceChildren();
    const all = document.createElement("option");
    all.value = "all";
    all.textContent = "Todas";
    dom.sourceFilter.append(all);

    sources.forEach((source) => {
      const option = document.createElement("option");
      option.value = source;
      option.textContent = source;
      dom.sourceFilter.append(option);
    });

    dom.sourceFilter.value = sources.includes(current) ? current : "all";
  }

  function computeRisk() {
    const open = records.filter((record) => record.status !== "Closed");
    const raw = open.reduce((sum, record) => sum + SEVERITY[record.severity].weight, 0);
    return Math.min(100, raw);
  }

  function renderMetrics() {
    const open = records.filter((record) => record.status !== "Closed");
    const high = open.filter((record) => record.severity === "Critical" || record.severity === "High");
    const sevenDaysAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
    const recentlyClosed = records.filter((record) => {
      if (record.status !== "Closed") return false;
      const time = new Date(record.closedAt || record.updatedAt || record.detectedAt).getTime();
      return time >= sevenDaysAgo;
    });

    const mttrSamples = records
      .filter((record) => record.status === "Closed" && validDateString(record.closedAt))
      .map((record) => {
        const start = new Date(record.detectedAt).getTime();
        const end = new Date(record.closedAt).getTime();
        return Math.max(0, (end - start) / 3600000);
      })
      .filter(Number.isFinite);

    const mttr = mttrSamples.length
      ? mttrSamples.reduce((sum, item) => sum + item, 0) / mttrSamples.length
      : 0;

    dom.metricOpen.textContent = String(open.length);
    dom.metricOpenMeta.textContent = open.length
      ? open.filter((record) => record.status === "Investigating").length + " em investigação"
      : "Nenhum registro ativo";

    dom.metricHigh.textContent = String(high.length);
    dom.metricHighMeta.textContent = high.length
      ? high.filter((record) => record.severity === "Critical").length + " críticos"
      : "Fila sob controle";

    dom.metricClosed.textContent = String(recentlyClosed.length);
    dom.metricClosedMeta.textContent = recentlyClosed.length
      ? "Encerramentos recentes"
      : "Sem encerramentos recentes";

    dom.metricMttr.textContent = mttr < 10 && mttr > 0 ? mttr.toFixed(1) + "h" : Math.round(mttr) + "h";
    dom.metricMttrMeta.textContent = mttrSamples.length
      ? mttrSamples.length + " caso(s) com tempo válido"
      : "Baseado em casos fechados";

    const risk = computeRisk();
    dom.riskScore.textContent = String(risk);
    dom.riskGauge.style.setProperty("--risk", String(risk));

    let riskLabel = "Sem exposição aberta";
    let gaugeColor = "#42d49d";
    if (risk > 0) {
      riskLabel = "Exposição baixa";
      gaugeColor = "#4aa8ff";
    }
    if (risk >= 35) {
      riskLabel = "Exposição moderada";
      gaugeColor = "#f2c75c";
    }
    if (risk >= 65) {
      riskLabel = "Exposição elevada";
      gaugeColor = "#ff9466";
    }
    if (risk >= 85) {
      riskLabel = "Exposição crítica";
      gaugeColor = "#ff4d6d";
    }
    dom.riskLabel.textContent = riskLabel;
    dom.riskGauge.style.setProperty("--gauge-color", gaugeColor);
  }

  function renderCriticalQueue() {
    const critical = records
      .filter((record) => record.status !== "Closed" && (record.severity === "Critical" || record.severity === "High"))
      .sort((a, b) => SEVERITY[b.severity].weight - SEVERITY[a.severity].weight || sortNewest(a, b))
      .slice(0, 4);

    dom.criticalQueueBadge.textContent = String(critical.length);
    dom.criticalQueue.replaceChildren();

    if (!critical.length) {
      const empty = document.createElement("div");
      empty.className = "empty-mini";
      empty.textContent = "Nenhum caso crítico ou alto em aberto.";
      dom.criticalQueue.append(empty);
      return;
    }

    critical.forEach((record) => {
      const item = document.createElement("div");
      item.className = "queue-item";
      item.tabIndex = 0;
      item.setAttribute("role", "button");
      item.addEventListener("click", () => openDetail(record.id));
      item.addEventListener("keydown", (event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          openDetail(record.id);
        }
      });

      const accent = document.createElement("span");
      accent.className = "queue-accent";
      accent.style.setProperty("--accent", SEVERITY[record.severity].color);

      const copy = document.createElement("div");
      copy.className = "queue-copy";
      const title = document.createElement("strong");
      title.textContent = record.title;
      const meta = document.createElement("small");
      meta.textContent = record.severity + " · " + (record.asset || record.source);
      copy.append(title, meta);

      const time = document.createElement("span");
      time.className = "queue-time";
      time.textContent = relativeTime(record.detectedAt);

      item.append(accent, copy, time);
      dom.criticalQueue.append(item);
    });
  }

  function fitCanvas(canvas, cssHeight) {
    const parentWidth = Math.max(240, canvas.parentElement.clientWidth);
    const ratio = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = Math.round(parentWidth * ratio);
    canvas.height = Math.round(cssHeight * ratio);
    canvas.style.height = cssHeight + "px";
    const ctx = canvas.getContext("2d");
    ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
    return { ctx, width: parentWidth, height: cssHeight };
  }

  function lastSevenDays() {
    const list = [];
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    for (let offset = 6; offset >= 0; offset -= 1) {
      const day = new Date(today);
      day.setDate(today.getDate() - offset);
      list.push(day);
    }
    return list;
  }

  function sameDay(a, b) {
    return a.getFullYear() === b.getFullYear()
      && a.getMonth() === b.getMonth()
      && a.getDate() === b.getDate();
  }

  function renderTrendChart() {
    const { ctx, width, height } = fitCanvas(dom.trendChart, 265);
    const days = lastSevenDays();
    const values = days.map((day) => records.filter((record) => sameDay(new Date(record.detectedAt), day)).length);
    const max = Math.max(4, ...values);

    ctx.clearRect(0, 0, width, height);

    const left = 38;
    const right = 14;
    const top = 14;
    const bottom = 34;
    const chartW = width - left - right;
    const chartH = height - top - bottom;

    ctx.lineWidth = 1;
    ctx.font = "11px ui-monospace, monospace";
    ctx.textAlign = "right";
    ctx.textBaseline = "middle";

    for (let step = 0; step <= 4; step += 1) {
      const y = top + (chartH / 4) * step;
      const value = Math.round(max - (max / 4) * step);
      ctx.strokeStyle = "rgba(142, 178, 218, 0.10)";
      ctx.beginPath();
      ctx.moveTo(left, y);
      ctx.lineTo(width - right, y);
      ctx.stroke();

      ctx.fillStyle = "#546479";
      ctx.fillText(String(value), left - 9, y);
    }

    const points = values.map((value, index) => {
      const x = left + (chartW / 6) * index;
      const y = top + chartH - (value / max) * chartH;
      return { x, y, value };
    });

    const gradient = ctx.createLinearGradient(0, top, 0, top + chartH);
    gradient.addColorStop(0, "rgba(52, 216, 255, 0.22)");
    gradient.addColorStop(1, "rgba(52, 216, 255, 0.005)");

    ctx.beginPath();
    ctx.moveTo(points[0].x, top + chartH);
    points.forEach((point) => ctx.lineTo(point.x, point.y));
    ctx.lineTo(points[points.length - 1].x, top + chartH);
    ctx.closePath();
    ctx.fillStyle = gradient;
    ctx.fill();

    ctx.beginPath();
    points.forEach((point, index) => {
      if (index === 0) ctx.moveTo(point.x, point.y);
      else ctx.lineTo(point.x, point.y);
    });
    ctx.strokeStyle = "#34d8ff";
    ctx.lineWidth = 2;
    ctx.stroke();

    points.forEach((point) => {
      ctx.beginPath();
      ctx.arc(point.x, point.y, 3.5, 0, Math.PI * 2);
      ctx.fillStyle = "#07101d";
      ctx.fill();
      ctx.strokeStyle = "#62b5ff";
      ctx.lineWidth = 2;
      ctx.stroke();
    });

    ctx.textAlign = "center";
    ctx.textBaseline = "top";
    days.forEach((day, index) => {
      ctx.fillStyle = "#546479";
      ctx.fillText(
        new Intl.DateTimeFormat("pt-BR", { weekday: "short" }).format(day).replace(".", ""),
        points[index].x,
        height - 22
      );
    });
  }

  function renderSeverityChart() {
    const { ctx, width, height } = fitCanvas(dom.severityChart, 220);
    const centerX = width / 2;
    const centerY = height / 2;
    const radius = Math.min(width, height) * 0.39;
    const lineWidth = Math.max(18, radius * 0.22);

    const entries = Object.keys(SEVERITY).map((name) => ({
      name,
      count: records.filter((record) => record.severity === name).length,
      color: SEVERITY[name].color
    }));

    const total = entries.reduce((sum, item) => sum + item.count, 0);
    dom.donutTotal.textContent = String(total);

    ctx.clearRect(0, 0, width, height);
    ctx.lineWidth = lineWidth;
    ctx.lineCap = "round";

    if (!total) {
      ctx.beginPath();
      ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
      ctx.strokeStyle = "rgba(255, 255, 255, 0.06)";
      ctx.stroke();
    } else {
      let start = -Math.PI / 2;
      entries.forEach((item) => {
        if (!item.count) return;
        const sweep = (item.count / total) * Math.PI * 2;
        const gap = total > 1 ? 0.018 : 0;
        ctx.beginPath();
        ctx.arc(centerX, centerY, radius, start + gap, start + sweep - gap);
        ctx.strokeStyle = item.color;
        ctx.stroke();
        start += sweep;
      });
    }

    dom.severityLegend.replaceChildren();
    entries.forEach((item) => {
      const row = document.createElement("div");
      row.className = "legend-row";

      const dot = document.createElement("span");
      dot.className = "legend-dot";
      dot.style.setProperty("--legend-color", item.color);

      const name = document.createElement("span");
      name.textContent = item.name;

      const count = document.createElement("strong");
      count.textContent = String(item.count);

      row.append(dot, name, count);
      dom.severityLegend.append(row);
    });
  }

  function countBy(field, fallback = "Unclassified") {
    const map = new Map();
    records.forEach((record) => {
      const key = record[field] || fallback;
      map.set(key, (map.get(key) || 0) + 1);
    });
    return Array.from(map.entries()).sort((a, b) => b[1] - a[1]);
  }

  function renderBars(container, entries) {
    container.replaceChildren();
    if (!entries.length) {
      const empty = document.createElement("div");
      empty.className = "empty-mini";
      empty.textContent = "Sem dados suficientes.";
      container.append(empty);
      return;
    }

    const max = Math.max(...entries.map((entry) => entry[1]), 1);
    entries.slice(0, 8).forEach(([name, count]) => {
      const row = document.createElement("div");
      row.className = "bar-row";

      const meta = document.createElement("div");
      meta.className = "bar-meta";
      const label = document.createElement("span");
      label.textContent = name;
      const value = document.createElement("strong");
      value.textContent = String(count);
      meta.append(label, value);

      const track = document.createElement("div");
      track.className = "bar-track";
      const fill = document.createElement("span");
      fill.style.setProperty("--width", Math.round((count / max) * 100) + "%");
      track.append(fill);

      row.append(meta, track);
      container.append(row);
    });
  }

  function renderStatusFlow() {
    dom.statusFlow.replaceChildren();
    const statuses = ["New", "Investigating", "Contained", "Closed"];

    statuses.forEach((status) => {
      const count = records.filter((record) => record.status === status).length;
      const card = document.createElement("div");
      card.className = "flow-card";

      const label = document.createElement("span");
      label.textContent = status.toUpperCase();

      const value = document.createElement("strong");
      value.textContent = String(count);
      value.style.color = STATUS_COLORS[status];

      const meta = document.createElement("small");
      meta.textContent = records.length ? Math.round((count / records.length) * 100) + "% do total" : "0% do total";

      card.append(label, value, meta);
      dom.statusFlow.append(card);
    });
  }

  function renderQuality() {
    if (!records.length) {
      dom.qualityScore.textContent = "0%";
      dom.qualityBar.style.setProperty("--width", "0%");
      dom.qualityText.textContent = "Adicione dados para medir a completude.";
      return;
    }

    const fields = ["asset", "identity", "mitre", "ioc", "analyst", "notes"];
    let filled = 0;
    records.forEach((record) => {
      fields.forEach((field) => {
        if (record[field]) filled += 1;
      });
    });

    const score = Math.round((filled / (records.length * fields.length)) * 100);
    dom.qualityScore.textContent = score + "%";
    dom.qualityBar.style.setProperty("--width", score + "%");

    if (score >= 85) {
      dom.qualityText.textContent = "Registros ricos em contexto. A triagem ganha velocidade e rastreabilidade.";
    } else if (score >= 60) {
      dom.qualityText.textContent = "Boa base. Preencha IOC, MITRE e notas para elevar a qualidade investigativa.";
    } else {
      dom.qualityText.textContent = "Contexto insuficiente. Complete ativo, identidade, IOC, MITRE, analista e notas.";
    }
  }

  function renderAnalytics() {
    renderBars(dom.sourceBars, countBy("source"));
    renderBars(dom.mitreBars, countBy("mitre"));
    renderStatusFlow();
    renderQuality();
  }

  function renderAll() {
    renderMetrics();
    renderCriticalQueue();
    renderRecentCases();
    renderCases();
    renderAnalytics();
    renderTrendChart();
    renderSeverityChart();
  }

  function field(label, value, wide = false, paragraph = false) {
    const box = document.createElement("div");
    box.className = "detail-field" + (wide ? " wide" : "");

    const name = document.createElement("span");
    name.textContent = label;

    const content = document.createElement(paragraph ? "p" : "strong");
    content.textContent = value || "N/A";

    box.append(name, content);
    return box;
  }

  function openDetail(id) {
    const record = records.find((item) => item.id === id);
    if (!record) return;

    $("#detailTitle").textContent = record.title;
    dom.detailContent.replaceChildren();

    const grid = document.createElement("div");
    grid.className = "detail-grid";
    grid.append(
      field("Case ID", record.id),
      field("Tipo", record.type),
      field("Severidade", record.severity),
      field("Status", record.status),
      field("Fonte", record.source),
      field("Detectado em", formatDate(record.detectedAt)),
      field("Ativo", record.asset),
      field("Identidade", record.identity),
      field("MITRE ATT&CK", record.mitre),
      field("Analista", record.analyst),
      field("IOC ou evidência", record.ioc, true),
      field("Notas", record.notes, true, true)
    );

    const actions = document.createElement("div");
    actions.className = "detail-actions";

    const workflow = document.createElement("div");
    workflow.className = "detail-actions-group";

    [
      ["Investigating", "Investigar"],
      ["Contained", "Conter"],
      ["Closed", "Fechar"]
    ].forEach(([status, label]) => {
      if (record.status === status) return;
      const button = document.createElement("button");
      button.className = status === "Closed" ? "primary-button" : "secondary-button";
      button.type = "button";
      button.textContent = label;
      button.addEventListener("click", () => updateStatus(record.id, status));
      workflow.append(button);
    });

    if (record.status === "Closed") {
      const reopen = document.createElement("button");
      reopen.className = "secondary-button";
      reopen.type = "button";
      reopen.textContent = "Reabrir";
      reopen.addEventListener("click", () => updateStatus(record.id, "Investigating"));
      workflow.append(reopen);
    }

    const remove = document.createElement("button");
    remove.className = "danger-button";
    remove.type = "button";
    remove.textContent = "Excluir registro";
    remove.addEventListener("click", () => deleteRecord(record.id));

    actions.append(workflow, remove);
    dom.detailContent.append(grid, actions);
    dom.detailDialog.showModal();
  }

  function updateStatus(id, status) {
    const record = records.find((item) => item.id === id);
    if (!record) return;

    record.status = status;
    record.updatedAt = new Date().toISOString();
    if (status === "Closed") {
      record.closedAt = record.updatedAt;
    } else {
      record.closedAt = "";
    }

    saveRecords();
    closeDetailDialog();
    renderAll();
    showToast("Status alterado para " + status + ".");
  }

  function deleteRecord(id) {
    const record = records.find((item) => item.id === id);
    if (!record) return;

    const accepted = window.confirm("Excluir o registro \"" + record.title + "\"? Esta ação não pode ser desfeita.");
    if (!accepted) return;

    records = records.filter((item) => item.id !== id);
    saveRecords();
    closeDetailDialog();
    renderAll();
    showToast("Registro excluído.");
  }

  function handleSubmit(event) {
    event.preventDefault();
    dom.formError.textContent = "";

    const title = sanitizeText($("#caseTitle").value, 100);
    const detectedValue = $("#caseDetectedAt").value;

    if (!title) {
      dom.formError.textContent = "Informe um título para o registro.";
      $("#caseTitle").focus();
      return;
    }

    if (!detectedValue || Number.isNaN(new Date(detectedValue).getTime())) {
      dom.formError.textContent = "Informe uma data de detecção válida.";
      $("#caseDetectedAt").focus();
      return;
    }

    const now = new Date().toISOString();
    const status = $("#caseStatus").value;

    const record = normalizeRecord({
      id: createId(),
      title,
      type: $("#caseType").value,
      severity: $("#caseSeverity").value,
      source: $("#caseSource").value,
      status,
      asset: $("#caseAsset").value,
      identity: $("#caseIdentity").value,
      mitre: $("#caseMitre").value,
      detectedAt: new Date(detectedValue).toISOString(),
      ioc: $("#caseIoc").value,
      analyst: $("#caseAnalyst").value,
      notes: $("#caseNotes").value,
      createdAt: now,
      updatedAt: now,
      closedAt: status === "Closed" ? now : ""
    });

    records.unshift(record);
    saveRecords();
    closeCaseDialog();
    renderAll();
    showToast("Registro adicionado ao Security Ledger.");
  }

  function demoDate(daysAgo, hour, minute = 0) {
    const date = new Date();
    date.setDate(date.getDate() - daysAgo);
    date.setHours(hour, minute, 0, 0);
    return date.toISOString();
  }

  function loadDemo() {
    const demo = [
      {
        id: "demo-powershell",
        title: "PowerShell encoded command",
        type: "Detection",
        severity: "High",
        source: "Microsoft Defender",
        status: "Investigating",
        asset: "WS-FIN-042",
        identity: "ana.silva@corp.local",
        mitre: "Execution",
        detectedAt: demoDate(0, 10, 18),
        ioc: "powershell.exe -enc <base64>",
        analyst: "SOC-L1",
        notes: "Processo iniciado por winword.exe. Coleta de árvore de processos pendente."
      },
      {
        id: "demo-entra",
        title: "Impossible travel sign-in",
        type: "Incident",
        severity: "Critical",
        source: "Entra ID",
        status: "Contained",
        asset: "IDENTITY",
        identity: "carlos.mendes@corp.local",
        mitre: "Credential Access",
        detectedAt: demoDate(0, 8, 42),
        ioc: "185.220.101.44",
        analyst: "SOC-L2",
        notes: "Sessões revogadas. Usuário obrigado a trocar senha. MFA revalidado."
      },
      {
        id: "demo-firewall",
        title: "Outbound connection to TOR node",
        type: "Detection",
        severity: "High",
        source: "Firewall",
        status: "New",
        asset: "172.23.10.190",
        identity: "",
        mitre: "Command and Control",
        detectedAt: demoDate(1, 22, 11),
        ioc: "54.202.193.237:9001",
        analyst: "",
        notes: "Conexão de saída persistente acima do baseline do ativo."
      },
      {
        id: "demo-email",
        title: "Credential phishing campaign",
        type: "Incident",
        severity: "Medium",
        source: "Email Security",
        status: "Closed",
        asset: "MAIL",
        identity: "finance-team@corp.local",
        mitre: "Initial Access",
        detectedAt: demoDate(2, 9, 5),
        ioc: "secure-docs-login.example",
        analyst: "SOC-L1",
        notes: "Mensagens removidas. Domínio bloqueado. Nenhum login confirmado.",
        closedAt: demoDate(2, 12, 20)
      },
      {
        id: "demo-hunt",
        title: "Unsigned binary in temp path",
        type: "Hunt",
        severity: "Medium",
        source: "Manual Hunt",
        status: "Investigating",
        asset: "ENG-LAP-017",
        identity: "maria.rocha@corp.local",
        mitre: "Defense Evasion",
        detectedAt: demoDate(3, 15, 14),
        ioc: "C:\\Users\\Public\\Temp\\update.exe",
        analyst: "Threat-Hunt",
        notes: "Hash enviado para enriquecimento. Sem prevalência em outros endpoints."
      },
      {
        id: "demo-rdp",
        title: "RDP access outside privileged path",
        type: "Case",
        severity: "Low",
        source: "SIEM",
        status: "Closed",
        asset: "SRV-APP-003",
        identity: "infra.admin@corp.local",
        mitre: "Lateral Movement",
        detectedAt: demoDate(4, 11, 32),
        ioc: "TCP/3389",
        analyst: "SOC-L2",
        notes: "Acesso confirmado pelo time de infraestrutura durante implantação do servidor.",
        closedAt: demoDate(4, 12, 10)
      },
      {
        id: "demo-info",
        title: "New administrative role assignment",
        type: "Detection",
        severity: "Info",
        source: "Microsoft Sentinel",
        status: "Closed",
        asset: "IDENTITY",
        identity: "cloud.ops@corp.local",
        mitre: "Privilege Escalation",
        detectedAt: demoDate(5, 16, 45),
        ioc: "Global Administrator",
        analyst: "SOC-L1",
        notes: "Mudança vinculada a ticket aprovado e janela de manutenção.",
        closedAt: demoDate(5, 17, 2)
      },
      {
        id: "demo-mde",
        title: "LSASS memory access attempt",
        type: "Detection",
        severity: "Critical",
        source: "Microsoft Defender",
        status: "Closed",
        asset: "WS-HR-009",
        identity: "helpdesk.ops@corp.local",
        mitre: "Credential Access",
        detectedAt: demoDate(6, 7, 50),
        ioc: "procdump64.exe -> lsass.exe",
        analyst: "SOC-L2",
        notes: "Ferramenta removida. Endpoint isolado durante triagem. Sem evidência de credenciais exfiltradas.",
        closedAt: demoDate(6, 10, 26)
      }
    ];

    const existingIds = new Set(records.map((record) => record.id));
    const now = new Date().toISOString();
    const fresh = demo
      .filter((item) => !existingIds.has(item.id))
      .map((item) => normalizeRecord({
        ...item,
        createdAt: item.detectedAt,
        updatedAt: item.closedAt || now
      }));

    if (!fresh.length) {
      showToast("O cenário demo já está carregado.");
      return;
    }

    records = [...fresh, ...records];
    saveRecords();
    renderAll();
    showToast(fresh.length + " registros demo adicionados.");
  }

  function exportJson() {
    const payload = {
      schema: "socdash.v1",
      exportedAt: new Date().toISOString(),
      records
    };

    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = "socdash-export-" + new Date().toISOString().slice(0, 10) + ".json";
    document.body.append(anchor);
    anchor.click();
    anchor.remove();
    URL.revokeObjectURL(url);
    showToast("Exportação JSON concluída.");
  }

  function updateClock() {
    const now = new Date();
    dom.liveClock.textContent = new Intl.DateTimeFormat("pt-BR", {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit"
    }).format(now);
    dom.liveDate.textContent = new Intl.DateTimeFormat("pt-BR", {
      weekday: "short",
      day: "2-digit",
      month: "2-digit"
    }).format(now).replace(".", "");
  }

  function setupEvents() {
    dom.navItems.forEach((item) => {
      item.addEventListener("click", () => setView(item.dataset.view));
    });

    $$("[data-go-view]").forEach((button) => {
      button.addEventListener("click", () => setView(button.dataset.goView));
    });

    dom.openCaseButton.addEventListener("click", openCaseDialog);
    $$("[data-open-case]").forEach((button) => button.addEventListener("click", openCaseDialog));
    dom.closeCaseButton.addEventListener("click", closeCaseDialog);
    dom.cancelCaseButton.addEventListener("click", closeCaseDialog);
    dom.closeDetailButton.addEventListener("click", closeDetailDialog);
    dom.caseForm.addEventListener("submit", handleSubmit);
    dom.loadDemoButton.addEventListener("click", loadDemo);
    dom.exportButton.addEventListener("click", exportJson);

    [dom.caseSearch, dom.severityFilter, dom.statusFilter, dom.sourceFilter].forEach((control) => {
      control.addEventListener(control.tagName === "INPUT" ? "input" : "change", renderCases);
    });

    dom.caseDialog.addEventListener("click", (event) => {
      if (event.target === dom.caseDialog) closeCaseDialog();
    });

    dom.detailDialog.addEventListener("click", (event) => {
      if (event.target === dom.detailDialog) closeDetailDialog();
    });

    window.addEventListener("resize", () => {
      window.clearTimeout(resizeTimer);
      resizeTimer = window.setTimeout(() => {
        renderTrendChart();
        renderSeverityChart();
      }, 120);
    });

    window.addEventListener("beforeinstallprompt", (event) => {
      event.preventDefault();
      installPrompt = event;
      dom.installAppButton.classList.remove("hidden");
    });

    dom.installAppButton.addEventListener("click", async () => {
      if (!installPrompt) return;
      installPrompt.prompt();
      await installPrompt.userChoice;
      installPrompt = null;
      dom.installAppButton.classList.add("hidden");
    });

    window.addEventListener("appinstalled", () => {
      installPrompt = null;
      dom.installAppButton.classList.add("hidden");
      showToast("SOC DASH instalado.");
    });
  }

  function setupServiceWorker() {
    if ("serviceWorker" in navigator && (location.protocol === "https:" || location.hostname === "localhost")) {
      navigator.serviceWorker.register("sw.js").catch(() => {});
    }
  }

  function init() {
    setupEvents();
    setupServiceWorker();

    const requestedView = location.hash.slice(1);
    setView(VIEWS[requestedView] ? requestedView : "overview");

    updateClock();
    window.setInterval(updateClock, 1000);

    renderAll();
  }

  init();
})();
