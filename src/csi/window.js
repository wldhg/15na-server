/* IRONA Server is subject to the terms of the Mozilla Public License 2.0.
 * You can obtain a copy of MPL at LICENSE.md of repository root. */

import os from 'os';
import fs from 'fs';

let getBufferPath;
let generateCallbackPath;
let winLog;
let windowCount = 0;
let psRotation = 0;
let prepServer;
let prepSockets;
const prepAreaCnt = {};
let csiDebug = null;

export const init = (core, ipc, launchCode) => {
  getBufferPath = () => {
    if (windowCount >= Number.MAX_SAFE_INTEGER) {
      windowCount = 0;
    } else {
      windowCount += 1;
    }
    return `${os.tmpdir()}/irona-pkts-${launchCode}-${windowCount}.dat`;
  };
  generateCallbackPath = () => `${os.tmpdir()}/idbgcb-${core.util.random().toString(16)}.json`;
  winLog = core.log;
  prepServer = ipc.prep.server;

  if (core.arg.enableDebug) {
    prepServer.on('data', (buf) => {
      try {
        const [aid, cbPath, prepCnt] = JSON.parse(buf.toString());
        fs.readFile(cbPath, (error, data) => {
          if (error) {
            core.log.error('Failed to read debugging object from file.');
            core.log.debug(error);
          } else {
            const pped = JSON.parse(data.toString());
            if (csiDebug) csiDebug(aid, prepCnt, pped);
            fs.unlink(cbPath, () => {});
          }
        });
      } catch (e) {
        core.log.warn('Failed to parse debugging object from preprocessor.');
        core.log.debug(e);
      }
    });
  }
};

export const registerPPSockets = (pps) => {
  prepSockets = pps;
};

export const setCSIDebugger = (fn) => {
  csiDebug = fn;
};

export const process = (aid, buf) => {
  winLog.info(`New CSI buffer of ${buf.length} bytes length entered`);
  const path = getBufferPath();
  if (prepAreaCnt[aid]) {
    prepAreaCnt[aid] = 0;
  } else {
    prepAreaCnt[aid] += 1;
  }
  fs.writeFile(path, buf, (error) => {
    if (error) {
      winLog.error('Error on saving dat file.');
      winLog.debug(error);
    } else {
      const prepRequest = { aid, path, cnt: prepAreaCnt[aid] };
      if (csiDebug) prepRequest.cbPath = generateCallbackPath();
      prepServer.emit(prepSockets[psRotation], JSON.stringify(prepRequest));
      psRotation += 1;
      if (psRotation === prepSockets.length) {
        psRotation = 0;
      }
    }
  });
};
