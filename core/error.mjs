// Widh Jio
// Error capturing module

import * as exit from './exit'

export default class {
  constructor(log) { this.log = log }

  make(detailedCode, message, additionals) {
    var error = new Error(message)

    if (additionals instanceof Array || typeof additionals === 'object') { for (var i in additionals) error[i] = additionals[i] } else if (typeof additionals !== 'undefined') { error['more'] = additionals }

    error.code = detailedCode
    error.name = 'debug'

    return error
  }

  parse(baseCode, description, doExit = false) {
    const log = this.log
    return function (e) {
      let code = baseCode
      if (typeof e.code === 'number') code += e.code

      log.error(
        `${description}${
        typeof e.code === 'undefined' ? '' : ' (' + e.code + ')'
        }`,
        `0x${code.toString(16)}`
      )
      delete e.code

      // NOTE: related with line 77
      if ((e.message || e.msg) && e.name === 'debug') {
        // For custom Errors
        log.debug(
          `${e.message || e.msg}`,
          e.name ? e.name : false,
          e.name ? false : undefined
        )

        delete e.name

        if (e.stack) {
          log.debug(
            e.stack
              .toString()
              .substring(e.stack.toString().indexOf('\n')),
            'stack'
          )
        }

        if (Object.keys(e).length > 0) { for (var one in e) log.debug(e[one], one) }

        if (doExit) exit.of(code)
      } else {
        // For basic Errors
        if (typeof e.stack !== 'undefined') { log.debug(e.stack.toString()) } else log.debug(e)

        if (doExit) exit.of(code)
      }

      return false
    }
  }
}
