export type PlateType = 'auto' | 'normal' | 'newEnergy' | 'police' | 'military' | 'armedPolice' | 'diplomatic' | 'temporary' | 'emergency' | 'custom'
export interface PlateResult {
  array: string[]
  slots: string[]
  value: string
  pass: boolean
  complete: boolean
  type: PlateType | 'unknown'
  message: string
}
export interface LicensePlateProps {
  modelValue?: string
  visible?: boolean
  autoShow?: boolean
  plateType?: PlateType
  autoClose?: boolean
  maxLength?: number
  extraKeys?: string[]
  customPattern?: string
  validator?: (value: string, context: { type: PlateType; slots: string[] }) => boolean | { pass: boolean; message?: string }
  disabled?: boolean
  readonly?: boolean
  appendToBody?: boolean
  closeOnOutside?: boolean
  adjustPosition?: boolean
  group?: string
  large?: boolean
  keyboardFontSize?: number
  zIndex?: number
  borderColor?: string
  borderActiveColor?: string
  borderRadius?: number
  borderWidth?: number
  fontColor?: string
  fontSize?: number
}
export type LicensePlateMethods = {
  show(index?: number): void
  hide(reason?: string): void
  clear(): void
  validate(): PlateResult
  confirm(): boolean
}

import type { DefineComponent, Plugin } from 'vue'
export const LicensePlate: DefineComponent<LicensePlateProps, {}, {}, {}, LicensePlateMethods>
declare const plugin: Plugin & { LicensePlate: typeof LicensePlate; version: string }
export default plugin
