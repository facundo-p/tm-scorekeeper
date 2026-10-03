// Small burst of tumbling cubes in the players' colours and MegaCredit gold.
export function burst(canvas, { x = 0.5, y = 0.35, colors = ['#f4c43a'], count = 140 } = {}) {
  if (!canvas || matchMedia('(prefers-reduced-motion: reduce)').matches) return () => {};
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  const w = canvas.clientWidth;
  const h = canvas.clientHeight;
  canvas.width = w * dpr;
  canvas.height = h * dpr;
  const ctx = canvas.getContext('2d');
  ctx.scale(dpr, dpr);
  const parts = Array.from({ length: count }, () => {
    const a = -Math.PI / 2 + (Math.random() - 0.5) * 2.2;
    const v = 6 + Math.random() * 9;
    return {
      x: x * w, y: y * h, vx: Math.cos(a) * v, vy: Math.sin(a) * v,
      s: 4 + Math.random() * 6, r: Math.random() * Math.PI, vr: (Math.random() - 0.5) * 0.3,
      c: colors[Math.floor(Math.random() * colors.length)], life: 1,
    };
  });
  let raf = 0;
  let last = performance.now();
  const tick = (now) => {
    const k = Math.min(4, (now - last) / 16.7);
    last = now;
    ctx.clearRect(0, 0, w, h);
    let alive = 0;
    for (const p of parts) {
      p.vy += 0.28 * k;
      p.vx *= 0.99 ** k;
      p.x += p.vx * k;
      p.y += p.vy * k;
      p.r += p.vr * k;
      p.life -= 0.006 * k;
      if (p.life <= 0 || p.y > h + 20) continue;
      alive++;
      ctx.save();
      ctx.globalAlpha = Math.min(1, p.life * 1.5);
      ctx.translate(p.x, p.y);
      ctx.rotate(p.r);
      ctx.fillStyle = p.c;
      ctx.fillRect(-p.s / 2, -p.s / 2, p.s, p.s);
      ctx.fillStyle = 'rgba(255,255,255,.35)';
      ctx.fillRect(-p.s / 2, -p.s / 2, p.s, p.s * 0.3);
      ctx.restore();
    }
    if (alive) raf = requestAnimationFrame(tick);
  };
  raf = requestAnimationFrame(tick);
  return () => cancelAnimationFrame(raf);
}
