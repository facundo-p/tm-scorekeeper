// node run.mjs [--self] [--phase NN] [--gated] [--screens a,b] [--ids x,y] [--viewports desktop,mobile]
//              [--ref mockup@<sha>] [--concurrency N] [--out dir]
const LIST = (v) => v.split(',').map((x) => x.trim()).filter(Boolean);

export function parseArgs(argv) {
  const opts = { mode: 'candidate', phase: 0, concurrency: 2 };
  for (let i = 0; i < argv.length; i++) {
    const [flag, value] = [argv[i], argv[i + 1]];
    if (flag === '--self') { opts.mode = 'self'; continue; }
    if (flag === '--gated') { opts.gated = true; continue; }
    if (!flag.startsWith('--')) throw new Error(`argumento inesperado: ${flag}`);
    i += 1;
    if (flag === '--phase') opts.phase = Number(value);
    else if (flag === '--screens') opts.screens = LIST(value);
    else if (flag === '--ids') opts.ids = LIST(value);
    else if (flag === '--viewports') opts.viewports = LIST(value);
    else if (flag === '--ref') opts.ref = value;
    else if (flag === '--concurrency') opts.concurrency = Number(value);
    else if (flag === '--out') opts.out = value;
    else throw new Error(`opción desconocida: ${flag}`);
  }
  return opts;
}
