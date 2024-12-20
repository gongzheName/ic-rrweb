/**
 * 蓝鲸构建时，stg、uat、prod 环境，都是使用的 build 命令。故没法通过 process.env 来区分环境。
 * 此处使用 location.hostname 来判断环境
 *
 * 20220708，针对离线包，增加 userAgent 判断环境
 */

// import { ipExp } from '@/utils/pattern'
// import { getToken } from '@/utils/auth'
// import { isOfflinePackage } from './device'

const hostname = location.hostname

const ua = navigator.userAgent

export const offline_stg = /kye_stg/.test(ua)
export const offline_uat = /kye_uat/.test(ua)
export const offline_prod = /kye_prod/.test(ua)

// export const isLocalUseIp = ipExp.test(window.location.host)
export const isLocalUseHost = /localhost/.test(window.location.host)
// export const isLocal = isLocalUseIp || isLocalUseHost
export const isLocal = isLocalUseHost

export const isSTG = 'ic-h5-stg.kye-erp.com' === hostname || offline_stg
export const isUAT = 'ic-h5-uat.kye-erp.com' === hostname || offline_uat || isLocal
export const isPROD = 'ic-h5.kye-erp.com' === hostname || offline_prod

/**
 * 请求动态域名处理
 * @returns 环境
 */
export const getRequestBaseUrl = () => {
  let base_url = 'https://ic-api-uat.ky-express.com'
  if (isSTG) {
    base_url = 'https://ic-api-stg.ky-express.com'
  } else if (isUAT) {
    base_url = 'https://ic-api-uat.ky-express.com'
  } else if (isPROD) {
    base_url = 'https://ic-api.ky-express.com'
  }
  return base_url
}

export const RequestBaseUrl = getRequestBaseUrl()
// export const RequestBaseUrlAngle = getRequestBaseUrlAngle()
