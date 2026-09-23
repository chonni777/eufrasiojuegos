// Arranque del emulador y biblioteca de juegos (roms/games.json)

const CONFIG = {
  // Fija una versión concreta (p. ej. 'https://cdn.emulatorjs.org/4.2.3/data/')
  // si quieres evitar cambios inesperados cuando EmulatorJS actualice "stable".
  dataPath: 'https://cdn.emulatorjs.org/stable/data/',
  gamesList: 'roms/games.json'
};

const $ = (id) => document.getElementById(id);
const statusEl = $('status');
const librarySel = $('library');
const playBtn = $('play-library');
const fileInput = $('rom');
const changeBtn = $('change-game');

// ?solo=1 → se muestra solo el juego (se usa desde la página de juegos)
if (new URLSearchParams(location.search).get('solo') === '1') {
  document.body.classList.add('solo');
}

let games = [];
let started = false;

function setStatus(text, isError = false) {
  statusEl.textContent = text;
  statusEl.classList.toggle('error', isError);
}

// EmulatorJS solo admite un juego por carga de página, así que
// al arrancar bloqueamos el selector y ofrecemos "Cambiar de juego".
function startEmulator(url, name) {
  if (started) return;
  started = true;

  setStatus('Cargando ' + name + '…');
  $('selector').hidden = true;   // con el juego en marcha, el selector sobra
  changeBtn.hidden = false;

  window.EJS_player = '#game';
  window.EJS_core = 'gba';           // usa el núcleo mGBA
  window.EJS_gameUrl = url;
  window.EJS_gameName = name;        // las partidas se asocian a este nombre
  window.EJS_pathtodata = CONFIG.dataPath;
  window.EJS_startOnLoaded = true;
  window.EJS_language = 'es-ES';
  window.EJS_onGameStart = () => setStatus('Jugando: ' + name);

  const script = document.createElement('script');
  script.src = CONFIG.dataPath + 'loader.js';
  script.onerror = () => setStatus('No se pudo cargar el emulador. Comprueba tu conexión a internet.', true);
  document.body.appendChild(script);
}

async function loadLibrary() {
  try {
    const res = await fetch(CONFIG.gamesList, { cache: 'no-cache' });
    if (!res.ok) throw new Error('HTTP ' + res.status);
    games = await res.json();
  } catch (err) {
    console.warn('No se pudo leer la biblioteca:', err);
    games = [];
  }

  librarySel.innerHTML = '';
  if (!games.length) {
    librarySel.add(new Option('No hay juegos en roms/games.json', ''));
    librarySel.disabled = true;
  } else {
    librarySel.add(new Option('Elige un juego', ''));
    games.forEach(g => librarySel.add(new Option(g.title, g.id)));
  }

  // Enlace directo: index.html?juego=<id>
  const wanted = new URLSearchParams(location.search).get('juego');
  const game = wanted && games.find(g => g.id === wanted);
  if (game) {
    librarySel.value = game.id;
    startEmulator(game.file, game.title);
  } else if (wanted) {
    setStatus('No existe ningún juego con el id "' + wanted + '" en la biblioteca.', true);
  }
}

librarySel.addEventListener('change', () => {
  playBtn.disabled = !librarySel.value;
});

playBtn.addEventListener('click', () => {
  const game = games.find(g => g.id === librarySel.value);
  if (!game) return;
  history.replaceState(null, '', '?juego=' + encodeURIComponent(game.id));
  startEmulator(game.file, game.title);
});

fileInput.addEventListener('change', (e) => {
  const file = e.target.files[0];
  if (!file) return;
  startEmulator(URL.createObjectURL(file), file.name);
});

changeBtn.addEventListener('click', () => {
  location.href = location.pathname; // recarga limpia
});

loadLibrary();
