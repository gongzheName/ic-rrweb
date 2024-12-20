class Common {
  #options = {}
  #appType = null
  #token = null

  constructor(appType, options) {
    this.setAppType(appType)
    this.#options = { ...options }
    this.#init()
  }

  #init() {
    const { token } = this.#options
    this.setToken(token)
    this.setOptions(this.#options)
  }

  setToken(token) {
    this.#token = token
  }
  getToken() {
    return this.#token
  }

  setAppType(type) {
    this.#appType = type
  }
  getAppType() {
    return this.#appType
  }

  setOptions(options) {
    this.#options = { ...this.#options, enable: true, ...options }
  }
  getOptions() {
    return this.#options
  }
}

export default Common
