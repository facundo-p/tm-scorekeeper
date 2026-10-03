// Three canvases of stars drawn once per resize, moved by CSS for pointer parallax,
// plus a few twinkling stars and the occasional meteor.
import { rng } from '../data/rand.js';

const LAYERS = [
  { depth: 6, density: 1 / 2600, size: [0.35, 0.9], alpha: [0.25, 0.7] },
  { depth: 14, density: 1 / 9000, size: [0.6, 1.3], alpha: [0.45, 0.9] },
  { depth: 26, density: 1 / 40000, size: [1, 1.8], alpha: [0.7, 1], glint: true },
];
const TINTS = ['255,244,230', '255,226,200', '214,226,255', '255,255,255'];
const MARGIN = 40;

function paint(canvas, layer, w, h, seed) {
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  canvas.width = (w + MARGIN * 2) * dpr;
  canvas.height = (h + MARGIN * 2) * dpr;
  canvas.style.width = `${w + MARGIN * 2}px`;
  canvas.style.height = `${h + MARGIN * 2}px`;
  const ctx = canvas.getContext('2d');
  ctx.scale(dpr, dpr);
  const rand = rng(seed);
  const count = Math.round((w + MARGIN * 2) * (h + MARGIN * 2) * layer.density);
  for (let i = 0; i < count; i++) {
    const x = rand() * (w + MARGIN * 2);
    const y = rand() * (h + MARGIN * 2);
    const s = layer.size[0] + rand() * (layer.size[1] - layer.size[0]);
    const a = layer.alpha[0] + rand() * (layer.alpha[1] - layer.alpha[0]);
    const tint = TINTS[Math.floor(rand() * TINTS.length)];
    ctx.fillStyle = `rgba(${tint},${a})`;
    ctx.beginPath();
    ctx.arc(x, y, s, 0, Math.PI * 2);
    ctx.fill();
    if (layer.glint && rand() > 0.45) {
      const g = ctx.createRadialGradient(x, y, 0, x, y, s * 6);
      g.addColorStop(0, `rgba(${tint},${a * 0.35})`);
      g.addColorStop(1, `rgba(${tint},0)`);
      ctx.fillStyle = g;
      ctx.fillRect(x - s * 6, y - s * 6, s * 12, s * 12);
      ctx.fillStyle = `rgba(${tint},${a * 0.5})`;
      ctx.fillRect(x - s * 4, y - 0.35, s * 8, 0.7);
      ctx.fillRect(x - 0.35, y - s * 4, 0.7, s * 8);
    }
  }
}

export function createSky(host) {
  const sky = document.createElement('div');
  sky.className = 'sky';
  sky.setAttribute('aria-hidden', 'true');
  sky.innerHTML = '<div class="sky__nebula"></div>';
  const canvases = LAYERS.map((layer) => {
    const c = document.createElement('canvas');
    c.className = 'sky__layer';
    c.style.setProperty('--depth', `${layer.depth}px`);
    sky.appendChild(c);
    return c;
  });
  const rand = rng(77);
  for (let i = 0; i < 14; i++) {
    const s = document.createElement('i');
    s.className = 'sky__twinkle';
    s.style.left = `${rand() * 100}%`;
    s.style.top = `${rand() * 100}%`;
    s.style.animationDelay = `${(rand() * 9).toFixed(2)}s`;
    s.style.animationDuration = `${(5 + rand() * 6).toFixed(2)}s`;
    sky.appendChild(s);
  }
  const meteor = document.createElement('i');
  meteor.className = 'sky__meteor';
  sky.appendChild(meteor);
  (host.querySelector('.fx') ?? host).appendChild(sky);

  const draw = () => {
    const w = host.offsetWidth;
    const h = host.offsetHeight;
    canvases.forEach((c, i) => paint(c, LAYERS[i], w, h, 11 + i * 97));
  };
  let pending = 0;
  new ResizeObserver(() => {
    cancelAnimationFrame(pending);
    pending = requestAnimationFrame(draw);
  }).observe(host);

  let frame = 0;
  host.addEventListener('pointermove', (e) => {
    if (frame) return;
    frame = requestAnimationFrame(() => {
      frame = 0;
      const r = host.getBoundingClientRect();
      sky.style.setProperty('--px', (((e.clientX - r.left) / r.width) * 2 - 1).toFixed(3));
      sky.style.setProperty('--py', (((e.clientY - r.top) / r.height) * 2 - 1).toFixed(3));
    });
  }, { passive: true });

  const launch = () => {
    if (!matchMedia('(prefers-reduced-motion: reduce)').matches && !document.hidden) {
      meteor.style.top = `${8 + Math.random() * 35}%`;
      meteor.style.left = `${25 + Math.random() * 60}%`;
      meteor.classList.remove('is-on');
      void meteor.offsetWidth;
      meteor.classList.add('is-on');
    }
    setTimeout(launch, 16000 + Math.random() * 22000);
  };
  setTimeout(launch, 6000);
  return sky;
}
