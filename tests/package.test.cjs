const { test, after } = require('node:test')
const assert = require('node:assert/strict')
const fs = require('node:fs')
const path = require('node:path')
const vm = require('node:vm')
const { createRequire } = require('node:module')
const { pathToFileURL } = require('node:url')
const { spawnSync } = require('node:child_process')
const { JSDOM } = require('jsdom')
const packageRoot = process.env.LP_PACKAGE_DIR || path.join(__dirname, '..')
const requirePackage = createRequire(path.join(packageRoot, 'package.json'))
const built = fs.existsSync(path.join(packageRoot, 'lib/licensePlate.esm.mjs'))
if (process.env.npm_lifecycle_event === 'test:package' && !built) throw Error('Run npm run lib before testing package artifacts')
const dom = new JSDOM('<!doctype html><html><body></body></html>', { url: 'http://localhost/' })
for (const key of ['window', 'document', 'navigator', 'HTMLElement', 'Element', 'SVGElement', 'Node']) Object.defineProperty(global, key, { value: dom.window[key], configurable: true, writable: true })
global.requestAnimationFrame = callback => setTimeout(callback, 0)
global.cancelAnimationFrame = clearTimeout
const Vue = requirePackage('vue')
const isVue2 = /^2\./.test(Vue.version)
function mount(Component, props = {}) {
  const target = document.createElement('div'); document.body.appendChild(target)
  const model = isVue2 ? 'value' : 'modelValue'
  const event = isVue2 ? 'update' : 'update:modelValue'
  let host, app
  const definition = {
    data() { return { plate: props[model] || '', visible: false, changes: [] } },
    render: isVue2 ? function(h) { return h(Component, { ref: 'plate', props: { ...props, value: this.plate, visible: this.visible }, on: { update: value => { this.plate = value }, 'update:visible': value => { this.visible = value }, change: value => this.changes.push(value) } }) } : function() { return Vue.h(Component, { ...props, ref: 'plate', modelValue: this.plate, visible: this.visible, 'onUpdate:modelValue': value => { this.plate = value }, 'onUpdate:visible': value => { this.visible = value }, onChange: value => this.changes.push(value) }) }
  }
  if (isVue2) { host = new Vue(definition).$mount(target) } else { app = Vue.createApp(definition); host = app.mount(target) }
  return { host, component: host.$refs.plate, dispose() { if (isVue2) { host.$destroy(); if (host.$el.parentNode) host.$el.remove() } else app.unmount(); target.remove() } }
}
const tick = () => Vue.nextTick()
let plugin
if (built) plugin = requirePackage('./lib/licensePlate.common.js').default

