(function(global, factory) {
  typeof exports === "object" && typeof module !== "undefined" ? factory(exports, require("vue")) : typeof define === "function" && define.amd ? define(["exports", "vue"], factory) : (global = typeof globalThis !== "undefined" ? globalThis : global || self, factory(global.licensePlate = {}, global.Vue));
})(this, (function(exports2, vue) {
  "use strict";
  function getDefaultExportFromCjs(x) {
    return x && x.__esModule && Object.prototype.hasOwnProperty.call(x, "default") ? x["default"] : x;
  }
  var plateCore;
  var hasRequiredPlateCore;
  function requirePlateCore() {
    if (hasRequiredPlateCore) return plateCore;
    hasRequiredPlateCore = 1;
    const PROVINCES = "京津渝沪冀晋辽吉黑苏浙皖闽赣鲁豫鄂湘粤琼川贵云陕甘青蒙桂宁新藏";
    const LETTERS = "ABCDEFGHJKLMNPQRSTUVWXYZ";
    const DIGITS = "0123456789";
    const ALNUM = LETTERS + DIGITS;
    const TYPES = ["auto", "normal", "newEnergy", "police", "military", "armedPolice", "diplomatic", "temporary", "emergency", "custom"];
    const SPECIAL = "警挂学港澳领使军海空临应急";
    const repeat = (value, count) => Array(count).fill(value);
    function normalize(value) {
      return String(value == null ? "" : value).toUpperCase().replace(/[\s·・.\-]/g, "");
    }
    function patterns(type) {
      const rules = {
        normal: [[PROVINCES, LETTERS, ...repeat(ALNUM, 4), ALNUM + "挂学港澳领"]],
        newEnergy: [
          [PROVINCES, LETTERS, "DABCEFGHJK", ALNUM, ...repeat(DIGITS, 4)],
          [PROVINCES, LETTERS, ...repeat(DIGITS, 5), "DABCEFGHJK"]
        ],
        police: [[PROVINCES, LETTERS, LETTERS + DIGITS, ...repeat(DIGITS, 3), "警"]],
        military: [[LETTERS + "军海空北南广沈兰成济", LETTERS, ...repeat(DIGITS, 5)]],
        armedPolice: [
          ["W", "J", ...repeat(DIGITS, 7)],
          ["W", "J", PROVINCES, ...repeat(DIGITS, 5)]
        ],
        diplomatic: [
          ["使", ...repeat(DIGITS, 6)],
          [...repeat(DIGITS, 6), "使"],
          [PROVINCES, LETTERS, ...repeat(ALNUM, 4), "领"]
        ],
        temporary: [["临", LETTERS, ...repeat(ALNUM, 5)]],
        emergency: [
          [PROVINCES, ...repeat(DIGITS, 5), "应", "急"],
          [PROVINCES, "XS", ...repeat(DIGITS, 4), "应", "急"]
        ]
      };
      return type === "auto" ? Object.keys(rules).reduce((all, key) => all.concat(rules[key]), []) : rules[type] || [];
    }
    function detectedType(value) {
      return ["police", "newEnergy", "diplomatic", "armedPolice", "military", "temporary", "emergency", "normal"].find((type) => patterns(type).some((rule) => matches(value, rule))) || "unknown";
    }
    function matches(value, rule) {
      return value.length === rule.length && rule.every((allowed, i) => allowed.indexOf(value[i]) !== -1);
    }
    function customLength(options) {
      return Math.max(1, Math.min(12, Math.floor(Number(options.maxLength) || 8)));
    }
    function capacity(type, value, options = {}) {
      if (type === "custom") return customLength(options);
      if (type === "armedPolice" || type === "auto" && value.slice(0, 2) === "WJ") {
        return PROVINCES.indexOf(value[2] || "\0") !== -1 ? 8 : 9;
      }
      if (type === "newEnergy" || type === "emergency" || type === "auto") return 8;
      return 7;
    }
    function validate(cells, options = {}) {
      const array = cells.slice();
      while (array.length && !array[array.length - 1]) array.pop();
      const value = array.join("");
      const type = options.plateType || "auto";
      const holes = array.some((char) => !char);
      const matched = type === "custom" ? value.length === customLength(options) : patterns(type).some((rule) => matches(value, rule));
      let pass = !holes && matched;
      let message = !value ? "请输入车牌号码" : holes ? "请按顺序填写车牌号码" : matched ? "" : "车牌号码未完整填写或格式不正确";
      const validator = options.validator || (options.customPattern ? (value2) => new RegExp("^(?:" + options.customPattern + ")$").test(value2) : null);
      if (typeof validator === "function" && !holes) {
        try {
          const result = validator(value, { type, slots: cells.slice() });
          pass = typeof result === "boolean" ? result : !!(result && result.pass);
          message = pass ? "" : result && result.message || "车牌号码格式不正确";
        } catch (_) {
          pass = false;
          message = "自定义车牌校验失败";
        }
      }
      if (!value) pass = false;
      return { array: array.filter(Boolean), slots: cells.slice(), value, pass, complete: !holes && matched, type: type === "custom" ? type : detectedType(value), message };
    }
    function canInput(char, index2, cells, options = {}) {
      if (typeof char !== "string" || char.length !== 1 || index2 < 0) return false;
      const type = options.plateType || "auto";
      if (index2 >= capacity(type, cells.join(""), options)) return false;
      if (type === "custom" || options.customPattern || typeof options.validator === "function") {
        return (ALNUM + PROVINCES + SPECIAL + (options.extraKeys || []).join("")).indexOf(char) !== -1;
      }
      return patterns(type).some((rule) => index2 < rule.length && rule[index2].indexOf(char) !== -1 && rule.slice(0, index2).every((allowed, i) => !cells[i] || allowed.indexOf(cells[i]) !== -1));
    }
    function clampIndex(index2, cells, length) {
      const empty = cells.findIndex((char) => !char);
      const end = empty < 0 ? cells.length : empty;
      return Math.max(0, Math.min(Math.floor(Number(index2) || 0), end, length - 1));
    }
    function nextIndex(cells, length) {
      return clampIndex(cells.length, cells, length);
    }
    function insert(cells, index2, char, options = {}) {
      const length = capacity(options.plateType || "auto", cells.join(""), options);
      const active = clampIndex(index2, cells, length);
      if (!canInput(char, active, cells, options)) return null;
      const result = cells.slice();
      result[active] = char;
      return { cells: result, index: Math.min(active + 1, capacity(options.plateType || "auto", result.join(""), options) - 1) };
    }
    function remove(cells, index2) {
      const result = cells.slice();
      if (!result.length) return { cells: [], index: 0 };
      const active = Math.max(0, Math.min(Math.floor(Number(index2) || 0), result.length));
      const target = active < result.length ? active : active - 1;
      result.splice(target, 1);
      return { cells: result, index: Math.max(0, target) };
    }
    function keys(mode, extraKeys = []) {
      const source = mode === "province" ? PROVINCES + "军海空北南广沈兰成济使临" : DIGITS + LETTERS + SPECIAL;
      return (source + extraKeys.join("")).split("").filter((char, i, list) => list.indexOf(char) === i);
    }
    plateCore = { PROVINCES, LETTERS, DIGITS, TYPES, normalize, patterns, validate, capacity, canInput, clampIndex, nextIndex, insert, remove, keys };
    return plateCore;
  }
  var plateCoreExports = /* @__PURE__ */ requirePlateCore();
  const core = /* @__PURE__ */ getDefaultExportFromCjs(plateCoreExports);
  const activeInstances = /* @__PURE__ */ new Map();
  const reservedSpaces = /* @__PURE__ */ new Map();
  let initialBodyPadding;
  let initialBodyPixels = 0;
  const props = {
    modelValue: { type: String, default: "" },
    autoShow: { type: Boolean, default: false },
    visible: { type: Boolean, default: void 0 },
    plateType: { type: String, default: "auto", validator: (value) => core.TYPES.indexOf(value) !== -1 },
    autoClose: { type: Boolean, default: true },
    maxLength: { type: Number, default: 8 },
    validator: { type: Function, default: null },
    customPattern: { type: String, default: "" },
    extraKeys: { type: Array, default: () => [] },
    disabled: { type: Boolean, default: false },
    readonly: { type: Boolean, default: false },
    appendToBody: { type: Boolean, default: true },
    closeOnOutside: { type: Boolean, default: true },
    adjustPosition: { type: Boolean, default: true },
    group: { type: String, default: "default" },
    large: { type: Boolean, default: false },
    keyboardFontSize: { type: Number, default: 20 },
    zIndex: { type: Number, default: 2e3 },
    borderColor: { type: String, default: "#79aef3" },
    borderActiveColor: { type: String, default: "#330aec" },
    borderRadius: { type: Number, default: 6 },
    borderWidth: { type: Number, default: 1 },
    fontColor: { type: String, default: "#333333" },
    fontSize: { type: Number, default: 16 }
  };
  const component = {
    name: "LicensePlate",
    props,
    emits: ["update:modelValue", "update:visible", "change", "complete", "confirm", "invalid", "visible-change", "show", "hide"],
    data() {
      return { inputValue: [], activeIndex: 0, keyboardVisible: false, keyboardMode: "province", errorMessage: "" };
    },
    computed: {
      options() {
        return { plateType: this.plateType, maxLength: this.maxLength, validator: this.validator, customPattern: this.customPattern, extraKeys: this.extraKeys };
      },
      licensePlateLength() {
        return Math.max(core.capacity(this.plateType, this.inputValue.join(""), this.options), this.inputValue.length);
      },
      keyboardKeys() {
        return core.keys(this.keyboardMode, this.extraKeys).map((value) => ({ value, disabled: !core.canInput(value, this.activeIndex, this.inputValue, this.options) }));
      },
      blocked() {
        return this.disabled || this.readonly;
      },
      statusText() {
        return this.errorMessage || "正在填写第 " + (this.activeIndex + 1) + " 位";
      }
    },
    watch: {
      modelValue: { immediate: true, handler(value) {
        this.syncValue(value);
      } },
      visible(value) {
        if (value === true && !this.keyboardVisible) this.show();
        else if (value === false) this.hide("external");
      },
      autoShow(value) {
        if (value) this.show();
        else this.hide("external");
      },
      plateType() {
        this.refreshType();
      },
      maxLength() {
        this.refreshType();
      },
      customPattern() {
        this.refreshType();
      },
      validator() {
        this.refreshType();
      },
      large() {
        this.$nextTick(this.onLayout);
      },
      keyboardFontSize() {
        this.$nextTick(this.onLayout);
      },
      adjustPosition(value) {
        if (value) this.$nextTick(this.onLayout);
        else this.releaseSpace();
      },
      disabled(value) {
        if (value) this.hide("disabled");
      },
      readonly(value) {
        if (value) this.hide("readonly");
      },
      appendToBody() {
        this.$nextTick(this.moveKeyboard);
      },
      group(oldValue, previous) {
        if (activeInstances.get(previous) === this) activeInstances.delete(previous);
        if (this.keyboardVisible) this.claimKeyboard();
      }
    },
    mounted() {
      this.moveKeyboard();
      if (typeof document !== "undefined") {
        document.addEventListener("pointerdown", this.onOutside, true);
        document.addEventListener("mousedown", this.onOutside, true);
        document.addEventListener("touchstart", this.onOutside, true);
        document.addEventListener("focusin", this.onOutside, true);
        document.addEventListener("keydown", this.onKeydown);
        window.addEventListener("resize", this.onLayout);
      }
      if (this.visible === true || this.visible === void 0 && this.autoShow) this.show();
    },
    beforeUnmount() {
      if (activeInstances.get(this.group) === this) activeInstances.delete(this.group);
      this.releaseSpace();
      if (typeof document !== "undefined") {
        document.removeEventListener("pointerdown", this.onOutside, true);
        document.removeEventListener("mousedown", this.onOutside, true);
        document.removeEventListener("touchstart", this.onOutside, true);
        document.removeEventListener("focusin", this.onOutside, true);
        document.removeEventListener("keydown", this.onKeydown);
        window.removeEventListener("resize", this.onLayout);
      }
    },
    methods: {
      syncValue(value) {
        const normalized = core.normalize(value);
        if (this.inputValue.join("") !== normalized) {
          this.inputValue = normalized.split("");
          this.activeIndex = core.nextIndex(this.inputValue, this.licensePlateLength);
          this.setKeyboardMode();
        }
        this.activeIndex = core.clampIndex(this.activeIndex, this.inputValue, this.licensePlateLength);
        this.errorMessage = "";
      },
      refreshType() {
        this.activeIndex = core.clampIndex(this.activeIndex, this.inputValue, this.licensePlateLength);
        this.errorMessage = "";
        this.setKeyboardMode();
      },
      setKeyboardMode() {
        this.keyboardMode = this.activeIndex === 0 && ["military", "armedPolice", "custom"].indexOf(this.plateType) < 0 ? "province" : "alnum";
        if (this.plateType === "armedPolice" && this.activeIndex === 2 && core.PROVINCES.indexOf(this.inputValue[2] || "\\0") >= 0) this.keyboardMode = "province";
      },
      claimKeyboard() {
        const previous = activeInstances.get(this.group);
        if (previous && previous !== this) previous.hide("switch");
        activeInstances.set(this.group, this);
      },
      show(index2) {
        if (this.blocked) return;
        this.activeIndex = typeof index2 === "number" ? core.clampIndex(index2, this.inputValue, this.licensePlateLength) : core.nextIndex(this.inputValue, this.licensePlateLength);
        this.setKeyboardMode();
        this.claimKeyboard();
        if (typeof document !== "undefined") {
          const focused = document.activeElement;
          if (focused && /^(INPUT|TEXTAREA|SELECT)$/.test(focused.tagName)) focused.blur();
        }
        const changed = !this.keyboardVisible;
        this.keyboardVisible = true;
        if (changed) {
          this.$emit("update:visible", true);
          this.$emit("visible-change", { visible: true, reason: "show" });
          this.$emit("show");
        }
        this.$nextTick(() => {
          if (this.keyboardVisible) this.reserveSpace();
        });
      },
      hide(reason = "manual") {
        if (!this.keyboardVisible) return;
        this.keyboardVisible = false;
        this.releaseSpace();
        if (activeInstances.get(this.group) === this) activeInstances.delete(this.group);
        this.$emit("update:visible", false);
        this.$emit("visible-change", { visible: false, reason });
        this.$emit("hide", { reason });
        if (["manual", "confirm", "escape", "complete"].indexOf(reason) >= 0 && this.$el && this.$el.querySelector) {
          const cell = this.$el.querySelectorAll(".lp-cell")[this.activeIndex] || this.$el.querySelector("button, [tabindex]");
          if (cell && cell.focus) cell.focus({ preventScroll: true });
        }
      },
      inputClick(index2) {
        this.show(index2);
      },
      onSlotClick() {
        this.show();
      },
      btnClick(value, disabled) {
        if (this.blocked || disabled) return;
        const next = core.insert(this.inputValue, this.activeIndex, String(value), this.options);
        if (!next) return;
        this.inputValue = next.cells;
        this.activeIndex = next.index;
        this.setKeyboardMode();
        this.errorMessage = "";
        const result = this.change();
        if (result.pass && this.autoClose && this.plateType !== "auto") this.hide("complete");
      },
      delClick() {
        if (this.blocked) return;
        const next = core.remove(this.inputValue, this.activeIndex);
        this.inputValue = next.cells;
        this.activeIndex = next.index;
        this.errorMessage = "";
        this.setKeyboardMode();
        this.change();
      },
      clear() {
        if (this.blocked) return;
        this.inputValue = [];
        this.activeIndex = 0;
        this.errorMessage = "";
        this.setKeyboardMode();
        this.change();
      },
      validate() {
        return core.validate(this.inputValue, this.options);
      },
      change() {
        const result = this.validate();
        this.$emit("update:modelValue", result.value);
        this.$emit("change", result);
        if (result.pass) this.$emit("complete", result);
        return result;
      },
      confirm() {
        if (this.blocked) return false;
        const result = this.validate();
        if (!result.pass) {
          this.errorMessage = result.message;
          this.$emit("invalid", result);
          return false;
        }
        this.$emit("confirm", result);
        this.hide("confirm");
        return true;
      },
      visibleClick() {
        this.hide();
      },
      onOutside(event) {
        if (!this.keyboardVisible || !this.closeOnOutside) return;
        const keyboard = this.$refs.keyboard;
        if (this.$el && this.$el.contains(event.target) || keyboard && keyboard.contains(event.target)) return;
        this.hide(event.type === "focusin" ? "blur" : "outside");
      },
      onKeydown(event) {
        if (!this.keyboardVisible || event.ctrlKey || event.metaKey || event.altKey) return;
        const target = event.target;
        if (target && /^(INPUT|TEXTAREA|SELECT)$/.test(target.tagName)) return;
        if (event.key === "Escape") {
          event.preventDefault();
          this.hide("escape");
          return;
        }
        if (event.key === "Enter") {
          if (target && target.tagName === "BUTTON") return;
          event.preventDefault();
          this.confirm();
          return;
        }
        if (event.key === "Backspace" || event.key === "Delete") {
          event.preventDefault();
          this.delClick();
          return;
        }
        if (event.key === "ArrowLeft" || event.key === "ArrowRight") {
          event.preventDefault();
          this.activeIndex = core.clampIndex(this.activeIndex + (event.key === "ArrowLeft" ? -1 : 1), this.inputValue, this.licensePlateLength);
          this.setKeyboardMode();
          return;
        }
        if (event.key && event.key.length === 1) {
          const char = core.normalize(event.key);
          if (core.canInput(char, this.activeIndex, this.inputValue, this.options)) {
            event.preventDefault();
            this.btnClick(char);
          }
        }
      },
      onLayout() {
        if (this.keyboardVisible) this.reserveSpace();
      },
      reserveSpace() {
        if (!this.adjustPosition || typeof document === "undefined" || !this.$refs.keyboard || !this.$el) return;
        const keyboard = this.$refs.keyboard.getBoundingClientRect();
        if (!keyboard.height) return;
        if (!reservedSpaces.size) {
          initialBodyPadding = document.body.style.paddingBottom;
          initialBodyPixels = parseFloat(window.getComputedStyle(document.body).paddingBottom) || 0;
        }
        reservedSpaces.set(this, keyboard.height);
        document.body.style.paddingBottom = initialBodyPixels + Math.max(...reservedSpaces.values()) + 12 + "px";
        const box = this.$el.getBoundingClientRect();
        const availableBottom = window.innerHeight - keyboard.height;
        if (box.bottom > availableBottom && window.scrollBy) window.scrollBy(0, box.bottom - availableBottom + 12);
      },
      releaseSpace() {
        if (!reservedSpaces.has(this) || typeof document === "undefined") return;
        reservedSpaces.delete(this);
        document.body.style.paddingBottom = reservedSpaces.size ? initialBodyPixels + Math.max(...reservedSpaces.values()) + 12 + "px" : initialBodyPadding;
      },
      moveKeyboard() {
      }
    }
  };
  const _export_sfc = (sfc, props2) => {
    const target = sfc.__vccOpts || sfc;
    for (const [key, val] of props2) {
      target[key] = val;
    }
    return target;
  };
  const _sfc_main = component;
  const _hoisted_1 = {
    class: "lp-inputs",
    role: "group",
    "aria-label": "车牌号码"
  };
  const _hoisted_2 = ["disabled", "aria-label", "aria-expanded", "onClick"];
  const _hoisted_3 = { class: "lp-toolbar" };
  const _hoisted_4 = {
    class: "lp-status",
    role: "status",
    "aria-live": "polite"
  };
  const _hoisted_5 = {
    class: "lp-tabs",
    role: "group",
    "aria-label": "键盘切换"
  };
  const _hoisted_6 = ["aria-pressed"];
  const _hoisted_7 = ["aria-pressed"];
  const _hoisted_8 = { class: "lp-keys" };
  const _hoisted_9 = ["disabled", "onClick"];
  function _sfc_render(_ctx, _cache, $props, $setup, $data, $options) {
    return vue.openBlock(), vue.createElementBlock("div", {
      class: vue.normalizeClass(["lp-container", { "lp-disabled": _ctx.disabled, "lp-large": _ctx.large }])
    }, [
      vue.createElementVNode("div", {
        onClick: _cache[0] || (_cache[0] = vue.withModifiers((...args) => _ctx.onSlotClick && _ctx.onSlotClick(...args), ["stop"]))
      }, [
        vue.renderSlot(_ctx.$slots, "default", {}, () => [
          vue.createElementVNode("div", _hoisted_1, [
            (vue.openBlock(true), vue.createElementBlock(vue.Fragment, null, vue.renderList(_ctx.licensePlateLength, (_, index2) => {
              return vue.openBlock(), vue.createElementBlock("button", {
                key: index2,
                type: "button",
                class: vue.normalizeClass(["lp-cell", { "lp-active": _ctx.keyboardVisible && _ctx.activeIndex === index2, "lp-energy": _ctx.plateType === "auto" && index2 === 7 && !_ctx.inputValue[index2] }]),
                disabled: _ctx.blocked,
                "aria-label": "第 " + (index2 + 1) + " 位：" + (_ctx.inputValue[index2] || "未填写"),
                "aria-expanded": _ctx.keyboardVisible && _ctx.activeIndex === index2 ? "true" : "false",
                style: vue.normalizeStyle({ borderWidth: _ctx.borderWidth + "px", borderRadius: _ctx.borderRadius + "px", borderColor: _ctx.keyboardVisible && _ctx.activeIndex === index2 ? _ctx.borderActiveColor : _ctx.borderColor, color: _ctx.fontColor, fontSize: _ctx.fontSize + "px" }),
                onClick: vue.withModifiers(($event) => _ctx.inputClick(index2), ["stop"])
              }, vue.toDisplayString(_ctx.inputValue[index2] || (_ctx.plateType === "auto" && index2 === 7 ? "+" : "")), 15, _hoisted_2);
            }), 128))
          ])
        ])
      ]),
      (vue.openBlock(), vue.createBlock(vue.Teleport, {
        to: "body",
        disabled: !_ctx.appendToBody
      }, [
        vue.createVNode(vue.Transition, {
          name: "lp-keyboard",
          persisted: ""
        }, {
          default: vue.withCtx(() => [
            vue.withDirectives(vue.createElementVNode("div", {
              ref: "keyboard",
              class: vue.normalizeClass(["lp-keyboard", { "lp-large": _ctx.large }]),
              role: "region",
              "aria-label": "车牌输入键盘",
              style: vue.normalizeStyle({ zIndex: _ctx.zIndex, fontSize: (_ctx.large ? Math.max(24, _ctx.keyboardFontSize) : _ctx.keyboardFontSize) + "px" }),
              onClick: _cache[6] || (_cache[6] = vue.withModifiers(() => {
              }, ["stop"]))
            }, [
              vue.createElementVNode("div", _hoisted_3, [
                vue.createElementVNode("button", {
                  type: "button",
                  class: "lp-action",
                  onClick: _cache[1] || (_cache[1] = ($event) => _ctx.hide())
                }, "收起"),
                vue.createElementVNode("span", _hoisted_4, vue.toDisplayString(_ctx.statusText), 1),
                vue.createElementVNode("button", {
                  type: "button",
                  class: "lp-confirm",
                  onClick: _cache[2] || (_cache[2] = (...args) => _ctx.confirm && _ctx.confirm(...args))
                }, "完成")
              ]),
              vue.createElementVNode("div", _hoisted_5, [
                vue.createElementVNode("button", {
                  type: "button",
                  "aria-pressed": _ctx.keyboardMode === "province" ? "true" : "false",
                  onClick: _cache[3] || (_cache[3] = ($event) => _ctx.keyboardMode = "province")
                }, "省份 / 特殊", 8, _hoisted_6),
                vue.createElementVNode("button", {
                  type: "button",
                  "aria-pressed": _ctx.keyboardMode === "alnum" ? "true" : "false",
                  onClick: _cache[4] || (_cache[4] = ($event) => _ctx.keyboardMode = "alnum")
                }, "字母 / 数字", 8, _hoisted_7),
                vue.createElementVNode("button", {
                  type: "button",
                  onClick: _cache[5] || (_cache[5] = (...args) => _ctx.delClick && _ctx.delClick(...args)),
                  "aria-label": "删除一位"
                }, "删除")
              ]),
              vue.createElementVNode("div", _hoisted_8, [
                (vue.openBlock(true), vue.createElementBlock(vue.Fragment, null, vue.renderList(_ctx.keyboardKeys, (key) => {
                  return vue.openBlock(), vue.createElementBlock("button", {
                    key: key.value,
                    type: "button",
                    class: "lp-key",
                    disabled: key.disabled || _ctx.blocked,
                    onClick: ($event) => _ctx.btnClick(key.value)
                  }, vue.toDisplayString(key.value), 9, _hoisted_9);
                }), 128))
              ])
            ], 6), [
              [vue.vShow, _ctx.keyboardVisible]
            ])
          ]),
          _: 1
        })
      ], 8, ["disabled"]))
    ], 2);
  }
  const LicensePlate = /* @__PURE__ */ _export_sfc(_sfc_main, [["render", _sfc_render]]);
  LicensePlate.install = (app) => app.component(LicensePlate.name, LicensePlate);
  const install = (app) => {
    app.component(LicensePlate.name, LicensePlate);
  };
  const index = { install, LicensePlate, version: "1.1.0" };
  exports2.LicensePlate = LicensePlate;
  exports2.default = index;
  Object.defineProperties(exports2, { __esModule: { value: true }, [Symbol.toStringTag]: { value: "Module" } });
}));
