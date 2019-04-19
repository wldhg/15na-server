// Widh Jio
// Program initializing

import path from 'path'
import exit from './exit'
import YError from './error'
import YLog from './log'
import * as arhe from './arghelp'
import * as cs from './const'
import * as json from '../util/json'

export var log = new YLog(cs.APPNAME_ABBR)
export var e = new YError(log)
export var pkg, arg

export var init =
    // Read "package.json"
    json.parse(
      path.resolve('package.json')
    ).then(parsedPkg => {
      pkg = parsedPkg
      return arhe.parse(e)
    }, e.parse(0x110, "Fatal error occurred while parsing 'package.json'.", true))

    // If no arguments, or want, display help
      .then(analyzedArg => {
        arg = analyzedArg

        if (arg.fn.keyword === 'help') {
          return arhe
            .help(arg, pkg, log)
            .then(exit(0))
            .catch(
              e.parse(
                0x140,
                'Fatal error occurred while printing help message.',
                true
              )
            )
        } else { return log.fsInit(cs.LOG_DIR, arg.fn.log || cs.LOG_DEFAULT_FILE) }
      }, e.parse(0x120, 'Fatal error occurred while parsing arguments.', true))

    // Wait for 5 ticks and start program
      .then(_ => {
        // Wait 50 ticks for safely load log module
        return new Promise((resolve, reject) => setTimeout(resolve, 200))
      }, e.parse(0x100, 'Fatal error from unknown cause.', true))
