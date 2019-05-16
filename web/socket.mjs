// Widh Jio

import YLog from '../core/log'
import * as cs from '../core/const'

var lin
var lout
var clis = []
var wcnt = 0

export const prepareRoute = () => {
  lin = new YLog(cs.APPNAME_ABBR)
  lin.fsInit(cs.LOG_DIR, '15na-in.log')
  lout = new YLog(cs.APPNAME_ABBR)
  lout.fsInit(cs.LOG_DIR, '15na-out.log')
  // Wait 75 ticks for safely load all loggers
  return new Promise((resolve) => setTimeout(resolve, 300))
}

export const route = (io, csi) => {
  return prepareRoute().then(() => {
    io.of('/15na-ws/in').on('connection', cli => {
      lin.debug('New AP connected.')
      cli.on('neww', csi.processWindow)
    })
    io.of('/15na-ws/out').on('connection', cli => {
      lout.debug('New Client connected.')
      cli.emit('allocateProfile', JSON.stringify({
        statLocation: 'C5 108',
        ip: '141.223.108.152'
      }))
    })
  })
}
