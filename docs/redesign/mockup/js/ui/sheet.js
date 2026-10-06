// Bottom sheet on phones, centred chamfered dialog on wider screens.
import { html, useEffect, useRef, cls, createPortal } from '../lib.js';
import { Button } from './atoms.js';

export function Sheet({ title, onClose, children, wide, labelId = 'sheet-title' }) {
  const ref = useRef(null);
  useEffect(() => {
    const prev = document.activeElement;
    const first = ref.current?.querySelector('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])');
    first?.focus();
    return () => prev?.focus?.();
  }, []);
  const onKey = (e) => {
    if (e.key === 'Escape') { e.stopPropagation(); onClose(); }
    if (e.key !== 'Tab') return;
    const nodes = [...ref.current.querySelectorAll('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])')].filter((n) => !n.disabled);
    if (!nodes.length) return;
    const [a, b] = [nodes[0], nodes[nodes.length - 1]];
    if (e.shiftKey && document.activeElement === a) { e.preventDefault(); b.focus(); }
    else if (!e.shiftKey && document.activeElement === b) { e.preventDefault(); a.focus(); }
  };
 return createPortal(html`<div class="sheet-backdrop" onClick=${(e) => e.target === e.currentTarget && onClose()} onKeyDown=${onKey}>
    <div class=${cls('sheet', wide && 'sheet--wide')} role="dialog" aria-modal="true" aria-labelledby=${labelId} ref=${ref}>
      <div class="sheet__grip" aria-hidden="true"></div>
      <div class="sheet__head">
        <h2 class="sheet__title" id=${labelId}>${title}</h2>
        <span class="sheet__close"><${Button} variant="ghost" icon="close" label="Cerrar" onClick=${onClose} /></span>
      </div>
      ${children}
    </div>
  </div>`, document.getElementById('overlays') ?? document.body);
}
