const LegendsAZ = (() => {
  const STORAGE_KEYS = {
    theme: "legends-az:theme",
    players: "legends-az:players",
    nextPlayerId: "legends-az:nextPlayerId",
    rounds: "legends-az:rounds",
  };

  const TABS = [
    { page: "index.html", label: "Jogadores", icon: "👥" },
    { page: "torneios.html", label: "Torneios", icon: "🏆" },
  ];

  function loadJson(key, fallback) {
    try {
      const raw = localStorage.getItem(key);
      if (!raw) return fallback;
      return JSON.parse(raw);
    } catch {
      return fallback;
    }
  }

  function saveJson(key, value) {
    localStorage.setItem(key, JSON.stringify(value));
  }

  function getPreferredTheme() {
    const saved = localStorage.getItem(STORAGE_KEYS.theme);
    if (saved === "light" || saved === "dark") return saved;
    return window.matchMedia?.("(prefers-color-scheme: dark)")?.matches ? "dark" : "light";
  }

  function applyTheme(theme) {
    document.documentElement.dataset.theme = theme;
    localStorage.setItem(STORAGE_KEYS.theme, theme);
  }

  function getCurrentPageFile() {
    const last = (location.pathname || "").split(/[\\/]/).pop();
    if (!last) return "index.html";
    if (!last.includes(".")) return "index.html";
    return last;
  }

  function ensureShell() {
    const app = document.getElementById("app");
    if (!app) return;

    const hasHeader = app.querySelector(".appHeader");
    if (!hasHeader) {
      const header = document.createElement("header");
      header.className = "appHeader";
      header.innerHTML = `
        <div class="appHeader__title">
          <div class="appHeader__name">Torneio Pokémon TCG</div>
          <div class="appHeader__subtitle">Legends AZ</div>
        </div>
        <button class="iconButton" type="button" id="themeToggle" aria-label="Alternar tema">
          <span class="iconButton__icon" aria-hidden="true">◐</span>
          <span class="iconButton__text">Tema</span>
        </button>
      `;
      app.prepend(header);
    }

    const hasTabBar = app.querySelector(".tabBar");
    if (!hasTabBar) {
      const nav = document.createElement("nav");
      nav.className = "tabBar";
      nav.setAttribute("aria-label", "Navegação");
      nav.innerHTML = TABS.map(
        (t) => `
          <a class="tabBar__item" href="./${t.page}" data-page="${t.page}">
            <span class="tabBar__icon" aria-hidden="true">${t.icon}</span>
            <span class="tabBar__label">${t.label}</span>
          </a>
        `,
      ).join("");
      app.append(nav);
    }
  }

  function setActiveTab() {
    const current = getCurrentPageFile();
    for (const el of document.querySelectorAll(".tabBar__item")) {
      const page = el.getAttribute("data-page") || "";
      const isCurrent = page === current;
      if (isCurrent) el.setAttribute("aria-current", "page");
      else el.removeAttribute("aria-current");
    }
  }

  function escapeHtml(str) {
    return String(str)
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#39;");
  }

  function setup() {
    ensureShell();
    applyTheme(getPreferredTheme());
    setActiveTab();

    const themeToggle = document.getElementById("themeToggle");
    themeToggle?.addEventListener("click", () => {
      const current = document.documentElement.dataset.theme === "dark" ? "dark" : "light";
      applyTheme(current === "dark" ? "light" : "dark");
    });
  }

  return {
    STORAGE_KEYS,
    loadJson,
    saveJson,
    getPreferredTheme,
    applyTheme,
    setActiveTab,
    escapeHtml,
    setup,
  };
})();

LegendsAZ.setup();
