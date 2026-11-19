// Vice Cover Studio — hand-in program (Node 22, standard library only).
// It stages the entry for the scorer: copy app/ and screenshots/ from
// this repository into the output directory, then write dossier.json
// with the vendored make.fun library so the judge can read the entry.
//
// Run it outside the grader with MAKEFUN_OUTPUT_DIR standing in for
// /output, e.g. `mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts`.

import { cpSync, existsSync, mkdirSync, readdirSync, statSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDossier } from './vendor/makefun-app.ts';

const repoRoot = fileURLToPath(new URL('.', import.meta.url));
const outDir = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';
const appDir = join(repoRoot, 'app');
const shotsDir = join(repoRoot, 'screenshots');

function countTree(dir) {
  let files = 0;
  let bytes = 0;
  for (const name of readdirSync(dir)) {
    const path = join(dir, name);
    const st = statSync(path);
    if (st.isDirectory()) {
      const sub = countTree(path);
      files += sub.files;
      bytes += sub.bytes;
    } else if (st.isFile()) {
      files += 1;
      bytes += st.size;
    }
  }
  return { files, bytes };
}

function stage() {
  mkdirSync(outDir, { recursive: true });
  cpSync(appDir, join(outDir, 'app'), { recursive: true });
  mkdirSync(join(outDir, 'screenshots'), { recursive: true });
  if (existsSync(shotsDir)) {
    cpSync(shotsDir, join(outDir, 'screenshots'), { recursive: true });
  }
}

// The scorer's own caps, from the kit's gate: app/ stays under 993
// entries and 48 MiB, screenshots/ under 4 files and 256 KiB each,
// and the dossier text under 160 KiB. Refuse loudly here instead of
// handing in an entry the scorer would refuse.
const appStats = countTree(appDir);
if (appStats.files > 993) throw new Error(`app/ holds ${appStats.files} entries, over the 993 cap`);
if (appStats.bytes > 48 * 1024 * 1024) throw new Error(`app/ is ${appStats.bytes} bytes, over the 48 MiB cap`);

stage();

const dossier = buildDossier(outDir, {
  text_max_bytes: 163840,
  screenshots: { max: 4, max_bytes: 262144 },
  app_max_files: 993,
  app_max_bytes: 50331648,
  app_path_max_bytes: 1000,
});
writeFileSync(join(outDir, 'dossier.json'), dossier);

const shotNames = existsSync(shotsDir) ? readdirSync(shotsDir).filter((n) => !n.startsWith('.')) : [];
console.log(`staged ${appStats.files} app files (${appStats.bytes} bytes) and ${shotNames.length} screenshots into ${outDir}`);
console.log(`dossier.json written (${dossier.length} bytes)`);