test('CJS, ESM and UMD expose the same plugin and install correctly', { skip: !built }, async () => {
  const esm = await import(pathToFileURL(path.join(packageRoot, 'lib/licensePlate.esm.mjs')).href)
  assert.equal(esm.default.version, '1.1.0'); assert.equal(plugin.version, '1.1.0'); assert.ok(esm.LicensePlate)
  const registrations = []; plugin.install({ component(name) { registrations.push(name) } }); assert.deepEqual(registrations, ['LicensePlate'])
  for (const file of ['licensePlate.umd.js', 'licensePlate.umd.min.js']) {
    const context = { Vue }
    vm.runInNewContext(fs.readFileSync(path.join(packageRoot, 'lib', file), 'utf8'), context)
    assert.equal(context.licensePlate.default.version, '1.1.0')
    let amd
    const define = (deps, factory) => { const exports = {}; const result = factory(...deps.map(name => name === 'exports' ? exports : Vue)); amd = result || exports }; define.amd = true
    vm.runInNewContext(fs.readFileSync(path.join(packageRoot, 'lib', file), 'utf8'), { define })
    assert.equal(amd.default.version, '1.1.0')
  }
})
test('actual compiled DOM: cell clicks do not bubble, parent reset and partial values synchronize', { skip: !built }, async () => {
  const mounted = mount(plugin.LicensePlate, { value: '川A12345', modelValue: '川A12345', adjustPosition: false })
  await tick()
  const cells = mounted.component.$el.querySelectorAll('.lp-cell')
  cells[2].click(); await tick(); assert.equal(mounted.component.activeIndex, 2)
  assert.equal(mounted.host.visible, true)
  mounted.host.plate = ''; await tick(); assert.equal(mounted.component.inputValue.join(''), '')
  mounted.host.plate = '粤B'; await tick(); assert.equal(mounted.component.inputValue.join(''), '粤B')
  mounted.component.onSlotClick(); await tick(); assert.equal(mounted.component.activeIndex, 2)
  mounted.dispose(); assert.equal(document.querySelector('.lp-keyboard'), null)
})
test('actual compiled DOM: seven-digit close, real key buttons and keyboard navigation', { skip: !built }, async () => {
  const mounted = mount(plugin.LicensePlate, { plateType: 'normal', adjustPosition: false })
  mounted.component.$el.querySelector('.lp-cell').click(); await tick()
  for (const char of '川A12345') {
    const key = Array.from(document.querySelectorAll('.lp-key')).find(button => button.textContent.trim() === char)
    assert.ok(key, char); assert.equal(key.disabled, false, char + ' must be enabled'); key.click(); await tick()
  }
  assert.equal(mounted.host.plate, '川A12345'); assert.equal(mounted.host.visible, false)
  mounted.component.show(2); await tick()
  document.dispatchEvent(new window.KeyboardEvent('keydown', { key: '6', bubbles: true, cancelable: true })); await tick()
  assert.equal(mounted.host.plate, '川A62345')
  mounted.component.show(); await tick()
  document.dispatchEvent(new window.KeyboardEvent('keydown', { key: 'Escape', bubbles: true })); await tick()
  assert.equal(mounted.host.visible, false)
  mounted.dispose()
})
test('actual compiled DOM: only one keyboard owns focus and outside focus closes it', { skip: !built }, async () => {
  const a = mount(plugin.LicensePlate, { adjustPosition: false }), b = mount(plugin.LicensePlate, { adjustPosition: false })
  a.component.show(); await tick(); b.component.show(); await tick()
  assert.equal(a.component.keyboardVisible, false); assert.equal(b.component.keyboardVisible, true)
  const input = document.createElement('input'); document.body.appendChild(input); input.focus(); await tick()
  assert.equal(b.component.keyboardVisible, false)
  input.remove(); a.dispose(); b.dispose()
})
test('page padding is restored across independent keyboard groups and unmount', { skip: !built }, async () => {
  document.body.style.paddingBottom = '10px'
  const a = mount(plugin.LicensePlate, { group: 'padding-a', closeOnOutside: false }), b = mount(plugin.LicensePlate, { group: 'padding-b', closeOnOutside: false })
  a.component.$refs.keyboard.getBoundingClientRect = () => ({ height: 240 })
  b.component.$refs.keyboard.getBoundingClientRect = () => ({ height: 280 })
  a.component.show(); await tick(); assert.equal(document.body.style.paddingBottom, '262px')
  b.component.show(); await tick(); assert.equal(document.body.style.paddingBottom, '302px')
  a.component.hide(); await tick(); assert.equal(document.body.style.paddingBottom, '302px')
  b.dispose(); assert.equal(document.body.style.paddingBottom, '10px')
  a.dispose(); document.body.style.paddingBottom = ''
})
test('published metadata has an explicit Vue peer and no self dependency', () => {
  const pkg = requirePackage('./package.json')
  assert.equal(pkg.version, '1.1.0'); assert.ok(pkg.peerDependencies.vue); assert.equal(pkg.dependencies, undefined)
  assert.equal(fs.existsSync(path.join(packageRoot, pkg.types)), true)
})
test('package entry imports without a browser for SSR', { skip: !built }, () => {
  const result = spawnSync(process.execPath, ['-e', "const p = require('./lib/licensePlate.common.js'); if (p.default.version !== '1.1.0') process.exit(1); import('./lib/licensePlate.esm.mjs').then(p => { if (!p.LicensePlate) process.exit(2) })"], { cwd: packageRoot, encoding: 'utf8' })
  assert.equal(result.status, 0, result.stderr)
})
after(() => dom.window.close())
