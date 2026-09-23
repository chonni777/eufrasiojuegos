// Pad táctil superpuesto, avance rápido y tamaño de botones.
//
// Método principal: la API interna de EmulatorJS (gameManager.simulateInput),
// que no depende del teclado ni del foco. Si no está disponible, se simulan
// las teclas por defecto de EmulatorJS como plan B.

// id = índice RetroPad que usa EmulatorJS
const GBA_BUTTONS = {
  b:      { id: 0,  key: 'x',          keyCode: 88 },
  select: { id: 2,  key: 'v',          keyCode: 86 },
  start:  { id: 3,  key: 'Enter',      keyCode: 13 },
  up:     { id: 4,  key: 'ArrowUp',    keyCode: 38 },
  down:   { id: 5,  key: 'ArrowDown',  keyCode: 40 },
  left:   { id: 6,  key: 'ArrowLeft',  keyCode: 37 },
  right:  { id: 7,  key: 'ArrowRight', keyCode: 39 },
  a:      { id: 8,  key: 'z',          keyCode: 90 },
  l:      { id: 10, key: 'q',          keyCode: 81 },
  r:      { id: 11, key: 'e',          keyCode: 69 }
};

function getGameManager() {
  return window.EJS_emulator && window.EJS_emulator.gameManager;
}

function dispatchKey(type, key, code, keyCode) {
  const event = new KeyboardEvent(type, { key, code, keyCode, which: keyCode, bubbles: true, cancelable: true });
  Object.defineProperty(event, 'keyCode', { get: () => keyCode });
  Object.defineProperty(event, 'which', { get: () => keyCode });
  const target = document.querySelector('#game canvas') || document.getElementById('game');
  target.dispatchEvent(event);
}

function sendButton(name, pressed) {
  const btn = GBA_BUTTONS[name];
  if (!btn) return;
  const gm = getGameManager();
  if (gm && typeof gm.simulateInput === 'function') {
    gm.simulateInput(0, btn.id, pressed ? 1 : 0);
  } else {
    dispatchKey(pressed ? 'keydown' : 'keyup', btn.key, btn.key, btn.keyCode);
  }
}

function setFastForward(on) {
  const gm = getGameManager();
  if (gm && typeof gm.toggleFastForward === 'function') {
    gm.toggleFastForward(on ? 1 : 0);
  } else {
    dispatchKey(on ? 'keydown' : 'keyup', '+', 'NumpadAdd', 107);
  }
}

(function initPad() {
  const pad = document.getElementById('pad');
  const toggleBtn = document.getElementById('toggle-pad');
  const speedBtn = document.getElementById('toggle-speed');

  // Mostrar / ocultar
  toggleBtn.addEventListener('click', () => {
    const visible = pad.classList.toggle('visible');
    toggleBtn.textContent = visible ? 'Ocultar controles táctiles' : 'Mostrar controles táctiles';
  });

  // Pointer events: funcionan con ratón, táctil y multitáctil
  pad.querySelectorAll('button[data-btn]').forEach(el => {
    const name = el.dataset.btn;
    let down = false;
    const press = (ev) => {
      ev.preventDefault();
      if (down) return;
      down = true;
      el.classList.add('pressed');
      sendButton(name, true);
    };
    const release = (ev) => {
      ev.preventDefault();
      if (!down) return;
      down = false;
      el.classList.remove('pressed');
      sendButton(name, false);
    };
    el.addEventListener('pointerdown', press);
    el.addEventListener('pointerup', release);
    el.addEventListener('pointercancel', release);
    el.addEventListener('pointerleave', release);
    el.addEventListener('contextmenu', ev => ev.preventDefault());
  });

  // Velocidad x2 como interruptor
  let fastForwardOn = false;
  speedBtn.addEventListener('click', () => {
    fastForwardOn = !fastForwardOn;
    setFastForward(fastForwardOn);
    speedBtn.classList.toggle('active', fastForwardOn);
    speedBtn.textContent = fastForwardOn ? 'Velocidad normal' : 'Velocidad x2';
  });

  // Tamaño del pad
  const MIN = 0.6, MAX = 1.8, STEP = 0.15;
  let scale = 1;
  const apply = () => pad.style.setProperty('--pad-scale', scale.toFixed(2));
  document.getElementById('pad-bigger').addEventListener('click', () => { scale = Math.min(MAX, scale + STEP); apply(); });
  document.getElementById('pad-smaller').addEventListener('click', () => { scale = Math.max(MIN, scale - STEP); apply(); });

  // La pantalla completa de EmulatorJS usa su propio contenedor:
  // movemos el pad dentro mientras dure y lo devolvemos al salir.
  const originalParent = pad.parentElement;
  document.addEventListener('fullscreenchange', () => {
    const fsEl = document.fullscreenElement;
    if (fsEl && fsEl !== originalParent) {
      fsEl.appendChild(pad);
      pad.classList.add('fullscreen-pad');
    } else {
      originalParent.appendChild(pad);
      pad.classList.remove('fullscreen-pad');
    }
  });
})();
