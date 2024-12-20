import Common from './src/utils/common'
import { getInstance, setInstance } from './src/utils/instance'
import { request as http } from './src/http'

// uuid
function uuid() {
  function b(a) {
    return a
      ? (a ^ ((Math.random() * 16) >> (a / 4))).toString(16)
      : ([1e7] + -[1e3] + -4e3 + -8e3 + -1e11).replace(/[018]/g, b)
  }
  return b()
}

// 批次ID
let batchId = uuid()
// 已使用内存大小
// let usedHeap = 0
// 录制数据
let events = []
// 性能监控定时器
let memoryInter = null
// 数据上报定时器
// let eventInter = null
// 总时长监控定时器
let sumSecondTimeout = null
// 启动定时器
let startTimeout = null
// 停止录制
let stopRecordEvent = null
// 录播配置
let recordConfig = {
  uploadRecorded: '',
  start_delayed_second: 0, // 启动延时时长 单位：毫秒
  performance_second: 5 * 1000, // 性能监控间隔时长 单位：毫秒
  interval_upload_second: 5 * 1000, // 间隔上报时长 单位：毫秒
  interval_upload_max_size: 100 * 1024, // 单次上报最大大小
}
// 录播配置
let userConfig = {}

// 初始化
const initRRWeb = (appType, options) => {
  const inst = new Common(appType, options)
  setInstance(inst)
  getConfig()
  return {
    getInstance,
    startRecord,
    stopRecord
  }
}

/**
 * 获取数据字典
 */
const getDataDictionaryByCode = (params) => {
  // const http = getInstance().getRequest()
  return http('web.order.getDataDictionaryByCode', params, {
    toast: false,
  })
}

/**
 * 获取用户配置
 * @returns
 */
function getUserConfig() {
  // const http = getInstance().getRequest()
  return new Promise((resolve) => {
    http(
      'web.monitor.userRecorded.getByUser',
      {},
      {
        toast: false,
      }
    )
      .then((e) => {
        if (e && e.data) {
          console.log('录播已开启')
          resolve(e.data)
        } else {
          console.log('录播未开启')
        }
      })
      .catch((e) => {
        console.log('web.monitor.userRecorded.getByUser 接口异常', e)
      })
  })
}

/**
 * 初始化录播配置
 * @returns
 */
function initRecordConfig() {
  return new Promise((resolve, reject) => {
    getDataDictionaryByCode({ dictionaryCode: 'eam_web_record_monitor_config' })
      .then((res) => {
        if (res && res.data && res.data) {
          res.data.forEach((item) => {
            if (item.lookupCode === 'uploadRecorded' || item.lookupCode === 'getRecordByBatchId') {
              recordConfig[item.lookupCode] = item.lookupValue
            } else {
              recordConfig[item.lookupValue] = Number(item.lookupCode)
            }
          })
          resolve()
        } else {
          reject()
        }
      })
      .catch(() => {
        reject()
      })
  })
}

/**
 * 开启录制
 */
const startRecord = () => {
  const inst = getInstance()
  const { enable } = inst.getOptions()
  // 可能从外部调用，需要判断是否已调用相关接口
  // 有可能手动禁止上传（enable）
  if (!userConfig?.startTime || !recordConfig?.uploadRecorded || !enable) {
    return
  }
  startTimeout = setTimeout(() => {
    // 启动录播
    stopRecordEvent = record()
    // 停止录播 - 时间限制
    sumSecondTimeout = setTimeout(() => {
      // 停止录播
      stopRecord()
    }, userConfig.maxTime * 60 * 1000)
  }, recordConfig.start_delayed_second)
}

const getConfig = () => {
  console.log('获取录播相关配置')
  // 获取用户私有配置
  getUserConfig().then((data) => {
    // 设置用户配置
    // channelList:1APP,2小程序,3PC
    const { id, singleLength, startTime, endTime } = data
    userConfig = { id, maxTime: singleLength, startTime, endTime }
    const nowTime = Date.now()
    if (nowTime < startTime || nowTime > endTime) {
      console.log('[未命中配置]-时间未生效')
      return
    }

    // 获取录播全局配置
    initRecordConfig().then(() => {
      if (!recordConfig.uploadRecorded) {
        return
      }
      startRecord()
    })
  })
}

/**
 * 停止录制
 */
function stopRecord() {
  console.log('[stopRecord] 停止录制')
  // 停止画面录制
  stopRecordEvent && stopRecordEvent()
  // 停止数据上报定时器
  // clearInterval(eventInter)
  // 停止性能监控定时器
  clearInterval(memoryInter)
  // 停止总时长监控定时器
  clearTimeout(sumSecondTimeout)
  // 停止启动定时器
  clearTimeout(startTimeout)
}

/**
 * 录制
 */
function record() {
  return rrweb.record({
    checkoutEveryNth: 100,
    emit(event, isCheckout) {
      if (isCheckout) {
        // 保存数据
        saveEvents()
        events = []
      }
      events.push(event)
    },
  })
}

/**
 * 保存event
 */
function saveEvents() {
  if (!events.length) {
    return
  }

  const inst = getInstance()

  const userPhone = inst.getUserInfo()?.phone
  // const http = inst.getRequest()

  http(
    recordConfig.uploadRecorded || '',
    {
      batchId, // 批次ID
      id: userConfig.id, // 配置ID
      uploadStatus: 1, // 上传状态
      recordedLength: 0, // 实际上报时长
      jsonListObject: events, // 事件数据
    },
    {
      headers: {
        'X-Phone': userPhone,
      },
    }
  )
  console.log('[saveEvents] 保存event数据成功，大小为：', getObjectSize(events))
}

/**
 * 获取对象大小
 * @param {*} obj
 * @returns
 */
function getObjectSize(obj) {
  var jsonString = JSON.stringify(obj)
  var sizeInBytes = new TextEncoder().encode(jsonString).length
  return `${Number(sizeInBytes / 10000).toFixed(2)} 万字节`
}

export { initRRWeb }
