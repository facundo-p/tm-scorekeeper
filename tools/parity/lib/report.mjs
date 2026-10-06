// Salidas de una corrida: imágenes, composiciones para el juez, summary.json y report.html.
import { mkdirSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { PNG } from 'pngjs';

export function writeImages(dir, key, ref, cand, result) {
  mkdirSync(resolve(dir, 'img'), { recursive: true });
  mkdirSync(resolve(dir, 'judge'), { recursive: true });
  return ref.frames.map((f, i) => {
    const base = `${key}-f${i}`;
    const files = { ref: `img/${base}-ref.png`, cand: `img/${base}-cand.png`, diff: `img/${base}-diff.png` };
    writeFileSync(resolve(dir, files.ref), f.png);
    if (cand.frames[i]) writeFileSync(resolve(dir, files.cand), cand.frames[i].png);
    if (result.frames[i]?.diffPng) writeFileSync(resolve(dir, files.diff), result.frames[i].diffPng);
    if (i === 0 && cand.frames[0] && result.frames[0]?.diffPng) writeComposite(resolve(dir, 'judge', `${key}.png`), f.png, cand.frames[0].png, result.frames[0].diffPng);
    return files;
  });
}

// mockup | app | diferencias, lado a lado.
function writeComposite(file, ...pngs) {
  const imgs = pngs.map((p) => PNG.sync.read(p));
  const out = new PNG({ width: imgs.reduce((s, i) => s + i.width, 0), height: Math.max(...imgs.map((i) => i.height)) });
  let x = 0;
  for (const img of imgs) { PNG.bitblt(img, out, 0, 0, img.width, img.height, x, 0); x += img.width; }
  writeFileSync(file, PNG.sync.write(out));
}

const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);

function frameHtml(files, cmp, i) {
  const metric = cmp?.error ? esc(cmp.error) : `${cmp.pixels.toFixed(3)} % · planeta ${cmp.planet.pct.toFixed(2)} %`;
  return `<figure class="f"><figcaption>frame ${i} — ${metric}</figcaption>
  <div class="trio"><img src="${files.ref}" alt="mockup"><img src="${files.cand}" alt="app"><img src="${files.diff}" alt="diferencias"></div>
  <div class="slider"><img src="${files.ref}" alt=""><div class="over"><img src="${files.cand}" alt=""></div>
  <input type="range" min="0" max="100" value="50" aria-label="Deslizar mockup/app"></div></figure>`;
}

function entryHtml(e) {
  const status = e.pass ? '<b class="ok">OK</b>' : e.gated ? '<b class="bad">FALLA</b>' : '<b class="warn">no exigido</b>';
  const fails = e.failures.map((f) => `<li>${esc(f)}</li>`).join('');
  return `<section><h2>${status} ${esc(e.id)} · ${esc(e.viewport)}</h2><ul>${fails}</ul>
  ${e.files.map((files, i) => frameHtml(files, e.result.frames[i], i)).join('')}</section>`;
}

const CSS = `body{background:#111;color:#eee;font:14px system-ui;margin:24px}.ok{color:#6c6}.bad{color:#f66}.warn{color:#fc6}
.trio{display:grid;grid-template-columns:repeat(3,1fr);gap:8px}.trio img,.slider img{width:100%;display:block}
.slider{position:relative;margin-top:8px;max-width:50%}.over{position:absolute;inset:0;overflow:hidden;width:var(--p,50%)}
.over img{width:calc(100% * 100 / var(--pn,50))}.slider input{width:100%}figure{margin:16px 0}`;

const JS = `document.querySelectorAll('.slider').forEach(s=>{const i=s.querySelector('input');const o=s.querySelector('.over');
const set=()=>{o.style.setProperty('--p',i.value+'%');o.style.setProperty('--pn',Math.max(1,i.value));};i.addEventListener('input',set);set();});`;

export function writeReport(dir, summary, entries) {
  writeFileSync(resolve(dir, 'summary.json'), `${JSON.stringify(summary, null, 2)}\n`);
  const body = entries.map(entryHtml).join('\n');
  writeFileSync(resolve(dir, 'report.html'), `<!doctype html><meta charset="utf-8"><title>Comparación ${esc(summary.run)}</title>
<style>${CSS}</style><h1>Comparación ${esc(summary.mode)} · fase ${summary.phase} · ${summary.passed}/${summary.total} OK</h1>${body}<script>${JS}</script>`);
}
