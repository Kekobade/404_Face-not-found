const $ = id => document.getElementById(id),
      C = $('c'),
      x = C.getContext('2d'),
      stage = $('stage'),
      spark = $('spark');

x.imageSmoothingEnabled = false;

// Offscreen buffer for clean mosaic pixelation & scanline glitches
const bufC = document.createElement('canvas');
bufC.width = 160;
bufC.height = 160;
const bx = bufC.getContext('2d');
bx.imageSmoothingEnabled = false;

const S = 160, BG = '#ebe5e8', L = '#b7b4d8', M = '#7b78a6', D = '#3f3d5c';
let PANELS = window.SAVED_PANELS || [], loadedImgs = [], mode = 'game', lockScene = 'auto';
let run = false, mem = 1, t = 0, spawnT = 1.2, sparkT = 5, sparkL = 0, cleared = 0, sparks = 0, last = performance.now();
let flashT = 0, cascadeT = 0, glitchT = 0;

let best = 0;
try { best = +localStorage.getItem('f404_best') || 0; } catch (e) {}
$('best').textContent = best;

function hydratePanels() {
  loadedImgs = PANELS.map(src => {
    const im = new Image();
    im.src = src;
    return im;
  });
}
if (PANELS.length === 9) hydratePanels();

// Auto-detects the exact 9 panel boxes from image_599d66.png
$('up').addEventListener('change', e => {
  const f = e.target.files[0];
  if (!f) return;
  const url = URL.createObjectURL(f);
  const img = new Image();
  img.onload = () => {
    URL.revokeObjectURL(url);
    const tc = document.createElement('canvas'), tx = tc.getContext('2d');
    tc.width = img.width;
    tc.height = img.height;
    tx.drawImage(img, 0, 0);
    const d = tx.getImageData(0, 0, tc.width, tc.height).data;
    const isDark = (px, py) => {
      const i = ((py | 0) * tc.width + (px | 0)) * 4;
      return d[i] < 95 && d[i + 1] < 95;
    };
    function scanSegs(len, fixed, horiz) {
      const segs = [];
      let inBox = false, s0 = 0;
      for (let p = 0; p < len; p++) {
        const dk = horiz ? isDark(p, fixed) : isDark(fixed, p);
        if (dk && !inBox) {
          inBox = true;
          s0 = p;
        } else if (!dk && inBox && p - s0 > len * 0.18) {
          segs.push([s0, p]);
          inBox = false;
        }
      }
      return segs.length === 3
        ? segs
        : [[len * 0.019, len * 0.311], [len * 0.355, len * 0.647], [len * 0.689, len * 0.981]];
    }
    const cols = scanSegs(tc.width, tc.height * 0.15, true);
    const rows = scanSegs(tc.height, tc.width * 0.15, false);
    const b = Math.max(2, Math.round(tc.width * 0.004));
    const pw = cols[0][1] - cols[0][0] - b * 2,
          ph = rows[0][1] - rows[0][0] - b * 2;
    PANELS = [];
    for (let r = 0; r < 3; r++) {
      for (let c = 0; c < 3; c++) {
        const pc = document.createElement('canvas');
        pc.width = S;
        pc.height = S;
        const px = pc.getContext('2d');
        px.imageSmoothingEnabled = false;
        px.drawImage(img, cols[c][0] + b, rows[r][0] + b, pw, ph, 0, 0, S, S);
        PANELS.push(pc.toDataURL('image/png'));
      }
    }
    hydratePanels();
  };
  img.src = url;
});

