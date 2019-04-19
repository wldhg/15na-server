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
    options: ['port', 'host']
  }
}
export const APP_OPT = {
  port: {
    flags: ['-p', '--port'],
    type: 'ARGOPT_WITH_DATA',
    description: 'Open websocket server with given port (default: 9119)',
    required: false
  },
  host: {
    flags: ['-h', '--host'],
    type: 'ARGOPT_WITH_DATA',
    description: 'Open websocket server with given host (default: localhost)',
    required: false
  }
}
