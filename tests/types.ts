import plugin, { LicensePlate, type LicensePlateProps, type LicensePlateMethods, type PlateResult } from '../index'
import { createApp } from 'vue'
createApp({}).use(plugin).component('LicensePlate', LicensePlate)
const props: LicensePlateProps = { plateType: 'military', visible: true, autoClose: false, customPattern: '[A-Z]{2}[0-9]{5}' }
function inspect(component: LicensePlateMethods): PlateResult { component.show(2); component.hide(); return component.validate() }
void props; void inspect
// @ts-expect-error unsupported plate type
const invalid: LicensePlateProps = { plateType: 'unsupported' }
void invalid

function inspectInstance(component: InstanceType<typeof LicensePlate>): PlateResult { component.show(0); return component.validate() }
void inspectInstance
