// Widh Jio

import YLog from '../core/log'
import * as cs from '../core/const'

var lin
var lout

export const prepareRoute = () => {
  lin = new YLog(cs.APPNAME_ABBR)
  lin.fsInit(cs.LOG_DIR, 'syaa-in.log')
  lout = new YLog(cs.APPNAME_ABBR)
  lout.fsInit(cs.LOG_DIR, 'syaa-out.log')
  // Wait 75 ticks for safely load all loggers
  return new Promise((resolve) => setTimeout(resolve, 300))
}

export const route = (io) => {
  return prepareRoute().then(() => {
    io.of('/syaa-ws/in').on('connection', cli => {
      lin.debug('hai')
    })
  })
}
