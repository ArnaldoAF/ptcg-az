const DEFAULT_PLAYER = Object.freeze({
  pontos: 1000,
  vitorias: 0,
  derrotas: 0,
});

const state = {
  players: [],
  ui: {
    isAddingPlayer: false,
  },
};

let hasBoundListEvents = false;

function getNextPlayerId() {
  const raw = Number(localStorage.getItem(LegendsAZ.STORAGE_KEYS.nextPlayerId) || "1");
  const next = Number.isFinite(raw) && raw >= 1 ? raw : 1;
  localStorage.setItem(LegendsAZ.STORAGE_KEYS.nextPlayerId, String(next + 1));
  return next;
}

function addPlayerByName(name) {
  const trimmed = String(name || "").trim();
  if (!trimmed) return { ok: false, reason: "Nome vazio" };

  const player = {
    id: getNextPlayerId(),
    nome: trimmed,
    pontos: DEFAULT_PLAYER.pontos,
    vitorias: DEFAULT_PLAYER.vitorias,
    derrotas: DEFAULT_PLAYER.derrotas,
  };

  const rounds = LegendsAZ.loadJson(LegendsAZ.STORAGE_KEYS.rounds, []);
  state.players = LegendsAZ.calculatePlayerStats([...state.players, player], rounds);
  LegendsAZ.saveJson(LegendsAZ.STORAGE_KEYS.players, state.players);
  return { ok: true, player };
}

function renderPlayersList() {
  const root = document.getElementById("playersList");
  if (!root) return;

  if (state.players.length === 0) {
    root.innerHTML = `<div class="emptyState">Lista vazia. Adicione o primeiro jogador abaixo.</div>`;
    return;
  }

  // Ordenar jogadores por pontos decrescente (e por vitórias/nome como critério de desempate)
  const sortedPlayers = [...state.players].sort(
    (a, b) => b.pontos - a.pontos || b.vitorias - a.vitorias || a.nome.localeCompare(b.nome),
  );

  root.innerHTML = `
    <ul class="simpleList" aria-label="Jogadores cadastrados">
      ${sortedPlayers
        .map(
          (p, index) => {
            const rank = index + 1;
            const rankClass = rank <= 3 ? `playerRank--${rank}` : "";
            return `
              <li class="simpleList__item" data-player-id="${String(p.id)}">
                <span class="playerRank ${rankClass}">${rank}º</span>
                <div class="simpleList__main">
                  <span class="simpleList__text">${LegendsAZ.escapeHtml(p.nome)}</span>
                  <span class="simpleList__meta">${p.pontos} pts <span class="statsDetail">(${p.vitorias}V / ${p.derrotas}D)</span></span>
                </div>
                <button
                  class="chipButton chipButton--danger"
                  type="button"
                  aria-label="Remover jogador ${LegendsAZ.escapeHtml(p.nome)}"
                  data-player-remove="${String(p.id)}"
                >
                  ×
                </button>
              </li>
            `;
          },
        )
        .join("")}
    </ul>
  `;
}

function renderPlayersAdd() {
  const root = document.getElementById("playersAdd");
  if (!root) return;

  root.innerHTML = state.ui.isAddingPlayer
    ? `
      <div class="addRow" role="group" aria-label="Adicionar jogador">
        <input
          class="textInput"
          id="playerNameInput"
          type="text"
          inputmode="text"
          autocomplete="off"
          autocapitalize="words"
          placeholder="Nome do jogador"
        />
        <button class="primaryButton" id="playerAddConfirm" type="button" aria-label="Adicionar jogador">
          +
        </button>
      </div>
    `
    : `
      <button class="primaryButton primaryButton--full" id="playerAddStart" type="button">
        Adicionar jogador
      </button>
    `;

  bindPlayersAddEvents();

  if (state.ui.isAddingPlayer) {
    document.getElementById("playerNameInput")?.focus?.();
  }
}

function bindPlayersAddEvents() {
  const startBtn = document.getElementById("playerAddStart");
  startBtn?.addEventListener("click", () => {
    state.ui.isAddingPlayer = true;
    renderPlayersAdd();
  });

  const confirmBtn = document.getElementById("playerAddConfirm");
  const input = document.getElementById("playerNameInput");

  function commit() {
    const res = addPlayerByName(input?.value || "");
    if (!res.ok) return;
    state.ui.isAddingPlayer = false;
    renderPlayersList();
    renderPlayersAdd();
  }

  confirmBtn?.addEventListener("click", commit);
  input?.addEventListener("keydown", (e) => {
    if (e.key === "Enter") commit();
    if (e.key === "Escape") {
      state.ui.isAddingPlayer = false;
      renderPlayersAdd();
    }
  });
}

function bindPlayersListEvents() {
  if (hasBoundListEvents) return;
  const root = document.getElementById("playersList");
  if (!root) return;

  hasBoundListEvents = true;
  root.addEventListener("click", (event) => {
    const target = event.target;
    if (!(target instanceof HTMLElement)) return;

    const button = target.closest("[data-player-remove]");
    if (!button) return;

    const idStr = button.getAttribute("data-player-remove");
    const id = Number(idStr || "");
    if (!Number.isFinite(id)) return;

    const player = state.players.find((p) => p.id === id);
    const nome = player?.nome || "";
    const ok = window.confirm(
      nome
        ? `Remover o jogador "${nome}" da lista?`
        : "Remover este jogador da lista?",
    );
    if (!ok) return;

    state.players = state.players.filter((p) => p.id !== id);
    const rounds = LegendsAZ.loadJson(LegendsAZ.STORAGE_KEYS.rounds, []);
    state.players = LegendsAZ.calculatePlayerStats(state.players, rounds);
    LegendsAZ.saveJson(LegendsAZ.STORAGE_KEYS.players, state.players);
    renderPlayersList();
  });
}

function setupPlayersPage() {
  const rawPlayers = LegendsAZ.loadJson(LegendsAZ.STORAGE_KEYS.players, []);
  const rounds = LegendsAZ.loadJson(LegendsAZ.STORAGE_KEYS.rounds, []);
  state.players = LegendsAZ.calculatePlayerStats(rawPlayers, rounds);
  LegendsAZ.saveJson(LegendsAZ.STORAGE_KEYS.players, state.players);
  renderPlayersList();
  renderPlayersAdd();
  bindPlayersListEvents();
}

setupPlayersPage();
