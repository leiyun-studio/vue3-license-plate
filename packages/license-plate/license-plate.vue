<template>
  <div class="lp-container" :class="{ 'lp-disabled': disabled, 'lp-large': large }">
    <div @click.stop="onSlotClick">
      <slot>
        <div class="lp-inputs" role="group" aria-label="车牌号码">
          <button v-for="(_, index) in licensePlateLength" :key="index" type="button"
            class="lp-cell" :class="{ 'lp-active': keyboardVisible && activeIndex === index, 'lp-energy': plateType === 'auto' && index === 7 && !inputValue[index] }"
            :disabled="blocked" :aria-label="'第 ' + (index + 1) + ' 位：' + (inputValue[index] || '未填写')"
            :aria-expanded="keyboardVisible && activeIndex === index ? 'true' : 'false'"
            :style="{ borderWidth: borderWidth + 'px', borderRadius: borderRadius + 'px', borderColor: keyboardVisible && activeIndex === index ? borderActiveColor : borderColor, color: fontColor, fontSize: fontSize + 'px' }"
            @click.stop="inputClick(index)">{{ inputValue[index] || (plateType === 'auto' && index === 7 ? '+' : '') }}</button>
        </div>
      </slot>
    </div>
    <Teleport to="body" :disabled="!appendToBody">
      <transition name="lp-keyboard">
        <div v-show="keyboardVisible" ref="keyboard" class="lp-keyboard" :class="{ 'lp-large': large }"
          role="region" aria-label="车牌输入键盘" :style="{ zIndex, fontSize: (large ? Math.max(24, keyboardFontSize) : keyboardFontSize) + 'px' }" @click.stop>
          <div class="lp-toolbar">
            <button type="button" class="lp-action" @click="hide()">收起</button>
            <span class="lp-status" role="status" aria-live="polite">{{ statusText }}</span>
            <button type="button" class="lp-confirm" @click="confirm">完成</button>
          </div>
          <div class="lp-tabs" role="group" aria-label="键盘切换">
            <button type="button" :aria-pressed="keyboardMode === 'province' ? 'true' : 'false'" @click="keyboardMode = 'province'">省份 / 特殊</button>
            <button type="button" :aria-pressed="keyboardMode === 'alnum' ? 'true' : 'false'" @click="keyboardMode = 'alnum'">字母 / 数字</button>
            <button type="button" @click="delClick" aria-label="删除一位">删除</button>
          </div>
          <div class="lp-keys">
            <button v-for="key in keyboardKeys" :key="key.value" type="button" class="lp-key"
              :disabled="key.disabled || blocked" @click="btnClick(key.value)">{{ key.value }}</button>
          </div>
        </div>
      </transition>
    </Teleport>
  </div>
</template>

<script>
import component from './component-options.js'
export default component
</script>

<style src="./style.css"></style>
