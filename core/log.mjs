// Widh Jio
// Logging module
// FIXME: Fix this code when tc39/proposal-class-fields are "finished"
//   - "_make" to "#make"
//   - "_fstream" to "#fstream"

import fs from 'fs'
import path from 'path'
import util from 'util'
import mkdir from '../util/mkdir'

var moment
var colors
import('colors').then(_ => (colors = _.default))
import('moment').then(_ => (moment = _.default))

export default class {
  constructor (appName, logDir = false, logFile = appName + '.log') {
    // Save Parameters
    this.appName = appName
    this.logFile = logFile
    this.logDir = logDir

    // Initialize log files
    if (this.logDir) {
      this.fsInit()
    }
  }

  fsInit (logDir = false, logFile = this.appName + '.log') {
    if (logDir) {
      this.logDir = logDir
      this.logFile = logFile
    }

    const copiedThis = this
    const logPath = path.join(this.logDir, this.logFile)
    const openFStream = (renamedPath, i) => {
      let stream = fs.createWriteStream(logPath)
      this._fstream = stream
      if (typeof i === 'number') this.info(`Previous log file has moved to ${renamedPath}.`)
      this.fsi = typeof i === 'number' ? i : 0
    }

    return fs.access(this.logDir, fs.constants.F_OK, e => {
      if (e) {
        // No log directory -> make & try to write file
        try { mkdir(this.logDir).then(openFStream) } catch (e) {
          copiedThis.error('Error occurred while creating log directory.')
          throw e
        }
      } else {
        // Log directory exists -> check if log file exists
        try {
          fs.accessSync(logPath)
          // Log file exists -> move log file
          let renameLog = function (i) {
            // Set destination path
            let renamedPath = logPath + '.' + i
            fs.access(renamedPath, fs.constants.F_OK, e => {
              if (e) {
                if (e.code === 'ENOENT') {
                  // File does not exists
                  fs.rename(logPath, renamedPath, e => {
                    if (e) {
                      copiedThis.error('Error occured while moving previous log file.')
                      throw e
                    } else { openFStream(renamedPath, i + 1) }
                  })
                } else {
                  // File access error
                  copiedThis.error('Cannot access to previous log file.')
                  throw e
                }
              } else renameLog(++i)
            })
          }
          renameLog(0)
        } catch (e) {
          if (e.code === 'ENOENT') {
            // Log file not exists -> make & load log module
            openFStream(undefined, 0)
          } else {
            // log file cannot be accessed
            copiedThis.error('Cannot access to log file.')
            throw e
          }
        }
      }
    })
  }

  set _colors (c) { this.colors = c }
  set _moment (m) { this.moment = m }

  get stdout () { return process.stdout }
  stdw (data) { this.stdout.write(data) }

  get fsout () { return this._fstream }
  fsw (data) { if (this._fstream) this._fstream.write(data) }

  _make (d, t, nw, l) {
    // Color and NoColor = data, title, default title, flag color
    const cnc = (d, t, dT, fC) => {
      let flag = `[${typeof t === 'undefined' ? dT : t}]`
      let time = moment().format('YYYY MMM Do kk:mm:ss.SSS')

      return {
        c: `${flag[fC].bold} ${time.gray} ${d}\n`,
        nc: `${flag} ${time} ${colors.strip(d)}\n`
      }
    }

    // Log Pattern - Color & Log title & Log content modifier
    const lpt = {
      'info': ['cyan', 'info', _ => _],
      'error': ['red', 'error', _ => _],
      'debug': ['blue', 'debug', _ => typeof _ === 'string' ? _ : util.format('%o', _)],
      'warn': ['yellow', 'warn', _ => _],
      'success': ['green', 'success', _ => _],
      'plain': ['strip', this.appName, _ => _]
    }

    let textPattern = lpt[l]
    let text = cnc(textPattern[2](d), t, textPattern[1], textPattern[0])

    if (this.fsw) this.fsw(text.nc)
    else if (typeof this.fsout === 'boolean' && !this.fsout && !nw) { this.stdw(this.text.warn('Fatal errrr! Writing log file failed.')) }

    this.stdw(text.c)
  }

  info (d, t, nw = false) { this._make(d, t, nw, 'info') }
  error (d, t, nw = false) { this._make(d, t, nw, 'error') }
  debug (d, t, nw = false) { this._make(d, t, nw, 'debug') }
  warn (d, t, nw = false) { this._make(d, t, nw, 'warn') }
  success (d, t, nw = false) { this._make(d, t, nw, 'success') }
  plain (d, t, nw = false) { this._make(d, t, nw, 'plain') }
};
