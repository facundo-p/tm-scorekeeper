// One persistent WebGL2 Mars behind the whole UI. Screens don't own a globe: they
// register a "slot" (an empty element) and the planet glides there, rotating to the
// slot's region. With no slot, it parks as a dim horizon at the bottom of the screen.
import { VERT, BAKE_FRAG, RENDER_FRAG } from './planet-shaders.js';
import { REGIONS } from '../data/catalog.js';

const reduceMotion = () => matchMedia('(prefers-reduced-motion: reduce)').matches;
const TAU = Math.PI * 2;
const wrapAngle = (a) => Math.atan2(Math.sin(a), Math.cos(a));

function compile(gl, type, src) {
  const sh = gl.createShader(type);
  gl.shaderSource(sh, src);
  gl.compileShader(sh);
  if (!gl.getShaderParameter(sh, gl.COMPILE_STATUS)) {
    const log = gl.getShaderInfoLog(sh);
    gl.deleteShader(sh);
    throw new Error(log);
  }
  return sh;
}

function program(gl, fs) {
  const p = gl.createProgram();
  gl.attachShader(p, compile(gl, gl.VERTEX_SHADER, VERT));
  gl.attachShader(p, compile(gl, gl.FRAGMENT_SHADER, fs));
  gl.bindAttribLocation(p, 0, 'aPos');
  gl.linkProgram(p);
  if (!gl.getProgramParameter(p, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(p));
  const u = {};
  const n = gl.getProgramParameter(p, gl.ACTIVE_UNIFORMS);
  for (let i = 0; i < n; i++) {
    const name = gl.getActiveUniform(p, i).name;
    u[name] = gl.getUniformLocation(p, name);
  }
  return { p, u };
}

function makeTexture(gl, w, h) {
  const t = gl.createTexture();
  gl.bindTexture(gl.TEXTURE_2D, t);
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA8, w, h, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.REPEAT);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
  return t;
}

function bakeSize() {
  const q = new URLSearchParams(location.search).get('bake');
  if (q) return Math.max(256, Math.min(4096, +q || 1024));
  const small = Math.min(screen.width, screen.height) < 700;
  return small || (navigator.hardwareConcurrency || 8) <= 4 ? 1024 : 2048;
}

const DEFAULTS = { region: null, terra: 0.15, fill: 0, board: false, bright: 1, glow: 1, interactive: false, tilt: 0.32 };

