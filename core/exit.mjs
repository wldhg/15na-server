// Widh Jio
// Exit control module

import YLog from './log'

var log = new YLog()
var exitStarted = false
var exit = (code) => {
  if (exitStarted) return
  exitStarted = true

  return setTimeout(() => process.exit(code), 0)
}

// Detecting process interrupt events
process.on('exit', _ => _)
process.on('SIGUSR2', e => {
  log.warn('System interrupt detected (maybe KILL command).', 'SIGUSR2')
  exit(0)
})
process.on('SIGUSR1', e => {
  log.warn('System interrupt detected (maybe KILL command).', 'SIGUSR1')
  exit(0)
})
process.on('SIGINT', e => {
  log.warn('Shutdowning, see-ya.', 'SIGINT')
  exit(0)
})

export default exit