function drawFallbackScene(idx, T) {
  x.fillStyle = BG;
  x.fillRect(0, 0, S, S);
  if (idx === 7) {
    x.fillStyle = D;
    x.font = '6px monospace';
    for (let y = 8; y < S; y += 8) x.fillText('REMEMBER ME REMEMBER ME ', 2, y);
  }
  // Shoulders & Collar
  x.fillStyle = D;
  x.beginPath();
  x.moveTo(12, S);
  x.lineTo(36, 132);
  x.lineTo(124, 132);
  x.lineTo(148, S);
  x.fill();
  x.fillStyle = M;
  x.fillRect(42, 126, 76, 34);
  x.fillStyle = BG;
  x.fillRect(62, 118, 36, 42);
  x.fillStyle = L;
  x.fillRect(68, 124, 24, 30);

  if (idx !== 3) {
    x.fillStyle = L;
    x.fillRect(38, 68, 84, 64);
    x.fillStyle = idx === 6 ? D : BG;
    x.fillRect(52, 72, 56, 46);
  }

  if (idx === 1) {
    x.fillStyle = L;
    x.fillRect(56, 78, 44, 36);
    x.fillStyle = D;
    x.fillRect(66, 92, 16, 3);
    x.fillRect(74, 104, 14, 4);
  } else if (idx === 2) {
    x.fillStyle = D;
    x.beginPath();
    x.moveTo(80, 76);
    x.lineTo(44, 32);
    x.lineTo(36, 108);
    x.lineTo(80, 96);
    x.lineTo(116, 44);
    x.lineTo(98, 122);
    x.fill();
    x.fillStyle = L;
    x.fillRect(52, 48, 18, 26);
    x.fillRect(88, 58, 14, 24);
  } else if (idx === 4) {
    x.fillStyle = D;
    x.fillRect(48, 80, 64, 20);
    x.fillStyle = BG;
    x.fillRect(56, 85, 14, 10);
    x.fillRect(90, 85, 14, 10);
    x.fillStyle = D;
    x.fillRect(61, 87, 5, 6);
    x.fillRect(95, 87, 5, 6);
  } else if (idx === 6) {
    const gx = 94, gy = 102, s = 18 + Math.sin(T * 12) * 4;
    x.fillStyle = BG;
    x.fillRect(gx - s, gy - 1, s * 2, 3);
    x.fillRect(gx - 1, gy - s, 3, s * 2);
  } else if (idx === 7) {
    x.strokeStyle = D;
    x.lineWidth = 1.5;
    x.strokeRect(50, 86, 18, 14);
    x.strokeRect(34, 98, 20, 14);
    x.fillStyle = D;
    x.fillRect(56, 90, 6, 6);
    x.fillRect(40, 102, 6, 6);
    for (let y = 84; y < 140; y += 6) {
      x.fillStyle = y % 12 === 0 ? D : (y % 18 === 0 ? M : L);
      x.fillRect(82, y, 78, 6);
    }
  }

  // Witch Hat
  if (idx !== 8) {
    x.fillStyle = D;
    x.beginPath();
    x.moveTo(0, 48);
    x.lineTo(54, 8);
    x.lineTo(132, 32);
    x.lineTo(124, 62);
    x.lineTo(S, 68);
    x.lineTo(S, 96);
    x.lineTo(0, 56);
    x.fill();
    x.fillStyle = M;
    x.fillRect(48, 26, 64, 8);
    x.fillStyle = L;
    x.fillRect(44, 36, 68, 6);
    x.fillStyle = M;
    x.fillRect(138, 38, 2, 14);
    x.fillRect(136, 52, 6, 9);
  } else {
    x.fillStyle = BG;
    x.beginPath();
    x.moveTo(22, 0);
    x.lineTo(S, 0);
    x.lineTo(S, 116);
    x.lineTo(96, 112);
    x.lineTo(52, 98);
    x.lineTo(28, 44);
    x.fill();
  }

  if (idx === 0) drawPixel404Box(30, 44);
  if (idx === 5) {
    // Clean offscreen mosaic downscale/upscale
    bx.clearRect(0, 0, S, S);
    bx.drawImage(C, 0, 0, S, S, 0, 0, 28, 28);
    x.clearRect(0, 0, S, S);
    x.drawImage(bufC, 0, 0, 28, 28, 0, 0, S, S);
  }
}

