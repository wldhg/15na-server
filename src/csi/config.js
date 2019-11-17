/* IRONA Server is subject to the terms of the Mozilla Public License 2.0.
 * You can obtain a copy of MPL at LICENSE.md of repository root. */

import os from 'os';

/* eslint-disable import/prefer-default-export */
export const parse = (launchCode, arg) => {
  const data = {};

  data.pipePath = `${os.tmpdir()}/${launchCode}-pipe-{0}.ipc`;
  data.prepPath = `${os.tmpdir()}/${launchCode}-preprocessor.ipc`;
  data.predPath = `${os.tmpdir()}/${launchCode}-predictor.ipc`;

  data.relativeModelDir = `${process.cwd()}/${arg.modelDir}`;

  data.preprocessors = arg.preprocessingServerCount || 4;
  data.csiTxAntenna = arg.txAntenna ? arg.txAntenna.split(',') : ['1'];
  data.csiRxAntenna = arg.rxAntenna ? arg.rxAntenna.split(',') : ['1'];
  data.csiWindowRow = arg.windowLength * arg.packetsPerSecond;
  data.csiSlideRow = arg.windowInterval * arg.packetsPerSecond;
  data.csiPPS = arg.packetsPerSecond;

  data.csiProcAmp = !arg.disableAmplitude;
  data.csiProcPhase = !arg.disablePhase;
  data.csiRedResolution = arg.reduceResolution || 1;

  data.pipeBufferSize = arg.pipeBufferSize || 30;
  data.predInterval = arg.predictionInterval || 8;
  data.predRemainingWindow = 0;

  data.gpu = arg.gpuNumber && arg.gpuNumber.length > 0 ? arg.gpuNumber : 'unset';

  data.csiWindowColumnPerPair = 30 * (data.csiProcAmp + data.csiProcPhase);
  data.csiWindowColumn = data.csiWindowColumnPerPair
                         * data.csiTxAntenna.length
                         * data.csiRxAntenna.length;

  data.modelLabels = arg.modeledLabels.split(',');

  return data;
};
