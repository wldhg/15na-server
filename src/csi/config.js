/* IRONA Server is subject to the terms of the Mozilla Public License 2.0.
 * You can obtain a copy of MPL at LICENSE.md of repository root. */

import os from 'os';

/* eslint-disable import/prefer-default-export */
export const parse = (launchCode, arg) => {
  const data = {};

  data.preprocessors = arg.preprocessingServerCount || 4;

  data.ppidTemplate = `{0:0${Math.max(2, Math.ceil(Math.log(data.preprocessors) / Math.LN10))}d}`;
  data.pipePath = `${os.tmpdir()}/irona-${launchCode}-pipe-${data.ppidTemplate}.ipc`;
  data.prepPath = `${os.tmpdir()}/irona-${launchCode}-preprocessor.ipc`;
  data.predPath = `${os.tmpdir()}/irona-${launchCode}-predictor.ipc`;

  data.relativeModelDir = `${process.cwd()}/${arg.modelDir}`;

  data.csiProcAmp = !arg.disableAmplitude;
  data.csiProcPhase = !arg.disablePhase;
  data.csiRedResolution = arg.reduceResolution || 1;

  data.csiTxAntenna = arg.txAntenna ? arg.txAntenna.split(',') : ['1'];
  data.csiRxAntenna = arg.rxAntenna ? arg.rxAntenna.split(',') : ['1'];
  data.csiWindowRow = Math.floor(arg.windowLength * arg.packetsPerSecond);
  data.csiSlideRow = Math.floor(arg.windowInterval * arg.packetsPerSecond);
  data.csiPPS = arg.packetsPerSecond;

  data.pipeBufferSize = arg.pipeBufferSize || 30;
  data.predInterval = arg.predictionInterval || 8;
  data.predRemainingWindow = arg.notifHistorySize || 15;

  data.gpu = arg.gpuNumber && arg.gpuNumber.length > 0 ? arg.gpuNumber : 'unset';

  data.csiWindowColumnPerPair = 30 * (data.csiProcAmp + data.csiProcPhase);
  data.csiWindowColumn = data.csiWindowColumnPerPair
                         * data.csiTxAntenna.length
                         * data.csiRxAntenna.length;

  data.modelLabels = arg.modeledLabels ? arg.modeledLabels.split(',') : [];

  data.leaveDat = arg.leavePackets ? 'true' : 'false';

  data.debug = arg.enableDebug ? 'true' : 'false';
  data.debugSkipRate = Math.ceil(arg.packetsPerSecond / 10);
  data.debugPPS = Math.floor(arg.packetsPerSecond / data.debugSkipRate);

  return data;
};
