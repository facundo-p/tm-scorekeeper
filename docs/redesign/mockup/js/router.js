// Tiny router: screen state lives in memory and mirrors to a plain #token, so the
// browser's back button works and any screen can be deep-linked. Filters and tabs
// travel in the hash as a query: #records?mapa=Tharsis, #jugador-p-facu?tab=partidas
// (the per-screen table filter ?mesa=N arrives in phase 18).
import { createContext, useContext } from './lib.js';

export { toHash, hrefOf, parseHash, SECTION } from './routes.js';

export const NavCtx = createContext(null);
export const useNav = () => useContext(NavCtx);
