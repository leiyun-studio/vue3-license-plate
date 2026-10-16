import LicensePlate from './license-plate/index.js'

const install = app => { app.component(LicensePlate.name, LicensePlate) }

export { LicensePlate }
export default { install, LicensePlate, version: '1.1.0' }
