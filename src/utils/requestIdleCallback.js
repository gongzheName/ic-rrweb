const ric = window.requestIdleCallback

window.requestIdleCallback = ric || setTimeout