function drawPixel404Box(bxPos, byPos) {
  x.fillStyle = BG;
  x.fillRect(bxPos, byPos, 100, 64);
  x.strokeStyle = D;
  x.lineWidth = 2;
  x.strokeRect(bxPos, byPos, 100, 64);
  x.fillStyle = M;
  x.fillRect(bxPos + 1, byPos + 1, 98, 11);
  x.fillStyle = BG;
  x.font = '6px "Press Start 2P",monospace';
  x.fillText('404', bxPos + 4, byPos + 9);
  [72, 81, 90].forEach(ox => {
    x.fillStyle = BG;
    x.fillRect(bxPos + ox, byPos + 2, 7, 7);
    x.strokeRect(bxPos + ox, byPos + 2, 7, 7);
  });
  x.fillStyle = M;
  x.beginPath();
  x.arc(bxPos + 18, byPos + 34, 10, 0, 6.28);
  x.fill();
  x.fillStyle = BG;
  x.fillText('X', bxPos + 15, byPos + 37);
  x.fillStyle = D;
  x.font = '5.5px "Press Start 2P",monospace';
  x.fillText("I'm slowly", bxPos + 33, byPos + 26);
  x.fillText("forgetting", bxPos + 33, byPos + 36);
  x.fillText("your face.", bxPos + 33, byPos + 46);
  x.fillStyle = BG;
  x.fillRect(bxPos + 36, byPos + 51, 28, 9);
  x.strokeRect(bxPos + 36, byPos + 51, 28, 9);
  x.fillStyle = D;
  x.fillText('OK', bxPos + 44, byPos + 58);
}

function pickScene(T) {
  if (lockScene !== 'auto') return +lockScene;
  if (mode === 'gif') {
    const p = T % 6.8;
    if (p < 0.9) return 6;
    if (p < 1.9) return -1;
    if (p < 3.6) return 0;
    if (p < 4.2) return (T * 14 | 0) % 9;
    if (p < 5.1) return 7;
    if (p < 5.6) return -2;
    return 0;
  }
  if (mem > 0.86) return 0;
  if (mem > 0.74) return 2;
  if (mem > 0.62) return 6;
  if (mem > 0.50) return 4;
  if (mem > 0.38) return 7;
  if (mem > 0.26) return 5;
  if (mem > 0.14) return 1;
  if (mem > 0.05) return 3;
  return 8;
}

function render(T) {
  const sc = pickScene(T);
  if (sc === -2 || flashT > 0) {
    x.fillStyle = BG;
    x.fillRect(0, 0, S, S);
    return;
  }
  if (sc === -1 || cascadeT > 0) {
    x.fillStyle = D;
    x.fillRect(0, 0, S, S);
    const steps = mode === 'gif' ? Math.min(5, ((T % 6.8) - 0.9) * 7 | 0) : 5;
    for (let i = steps; i >= 0; i--) drawPixel404Box(14 + i * 5, 42 - i * 5);
    return;
  }
  const idx = glitchT > 0 ? (T * 18 | 0) % 9 : sc;
  if (loadedImgs[idx] && loadedImgs[idx].complete && loadedImgs[idx].naturalWidth > 0) {
    x.drawImage(loadedImgs[idx], 0, 0, S, S);
    if (mode === 'gif' && idx === 7) drawPixel404Box(62, 36);
  } else {
    drawFallbackScene(idx, T);
  }
  if (glitchT > 0 || (mode === 'game' && mem < 0.45 && Math.random() < 0.35)) {
    const sy = Math.random() * S | 0,
          sh = 6 + Math.random() * 18 | 0,
          dx = (Math.random() - 0.5) * 14 | 0;
    bx.clearRect(0, 0, S, S);
    bx.drawImage(C, 0, 0);
    x.drawImage(bufC, 0, sy, S, sh, dx, sy, S, sh);
  }
}

stage.addEventListener('pointerdown', e => {
  if (e.target !== C) return;
  flashT = 0.12;
  glitchT = 0.45;
});

const MSG = [
  "I'm slowly forgetting your face.",
  "Who were you again?",
  "REMEMBER ME",
  "Error: smile not found.",
  "Face.exe has stopped."
];

function spawnWin() {
  const w = document.createElement('div');
  w.className = 'win';
  w.innerHTML = `<div class="tb"><span>404</span><i>_</i><i>□</i><i class="close">×</i></div><div class="bd"><b class="ic">×</b><p>${MSG[Math.random() * MSG.length | 0]}</p></div><button>OK</button>`;
  stage.appendChild(w);

  const maxX = Math.max(8, stage.clientWidth - w.offsetWidth - 8);
  const maxY = Math.max(8, stage.clientHeight - w.offsetHeight - 8);
  w.style.left = (Math.random() * maxX | 0) + 'px';
  w.style.top = (Math.random() * maxY | 0) + 'px';

  const closeWin = e => {
    e.stopPropagation();
    if (!w.parentNode) return;
    w.remove();
    cleared++;
    $('cl').textContent = cleared;
    flashT = 0.06;
  };
  w.querySelector('button').addEventListener('pointerdown', closeWin);
  w.querySelector('.close').addEventListener('pointerdown', closeWin);
}

