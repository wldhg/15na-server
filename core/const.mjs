// Widh Jio
// Program constants

import path from 'path'

// [String]
export const APPNAME = 'Syaa Server'
export const APPNAME_ABBR = 'syaa'

// [Path]
// NOTE: To point a file/dir in this program, USE RELATIVE PATH
export const DATA_DIR = path.join('.', 'logs')
export const LOG_DEFAULT_FILE = 'process.log'
export const LOG_DIR = DATA_DIR

// [Argument Parsing]
export const APP_DEFFUNC = 'run'
export const APP_FUNC = {
  operate: {
    keyword: 'run',
    description: 'Open Syaa Server!',
    options: ['wsPort', 'webPort', 'certPath', 'keyPath', 'noRedirector']
  }
}
export const APP_OPT = {
  wsPort: {
    flags: ['-wsp', '--websocket-port'],
    type: 'ARGOPT_WITH_DATA',
    description: 'Open websocket server with given port (default: 11900)',
    required: false
  },
  webPort: {
    flags: ['-wp', '--web-port'],
    type: 'ARGOPT_WITH_DATA',
    description: 'Open web server with given port (default: 443)',
    required: false
  },
  certPath: {
    flags: ['-c', '--cert'],
    type: 'ARGOPT_WITH_DATA',
    description: 'Specify SSL certificate',
    required: true
  },
  keyPath: {
    flags: ['-k', '--key'],
    type: 'ARGOPT_WITH_DATA',
    description: 'Specify a key for SSL certificate',
    required: true
  },
  noRedirector: {
    flags: ['-nr', '--no-redirector'],
    type: 'ARGOPT_WITHOUT_DATA',
    description: 'Do not make 443 port redirector on 80 port (This works only when the port is 443)',
    required: false
  }
}
