/* IRONA Server is subject to the terms of the Mozilla Public License 2.0.
 * You can obtain a copy of MPL at LICENSE.md of repository root. */

import { spawn } from 'child_process';
import 'colors';

/* eslint-disable import/extensions */
import * as config from './config.js';
import * as ipc from './ipc.js';
import * as detect from './detect.js';
import * as window from './window.js';

let isPredictorReady = false;
export const isReady = () => isPredictorReady;

export const load = (core) => {
  const launchCode = core.util.random().toString(16);
  const conf = config.parse(launchCode, core.arg);
  ipc.init(core, conf);
  detect.init(core, conf);
  window.init(core, ipc, launchCode);

  // Config Preprocessing Server
  if (core.arg.dispPrepResults) {
    core.log.warn('The output of preprocessors will be printed through standard output. This can downgrade the performance.');
  }

  const ppSockets = [];
  ipc.prep.server.on('start', () => {
    for (let i = 0; i < conf.preprocessors; i += 1) {
      const py = spawn('python', [
        `${process.cwd()}/src/csi/preprocessor.py`,
        i + 1,
        conf.prepPath,
        conf.pipePath,
        conf.csiRedResolution,
        conf.csiSlideRow,
        conf.csiWindowRow,
        conf.csiWindowColumn,
        conf.csiWindowColumnPerPair,
        conf.csiTxAntenna.join(','),
        conf.csiRxAntenna.join(','),
        conf.csiProcAmp,
        conf.csiProcPhase,
        conf.csiPPS,
      ], core.arg.dispPrepResults ? { stdio: ['ignore', 1, 2] } : {});
      py.on('close', () => {
        core.log.warn(`${core.util.ordinalSuffix(i + 1)} preprocessing process died!`);
      });
      core.onExit(() => py.kill('SIGKILL'));
    }
  });
  ipc.prep.server.on('connect', (soc) => {
    core.log.info(`A preprocessor is now live. (Now ${ppSockets.length + 1} alive)`);
    ppSockets.push(soc);
    if (ppSockets.length === conf.preprocessors) {
      core.log.success('All preprocessors are successfully loaded.');
      window.registerPPSockets(ppSockets);
      ipc.pred.server.start();
    }
  });

  // Config Predictor Server
  if (core.arg.dispPredResults) {
    core.log.warn('The output of predictors will be printed through standard output. This can downgrade the performance.');
  }

  ipc.pred.server.on('start', () => {
    const py = spawn('python', [
      `${process.cwd()}/src/csi/predictor.py`,
      conf.predPath,
      conf.pipePath,
      conf.relativeModelDir,
      conf.gpu,
      conf.preprocessors,
      conf.pipeBufferSize,
      conf.csiWindowRow,
      conf.csiWindowColumn,
      conf.predInterval,
    ], core.arg.dispPredResults ? { stdio: ['ignore', 1, 2] } : {});
    py.on('close', () => {
      core.log.warn('Keras prediction process died!');
    });
    core.onExit(() => py.kill('SIGKILL'));
  });
  ipc.pred.server.on('connect', () => {
    core.log.success('Keras server is now live.');
    isPredictorReady = true;
  });
  ipc.pred.server.on('data', detect.fromBuffer);

  // Start Preprocessing Server
  ipc.prep.server.start();
};

export const setAlerter = (fn) => {
  detect.setAlerter(fn);
};

export const processWindow = (aid, buf) => {
  window.process(aid, buf);
};
