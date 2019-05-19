// Widh Jio

import child_process from 'child_process'
import ipc from 'node-ipc'
import os from 'os'
import fs from 'fs'
import moment from 'moment'
import rd from '../util/random'
import * as exit from '../core/exit'

// System
var log
var e
var arg

// Preprocessing servers
var pss = []
var psCount = 4
var psRotation = 0

// Socket
var pred
var prep

// CSI parameters
var windowCount = 0
var launchCode = 0

// Websocket
var notifClis = []

const setupPred = (vars, predPath, pipePath) => {
  pred.server.on('start', () => {
    var cp = child_process.spawn('python', [
      `${process.cwd()}/csi/predict.py`,
      predPath,
      `${process.cwd()}/${arg.modelDir}`,
      pipePath,
      psCount,
      vars.pipeBufferSize,
      vars.winRow,
      vars.winCol,
      vars.predictionInterval
    ], arg.debugClassifier ? { stdio: ['ignore', 1, 2] } : {})
    cp.on('close', () => {
      log.error('Keras server died! Please fix the error and restart irona server.')
    })
  })
  pred.server.on('connect', soc => {
    log.success('Keras server is now live.')
    // Register exit handler
    exit.onExit(() => {
      pred.server.stop()
    })
  })
  pred.server.on('data', data => {
    data = JSON.parse(data.toString().slice(0, -1)) // Remove Form Feed
    for (var i = 0; i < data.length; i++) {
      console.log(Number(data[i][Number(arg.notifID) - 1]))
      if (Number(data[i][Number(arg.notifID) - 1]) > Number(arg.notifCond)) {
        log.info('FALL DETECTED!')
        notifClis.forEach((item) => {
          try {
            item.emit('fallalert')
          } catch (err) { }
        })
      }
    }
  })
  pred.server.start()
}

const setupPrep = (vars, prepPath, pipePath, predPath) => {
  prep.server.on('start', () => {
    for (var i = 0; i < psCount; i++) {
      var cp = child_process.spawn('python', [
        `${process.cwd()}/csi/preprocessing.py`,
        prepPath,
        vars.optimizeFactor,
        vars.winRow,
        vars.winColStart,
        vars.winColEnd,
        vars.slideSize,
        pipePath,
        i + 1
      ], arg.debugClassifier ? { stdio: ['ignore', 1, 2] } : {})
      cp.on('close', () => {
        log.error('A preprocessing server died! Please fix the error and restart irona server.')
      })
    }
  })
  prep.server.on('connect', soc => {
    log.info(`A preprocessing server is now live. (${pss.length + 1})`)
    pss.push(soc)
    if (pss.length === psCount) {
      log.success('All preprocessing servers are successfully loaded!')
      if (predPath) {
        setupPred(vars, predPath, pipePath)
      }
      // Register exit handler
      exit.onExit(() => {
        prep.server.stop()
      })
    }
  })
  prep.server.start()
}

export const prepareAll = (_log, _e, _arg) => {
  const vars = getCommonVariables(_log, _e, _arg)
  const prepPath = `${os.tmpdir()}/${launchCode}-preprocessing.ipc`
  const predPath = `${os.tmpdir()}/${launchCode}-predict.ipc`
  const pipePath = `${os.tmpdir()}/${launchCode}-pipe-{0}.ipc`

  // Launch IPC server
  pred = new ipc.IPC
  prep = new ipc.IPC
  prep.config.rawBuffer = true
  prep.config.silent = true
  pred.config.rawBuffer = true
  pred.config.silent = true
  prep.serve(prepPath)
  pred.serve(predPath)

  if (arg.debugClassifier) {
    log.warn('The output of classifiers will be printed through standard output.')
    log.warn('This can downgrade the performance.')
  }

  // Trigger setup
  setupPrep(vars, prepPath, pipePath, predPath)
}

export const preparePrep = (_log, _e, _arg) => {
  const vars = getCommonVariables(_log, _e, _arg)
}

export const getCommonVariables = (_log, _e, _arg) => {
  // Return set
  var ret = {}

  // Save global variables
  log = _log
  e = _e
  arg = _arg

  // Constants & arguments without "URLs"
  launchCode = rd(0, 281474976710650)
  psCount = Number(arg.preprocessingServerCount) || 4

  ret.winColStart = Number(arg.columnRange.substring(0, arg.columnRange.indexOf(':')))
  ret.winColEnd = Number(arg.columnRange.substring(arg.columnRange.indexOf(':') + 1))
  ret.winCol = ret.winColEnd - ret.winColStart
  ret.winRow = Math.floor(Math.floor(Number(arg.packetsPerSecond) / Number(arg.optimizeFactor || 1)) * Number(arg.windowLength))
  ret.optimizeFactor = arg.optimizeFactor || 1
  ret.slideSize = Number(arg.slideInterval) * Number(arg.packetsPerSecond)
  ret.pipeBufferSize = arg.pipeBufferSize || 30
  ret.predictionInterval = arg.predictionInterval || 8

  return ret
}

export const processWindow = (buf) => {
  log.info(`New CSI of buffer of length ${buf.length} entered`)
  if (pss.length !== psCount) {
    log.warn('Classifier initialization uncompleted. This window is goint to be omitted.')
  } else {
    const path = `${os.tmpdir()}/15na-${launchCode}-${windowCount++}.dat`
    fs.writeFile(path, buf, (err) => {
      if (err) {
        log.error(e.parse(0x100, 'Error on saving dat file'))
      } else {
        prep.server.emit(pss[psRotation++], path)
        if (psRotation === pss.length) {
          psRotation = 0
        }
      }
    })
  }
}

export const notifRegister = (cli) => {
  clis.push(cli)
  cli.on('disconnect', () => {
    clis.splice(clis.indexOf(cli), 1)
  })
}

export const preparePred = (_log, _e, _arg) => {
  // Save them
  log = _log
  e = _e
  arg = _arg
}
