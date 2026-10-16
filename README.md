# vue3-license-plate 1.1.0

适用于 Vue 3 的车牌输入组件，支持普通、新能源、警用、军用、武警等格式，提供大字键盘、文字“完成/收起”、手动显隐及自定义展示。

## 安装

```sh
npm install vue3-license-plate@^1.1.0
```

```js
import { createApp } from 'vue'
import LicensePlate from 'vue3-license-plate'
import 'vue3-license-plate/lib/licensePlate.css'

createApp(App).use(LicensePlate).mount("#app")
```

也可以按需导入 `import { LicensePlate } from 'vue3-license-plate'`，然后注册为局部组件。CSS 仍需要显式引入。

## 输入与手动控制

```vue
<LicensePlate
  ref="plateInput"
  v-model="plate"
  v-model:visible="keyboardVisible"
  plateType="normal"
  :autoClose="true"
  :large="true"
  @change="onChange"
  @confirm="onConfirm"
/>
```

在页面 data 中声明 `plate: ''`、`keyboardVisible: false`。通过 ref 调用 `show()` / `hide()`，或修改已绑定的 `keyboardVisible`。指定普通车牌输入 7 位且校验通过后收起；新能源为 8 位；自动模式不猜测第 7 位是否结束，由用户点击“完成”。

```js
// Options API 中的方法；Vue 3 setup 中使用对应组件 ref.value
this.$refs.plateInput.show()     // 默认选中下一处空位，满位时选中末位
this.$refs.plateInput.show(2)    // 从 0 开始的格位下标
this.$refs.plateInput.hide()
this.$refs.plateInput.clear()    // 清空并发出模型更新和 change
const result = this.$refs.plateInput.validate()
this.$refs.plateInput.confirm()  // 校验成功发 confirm 并收起；失败发 invalid 且继续展示
```

`change` 适合处理所有输入变化，`complete` 表示当前值校验通过（修改已完成车牌时也可能再次触发），`confirm` 只表示用户明确确认；不要把 `complete` 当作只触发一次的提交事件。

## 车牌类型

| `plateType` | 位数与支持格式 | 示例 |
| --- | --- | --- |
| `auto`（默认） | 自动识别以下内置格式；输入后手动点击“完成” | `川A12345` / `川AD12345` |
| `normal` | 7 位；省份、机关字母、序号，末位支持挂/学/港/澳/领 | `粤Z1234港` |
| `newEnergy` | 8 位；支持大小型新能源序号布局及扩展字母号段 | `川AD12345` / `川A12345F` |
| `police` | 7 位；末位“警”，序号首位可为字母 | `京A1234警` / `京AA123警` |
| `military` | 两位前缀加五位数字；包含军/海/空等历史前缀兼容 | `VA12345` / `军A12345` |
| `armedPolice` | WJ + 7 位数字（9 字符），或 WJ + 省份 + 5 位数字（8 字符） | `WJ0112345` / `WJ京12345` |
| `diplomatic` | 使 + 6 位数字、6 位数字 + 使，或省份机关序号 + 领 | `使123456` / `沪A1234领` |
| `temporary` | 仅兼容“临 + 字母 + 5 位序号”的业务格式 | `临A12345` |
| `emergency` | 省份 + 5 位数字 + 应急，或省份 + X/S + 4 位数字 + 应急 | `京X1234应急` |
| `custom` | 1～12 位；配合自定义字符和校验规则 | `试A1` |

内置规则只做上述格式检查，不验证号牌真实存在、地区发放号段或车辆身份；不能代替交管系统校验。临时号牌及其他未列明的历史/特殊格式请使用 `custom`。普通序号禁止 I、O。特殊字符在允许位置才可点击；军牌字母入口可用“字母 / 数字”切换。武警省份变体的第 3 位可切换“省份 / 特殊”。

## Props

