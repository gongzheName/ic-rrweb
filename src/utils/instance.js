let instance = null

function setInstance (inst) {
  instance = inst
}
function getInstance () {
  return instance
}

export {
  setInstance,
  getInstance
}
