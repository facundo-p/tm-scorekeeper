// A screen asks for the planet by rendering an empty slot; the persistent stage
// flies the globe there. Without WebGL2 the slot paints a CSS globe instead.
import { html, createContext, useContext, useEffect, useRef, cls } from '../lib.js';

export const StageCtx = createContext(null);

export function PlanetSlot({ region = null, terra = 0.15, board = false, fill = 0, interactive = false, bright = 1, glow = 1, tilt = 0.32, class: className, label }) {
  const stage = useContext(StageCtx);
  const ref = useRef(null);
  const handle = useRef(null);
  const params = { region, terra, board, fill, interactive, bright, glow, tilt };

  useEffect(() => {
    if (!stage?.supported || !ref.current) return undefined;
    handle.current = stage.addSlot(ref.current, params);
    return () => { handle.current?.remove(); handle.current = null; };
  }, [stage]);

  useEffect(() => { handle.current?.update(params); }, [region, terra, board, fill, interactive, bright, glow, tilt]);

  const fallback = stage && !stage.supported;
  return html`<div ref=${ref} data-planet-slot class=${cls('planet-slot', interactive && 'planet-slot--grab', fallback && 'planet-slot--fallback', className)}
    role=${label ? 'img' : null} aria-label=${label ?? null}>
    ${fallback && html`<span class="planet-fallback" aria-hidden="true"></span>`}
  </div>`;
}
