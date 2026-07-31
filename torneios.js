const roundsState = {
  players: [],
  rounds: [],
};

function loadTournamentData() {
  const rawPlayers = LegendsAZ.loadJson(LegendsAZ.STORAGE_KEYS.players, []);
  roundsState.rounds = LegendsAZ.loadJson(LegendsAZ.STORAGE_KEYS.rounds, []);
  roundsState.players = LegendsAZ.calculatePlayerStats(rawPlayers, roundsState.rounds);
  LegendsAZ.saveJson(LegendsAZ.STORAGE_KEYS.players, roundsState.players);
}

function saveRounds() {
  LegendsAZ.saveJson(LegendsAZ.STORAGE_KEYS.rounds, roundsState.rounds);
}

function generateRoundId() {
  let id;
  const used = new Set(roundsState.rounds.map((r) => r.id));
  do {
    id = Math.floor(Math.random() * 1_000_000_000);
  } while (used.has(id));
  return id;
}

let hasBoundRoundsListEvents = false;

function renderRoundsList() {
  const root = document.getElementById("roundsList");
  if (!root) return;

  if (roundsState.rounds.length === 0) {
    root.innerHTML = `<div class="emptyState">Nenhum round cadastrado ainda.</div>`;
    return;
  }

  root.innerHTML = `
    <ul class="simpleList" aria-label="Rounds cadastrados">
      ${roundsState.rounds
      .map((r) => {
        const j1 = r.jogador1?.nome || "Jogador 1";
        const j2 = r.jogador2?.nome || "Jogador 2";
        const p1 = roundsState.players.find((p) => p.id === r.jogador1?.id);
        const p2 = roundsState.players.find((p) => p.id === r.jogador2?.id);
        const pts1 = p1 ? p1.pontos : 1000;
        const pts2 = p2 ? p2.pontos : 1000;

        let resultado = "Empate";
        if (r.vencedor === "jogador1") resultado = `${j1} venceu`;
        else if (r.vencedor === "jogador2") resultado = `${j2} venceu`;

        const isWin1 = r.vencedor === "jogador1";
        const isWin2 = r.vencedor === "jogador2";

        return `
            <li class="simpleList__item roundItem">
              <div class="roundMatch">
                <button
                  class="roundPlayer ${isWin1 ? "roundPlayer--winner" : ""}"
                  type="button"
                  data-round-id="${r.id}"
                  data-winner="jogador1"
                  title="Declarar vitória para ${LegendsAZ.escapeHtml(j1)}"
                  aria-label="Declarar vitória para ${LegendsAZ.escapeHtml(j1)}"
                >
                  <span class="roundPlayer__name">${LegendsAZ.escapeHtml(j1)}</span>
                  <span class="roundPlayer__pts">${pts1} pts</span>
                </button>

                <span class="vsLabel">vs</span>

                <button
                  class="roundPlayer ${isWin2 ? "roundPlayer--winner" : ""}"
                  type="button"
                  data-round-id="${r.id}"
                  data-winner="jogador2"
                  title="Declarar vitória para ${LegendsAZ.escapeHtml(j2)}"
                  aria-label="Declarar vitória para ${LegendsAZ.escapeHtml(j2)}"
                >
                  <span class="roundPlayer__name">${LegendsAZ.escapeHtml(j2)}</span>
                  <span class="roundPlayer__pts">${pts2} pts</span>
                </button>
              </div>
            </li>
          `;
      })
      .join("")}
    </ul>
  `;
}

