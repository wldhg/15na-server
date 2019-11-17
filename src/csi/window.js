/* IRONA Server is subject to the terms of the Mozilla Public License 2.0.
 * You can obtain a copy of MPL at LICENSE.md of repository root. */

import os from 'os';
import fs from 'fs';

let getBufferPath;
let winLog;
let windowCount = 0;
let psRotation = 0;
let prepServer;
let prepSockets;

export const init = (core, ipc, launchCode) => {
  getBufferPath = () => {
    if (windowCount >= Number.MAX_SAFE_INTEGER) {
      windowCount = 0;
    } else {
      windowCount += 1;
    }
    return `${os.tmpdir()}/15na-${launchCode}-${windowCount}.dat`;
  };
  winLog = core.log;
  prepServer = ipc.prep.server;
};

export const registerPPSockets = (pps) => {
  prepSockets = pps;
};

export const process = (aid, buf) => {
  winLog.info(`New CSI buffer of ${buf.length} bytes length entered`);
  const path = getBufferPath();
  fs.writeFile(path, buf, (error) => {
    if (error) {
      winLog.error('Error on saving dat file.');
    } else {
      prepServer.emit(prepSockets[psRotation], JSON.stringify({ aid, path }));
      psRotation += 1;
      if (psRotation === prepSockets.length) {
        psRotation = 0;
      }
    }
  });
};