| 属性 | 默认值 | 说明 |
| --- | --- | --- |
| `modelValue` / `v-model` | `''` | 车牌值；支持清空、部分值及不合法值回填，不会保留上一条合法值 |
| `visible` | `undefined` | 可同步显隐状态；省略时组件自行管理。需要双向绑定才能让外部按钮和内部点击持续同步 |
| `autoShow` | `false` | 初始化自动展开；后续变化也可展开/收起。初始化时显式 `visible` 优先 |
| `plateType` | `'auto'` | 见上表 |
| `autoClose` | `true` | 指定类型且格式通过后自动收起；`auto` 始终手动确认，避免 7/8 位歧义 |
| `maxLength` | `8` | `custom` 模式的最大/预期长度，限制为 1～12 |
| `validator` | `null` | `(value, { type, slots }) => boolean \| { pass, message? }`；覆盖内置校验，异常按失败处理 |
| `customPattern` | `''` | 自定义正则字符串，自动添加整串锚点；与 `validator` 同时传入时函数优先 |
| `extraKeys` | `[]` | 额外单字符按键；在 custom 模式或自定义校验下启用 |
| `disabled` / `readonly` | `false` | 禁止打开和编辑；外部值更新仍有效 |
| `appendToBody` | `true` | 将键盘移到 body，避免父级 transform/overflow 裁切；Vue 3 使用 Teleport |
| `closeOnOutside` | `true` | 点击外部或焦点切到其他表单控件时收起 |
| `adjustPosition` | `true` | 展开时为页面底部预留键盘空间并尝试滚动避让；自定义滚动容器可关闭并自行处理 |
| `group` | `'default'` | 同组最多展开一个键盘；不同组独立 |
| `large` | `false` | 大字键盘，减少每行按键并增大触摸区域 |
| `keyboardFontSize` | `20` | 键盘字号，px；large 模式最低 24px |
| `zIndex` | `2000` | 键盘层级 |
| `borderColor` | `'#79aef3'` | 输入格边框颜色 |
| `borderActiveColor` | `'#330aec'` | 当前输入格边框颜色 |
| `borderWidth` / `borderRadius` | `1` / `6` | 输入格边框宽度、圆角，px |
| `fontColor` / `fontSize` | `'#333333'` / `16` | 输入格文字颜色、字号，px |

## 事件

| 事件 | 参数 / 行为 |
| --- | --- |
| `change` | `PlateResult`，模型更新后触发 |
| `complete` | `PlateResult`，输入变化后当前值校验通过时触发 |
| `confirm` | `PlateResult`，点击完成或调用 confirm() 且校验通过时触发 |
| `invalid` | `PlateResult`，确认时校验不通过 |
| `update:visible` | boolean，配合双向显隐绑定 |
| `visible-change` | `{ visible, reason }` |
| `show` | 展开通知 |
| `hide` | `{ reason }`，收起通知 |

reason 包括 `show/manual/external/complete/confirm/switch/outside/blur/escape/disabled/readonly`。原有模型更新事件保持不变。

```ts
interface PlateResult {
  array: string[]       // 已填写字符（保留原有字段）
  slots: string[]       // 原始格位，保留空位
  value: string         // 拼接字符串
  pass: boolean        // 是否通过当前校验
  complete: boolean    // 是否符合内置类型长度/格式；自定义校验的最终结果以 pass 为准
  type: string         // 识别的类型，无法识别时 unknown
  message: string      // 错误提示，通过时为空字符串
}
```

字符串回填会转大写，并移除空白、点和短横线分隔符；其他非法字符保留显示，并由校验反馈。显示数据与校验分离，不会因为格式错误而静默保留旧车牌或截断超长值。删除中间字符会让后续字符前移；点击尚未填写的远端格会定位到第一处空位，避免跳格后错误拼接。

## 自定义展示与校验

```vue
<LicensePlate v-model="plate">
  <button type="button">{{ plate || '点击输入车牌' }}</button>
</LicensePlate>

<LicensePlate
  v-model="testPlate"
  plateType="custom"
  :maxLength="3"
  :extraKeys="['试']"
  customPattern="试[A-Z][0-9]"
/>
```