spark.addEventListener('pointerdown', e => {
  e.stopPropagation();
  spark.style.display = 'none';
  sparkL = 0;
  mem = Math.min(1, mem + 0.14);
  sparks++;
  flashT = 0.08;
});

function tick(ts) {
  const dt = Math.min(0.05, Math.max(0, (ts - last) / 1000));
  last = ts;
  const T = ts / 1000;
  if (flashT > 0) flashT = Math.max(0, flashT - dt);
  if (cascadeT > 0) cascadeT = Math.max(0, cascadeT - dt);
  if (glitchT > 0) glitchT = Math.max(0, glitchT - dt);

  if (run && mode === 'game') {
    t += dt;
    if ((spawnT -= dt) <= 0) {
      spawnWin();
      spawnT = Math.max(0.45, 1.7 - t * 0.024) * (0.75 + Math.random() * 0.5);
    }
    const n = stage.querySelectorAll('.win').length;
    mem = Math.max(0, Math.min(1, mem + (n ? -0.022 * n : 0.028) * dt));
    if ((sparkT -= dt) <= 0 && !sparkL) {
      sparkL = 2.4;
      sparkT = 6 + Math.random() * 4;
      spark.style.left = (12 + Math.random() * 70) + '%';
      spark.style.top = (12 + Math.random() * 65) + '%';
      spark.style.display = 'block';
    }
    if (sparkL > 0 && (sparkL -= dt) <= 0) spark.style.display = 'none';

    $('fill').style.width = (mem * 100) + '%';
    $('pc').textContent = Math.round(mem * 100) + '\%';$('tm').textContent = Math.max(0, Math.ceil(60 - t)) + 's';

    if (mem <= 0 || t >= 60) {
      run = false;
      stage.querySelectorAll('.win').forEach(w => w.remove());
      spark.style.display = 'none';
      const win = t >= 60,
            sc = cleared * 10 + Math.floor(t) * 5 + sparks * 50 + (win ? 1000 : 0);
      if (sc > best) {
        best = sc;
        try { localStorage.setItem('f404_best', sc); } catch (e) {}
        $('best').textContent = best;
      }
      $('ov').querySelector('h2').innerHTML = win ? 'MEMORY RESTORED' : '404: FACE NOT FOUND';
      $('ov').querySelector('p').textContent = `Score: ${sc} | Windows Closed: ${cleared} | Sparkles: ${sparks}`;
      $('go').textContent = 'PLAY AGAIN';$('ov').style.display = 'flex';
    }
  }
  render(T);
  requestAnimationFrame(tick);
}

$('go').addEventListener('click', () => {
  stage.querySelectorAll('.win').forEach(w => w.remove());
  mem = 1;
  t = 0;
  spawnT = 1;
  sparkT = 5;
  sparkL = 0;
  cleared = 0;
  sparks = 0;
  $('cl').textContent = 0;
  $('fill').style.width = '100\%';$('pc').textContent = '100%';
  $('tm').textContent = '60s';$('ov').style.display = 'none';
  run = true;
});

$('mode-game').addEventListener('click', () => {
  mode = 'game';
  $('mode-game').classList.add('act');
  $('mode-gif').classList.remove('act');$('hud').style.display = 'flex';
  if (!run && lockScene === 'auto') $('ov').style.display = 'flex';
});

$('mode-gif').addEventListener('click', () => {
  mode = 'gif';
  run = false;
  stage.querySelectorAll('.win').forEach(w => w.remove());
  spark.style.display = 'none';
  $('ov').style.display = 'none';$('hud').style.display = 'none';
  $('mode-gif').classList.add('act');$('mode-game').classList.remove('act');
});

document.querySelectorAll('#scene-bar button').forEach(b => b.addEventListener('click', () => {
  document.querySelectorAll('#scene-bar button').forEach(el => el.classList.remove('act'));
  b.classList.add('act');
  lockScene = b.dataset.s;
  if (lockScene !== 'auto') {
    $('ov').style.display = 'none';
  } else if (mode === 'game' && !run) {
    $('ov').style.display = 'flex';
  }
}));


requestAnimationFrame(tick);
