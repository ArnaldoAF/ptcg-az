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

  function calculatePlayerStats(players, rounds) {
    const DEFAULT_PONTOS = 1000;
    const POINTS_PER_WIN = 300;

    const statsMap = new Map();
    for (const p of players) {
      statsMap.set(p.id, {
        pontos: DEFAULT_PONTOS,
        vitorias: 0,
        derrotas: 0,
      });
    }

    for (const r of rounds) {
      if (!r || !r.vencedor || r.vencedor === "empate") continue;
      const j1Id = r.jogador1?.id;
      const j2Id = r.jogador2?.id;

      const s1 = statsMap.get(j1Id);
      const s2 = statsMap.get(j2Id);

      if (r.vencedor === "jogador1") {
        if (s1) {
          s1.pontos += POINTS_PER_WIN;
          s1.vitorias += 1;
        }
        if (s2) {
          s2.pontos -= POINTS_PER_WIN;
          s2.derrotas += 1;
        }
      } else if (r.vencedor === "jogador2") {
        if (s2) {
          s2.pontos += POINTS_PER_WIN;
          s2.vitorias += 1;
        }
        if (s1) {
          s1.pontos -= POINTS_PER_WIN;
          s1.derrotas += 1;
        }
      }
    }

    return players.map((p) => {
      const s = statsMap.get(p.id);
      return {
        ...p,
        pontos: s ? s.pontos : DEFAULT_PONTOS,
        vitorias: s ? s.vitorias : 0,
        derrotas: s ? s.derrotas : 0,
      };
    });
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
    calculatePlayerStats,
    setup,
  };
})();

LegendsAZ.setup();
