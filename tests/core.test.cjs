const { test } = require('node:test')
const assert = require('node:assert/strict')
const fs = require('node:fs')
const path = require('node:path')
const core = require('../packages/license-plate/plate-core.cjs')
const valid = [
  ['normal', '川A12345'], ['normal', '粤Z1234港'], ['normal', '川A1234挂'],
  ['normal', '川A1234学'], ['normal', '川A1234领'],
  ['newEnergy', '川AD12345'], ['newEnergy', '沪AB12345'], ['newEnergy', '川A12345F'],
  ['police', '京A1234警'], ['police', '京AA123警'],
  ['military', 'VA12345'], ['military', '军A12345'], ['military', '海A12345'],
  ['armedPolice', 'WJ0112345'], ['armedPolice', 'WJ京12345'],
  ['diplomatic', '使123456'], ['diplomatic', '123456使'], ['diplomatic', '沪A1234领'],
  ['temporary', '临A12345'], ['emergency', '京12345应急'], ['emergency', '京X1234应急']
]
for (const [plateType, value] of valid) {
  test(plateType + ': validates and can enter ' + value, () => {
    assert.equal(core.validate(value.split(''), { plateType }).pass, true)
    assert.equal(core.validate(value.split(''), { plateType: 'auto' }).pass, true)
    let cells = [], index = 0
    for (const char of value) {
      const next = core.insert(cells, index, char, { plateType })
      assert.ok(next, 'must be possible to type ' + char + ' at ' + index)
      cells = next.cells; index = next.index
    }
    assert.equal(cells.join(''), value)
  })
}
for (const value of ['', '川O12345', '川A12O45', '川A123456', '川A12345警', '川A警1234', '临123456', '军A1234', 'WJ1234']) {
  test('rejects invalid ' + JSON.stringify(value), () => assert.equal(core.validate(value.split('')).pass, false))
}
test('does not hide positional holes by joining', () => {
  const result = core.validate(['川', '', 'A', '1', '2', '3', '4', '5'])
  assert.equal(result.pass, false); assert.equal(result.slots[1], '')
})
test('normalization and external values are independent of validation', () => {
  assert.equal(core.normalize(' 粤b·12345 '), '粤B12345')
  assert.equal(core.normalize(null), '')
  assert.equal(core.normalize('invalid?'), 'INVALID?')
})
test('insertion clamps gaps; deletion cannot underflow or write a ninth cell', () => {
  assert.deepEqual(core.insert([], 7, '川', { plateType: 'normal' }), { cells: ['川'], index: 1 })
  assert.equal(core.insert([], -1, '1', { plateType: 'normal' }), null)
  let cells = '川A12345'.split('')
  for (let i = 0; i < 30; i++) cells = core.remove(cells, -100).cells
  assert.deepEqual(cells, [])
  assert.deepEqual(core.remove([], 99), { cells: [], index: 0 })
  assert.equal(core.insert('川A12345'.split(''), 99, '6', { plateType: 'normal' }).cells.join(''), '川A12346')
})
test('unsupported key positions are disabled', () => {
  assert.equal(core.canInput('O', 1, ['川'], { plateType: 'normal' }), false)
  assert.equal(core.canInput('警', 1, ['川'], { plateType: 'police' }), false)
  assert.equal(core.canInput('警', 6, '川A1234'.split(''), { plateType: 'police' }), true)
})
test('custom validation and extra characters', () => {
  const options = { plateType: 'custom', maxLength: 3, extraKeys: ['试'], customPattern: '试[A-Z][0-9]' }
  assert.equal(core.validate(['试', 'A', '1'], options).pass, true)
  assert.equal(core.canInput('试', 0, [], options), true)
  assert.equal(core.validate(['试', 'A', '1'], { ...options, customPattern: '[' }).pass, false)
  assert.equal(core.validate(['A'], { validator: () => ({ pass: false, message: '业务拒绝' }) }).message, '业务拒绝')
  assert.equal(core.validate(['A'], { validator: () => { throw Error('failure') } }).pass, false)
  assert.equal(core.validate([], { validator: () => true }).pass, false)
  assert.equal(core.validate(['A', '', '1'], { validator: () => true }).pass, false)
})
test('keys are unique and capacity covers WJ variants', () => {
  assert.equal(core.capacity('armedPolice', 'WJ京'), 8)
  assert.equal(core.capacity('armedPolice', 'WJ01'), 9)
  const keys = core.keys('province', ['军', '试'])
  assert.equal(keys.filter(key => key === '军').length, 1)
  assert.ok(keys.indexOf('试') >= 0)
})
test('core stays identical across sibling repositories when present', () => {
  const own = fs.readFileSync(path.join(__dirname, '../packages/license-plate/plate-core.cjs'), 'utf8')
  for (const file of ['vue2-license-plate/packages/license-plate/plate-core.cjs', 'vue3-license-plate/packages/license-plate/plate-core.cjs', 'mp-license-plate/components/mp-license-plate/plate-core.js']) {
    const sibling = path.join(__dirname, '../../', file)
    if (fs.existsSync(sibling)) assert.equal(fs.readFileSync(sibling, 'utf8'), own, file)
  }
})