自定义展示只替换输入格，输入格边框/字体配置不影响插槽内容。自定义校验函数和正则由应用开发者提供；不要使用网络下发的未经审查的正则。maxLength 决定键盘容量，validator/customPattern 决定最终 pass。

## 兼容性与开发

- Vue 3.2.47 及以上的 3.x；开发构建使用 3.5.x。Vue 不再打包进组件，使用 peerDependencies 声明宿主版本。
- 开发环境 Node `20.19+` 或 `22.12+`（含 24），运行 `npm ci` 安装锁定依赖；使用 Vite 7，已移除 Vue CLI / Webpack 4。
- 库 JS 目标为 ES2015；支持现代 Chrome/Edge、Firefox、Safari 和相应微信 WebView。IE11、无 ES2015 支持的旧 WebView 不在本版本承诺范围内。CSS 使用 Grid/Flex；极旧浏览器需宿主做布局降级。
- body 挂载可避开组件祖先的定位/裁切影响；自定义页面弹层可通过 zIndex 调整。自定义滚动容器关闭 adjustPosition 后自行避让。
- 支持实体键盘字符、左右方向键、Backspace/Delete、Escape；按钮支持原生 Enter/Space 激活。尊重减少动画偏好。
- 安全区有基础 padding 回退；输入格高度随字号自然增长，图标已替换为文字按钮，CSS 使用 `lp-` 前缀。
- SSR 导入不访问 DOM；键盘仅在 mounted 后展开。SSR 页面仍需引入 CSS。

```sh
npm ci
npm run serve        # 本地交互示例
npm run lint         # JavaScript 语法检查；Vue 模板由构建验证
npm test             # 核心规则、适配层和已有发布产物 DOM 回归
npm run build        # 示例页面
npm run lib          # 重建 ESM / CJS / UMD 及 CSS
npm run test:package  # 新构建产物的真实 Vue DOM、ESM/CJS/UMD/AMD 检查
npm run typecheck    # TypeScript 消费端检查
npm pack --dry-run --ignore-scripts
```

提交时需要同步 lib 产物。CI 覆盖 Node 20/22/24，并在构建后对最低声明 Vue 版本重跑产物测试。不同仓库各自保留一份相同的纯输入核心，跨仓库测试会检查内容一致；每个仓库也可独立使用。

发布文件包含：`licensePlate.esm.mjs`、`licensePlate.common.js`、原有 `licensePlate.umd.js` / `licensePlate.umd.min.js`、`licensePlate.css` 和根目录类型声明。直接用 script 引入 UMD 时先加载对应 Vue 的运行时，插件为 `licensePlate.default`，组件为 `licensePlate.LicensePlate`。

## 1.1.0 更新与迁移

- 增加警牌、军牌、武警等类型及特殊字符的位置限制。
- 增加手动显隐、显隐事件、完成/收起文字按钮、大字键盘和多实例互斥。
- 修复父级清空/部分值回填、光标定位、插槽追加、删除越界、空位错误校验及无效值自动收起。
- 原有 `array/value/pass` 字段保留；新增 `slots/complete/type/message`。校验比 1.0.x 严格，历史上被误判通过的数据可能返回 false。
- 默认 `auto` 模式需要点击“完成”；普通车牌希望输满 7 位收起，请显式设置 `plateType="normal"`。可随时点击“收起”，不会丢失已输入内容。

- 构建、锁文件、发布入口、类型声明、示例和 CI 已更新；旧 CSS 引入路径保持可用。
- 键盘默认挂到 body、默认点击外部收起；对嵌入式布局可关闭 appendToBody / closeOnOutside / adjustPosition。

## 验证边界与安全

自动化测试覆盖格式、状态、真实 Vue DOM 交互及发布包；手机 Safari/微信 WebView、微信开发者工具原生组件层级仍需在实际业务页面验收。格式规则不代表官方全部历史号牌规范。

## License

MIT
