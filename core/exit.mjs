// Widh Jio
// Exit control module

import YLog from './log'

var log = new YLog()
var exitStarted = false
export const of = (code) => {
  if (exitStarted) return
  exitStarted = true

  return setTimeout(() => process.exit(code), 0)
}

var exitHndls = []
export const onExit = (fn) => {
  if (typeof fn === 'function') {
    exitHndls.push(fn)
  } else {
    log.error('Something you trying to register as exit handler is not a function.')
    of(0xEEEEE)
  }
}

// Detecting process interrupt events
process.on('exit', _ => {
  exitHndls.forEach(hdl => {
    try { hdl() } catch (e) { }
  })
})
process.on('SIGUSR2', e => {
  log.warn('System interrupt detected (maybe KILL command).', 'SIGUSR2')
  of(0)
})
process.on('SIGUSR1', e => {
  log.warn('System interrupt detected (maybe KILL command).', 'SIGUSR1')
  of(0)
})
process.on('SIGINT', e => {
  log.warn('Shutdowning, see-ya.', 'SIGINT')
  of(0)
})
