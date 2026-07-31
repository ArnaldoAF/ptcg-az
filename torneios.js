const roundsState = {
  players: [],
  rounds: [],
};

function loadTournamentData() {
  roundsState.players = LegendsAZ.loadJson(LegendsAZ.STORAGE_KEYS.players, []);
  roundsState.rounds = LegendsAZ.loadJson(LegendsAZ.STORAGE_KEYS.rounds, []);
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
          let resultado = "Empate";
          if (r.vencedor === "jogador1") resultado = `${j1} venceu`;
          else if (r.vencedor === "jogador2") resultado = `${j2} venceu`;
          return `
            <li class="simpleList__item">
              <span class="simpleList__dot" aria-hidden="true"></span>
              <div class="simpleList__main">
                <span class="simpleList__text">
                  ${LegendsAZ.escapeHtml(j1)} <span class="vsLabel">vs</span> ${LegendsAZ.escapeHtml(j2)}
                </span>
                <span class="simpleList__meta">${LegendsAZ.escapeHtml(resultado)}</span>
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

function setupTorneiosPage() {
  loadTournamentData();
  renderRoundsList();
  renderRoundsForm();
}

setupTorneiosPage();
