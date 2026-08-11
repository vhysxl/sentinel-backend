#!/usr/bin/env node
/**
 * Menarik kontrak temuan dari snapshot OpenAPI agent server dan men-generate
 * src/contract/findings.contract.js — satu-satunya sumber nilai enum temuan.
 *
 *   npm run contract:pull       tulis ulang contract (dikomit)
 *   npm run contract:check      bandingkan fingerprint tersimpan dengan sumber
 *
 * Sumber snapshot:
 *   AGENT_CONTRACT_URL   URL http(s) atau path file. Default: sibling repo
 *   ../sentinel-agent-server/openapi/snapshot.json.
 *
 * Snapshot dihasilkan agent server lewat `python scripts/export_openapi.py`.
 * Agent server adalah sumber kebenaran; berkas ini hanya menyalin enum-nya.
 */
import { createHash } from 'node:crypto';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const OUT = path.join(ROOT, 'src', 'contract', 'findings.contract.js');
const CHECK = process.argv.includes('--check');

async function loadSnapshot() {
  const src =
    process.env.AGENT_CONTRACT_URL ||
    path.join(path.dirname(ROOT), 'sentinel-agent-server', 'openapi', 'snapshot.json');

  if (/^https?:\/\//.test(src)) {
    const res = await fetch(src);
    if (!res.ok) throw new Error(`AGENT_CONTRACT_URL ${src} -> HTTP ${res.status}`);
    return res.text();
  }
  return await readFile(src, 'utf-8');
}

/** Enum yang membentuk kontrak, diambil dari posisi yang sudah disepakati. */
function extractEnums(spec) {
  const row = spec.components?.schemas?.FindingRow;
  if (!row) throw new Error('FindingRow schema tidak ada di snapshot');

  const riskLevel = row.properties?.risk_level?.enum;
  const resolution = row.properties?.resolution?.anyOf?.find((o) => o.enum)?.enum;
  const status = spec.paths?.['/api/findings']?.get?.parameters
    ?.find((p) => p.name === 'status')?.schema?.enum;

  if (!riskLevel || !resolution || !status) {
    throw new Error(
      'Enum risk_level/resolution/status tidak ditemukan di snapshot — ' +
        'snapshot bukan dari agent server versi saat ini? Jalankan export_openapi.py dulu.'
    );
  }
  return { riskLevel, resolution, status };
}

function render(raw, fingerprint) {
  const arr = (a) => `Object.freeze([${a.map((v) => JSON.stringify(v)).join(', ')}])`;
  const spec = JSON.parse(raw);
  const { riskLevel, resolution, status } = extractEnums(spec);
  return `// AUTO-GENERATED. Jangan edit. Sumber: snapshot OpenAPI sentinel-agent-server.
// Regenerasi: npm run contract:pull
// Fingerprint: ${fingerprint}

export const RISK_LEVELS = ${arr(riskLevel)};
export const RESOLUTIONS = ${arr(resolution)};
export const FINDING_STATUS_FILTERS = ${arr(status)};
`;
}

const raw = await loadSnapshot();
// Fingerprint the LF-normalized text, not the raw bytes: a Windows checkout
// smudges CRLF into the snapshot while Linux CI reads LF, so hashing the raw
// file makes the same snapshot hash differently per platform and trips
// contract:check spuriously.
const normalized = raw.replace(/\r\n/g, '\n');
const fingerprint = createHash('sha256').update(normalized).digest('hex').slice(0, 16);

if (CHECK) {
  let stored;
  try {
    const file = await readFile(OUT, 'utf-8');
    stored = file.match(/Fingerprint: ([0-9a-f]+)/)?.[1];
  } catch {
    stored = null;
  }
  if (stored !== fingerprint) {
    console.error(`contract STALE: tersimpan ${stored ?? '(tidak ada)'}, sumber ${fingerprint}.`);
    console.error('Jalankan npm run contract:pull lalu komit hasilnya.');
    process.exit(1);
  }
  console.log(`contract OK (fingerprint ${fingerprint})`);
  process.exit(0);
}

await mkdir(path.dirname(OUT), { recursive: true });
await writeFile(OUT, render(raw, fingerprint), 'utf-8');
console.log(`contract -> ${OUT} (fingerprint ${fingerprint})`);
