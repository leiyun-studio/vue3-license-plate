const { test } = require('node:test')
const assert = require('node:assert/strict')
const fs = require('node:fs')
const path = require('node:path')
const vm = require('node:vm')
const core = require('../packages/license-plate/plate-core.cjs')
const file = path.join(__dirname, '../packages/license-plate/component-options.js')
const context = { core, document: undefined }
vm.runInNewContext(fs.readFileSync(file, 'utf8').replace(/^import .*$/m, '').replace('export default', 'globalThis.component ='), context)
const definition = context.component
function create(properties = {}) {
  const events = []
  const instance = { ...definition.data(), $refs: {}, $el: null, $nextTick(fn) { fn() }, $emit(name, value) { events.push({ name, value }) }, events }
  for (const [key, prop] of Object.entries(definition.props)) instance[key] = prop.type.name === 'Function' ? prop.default : typeof prop.default === 'function' ? prop.default() : prop.default
  Object.assign(instance, properties)
  for (const [key, fn] of Object.entries(definition.methods)) instance[key] = fn.bind(instance)
  for (const [key, fn] of Object.entries(definition.computed)) Object.defineProperty(instance, key, { get: fn.bind(instance) })
  instance.syncValue(instance.value || instance.modelValue)
  return instance
}
test('external clear, partial and invalid values replace old data', () => {
  const o = create({ value: '川A12345', modelValue: '川A12345' })
  o.keyboardMode = 'alnum'; o.syncValue(''); assert.equal(o.inputValue.join(''), ''); assert.equal(o.keyboardMode, 'province')
  o.syncValue('粤b'); assert.equal(o.inputValue.join(''), '粤B')
  o.syncValue('INVALID?'); assert.equal(o.inputValue.join(''), 'INVALID?'); assert.equal(o.validate().pass, false)
})
test('normal input closes after 7; auto mode waits for explicit confirmation', () => {
  for (const plateType of ['normal', 'auto']) {
    const o = create({ plateType }); o.show()
    for (const char of '川A12345') o.btnClick(char)
    assert.equal(o.keyboardVisible, plateType === 'auto')
    assert.equal(o.validate().pass, true)
    if (plateType === 'auto') { assert.equal(o.confirm(), true); assert.equal(o.keyboardVisible, false) }
  }
})
test('new energy waits for 8 and autoClose=false remains open', () => {
  const o = create({ plateType: 'newEnergy' }); o.show()
  for (const char of '川AD1234') o.btnClick(char)
  assert.equal(o.keyboardVisible, true); assert.equal(o.validate().pass, false)
  o.btnClick('5'); assert.equal(o.keyboardVisible, false)
  o.autoClose = false; o.show(7); o.btnClick('6'); assert.equal(o.keyboardVisible, true)
})
test('invalid confirmation stays open and reports an error', () => {
  const o = create(); o.show(); o.btnClick('川')
  assert.equal(o.confirm(), false); assert.equal(o.keyboardVisible, true); assert.ok(o.errorMessage)
})
test('multiple instances coordinate and groups are independent', () => {
  const a = create(), b = create(), c = create({ group: 'separate' })
  a.show(); b.show(); assert.equal(a.keyboardVisible, false); assert.equal(b.keyboardVisible, true)
  c.show(); assert.equal(b.keyboardVisible, true); assert.equal(c.keyboardVisible, true)
  b.hide(); c.hide()
})
test('clicks locate exact cells; custom display resumes at first empty', () => {
  const o = create({ value: '川A12345', modelValue: '川A12345' })
  o.inputClick(2); assert.equal(o.activeIndex, 2)
  o.onSlotClick(); assert.equal(o.activeIndex, 7)
  o.syncValue('川A'); o.onSlotClick(); assert.equal(o.activeIndex, 2)
})
test('disabled and readonly prevent edits and opening', () => {
  for (const property of ['disabled', 'readonly']) {
    const o = create({ [property]: true }); o.show(); o.btnClick('川'); o.delClick(); o.clear()
    assert.equal(o.keyboardVisible, false); assert.equal(o.inputValue.join(''), '')
  }
})
test('model echo preserves cursor and events use an up-to-date model', () => {
  const o = create(); o.show(); o.btnClick('川'); o.syncValue('川')
  assert.equal(o.activeIndex, 1)
  assert.match(o.events[o.events.length - 2].name, /^update/)
  assert.equal(o.events[o.events.length - 1].name, 'change')
})
test('repeated deletion is bounded; clear and external visibility work', () => {
  const o = create(); o.show()
  for (let i = 0; i < 30; i++) o.delClick()
  assert.equal(o.activeIndex, 0); assert.equal(o.inputValue.length, 0)
  o.btnClick('川'); o.clear(); assert.equal(o.validate().value, '')
  definition.watch.visible.call(o, false); assert.equal(o.keyboardVisible, false)
  definition.watch.visible.call(o, true); assert.equal(o.keyboardVisible, true)
  o.hide()
})
