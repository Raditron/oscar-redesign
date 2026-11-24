// Seam: the source tree. ARCHITECTURE.md's one rule between the layers is that dependencies point inward only, and
// its table says what each layer may import: which layers, and which packages. The domain at the centre imports
// nothing but other domain code: never Express, MongoDB, zod or any other package. A wrong import compiles and runs,
// so nothing else would notice it; this test reads every import in the four layers' folders and in seed/.
import { readdirSync, readFileSync } from 'node:fs';
import { dirname, join, relative, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

const SRC = fileURLToPath(new URL('../../src', import.meta.url));

const LAYERS = ['domain', 'application', 'infrastructure', 'interface'] as const;
type Layer = (typeof LAYERS)[number];

/** ARCHITECTURE.md's table, its "May import" column: the layers and the packages each layer may import from. */
const MAY_IMPORT: Record<Layer, { readonly layers: readonly Layer[]; readonly packages: readonly string[] }> = {
  domain: { layers: ['domain'], packages: [] },
  application: { layers: ['domain', 'application'], packages: [] },
  // The libraries it adapts: MongoDB, bcrypt, JWT, and Node's crypto (for the password hash's fingerprint).
  infrastructure: {
    layers: ['domain', 'application', 'infrastructure'],
    packages: ['mongodb', 'bcryptjs', 'jsonwebtoken', 'node:crypto'],
  },
  interface: { layers: ['domain', 'application', 'interface'], packages: ['express', 'zod'] },
};

interface Import {
  /** The importing file, relative to src/. */
  readonly file: string;
  /** The module as written: './money.ts', 'express', 'node:fs'. */
  readonly module: string;
  /** Where the module is: a layer's name, 'the outer shell' (main.ts, config.ts, …) or 'a package'. */
  readonly reaches: string;
}

/** Every import and re-export in the source files of a folder of src/: a layer, or the seed. */
function importsIn(folder: Layer | 'seed'): Import[] {
  const files = readdirSync(join(SRC, folder), { recursive: true, encoding: 'utf8' }).filter((name) => name.endsWith('.ts'));
  return files.flatMap((name) => {
    const path = join(SRC, folder, name);
    const source = readFileSync(path, 'utf8');
    // `from` after a space or a brace, as in an import, never after a dot: 'HappyHour.from' is a string, not an import.
    const patterns = [/(?:^|[\s}])from\s*['"]([^'"]+)['"]/g, /\bimport\s*['"]([^'"]+)['"]/g, /\bimport\s*\(\s*['"]([^'"]+)['"]\s*\)/g];
    const modules = patterns.flatMap((pattern) => [...source.matchAll(pattern)].map((match) => match[1]!));
    return modules.map((module) => ({ file: relative(SRC, path), module, reaches: layerReachedBy(path, module) }));
  });
}

function layerReachedBy(importingFile: string, module: string): string {
  if (!module.startsWith('.')) return 'a package';
  const top = relative(SRC, resolve(dirname(importingFile), module)).split(sep)[0];
  return (LAYERS as readonly string[]).includes(top!) ? top! : 'the outer shell';
}

/** Whether `layer` may import `entry`, by the table. A package may also be imported by a path inside it ('zod/v4'). */
function isAllowed(layer: Layer, entry: Import): boolean {
  const { layers, packages } = MAY_IMPORT[layer];
  if (entry.reaches !== 'a package') return (layers as readonly string[]).includes(entry.reaches);
  return packages.some((name) => entry.module === name || entry.module.startsWith(`${name}/`));
}

describe('the layers', () => {
  it('keep the domain free of every package: no Express, no MongoDB, no zod, not even Node', () => {
    expect(importsIn('domain').filter((entry) => entry.reaches === 'a package')).toEqual([]);
  });

  it.each(LAYERS)('let %s import only what the table allows: its own layer, the layers it points at, its packages', (layer) => {
    expect(importsIn(layer).filter((entry) => !isAllowed(layer, entry))).toEqual([]);
  });
});

describe('the seed', () => {
  it('stays a client of the admin API: it imports none of the layers, so it can only load what an Admin could', () => {
    expect(importsIn('seed').filter((entry) => (LAYERS as readonly string[]).includes(entry.reaches))).toEqual([]);
  });
});