export function createPlanetStage(host) {
  const canvas = document.createElement('canvas');
  canvas.className = 'planet-canvas';
  canvas.setAttribute('aria-hidden', 'true');
  (host.querySelector('.fx') ?? host).appendChild(canvas);
  const gl = canvas.getContext('webgl2', { alpha: true, premultipliedAlpha: true, antialias: false, powerPreference: 'high-performance' });

  const stage = {
    supported: !!gl,
    ready: false,
    slots: [],
    pointer: { x: 0, y: 0 },
    listeners: new Set(),
    onReady(fn) { this.listeners.add(fn); if (this.ready) fn(); return () => this.listeners.delete(fn); },
  };
  if (!gl) { canvas.remove(); return stage; }

  let render, quad, textures, W = 0, H = 0, dpr = 1, running = false, raf = 0, last = 0, time = 0;
  let spin = 0, spinVel = 0, dragging = false;
  const cur = { x: 0, y: 0, r: 0, yaw: -1.9, pitch: 0.32, terra: 0.15, fill: 0, board: 0, fLat: 0, fLon: 0, bright: 0.5, glow: 1, lx: 0, ly: 0 };
  let initialised = false;

  try {
    render = program(gl, RENDER_FRAG);
    quad = gl.createVertexArray();
    gl.bindVertexArray(quad);
    const buf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
    gl.enableVertexAttribArray(0);
    gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);
    bake();
  } catch (err) {
    console.warn('Planet disabled:', err);
    stage.supported = false;
    canvas.remove();
    return stage;
  }

  function bake() {
    const bw = bakeSize();
    const bh = bw / 2;
    const bk = program(gl, BAKE_FRAG);
    textures = [makeTexture(gl, bw, bh), makeTexture(gl, bw, bh), makeTexture(gl, bw, bh)];
    const fb = gl.createFramebuffer();
    gl.bindFramebuffer(gl.FRAMEBUFFER, fb);
    textures.forEach((t, i) => gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0 + i, gl.TEXTURE_2D, t, 0));
    gl.drawBuffers([gl.COLOR_ATTACHMENT0, gl.COLOR_ATTACHMENT1, gl.COLOR_ATTACHMENT2]);
    gl.useProgram(bk.p);
    gl.uniform2f(bk.u.uTexel, 1 / bw, 1 / bh);
    gl.viewport(0, 0, bw, bh);
    gl.enable(gl.SCISSOR_TEST);
    const strips = 12;
    let i = 0;
    const step = () => {
      if (gl.isContextLost()) return;
      gl.bindFramebuffer(gl.FRAMEBUFFER, fb);
      gl.useProgram(bk.p);
      gl.viewport(0, 0, bw, bh);
      gl.enable(gl.SCISSOR_TEST);
      const y0 = Math.floor((i / strips) * bh);
      const y1 = Math.floor(((i + 1) / strips) * bh);
      gl.scissor(0, y0, bw, y1 - y0);
      gl.bindVertexArray(quad);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
      i++;
      if (i < strips) { requestAnimationFrame(step); return; }
      gl.disable(gl.SCISSOR_TEST);
      gl.bindFramebuffer(gl.FRAMEBUFFER, null);
      gl.deleteFramebuffer(fb);
      gl.deleteProgram(bk.p);
      stage.ready = true;
      document.documentElement.dataset.planet = 'ready';
      stage.listeners.forEach((fn) => fn());
    };
    requestAnimationFrame(step);
  }

  function resize() {
    const rect = host.getBoundingClientRect();
    const scale = rect.width / (host.offsetWidth || 1);
    dpr = Math.min(window.devicePixelRatio || 1, host.offsetWidth < 760 ? 1.5 : 1.75) * scale;
    W = Math.max(1, Math.round(host.offsetWidth * dpr));
    H = Math.max(1, Math.round(host.offsetHeight * dpr));
    canvas.width = W;
    canvas.height = H;
  }

  const activeSlot = () => {
    for (let i = stage.slots.length - 1; i >= 0; i--) {
      const s = stage.slots[i];
      if (s.el.isConnected && s.el.offsetWidth > 0) return s;
    }
    return null;
  };

  function targets() {
    const slot = activeSlot();
    const hostRect = host.getBoundingClientRect();
    const scale = hostRect.width / (host.offsetWidth || 1);
    if (!slot) {
      const r = Math.max(host.offsetWidth, host.offsetHeight) * 0.62;
      return { ...DEFAULTS, x: host.offsetWidth * 0.72, y: host.offsetHeight + r * 0.52, r, bright: 0.42, glow: 0.8, parked: true };
    }
    const rect = slot.el.getBoundingClientRect();
    const p = { ...DEFAULTS, ...slot.params };
    return {
      ...p,
      x: (rect.left - hostRect.left + rect.width / 2) / scale,
      y: (rect.top - hostRect.top + rect.height / 2) / scale,
      r: Math.min(rect.width, rect.height) / 2 / scale,
      slot,
    };
  }

  let skip = false;
  function frame(now) {
    raf = requestAnimationFrame(frame);
    const t0 = targets();
    const settling = Math.abs(t0.x - cur.x) + Math.abs(t0.y - cur.y) + Math.abs(t0.r - cur.r) > 0.5;
    // Idle globes only need 30 fps: halve GPU work unless something is moving.
    skip = !skip;
    if (skip && !dragging && !settling && Math.abs(spinVel) < 0.01) return;
    const dt = Math.min(0.05, (now - (last || now)) / 1000);
    last = now;
    const still = reduceMotion();
    time += dt;
    const t = t0;
    const k = still || !initialised ? 1 : 1 - Math.exp(-dt * 5.5);
    const ks = still || !initialised ? 1 : 1 - Math.exp(-dt * 3.2);
    initialised = true;
    cur.x += (t.x - cur.x) * k;
    cur.y += (t.y - cur.y) * k;
    cur.r += (t.r - cur.r) * k;
    cur.terra += (t.terra - cur.terra) * ks;
    cur.fill += (t.fill - cur.fill) * ks;
    cur.bright += (t.bright - cur.bright) * k;
    cur.glow += (t.glow - cur.glow) * k;
    cur.board += ((t.board ? 1 : 0) - cur.board) * ks;

    const region = t.region && REGIONS[t.region];
    if (!dragging) {
      spinVel *= Math.pow(0.04, dt);
      spin = wrapAngle(spin + spinVel * dt);
    }
    const px = t.interactive ? stage.pointer.x : 0;
    const py = t.interactive ? stage.pointer.y : 0;
    if (region) {
      cur.fLat = region.lat * Math.PI / 180;
      cur.fLon = region.lon * Math.PI / 180;
      const goalYaw = -cur.fLon + spin + px * 0.12;
      cur.yaw += wrapAngle(goalYaw - cur.yaw) * ks;
      const goalPitch = cur.fLat * 0.9 + py * 0.08;
      cur.pitch += (goalPitch - cur.pitch) * ks;
      if (!dragging) spin *= Math.pow(0.15, dt);
    } else {
      if (!dragging) cur.yaw = wrapAngle(cur.yaw + spinVel * dt + (still ? 0 : dt * 0.045));
      const goalPitch = t.tilt + py * 0.07;
      cur.pitch += (goalPitch - cur.pitch) * ks;
    }
    const lx = -0.62 + stage.pointer.x * (t.interactive ? 0.22 : 0.06);
    const ly = 0.34 - stage.pointer.y * (t.interactive ? 0.16 : 0.04);
    cur.lx += (lx - cur.lx) * k;
    cur.ly += (ly - cur.ly) * k;
    draw();
  }

  function draw() {
    if (!stage.ready || gl.isContextLost()) return;
    gl.disable(gl.SCISSOR_TEST);
    gl.viewport(0, 0, W, H);
    gl.clearColor(0, 0, 0, 0);
    gl.clear(gl.COLOR_BUFFER_BIT);
    const cx = cur.x * dpr;
    const cy = H - cur.y * dpr;
    const r = cur.r * dpr;
    if (r < 2) return;
    const m = r * 1.45;
    const x0 = Math.max(0, Math.floor(cx - m));
    const y0 = Math.max(0, Math.floor(cy - m));
    const x1 = Math.min(W, Math.ceil(cx + m));
    const y1 = Math.min(H, Math.ceil(cy + m));
    if (x1 <= x0 || y1 <= y0) return;
    gl.enable(gl.SCISSOR_TEST);
    gl.scissor(x0, y0, x1 - x0, y1 - y0);
    gl.useProgram(render.p);
    textures.forEach((tex, i) => { gl.activeTexture(gl.TEXTURE0 + i); gl.bindTexture(gl.TEXTURE_2D, tex); });
    const u = render.u;
    gl.uniform1i(u.uSurf, 0);
    gl.uniform1i(u.uAux, 1);
    gl.uniform1i(u.uCloud, 2);
    gl.uniform3f(u.uPlanet, cx, cy, r);
    gl.uniform3f(u.uLight, cur.lx, cur.ly, 0.72);
    gl.uniform1f(u.uYaw, cur.yaw);
    gl.uniform1f(u.uPitch, cur.pitch);
    gl.uniform1f(u.uTime, time);
    gl.uniform1f(u.uTerra, cur.terra);
    gl.uniform4f(u.uFocus, cur.fLat, cur.fLon, 0.5, cur.board);
    gl.uniform2f(u.uHex, 0.083, cur.fill);
    gl.uniform1f(u.uBright, cur.bright);
    gl.uniform1f(u.uGlow, cur.glow);
    gl.bindVertexArray(quad);
    gl.drawArrays(gl.TRIANGLES, 0, 3);
  }

  function start() {
    if (running) return;
    running = true;
    last = 0;
    raf = requestAnimationFrame(frame);
  }

  function stop() {
    running = false;
    cancelAnimationFrame(raf);
  }

  new ResizeObserver(resize).observe(host);
  resize();
  document.addEventListener('visibilitychange', () => (document.hidden ? stop() : start()));
  canvas.addEventListener('webglcontextlost', (e) => { e.preventDefault(); stop(); });
  host.addEventListener('pointermove', (e) => {
    const rect = host.getBoundingClientRect();
    stage.pointer.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
    stage.pointer.y = ((e.clientY - rect.top) / rect.height) * 2 - 1;
  }, { passive: true });

  stage.addSlot = (el, params) => {
    const slot = { el, params: { ...params } };
    stage.slots.push(slot);
    if (params.interactive) attachDrag(slot);
    return {
      update(next) { slot.params = { ...next }; },
      remove() {
        slot.detach?.();
        stage.slots = stage.slots.filter((s) => s !== slot);
      },
    };
  };

  function attachDrag(slot) {
    let lastX = 0, lastT = 0;
    const down = (e) => {
      dragging = true;
      lastX = e.clientX;
      lastT = performance.now();
      slot.el.setPointerCapture?.(e.pointerId);
      slot.el.classList.add('is-dragging');
    };
    const move = (e) => {
      if (!dragging) return;
      const now = performance.now();
      const dx = e.clientX - lastX;
      const w = slot.el.getBoundingClientRect().width || 300;
      const dA = (dx / w) * Math.PI;
      spin = wrapAngle(spin + dA);
      if (!(slot.params.region && REGIONS[slot.params.region])) cur.yaw = wrapAngle(cur.yaw + dA);
      spinVel = dA / Math.max(0.008, (now - lastT) / 1000);
      lastX = e.clientX;
      lastT = now;
    };
    const up = () => {
      dragging = false;
      slot.el.classList.remove('is-dragging');
      spinVel = Math.max(-3, Math.min(3, spinVel));
    };
    slot.el.addEventListener('pointerdown', down);
    slot.el.addEventListener('pointermove', move);
    slot.el.addEventListener('pointerup', up);
    slot.el.addEventListener('pointercancel', up);
    slot.detach = () => {
      slot.el.removeEventListener('pointerdown', down);
      slot.el.removeEventListener('pointermove', move);
      slot.el.removeEventListener('pointerup', up);
      slot.el.removeEventListener('pointercancel', up);
    };
  }

  start();
  return stage;
}

export { TAU };
