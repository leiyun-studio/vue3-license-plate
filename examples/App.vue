<template>
  <main class="demo">
    <h1>车牌输入组件 <small>1.1.0</small></h1>
    <p>选择车牌类型后输入，支持点击修改、实体键盘和手动收起。</p>
    <section>
      <h2>类型与键盘控制</h2>
      <div class="controls">
        <label>车牌类型 <select v-model="plateType"><option v-for="item in types" :key="item.value" :value="item.value">{{ item.label }}</option></select></label>
        <label><input v-model="large" type="checkbox">大字键盘</label>
        <label><input v-model="autoClose" type="checkbox">填完自动收起</label>
      </div>
      <LicensePlate ref="plate" v-model="plate" v-model:visible="visible" :plateType="plateType" :autoClose="autoClose" :large="large" @change="result = $event" />
      <div class="controls">
        <button type="button" @click="openKeyboard">打开键盘</button>
        <button type="button" @click="visible = false">收起键盘</button>
        <button type="button" @click="plate = ''">父级清空</button>
        <button type="button" @click="plate = '粤B'">回填未完成值</button>
      </div>
      <p>当前：{{ plate || '未填写' }} · 键盘{{ visible ? '已展开' : '已收起' }}</p>
      <p role="status">{{ result ? (result.pass ? '格式通过' : result.message) : '等待输入' }}</p>
    </section>
    <section>
      <h2>第二个车牌 · 自动模式与自定义展示</h2>
      <p>自动模式下点击“完成”确认，打开此键盘会收起前一个。</p>
      <LicensePlate v-model="secondPlate" plateType="auto" :large="large">
        <button type="button" class="custom-plate">{{ secondPlate || '点击输入另一辆车的车牌' }}</button>
      </LicensePlate>
    </section>
    <section>
      <h2>其他表单内容</h2>
      <label>联系电话 <input type="tel" placeholder="切换到此处会收起车牌键盘"></label>
    </section>
  </main>
</template>

<script>
export default {
  name: 'App',
  data() {
    return {
      plate: '', secondPlate: '', plateType: 'normal', visible: false, autoClose: true, large: false, result: null,
      types: [
        { value: 'normal', label: '普通车牌（7位）' }, { value: 'newEnergy', label: '新能源（8位）' },
        { value: 'police', label: '警用车牌' }, { value: 'military', label: '军用车牌' },
        { value: 'armedPolice', label: '武警车牌' }, { value: 'diplomatic', label: '使领馆车牌' },
        { value: 'temporary', label: '临字兼容格式' }, { value: 'emergency', label: '应急车牌' }, { value: 'auto', label: '自动识别（手动完成）' }
      ]
    }
  },
  methods: { openKeyboard() { this.$refs.plate.show() } }
}
</script>

<style scoped>
.demo { max-width: 720px; margin: 0 auto; padding: 20px 12px 60px; color: #24334b; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; }
h1 { font-size: 25px; } h2 { font-size: 18px; } small { font-size: 14px; color: #61728a; }
section { margin: 24px 0; padding: 18px 12px; border: 1px solid #d7dfe9; border-radius: 10px; background: #fff; }
p { font-size: 14px; line-height: 1.7; }
.controls { display: flex; flex-wrap: wrap; align-items: center; gap: 12px; margin: 16px 0; }
.controls button, select, input[type='tel'] { min-height: 44px; padding: 8px; box-sizing: border-box; border: 1px solid #bcc9db; border-radius: 6px; background: #fff; color: #24334b; font-size: 15px; }
.custom-plate { width: 100%; min-height: 48px; padding: 10px; border: 1px solid #2367d1; background: #f5f9ff; border-radius: 6px; font-size: 18px; color: #17417f; }
</style>
