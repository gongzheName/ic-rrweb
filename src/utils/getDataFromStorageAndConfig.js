import { getInstance } from "./instance"

let token = ''

export const getToken = () => {
  if (token) {
    return token
  }
  const tokenFromSession = sessionStorage.getItem('token')
  if (tokenFromSession) {
    token = tokenFromSession
    return tokenFromSession
  }
  const inst = getInstance()
  const tokenFromInst = inst.getToken()
  if (tokenFromInst) {
    token = tokenFromInst
    return tokenFromInst
  }
  const __options = inst.getOptions()
  const { token: tokenFromOption } = __options
  if (tokenFromOption) {
    token = tokenFromOption
    return tokenFromOption
  }
}
