// Preact + htm from the CDN globals (UMD builds loaded in index.html).
const { h, render, Fragment, createContext, cloneElement } = window.preact;
const hooks = window.preactHooks;

export const html = window.htm.bind(h);
export const { useState, useEffect, useRef, useMemo, useCallback, useLayoutEffect, useContext, useReducer } = hooks;
export { h, render, Fragment, createContext, cloneElement };
export const { createPortal } = window.preactCompat;

export const cls = (...xs) => xs.filter(Boolean).join(' ');

export const reducedMotion = () => matchMedia('(prefers-reduced-motion: reduce)').matches;

export const fmt = {
  int: (n) => Math.round(n).toLocaleString('es-AR', { useGrouping: 'min2' }),
  pct: (x, digits = 0) => `${(x * 100).toFixed(digits)} %`,
  signed: (n) => (n > 0 ? `+${n}` : n < 0 ? `−${Math.abs(n)}` : '±0'),
  dec: (n, d = 1) => n.toLocaleString('es-AR', { minimumFractionDigits: d, maximumFractionDigits: d }),
};
