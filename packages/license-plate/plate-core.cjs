/* Keep this module identical in all three distributions. No platform dependencies. */
const PROVINCES = '京津渝沪冀晋辽吉黑苏浙皖闽赣鲁豫鄂湘粤琼川贵云陕甘青蒙桂宁新藏';
const LETTERS = 'ABCDEFGHJKLMNPQRSTUVWXYZ';
const DIGITS = '0123456789';
const ALNUM = LETTERS + DIGITS;
const TYPES = ['auto', 'normal', 'newEnergy', 'police', 'military', 'armedPolice', 'diplomatic', 'temporary', 'emergency', 'custom'];
const SPECIAL = '警挂学港澳领使军海空临应急';
const repeat = (value, count) => Array(count).fill(value);

function normalize(value) {
  return String(value == null ? '' : value).toUpperCase().replace(/[\s·・.\-]/g, '');
}

function patterns(type) {
  const rules = {
    normal: [[PROVINCES, LETTERS, ...repeat(ALNUM, 4), ALNUM + '挂学港澳领']],
    newEnergy: [
      [PROVINCES, LETTERS, 'DABCEFGHJK', ALNUM, ...repeat(DIGITS, 4)],
      [PROVINCES, LETTERS, ...repeat(DIGITS, 5), 'DABCEFGHJK']
    ],
    police: [[PROVINCES, LETTERS, LETTERS + DIGITS, ...repeat(DIGITS, 3), '警']],
    military: [[LETTERS + '军海空北南广沈兰成济', LETTERS, ...repeat(DIGITS, 5)]],
    armedPolice: [
      ['W', 'J', ...repeat(DIGITS, 7)],
      ['W', 'J', PROVINCES, ...repeat(DIGITS, 5)]
    ],
    diplomatic: [
      ['使', ...repeat(DIGITS, 6)],
      [...repeat(DIGITS, 6), '使'],
      [PROVINCES, LETTERS, ...repeat(ALNUM, 4), '领']
    ],
    temporary: [['临', LETTERS, ...repeat(ALNUM, 5)]],
    emergency: [
      [PROVINCES, ...repeat(DIGITS, 5), '应', '急'],
      [PROVINCES, 'XS', ...repeat(DIGITS, 4), '应', '急']
    ]
  };
  return type === 'auto' ? Object.keys(rules).reduce((all, key) => all.concat(rules[key]), []) : (rules[type] || []);
}

function detectedType(value) {
  // Check specific types before their more general civil-plate counterpart.
  return ['police', 'newEnergy', 'diplomatic', 'armedPolice', 'military', 'temporary', 'emergency', 'normal'].find(type =>
    patterns(type).some(rule => matches(value, rule))) || 'unknown';
}

function matches(value, rule) {
  return value.length === rule.length && rule.every((allowed, i) => allowed.indexOf(value[i]) !== -1);
}

function customLength(options) {
  return Math.max(1, Math.min(12, Math.floor(Number(options.maxLength) || 8)));
}

function capacity(type, value, options = {}) {
  if (type === 'custom') return customLength(options);
  if (type === 'armedPolice' || (type === 'auto' && value.slice(0, 2) === 'WJ')) {
    return PROVINCES.indexOf(value[2] || '\0') !== -1 ? 8 : 9;
  }
  if (type === 'newEnergy' || type === 'emergency' || type === 'auto') return 8;
  return 7;
}

function validate(cells, options = {}) {
  const array = cells.slice();
  while (array.length && !array[array.length - 1]) array.pop();
  const value = array.join('');
  const type = options.plateType || 'auto';
  const holes = array.some(char => !char);
  const matched = type === 'custom' ? value.length === customLength(options) : patterns(type).some(rule => matches(value, rule));
  let pass = !holes && matched;
  let message = !value ? '请输入车牌号码' : holes ? '请按顺序填写车牌号码' : matched ? '' : '车牌号码未完整填写或格式不正确';
  const validator = options.validator || (options.customPattern ? value => new RegExp('^(?:' + options.customPattern + ')$').test(value) : null);
  if (typeof validator === 'function' && !holes) {
    try {
      const result = validator(value, { type, slots: cells.slice() });
      pass = typeof result === 'boolean' ? result : !!(result && result.pass);
      message = pass ? '' : (result && result.message) || '车牌号码格式不正确';
    } catch (_) {
      pass = false;
      message = '自定义车牌校验失败';
    }
  }
  if (!value) pass = false;
  return { array: array.filter(Boolean), slots: cells.slice(), value, pass, complete: !holes && matched, type: type === 'custom' ? type : detectedType(value), message };
}

function canInput(char, index, cells, options = {}) {
  if (typeof char !== 'string' || char.length !== 1 || index < 0) return false;
  const type = options.plateType || 'auto';
  if (index >= capacity(type, cells.join(''), options)) return false;
  if (type === 'custom' || options.customPattern || typeof options.validator === 'function') {
    return (ALNUM + PROVINCES + SPECIAL + (options.extraKeys || []).join('')).indexOf(char) !== -1;
  }
  return patterns(type).some(rule => index < rule.length && rule[index].indexOf(char) !== -1 &&
    rule.slice(0, index).every((allowed, i) => !cells[i] || allowed.indexOf(cells[i]) !== -1));
}

function clampIndex(index, cells, length) {
  const empty = cells.findIndex(char => !char);
  const end = empty < 0 ? cells.length : empty;
  return Math.max(0, Math.min(Math.floor(Number(index) || 0), end, length - 1));
}

function nextIndex(cells, length) {
  return clampIndex(cells.length, cells, length);
}

function insert(cells, index, char, options = {}) {
  const length = capacity(options.plateType || 'auto', cells.join(''), options);
  const active = clampIndex(index, cells, length);
  if (!canInput(char, active, cells, options)) return null;
  const result = cells.slice();
  result[active] = char;
  return { cells: result, index: Math.min(active + 1, capacity(options.plateType || 'auto', result.join(''), options) - 1) };
}

function remove(cells, index) {
  const result = cells.slice();
  if (!result.length) return { cells: [], index: 0 };
  const active = Math.max(0, Math.min(Math.floor(Number(index) || 0), result.length));
  const target = active < result.length ? active : active - 1;
  result.splice(target, 1);
  return { cells: result, index: Math.max(0, target) };
}

function keys(mode, extraKeys = []) {
  const source = mode === 'province' ? PROVINCES + '军海空北南广沈兰成济使临' : DIGITS + LETTERS + SPECIAL;
  return (source + extraKeys.join('')).split('').filter((char, i, list) => list.indexOf(char) === i);
}

module.exports = { PROVINCES, LETTERS, DIGITS, TYPES, normalize, patterns, validate, capacity, canInput, clampIndex, nextIndex, insert, remove, keys };
