// Widh Jio

import child_process from 'child_process'
import ipc from 'node-ipc'
import os from 'os'
import fs from 'fs'
import moment from 'moment'
import rd from '../util/random'
import * as py from './py'

var log
var e
var arg
var cl = []
var clCount = 4
var clRotation = 0
var windowCount = 0
var launchCode = 0

export const prepare = (_log, _e, _arg) => {
  // Save global variables
  log = _log
  e = _e
  arg = _arg

  // Random
  launchCode = rd(0, 281474976710650)
  clCount = Number(arg.classifierCount) || 4

  // Launch IPC server on port 9110
  const ipcPath = `${process.cwd()}/15na.ipc`
  ipc.config.rawBuffer = true
  ipc.config.silent = true
  ipc.serve(ipcPath)
  ipc.server.on('start', () => {
    if (arg.debugClassifier) {
      log.warn('The output of classifiers will be printed through standard output.')
      log.warn('To do above, all classifiers will use one core.')
      log.warn('This can be downgrade the performance.')
    }
    for (var i = 0; i < clCount; i++) {
      var cp = child_process.spawn('python', [
        `${process.cwd()}/csi/ipc.py`,
        ipcPath,
        `${process.cwd()}/${arg.modelDir}`,
        arg.optimizeFactor || 1,
        Math.floor(Math.floor(Number(arg.packetsPerSecond) / Number(arg.optimizeFactor || 1)) * Number(arg.windowLength)),
        arg.columnRange.substring(0, arg.columnRange.indexOf(':')),
        arg.columnRange.substring(arg.columnRange.indexOf(':') + 1),
        Number(arg.slideInterval) * Number(arg.packetsPerSecond)
      ], arg.debugClassifier ? { stdio: ['ignore', 1, 2] } : {})
      cp.on('close', () => {
        log.error('A socket seems to be died!')
      })
    }
  })
  ipc.server.on('connect', soc => {
    log.info(`A classifier is now live. (${cl.length + 1})`)
    cl.push(soc)
    if (cl.length === clCount) {
      log.success('All classifiers are successfully loaded!')
    }
  })
  ipc.server.on('data', data => {
    data = JSON.parse(data.toString().slice(0, -1)) // Remove Form Feed
    for (var i = 0; i < data.length; i++) {
      log.info(`Is fall? ${data[i][0]}`)
    }
  })
  ipc.server.start()
}

export const requestPredict = (path) => {
  ipc.server.emit(cl[clRotation++], path)
  if (clRotation === cl.length) {
    clRotation = 0
  }
}

export const processWindow = (buf) => {
  // Cut valid window
  log.info(`New CSI of buffer of length ${buf.length} entered`)
  if (cl.length !== clCount) {
    log.warn('Classifier initialization uncompleted. This window is omitted.')
  } else {
    const datName = `15na-${launchCode}-${windowCount++}.dat`
    const path = `${os.tmpdir()}/${datName}`
    fs.writeFile(path, buf, (err) => {
      if (err) {
        log.error(e.parse(0x100, 'Error on saving dat file'))
      } else {
        requestPredict(path)
      }
    })
  }
}
