/* IRONA Server is subject to the terms of the Mozilla Public License 2.0.
 * You can obtain a copy of MPL at LICENSE.md of repository root. */
// Program constants

import path from 'path';

// [String]
export const name = {
  full: 'IRONA Server',
  abbr: '15na',
};

// [Directories]
// NOTE: Base directory of relative path is {process.cwd()}.
// NOTE: Other than {base} must be used with {base}.
export const dir = {
  base: path.join(process.cwd(), 'data'),
  log: path.join('log'),
  db: path.join('db'),
  model: path.join(process.cwd(), 'model'),
};

// [Argument Parsing]
export const arg = {
  fn: {
    default: {
      keyword: 'launch',
      description: 'Open 15na Server, all in one.',
      options: [

        // Web module
        'port', 'certPath', 'keyPath', 'noRedirector',

        // CSI module
        'modelDir', 'gpuNumber', 'preprocessingServerCount', 'predictionInterval', 'pipeBufferSize',
        'windowLength', 'windowInterval', 'packetsPerSecond', 'txAntenna', 'rxAntenna', 'disableAmplitude', 'disablePhase', 'reduceResolution', 'leavePackets',
        'dispInterpretedConfig', 'dispPredResults', 'dispPredOutput', 'dispPrepOutput', 'modeledLabels',
        'notifProbCond', 'notifRepeatCond', 'notifID',

      ],
    },
    auth: {
      keyword: 'auth-config',
      description: 'Configure authentication and AP/Client registration.',
      options: [

        // Area
        'addArea', 'deleteArea',

        // AP
        'addAP', 'deleteAP',

        // Client
        'addClient', 'deleteClient',

      ],
    },
  },
  opt: {

    /* Authentication-config-related features */
    addArea: {
      flags: ['--add-area'],
      type: 'string',
      description: 'Add an area with name',
      required: false,
      multiple: true,
    },
    deleteArea: {
      flags: ['--del-area'],
      type: 'string',
      description: 'Delete an area with Area ID',
      required: false,
      multiple: true,
    },
    addAP: {
      flags: ['--add-ap'],
      type: 'string',
      description: 'Add an access point with name and AreaID (e.g. NAME AID)',
      required: false,
      inputCount: 2,
      multiple: true,
    },
    deleteAP: {
      flags: ['--del-ap'],
      type: 'string',
      description: 'Delete an access point with APID',
      required: false,
      multiple: true,
    },
    addClient: {
      flags: ['--add-cli'],
      type: 'string',
      description: 'Add a client with name and AreaIDs (e.g. NAME AID1|AID2|AID3)',
      required: false,
      inputCount: 2,
      multiple: true,
    },
    deleteClient: {
      flags: ['--del-cli'],
      type: 'string',
      description: 'Delete a client with ClientID',
      required: false,
      multiple: true,
    },

    /* Web features */

    port: {
      flags: ['-p', '--port'],
      type: 'number',
      description: 'Open the server with given port (default: 443)',
      required: false,
    },
    certPath: {
      flags: ['-c', '--cert'],
      type: 'string',
      description: 'Specify a SSL certificate path',
      required: false,
    },
    keyPath: {
      flags: ['-k', '--key'],
      type: 'string',
      description: 'Specify a path of the key for SSL certificate',
      required: false,
    },
    noRedirector: {
      flags: ['-nr', '--no-redirector'],
      type: 'flag',
      description: 'Do not make 443 port redirector on 80 port (This works only when the port is 443)',
      required: false,
    },

    /* CSI Environmental */

    modelDir: {
      flags: ['-m', '--model-dir'],
      type: 'string',
      description: 'Path of directory which contains model.h5 and model.json(yml)',
      required: true,
    },
    gpuNumber: {
      flags: ['-g', '--gpu'],
      type: 'string',
      description: 'Set ID of gpus to use. (Default: All gpus)',
      required: false,
    },
    preprocessingServerCount: {
      flags: ['-ppc', '--preprocessor-count'],
      type: 'number',
      description: 'The number of instances of python CSI preprocessors (Default: 4)',
      required: false,
    },
    predictionInterval: {
      flags: ['-pi', '--prediction-interval'],
      type: 'number',
      description: 'Time interval of Keras prediction in seconds (Default: 8)',
      required: false,
    },
    pipeBufferSize: {
      flags: ['-pipe-buf', '--pipe-buffer-size'],
      type: 'number',
      description: 'Pipe IPC buffer size for preprocessor/predictor in exponential(2^n). (Default: 30)',
      required: false,
    },

    /* CSI Window & Packet Configuration */

    windowLength: {
      flags: ['-win', '--window-length'],
      type: 'number',
      description: 'CSI window length in seconds',
      required: true,
    },
    windowInterval: {
      flags: ['-slide', '--window-slide-interval'],
      type: 'number',
      description: 'Sliding window interval in seconds',
      required: true,
    },
    packetsPerSecond: {
      flags: ['-pps', '--packets-per-second'],
      type: 'number',
      description: 'Amount of CSI packets per second for predictor',
      required: true,
    },
    txAntenna: {
      flags: ['-tx', '--tx-antenna'],
      type: 'string',
      description: 'Select ID of used transmission antenna. (Default: 1)',
      required: false,
    },
    rxAntenna: {
      flags: ['-rx', '--rx-antenna'],
      type: 'string',
      description: 'Select ID of used reception antenna. Starts from 1. (Default: 1)',
      required: false,
    },
    disableAmplitude: {
      flags: ['-noamp', '--disable-amplitude'],
      type: 'flag',
      description: 'Disable processing amplitude. This does not change CSI column shape.',
      required: false,
    },
    disablePhase: {
      flags: ['-nophase', '--disable-phase'],
      type: 'flag',
      description: 'Disable processing phase. This does not change CSI phase shape.',
      required: false,
    },
    reduceResolution: {
      flags: ['-res', '--reduce-resolution'],
      type: 'number',
      description: 'Reduces input packet of preprocessor by this. So, 1/n of the original packet may processed. (Default: 1)',
      required: false,
    },
    leavePackets: {
      flags: ['-leave', '--leave-packets'],
      type: 'flag',
      description: 'Leave all packet data in OS temp directory.',
      required: false,
    },

    /* Logging-Debug related display options */

    dispInterpretedConfig: {
      flags: ['-disp-conf', '--display-interpreted-configs'],
      type: 'flag',
      description: 'Display config interpretation',
      required: false,
    },
    dispPredResults: {
      flags: ['-disp-pred', '--display-prediction-results'],
      type: 'flag',
      description: 'Display results of classification',
      required: false,
    },
    dispPredOutput: {
      flags: ['-debug-pred', '--display-prediction-output'],
      type: 'flag',
      description: 'If enabled, classifier output will be printed to standard output.',
      required: false,
    },
    dispPrepOutput: {
      flags: ['-debug-prep', '--display-preprocessing-output'],
      type: 'flag',
      description: 'If enabled, preprocessor output will be printed to standard output.',
      required: false,
    },
    modeledLabels: {
      flags: ['-l', '--label'],
      type: 'string',
      description: 'Set labels for prediction results (e.g. Noise,Fall,LayDown)',
      required: false,
    },

    /* Client Notification Thresholds */

    notifProbCond: {
      flags: ['-noti-th', '--notification-threshold-probability'],
      type: 'number',
      description: 'Condition probability of sending notification',
      required: true,
    },
    notifRepeatCond: {
      flags: ['-noti-rep', '--notification-threshold-repeat'],
      type: 'number',
      description: 'Condition repeatness of sending notification',
      required: true,
    },
    notifID: {
      flags: ['-noti-id', '--notification-target-id'],
      type: 'string',
      description: 'If probability of [NOTIF ID] from prediction result goes over [NOTIF COND], notification will be sent (Caution: this > 0) (e.g. 1,2)',
      required: true,
    },
  },
};
