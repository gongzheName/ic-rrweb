import md5 from 'js-md5'
import { requestNetc} from '@kye-netc/request'
import { RequestBaseUrl } from '../utils/env'
import { getToken } from '../utils/getDataFromStorageAndConfig'


/**
 * 创建签名，用于网络请求
 * @param token
 * @param timestamp
 * @param body
 * @returns {string}
 */
export const createSign = (token, timestamp, body) => {
  return md5(md5(token).toUpperCase() + timestamp + JSON.stringify(body || {})).toUpperCase()
}

// 超时时间，单位ms
const TIME_OUT = 10000

// 返回码
const CODE_SUCCESS = 0
const CODE_TOKEN_INVALID = 6001
const CODE_TOKEN_EMPTY = 60010
const CODE_TOKEN_EXPIRED = 100201

// 基础配置
const DEFAULT_CONFIG = {
  timeout: TIME_OUT,
  method: 'POST',
  withToken: true,
  headers: {
    appKey: '55262',
    'Content-Type': 'application/json',
    'x-from': '114'
  }
}

export const requestOptionsConfig = () => {
  return {
    // 端来源[iOS, android, miniprogram, other, pc]
    source: 'pc',
    // 开启x-from 兜底配置,source端必传
    openXfromDefault: true,
    // 开启退登检查
    openLogOutCheck: true,
    logoutCallback: {
      confirmCallback: () => {
        console.log('去登录-确定')
        // userLogout()
      },
      cancelCallback: () => {
        console.log('取消')
      },
      responseCallback: (response) => {
        console.log('lotout responseCallback response', response)
      }
    }
  }
}

const getPhone = () => {
  return sessionStorage.getItem('PHONE')
}

// 创建请求实例
const instance = requestNetc.create({
  clientType: 'pc',
  requestConfig: DEFAULT_CONFIG,
  // 扩展配置
  options: requestOptionsConfig(),
  interceptors: {
    // 请求拦截器
    requestInterceptor: (config) => {
      // 请求带token，则需要加上签名信息
      let timestamp = Date.now()
      let phone = getPhone()
      config.headers['web-trace-id'] =
        (phone && phone.length > 4 ? phone.slice(phone.length - 4) : '0000') + '-' + timestamp //trace-id 链路id

      if (config.withToken) {
        let token = getToken()
        config.headers.token = token
        config.headers.timestamp = timestamp
        config.headers.sign = token ? createSign(token, timestamp, config.data) : ''
      }
      // 腾讯图形码添加请求头x-risk-version=captcha
      if (config.captcha) {
        config.headers['x-risk-version'] = config.captcha
      }
      // 写入退登检查忽略
      if (sessionStorage.getItem('IS_TO_IFRAME') === 'true') {
        config['ignoreLogOutCheck'] = true
      }
      // 追加headers,fmk测试环境标识
      // Object.assign(config.headers, fmkEnvUtil.addFmkHeader())
      return config
    },
    // 请求拦截器异常
    requestInterceptorCatch: (error) => {
      return Promise.reject(error)
    },
    // 响应拦截器
    responseInterceptor: (response) => {
      let res = response.data
      if (res.code !== CODE_SUCCESS) {
        // 登录失效 (100201场景移动到统一退登库逻辑)
        if (res.code === CODE_TOKEN_INVALID || res.code === CODE_TOKEN_EMPTY || res.code === CODE_TOKEN_EXPIRED) {
          // useBaseLoginOut({
          //   msg: '该手机号登录已失效，请重新登录'
          // })
        }

        // 统一处理
        else {
          // 根据配置，分为defalut(默认提示)、silent(静默模式)
          const mode = response.config.errorMode
          if (mode !== 'silent') {
            // Message.error({ message: res.msg || res.errMsg || '服务器异常，请稍后重试' })
          }
          return Promise.reject(res)
        }
      } else {
        // ump上报
        // const apiUrl = response?.request?.responseURL
        // apiReport(apiUrl, response.config)
      }
      return res
    },
    // 响应拦截器异常
    responseInterceptorCatch: (error) => {
      return Promise.reject(error)
    }
  }
})

/**
 * 基础请求
 * @param apiCode 接口code
 * @param config 自定义配置，可选，会覆盖默认配置
 * 参见：http://www.axios-js.com/zh-cn/docs/index.html#%E8%AF%B7%E6%B1%82%E9%85%8D%E7%BD%AE
 */
export const request = (apiCode, params, config = {}) => {
  return instance.request({
    baseURL: RequestBaseUrl + '/router/rest?' + apiCode,
    data: params,
    headers: {
      method: apiCode
    },
    ...config
  })
}
