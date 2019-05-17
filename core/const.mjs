// Widh Jio
// Program constants

import path from 'path'

// [String]
export const APPNAME = '15na Server'
export const APPNAME_ABBR = '15na'

// [Path]
// NOTE: To point a file/dir in this program, USE RELATIVE PATH
export const DATA_DIR = path.join('.')
export const LOG_DEFAULT_FILE = 'process.log'
export const LOG_DIR = path.join(DATA_DIR, 'logs')
export const DB_DIR = path.join(DATA_DIR, 'db')

// [Argument Parsing]
export const APP_DEFFUNC = 'run'
export const APP_FUNC = {
  operate: {
    keyword: 'run',
    description: 'Open 15na Server!',
    options: ['port', 'certPath', 'keyPath', 'noRedirector', 'packetsPerSecond', 'optimizeFactor', 'slideInterval', 'modelDir', 'columnRange', 'notifCond', 'notifID', 'classifierCount', 'debugClassifier', 'windowLength', 'kerasCore']
  }
}
export const APP_OPT = {
  port: {
    flags: ['-p', '--port'],
    type: 'ARGOPT_WITH_DATA',
    description: 'Open the server with given port (default: 443)',
    required: false
  },
  certPath: {
    flags: ['--cert'],
    type: 'ARGOPT_WITH_DATA',
    description: 'Specify SSL certificate',
    required: false
  },
  keyPath: {
    flags: ['--key'],
    type: 'ARGOPT_WITH_DATA',
    description: 'Specify a key for SSL certificate',
    required: false
  },
  noRedirector: {
    flags: ['-nr', '--no-redirector'],
    type: 'ARGOPT_WITHOUT_DATA',
    description: 'Do not make 443 port redirector on 80 port (This works only when the port is 443)',
    required: false
  },
  packetsPerSecond: {
    flags: ['-pps', '--packets-per-second'],
    type: 'ARGOPT_WITH_DATA',
    description: 'Amount of CSI packets per second',
    required: true
  },
  optimizeFactor: {
    flags: ['-x', '--optimize-factor'],
    type: 'ARGOPT_WITH_DATA',
    description: 'CSI Window optimizing factor (Detection Window Size = Window Size / This)',
    required: false
  },
  slideInterval: {
    flags: ['-s', '--slide-interval'],
    type: 'ARGOPT_WITH_DATA',
    description: 'Classification slide interval (Interval = Window Size * This)',
    required: true
  },
  modelDir: {
    flags: ['-m', '--model-dir'],
    type: 'ARGOPT_WITH_DATA',
    description: 'Path of directory which contains model.h5 and model.json or model.yml',
    required: true
  },
  columnRange: {
    flags: ['-col', '--column-range'],
    type: 'ARGOPT_WITH_DATA',
    description: 'Range of columns to be used in classification of each CSI (e.g. 1:181)',
    required: true
  },
  notifCond: {
    flags: ['-cond', '--notif-cond'],
    type: 'ARGOPT_WITH_DATA',
    description: 'Condition probability of sending notification',
    required: true
  },
  notifID: {
    flags: ['-id', '--notif-id'],
    type: 'ARGOPT_WITH_DATA',
    description: 'If probability of [NOTIF ID] goes over [NOTIF COND], notification will be sent (> 0)',
    required: true
  },
  classifierCount: {
    flags: ['-cl', '--classifier-count'],
    type: 'ARGOPT_WITH_DATA',
    description: 'The number of instances of python CSI classifier for real-time performance (Default: 4)',
    required: false
  },
  debugClassifier: {
    flags: ['-dc', '--debug-classifier'],
    type: 'ARGOPT_WITHOUT_DATA',
    description: 'If enabled, classifier output will be printed.',
    required: false
  },
  windowLength: {
    flags: ['-w', '--window-length'],
    type: 'ARGOPT_WITH_DATA',
    description: 'Window length in seconds',
    required: true
  },
  kerasCore: {
    flags: ['--keras-core'],
    type: 'ARGOPT_WITH_DATA',
    description: 'This modifies inter_op_parallelism_threads.',
    required: false
  }
}
