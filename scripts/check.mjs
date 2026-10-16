import { readdir, readFile } from 'node:fs/promises'
import { spawnSync } from 'node:child_process'
import { resolve } from 'node:path'

async function visit(dir) {
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const file = resolve(dir, entry.name)
    if (entry.isDirectory()) await visit(file)
    else if (/\.(?:js|cjs|mjs)$/.test(file)) {
      const esm = /\b(?:import|export)\s/.test(await readFile(file, 'utf8'))
      const args = esm ? ['--input-type=module', '--check'] : ['--check', file]
      const result = spawnSync(process.execPath, args, { input: esm ? await readFile(file, 'utf8') : undefined, encoding: 'utf8' })
      if (result.status !== 0) throw new Error(file + '\n' + result.stderr)
    }
  }
}
for (const folder of ['packages', 'examples', 'scripts', 'tests']) await visit(folder)
console.log('JavaScript syntax checks passed; Vue templates are checked by npm run build/lib.')