function renderRoundsForm() {
  const root = document.getElementById("roundsForm");
  if (!root) return;

  if (!roundsState.players || roundsState.players.length < 2) {
    root.innerHTML = `
      <div class="emptyState">
        Cadastre pelo menos dois jogadores na tela de Jogadores para criar rounds.
      </div>
    `;
    return;
  }

  const options = roundsState.players
    .map(
      (p) =>
        `<option value="${String(p.id)}">${LegendsAZ.escapeHtml(p.nome)} (${p.pontos} pts)</option>`,
    )
    .join("");

  root.innerHTML = `
    <div class="formContainer">
      <div class="roundsForm" role="form" aria-label="Criar round">
        <select class="selectInput" id="roundPlayer1">
          <option value="">Jogador 1</option>
          ${options}
        </select>
        <span class="vsLabel">vs</span>
        <select class="selectInput" id="roundPlayer2">
          <option value="">Jogador 2</option>
          ${options}
        </select>
      </div>
      <div class="spacer12"></div>
      <button class="primaryButton primaryButton--full" id="roundCreate" type="button">
        Criar round
      </button>
    </div>
  `;

  bindRoundsFormEvents();
}

function bindRoundsFormEvents() {
  const select1 = document.getElementById("roundPlayer1");
  const select2 = document.getElementById("roundPlayer2");
  const createBtn = document.getElementById("roundCreate");

  if (!(select1 instanceof HTMLSelectElement)) return;
  if (!(select2 instanceof HTMLSelectElement)) return;
  if (!(createBtn instanceof HTMLButtonElement)) return;

  function createRound() {
    const id1 = Number(select1.value || "");
    const id2 = Number(select2.value || "");

    if (!Number.isFinite(id1) || !Number.isFinite(id2)) {
      window.alert("Selecione os dois jogadores.");
      return;
    }
    if (id1 === id2) {
      window.alert("Os jogadores devem ser diferentes.");
      return;
    }

    const jogador1 = roundsState.players.find((p) => p.id === id1);
    const jogador2 = roundsState.players.find((p) => p.id === id2);
    if (!jogador1 || !jogador2) {
      window.alert("Jogadores inválidos. Atualize a página.");
      return;
    }

    const exists = roundsState.rounds.some(
      (r) =>
        (r.jogador1?.id === id1 && r.jogador2?.id === id2) ||
        (r.jogador1?.id === id2 && r.jogador2?.id === id1),
    );
    if (exists) {
      window.alert("Esses jogadores já se enfrentaram. Escolha outro confronto.");
      return;
    }

    const round = {
      id: generateRoundId(),
      jogador1: { id: jogador1.id, nome: jogador1.nome },
      jogador2: { id: jogador2.id, nome: jogador2.nome },
      vencedor: "empate",
    };

    roundsState.rounds = [...roundsState.rounds, round];
    saveRounds();
    renderRoundsList();
    renderRoundsForm();
  }

  createBtn.addEventListener("click", createRound);
}

function bindRoundsListEvents() {
  if (hasBoundRoundsListEvents) return;
  const root = document.getElementById("roundsList");
  if (!root) return;

  hasBoundRoundsListEvents = true;
  root.addEventListener("click", (event) => {
    const target = event.target;
    if (!(target instanceof HTMLElement)) return;

    const winBtn = target.closest("[data-winner]");
    if (!winBtn) return;

    const roundIdStr = winBtn.getAttribute("data-round-id");
    const winnerChoice = winBtn.getAttribute("data-winner");
    const roundId = Number(roundIdStr || "");

    if (!Number.isFinite(roundId) || !winnerChoice) return;

    const round = roundsState.rounds.find((r) => r.id === roundId);
    if (!round) return;

    // Se clicar no jogador que já é o vencedor, alterna para empate. Caso contrário, define o novo vencedor.
    if (round.vencedor === winnerChoice) {
      round.vencedor = "empate";
    } else {
      round.vencedor = winnerChoice;
    }

    saveRounds();

    roundsState.players = LegendsAZ.calculatePlayerStats(roundsState.players, roundsState.rounds);
    LegendsAZ.saveJson(LegendsAZ.STORAGE_KEYS.players, roundsState.players);

    renderRoundsList();
    renderRoundsForm();
  });
}

function setupTorneiosPage() {
  loadTournamentData();
  renderRoundsList();
  renderRoundsForm();
  bindRoundsListEvents();
}

setupTorneiosPage();
