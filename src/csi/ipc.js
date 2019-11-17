/* IRONA Server is subject to the terms of the Mozilla Public License 2.0.
 * You can obtain a copy of MPL at LICENSE.md of repository root. */

import ipc from 'node-ipc';

export const pred = new ipc.IPC();
export const prep = new ipc.IPC();

export const init = (core, conf) => {
  // Config node-ipc
  prep.config.rawBuffer = true;
  prep.config.silent = true;

  pred.config.rawBuffer = true;
  pred.config.silent = true;

  // Launch check variables
  let isPrepIPCStarted = false;
  let isPredIPCStarted = false;

  // Launch IPC
  prep.serve(conf.prepPath, () => {
    isPrepIPCStarted = true;
  });
  pred.serve(conf.predPath, () => {
    isPredIPCStarted = true;
  });

  // Register onExit handler
  core.onExit(() => {
    if (isPrepIPCStarted) {
      prep.server.stop();
    }
    if (isPredIPCStarted) {
      pred.server.stop();
    }
  });
};
