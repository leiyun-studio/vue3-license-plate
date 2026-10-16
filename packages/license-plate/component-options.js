import core from './plate-core.cjs'

// Only one instance in a group may own a keyboard, including across Vue apps.
const activeInstances = new Map()
const reservedSpaces = new Map()
let initialBodyPadding
let initialBodyPixels = 0
const props = {
  modelValue: { type: String, default: '' },
  autoShow: { type: Boolean, default: false },
  visible: { type: Boolean, default: undefined },
  plateType: { type: String, default: 'auto', validator: value => core.TYPES.indexOf(value) !== -1 },
  autoClose: { type: Boolean, default: true },
  maxLength: { type: Number, default: 8 },
  validator: { type: Function, default: null },
  customPattern: { type: String, default: '' },
  extraKeys: { type: Array, default: () => [] },
  disabled: { type: Boolean, default: false },
  readonly: { type: Boolean, default: false },
  appendToBody: { type: Boolean, default: true },
  closeOnOutside: { type: Boolean, default: true },
  adjustPosition: { type: Boolean, default: true },
  group: { type: String, default: 'default' },
  large: { type: Boolean, default: false },
  keyboardFontSize: { type: Number, default: 20 },
  zIndex: { type: Number, default: 2000 },
  borderColor: { type: String, default: '#79aef3' },
  borderActiveColor: { type: String, default: '#330aec' },
  borderRadius: { type: Number, default: 6 },
  borderWidth: { type: Number, default: 1 },
  fontColor: { type: String, default: '#333333' },
  fontSize: { type: Number, default: 16 }
}

