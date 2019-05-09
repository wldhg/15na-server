// Widh Jio

import YLog from '../core/log'
import * as cs from '../core/const'

var lin
var lout

export const prepareRoute = () => {
  lin = new YLog(cs.APPNAME_ABBR)
  lin.fsInit(cs.LOG_DIR, '15na-in.log')
  lout = new YLog(cs.APPNAME_ABBR)
  lout.fsInit(cs.LOG_DIR, '15na-out.log')
  // Wait 75 ticks for safely load all loggers
  return new Promise((resolve) => setTimeout(resolve, 300))
}

export const route = (io) => {
  return prepareRoute().then(() => {
    io.of('/15na-ws/in').on('connection', cli => {
      cli.emit('reqID')
      lin.debug('haiii of in')
    })
    io.of('/15na-ws/out').on('connection', cli => {
      lout.debug('haiiii')
    })
  })
}
