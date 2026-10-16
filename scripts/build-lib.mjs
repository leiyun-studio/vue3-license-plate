import { build } from 'vite'
import { fileURLToPath } from 'node:url'
import { writeFile } from 'node:fs/promises'

const entry = fileURLToPath(new URL('../packages/index.js', import.meta.url))
const common = {
  outDir: 'lib', copyPublicDir: false, target: 'es2015', sourcemap: false,
  lib: { entry, name: 'licensePlate', cssFileName: 'licensePlate' },
  rollupOptions: { external: ['vue'], output: { globals: { vue: 'Vue' }, exports: 'named' } }
}
await build({ build: { ...common, emptyOutDir: true, minify: false, lib: { ...common.lib, formats: ['es', 'cjs', 'umd'], fileName: format => ({ es: 'licensePlate.esm.mjs', cjs: 'licensePlate.common.js', umd: 'licensePlate.umd.js' })[format] } } })
await build({ build: { ...common, emptyOutDir: false, minify: 'esbuild', lib: { ...common.lib, formats: ['umd'], fileName: () => 'licensePlate.umd.min.js' } } })
await writeFile('lib/demo.html', '<!doctype html><html lang="zh-CN"><meta charset="utf-8"><title>LicensePlate 1.1.0</title><p>完整示例请在仓库运行 npm run serve。UMD 用法参见 README。</p></html>\n')