export default {
  name: 'LicensePlate',
  props,
  emits: ['update:modelValue', 'update:visible', 'change', 'complete', 'confirm', 'invalid', 'visible-change', 'show', 'hide'],
  data() {
    return { inputValue: [], activeIndex: 0, keyboardVisible: false, keyboardMode: 'province', errorMessage: '' }
  },
  computed: {
    options() { return { plateType: this.plateType, maxLength: this.maxLength, validator: this.validator, customPattern: this.customPattern, extraKeys: this.extraKeys } },
    licensePlateLength() { return Math.max(core.capacity(this.plateType, this.inputValue.join(''), this.options), this.inputValue.length) },
    keyboardKeys() { return core.keys(this.keyboardMode, this.extraKeys).map(value => ({ value, disabled: !core.canInput(value, this.activeIndex, this.inputValue, this.options) })) },
    blocked() { return this.disabled || this.readonly },
    statusText() { return this.errorMessage || ('正在填写第 ' + (this.activeIndex + 1) + ' 位') }
  },
  watch: {
    modelValue: { immediate: true, handler(value) { this.syncValue(value) } },
    visible(value) { if (value === true && !this.keyboardVisible) this.show(); else if (value === false) this.hide('external') },
    autoShow(value) { if (value) this.show(); else this.hide('external') },
    plateType() { this.refreshType() },
    maxLength() { this.refreshType() },
    customPattern() { this.refreshType() },
    validator() { this.refreshType() },
    large() { this.$nextTick(this.onLayout) },
    keyboardFontSize() { this.$nextTick(this.onLayout) },
    adjustPosition(value) { if (value) this.$nextTick(this.onLayout); else this.releaseSpace() },
    disabled(value) { if (value) this.hide('disabled') },
    readonly(value) { if (value) this.hide('readonly') },
    appendToBody() { this.$nextTick(this.moveKeyboard) },
    group(oldValue, previous) { if (activeInstances.get(previous) === this) activeInstances.delete(previous); if (this.keyboardVisible) this.claimKeyboard() }
  },
  mounted() {
    this.moveKeyboard()
    if (typeof document !== 'undefined') {
      document.addEventListener('pointerdown', this.onOutside, true)
      document.addEventListener('mousedown', this.onOutside, true)
      document.addEventListener('touchstart', this.onOutside, true)
      document.addEventListener('focusin', this.onOutside, true)
      document.addEventListener('keydown', this.onKeydown)
      window.addEventListener('resize', this.onLayout)
    }
    if (this.visible === true || (this.visible === undefined && this.autoShow)) this.show()
  },
  beforeUnmount() {
    if (activeInstances.get(this.group) === this) activeInstances.delete(this.group)
    this.releaseSpace()
    if (typeof document !== 'undefined') {
      document.removeEventListener('pointerdown', this.onOutside, true)
      document.removeEventListener('mousedown', this.onOutside, true)
      document.removeEventListener('touchstart', this.onOutside, true)
      document.removeEventListener('focusin', this.onOutside, true)
      document.removeEventListener('keydown', this.onKeydown)
      window.removeEventListener('resize', this.onLayout)
    }

  },
  methods: {
    syncValue(value) {
      const normalized = core.normalize(value)
      // A v-model echo must not move the cursor or remove positional information.
      if (this.inputValue.join('') !== normalized) {
        this.inputValue = normalized.split('')
        this.activeIndex = core.nextIndex(this.inputValue, this.licensePlateLength)
        this.setKeyboardMode()
      }
      this.activeIndex = core.clampIndex(this.activeIndex, this.inputValue, this.licensePlateLength)
      this.errorMessage = ''
    },
    refreshType() {
      this.activeIndex = core.clampIndex(this.activeIndex, this.inputValue, this.licensePlateLength)
      this.errorMessage = ''
      this.setKeyboardMode()
    },
    setKeyboardMode() {
      this.keyboardMode = this.activeIndex === 0 && ['military', 'armedPolice', 'custom'].indexOf(this.plateType) < 0 ? 'province' : 'alnum'
      if (this.plateType === 'armedPolice' && this.activeIndex === 2 && core.PROVINCES.indexOf(this.inputValue[2] || '\\0') >= 0) this.keyboardMode = 'province'
    },
    claimKeyboard() {
      const previous = activeInstances.get(this.group)
      if (previous && previous !== this) previous.hide('switch')
      activeInstances.set(this.group, this)
    },
    show(index) {
      if (this.blocked) return
      this.activeIndex = typeof index === 'number' ? core.clampIndex(index, this.inputValue, this.licensePlateLength) : core.nextIndex(this.inputValue, this.licensePlateLength)
      this.setKeyboardMode()
      this.claimKeyboard()
      if (typeof document !== 'undefined') {
        const focused = document.activeElement
        if (focused && /^(INPUT|TEXTAREA|SELECT)$/.test(focused.tagName)) focused.blur()
      }
      const changed = !this.keyboardVisible
      this.keyboardVisible = true
      if (changed) { this.$emit('update:visible', true); this.$emit('visible-change', { visible: true, reason: 'show' }); this.$emit('show') }
      this.$nextTick(() => {
        if (this.keyboardVisible) this.reserveSpace()
      })
    },
    hide(reason = 'manual') {
      if (!this.keyboardVisible) return
      this.keyboardVisible = false
      this.releaseSpace()
      if (activeInstances.get(this.group) === this) activeInstances.delete(this.group)
      this.$emit('update:visible', false)
      this.$emit('visible-change', { visible: false, reason })
      this.$emit('hide', { reason })
      if (['manual', 'confirm', 'escape', 'complete'].indexOf(reason) >= 0 && this.$el && this.$el.querySelector) {
        const cell = this.$el.querySelectorAll('.lp-cell')[this.activeIndex] || this.$el.querySelector('button, [tabindex]')
        if (cell && cell.focus) cell.focus({ preventScroll: true })
      }
    },
    inputClick(index) { this.show(index) },
    onSlotClick() { this.show() },
    btnClick(value, disabled) {
      if (this.blocked || disabled) return
      const next = core.insert(this.inputValue, this.activeIndex, String(value), this.options)
      if (!next) return
      this.inputValue = next.cells
      this.activeIndex = next.index
      this.setKeyboardMode()
      this.errorMessage = ''
      const result = this.change()
      // Auto mode is deliberately ambiguous at seven characters: use 完成.
      if (result.pass && this.autoClose && this.plateType !== 'auto') this.hide('complete')
    },
    delClick() {
      if (this.blocked) return
      const next = core.remove(this.inputValue, this.activeIndex)
      this.inputValue = next.cells
      this.activeIndex = next.index
      this.errorMessage = ''
      this.setKeyboardMode()
      this.change()
    },
    clear() {
      if (this.blocked) return
      this.inputValue = []
      this.activeIndex = 0
      this.errorMessage = ''
      this.setKeyboardMode()
      this.change()
    },
    validate() { return core.validate(this.inputValue, this.options) },
    change() {
      const result = this.validate()
      this.$emit('update:modelValue', result.value)
      this.$emit('change', result)
      if (result.pass) this.$emit('complete', result)
      return result
    },
    confirm() {
      if (this.blocked) return false
      const result = this.validate()
      if (!result.pass) { this.errorMessage = result.message; this.$emit('invalid', result); return false }
      this.$emit('confirm', result)
      this.hide('confirm')
      return true
    },
    visibleClick() { this.hide() },
    onOutside(event) {
      if (!this.keyboardVisible || !this.closeOnOutside) return
      const keyboard = this.$refs.keyboard
      if ((this.$el && this.$el.contains(event.target)) || (keyboard && keyboard.contains(event.target))) return
      this.hide(event.type === 'focusin' ? 'blur' : 'outside')
    },
    onKeydown(event) {
      if (!this.keyboardVisible || event.ctrlKey || event.metaKey || event.altKey) return
      const target = event.target
      if (target && /^(INPUT|TEXTAREA|SELECT)$/.test(target.tagName)) return
      if (event.key === 'Escape') { event.preventDefault(); this.hide('escape'); return }
      if (event.key === 'Enter') {
        // Preserve native activation of keyboard and input buttons.
        if (target && target.tagName === 'BUTTON') return
        event.preventDefault(); this.confirm(); return
      }
      if (event.key === 'Backspace' || event.key === 'Delete') { event.preventDefault(); this.delClick(); return }
      if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') {
        event.preventDefault()
        this.activeIndex = core.clampIndex(this.activeIndex + (event.key === 'ArrowLeft' ? -1 : 1), this.inputValue, this.licensePlateLength)
        this.setKeyboardMode()
        return
      }
      if (event.key && event.key.length === 1) {
        const char = core.normalize(event.key)
        if (core.canInput(char, this.activeIndex, this.inputValue, this.options)) { event.preventDefault(); this.btnClick(char) }
      }
    },
    onLayout() { if (this.keyboardVisible) this.reserveSpace() },
    reserveSpace() {
      if (!this.adjustPosition || typeof document === 'undefined' || !this.$refs.keyboard || !this.$el) return
      const keyboard = this.$refs.keyboard.getBoundingClientRect()
      if (!keyboard.height) return
      if (!reservedSpaces.size) {
        initialBodyPadding = document.body.style.paddingBottom
        initialBodyPixels = parseFloat(window.getComputedStyle(document.body).paddingBottom) || 0
      }
      reservedSpaces.set(this, keyboard.height)
      document.body.style.paddingBottom = (initialBodyPixels + Math.max(...reservedSpaces.values()) + 12) + 'px'
      const box = this.$el.getBoundingClientRect()
      const availableBottom = window.innerHeight - keyboard.height
      if (box.bottom > availableBottom && window.scrollBy) window.scrollBy(0, box.bottom - availableBottom + 12)
    },
    releaseSpace() {
      if (!reservedSpaces.has(this) || typeof document === 'undefined') return
      reservedSpaces.delete(this)
      document.body.style.paddingBottom = reservedSpaces.size ? (initialBodyPixels + Math.max(...reservedSpaces.values()) + 12) + 'px' : initialBodyPadding
    },
    moveKeyboard() { /* Vue 3 uses Teleport in the template. */ }
  }
}
