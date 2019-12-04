/* IRONA Server is subject to the terms of the Mozilla Public License 2.0.
 * You can obtain a copy of MPL at LICENSE.md of repository root. */

/* eslint-disable import/extensions */
import 'colors';
import Log from '../core/logger.js';

const inLogInstance = new Log();
const lin = function logByAP(data, title) {
  return inLogInstance.plain(data, title);
};
lin.info = inLogInstance.info;
lin.error = inLogInstance.error;
lin.debug = inLogInstance.debug;
lin.warn = inLogInstance.warn;
lin.okay = inLogInstance.okay;

const outLogInstance = new Log();
const lout = function logByCli(data, title) {
  return outLogInstance.plain(data, title);
};
lout.info = outLogInstance.info;
lout.error = outLogInstance.error;
lout.debug = outLogInstance.debug;
lout.warn = outLogInstance.warn;
lout.okay = outLogInstance.okay;

const liveAP = {};
const liveClient = {};
const alertLog = [];

/* eslint-disable import/prefer-default-export */
export const route = (core, io, csi, db) => (new Promise((resolve) => {
  // Create websocket loggers
  Promise.all([
    inLogInstance.init('ws-in.log', core.config.dir.base, core.config.dir.log),
    outLogInstance.init('ws-out.log', core.config.dir.base, core.config.dir.log),
  ]).then(() => {
    // Wait 75 ticks for safely load all loggers
    setTimeout(resolve, 300);
  });
})).then(() => {
  // AP program communication
  io.of('/15na-ws/in').on('connection', (ap) => {
    lin.debug('New AP connected.');
    ap.on('disconnect', () => {
      lin.debug('An AP disconnected.');
    });
    ap.on('reg', (rawAPID) => {
      try {
        const apid = JSON.parse(rawAPID);
        db.queryAPID(apid)
          .then((apInfo) => {
            if (liveAP[apInfo.aid]) {
              if (liveAP[apInfo.aid].indexOf(apid) === -1) {
                liveAP[apInfo.aid].push(apid);
              } else {
                lin.warn(`Already an AP with apid: ${apid}`);
              }
            } else {
              liveAP[apInfo.aid] = [apid];
            }
            ap.on('disconnect', () => {
              if (liveAP[apInfo.aid]) {
                if (liveClient[apInfo.aid]) {
                  const cliKeys = Object.keys(liveClient[apInfo.aid]);
                  for (let i = 0; i < cliKeys.length; i += 1) {
                    if (cliKeys[i] !== 'name') {
                      liveClient[apInfo.aid][cliKeys[i]].emit('updateAPCount', JSON.stringify(-1));
                    }
                  }
                }
                liveAP[apInfo.aid].splice(
                  liveAP[apInfo.aid].indexOf(apid), 1,
                );
              } else {
                lin.warn(`An AP array does not exist: ${apid}`);
              }
            });
            lin.info(`An AP registered: ${apid}`);
            ap.on('neww', (data) => {
              if (csi.isReady()) {
                csi.processWindow(apInfo.aid, data);
              } else {
                lin.warn('CSI entered but processors are not ready. These CSIs are ignored.');
              }
            });
            ap.emit('regResult', JSON.stringify('true'));
            if (liveClient[apInfo.aid]) {
              const cliKeys = Object.keys(liveClient[apInfo.aid]);
              for (let i = 0; i < cliKeys.length; i += 1) {
                if (cliKeys[i] !== 'name') {
                  liveClient[apInfo.aid][cliKeys[i]].emit('updateAPCount', JSON.stringify(1));
                }
              }
            }
          })
          .catch(() => {
            lin.warn(`New AP tried to register but failed: ${apid}`);
            ap.emit('regResult', JSON.stringify('Failed to register your AP. Please restart the AP program to retry.'));
          });
      } catch (e) {
        lin.error('AP Registration Error!');
        lin.debug(e);
      }
    });
  });

  // Client program communication
  io.of('/15na-ws/out').on('connection', (cli) => {
    lout.debug('New client connected.');
    cli.on('disconnect', () => {
      lout.info('A client disconnected.');
    });
    cli.on('reg', (rawCID) => {
      try {
        const cid = JSON.parse(rawCID);
        db.queryClientID(cid)
          .then((cliInfo) => {
            // Check management area
            if (cliInfo.aids.length < 1) {
              cli.emit('regResult', JSON.stringify(
                'This client ID does not have any managable area.',
              ));
              return;
            }

            lout.info(`New client registered: ${cid}`);

            // Actual registration
            let liveAPs = 0;
            for (let i = 0; i < cliInfo.aids.length; i += 1) {
              if (liveAP[cliInfo.aids[i]]) {
                liveAPs += liveAP[cliInfo.aids[i]].length;
              }
              if (liveClient[cliInfo.aids[i]]) {
                liveClient[cliInfo.aids[i]][cid] = cli;
              } else {
                db.queryAreaID(cliInfo.aids[i]).then((area) => {
                  liveClient[cliInfo.aids[i]] = { name: area.name };
                  liveClient[cliInfo.aids[i]][cid] = cli;
                }).catch(() => {
                  core.log.error(`Failed to find an area: ${cliInfo.aids[i]}! Notification for this area may not work.`);
                });
              }
            }

            // Bind disconnect event
            cli.on('disconnect', () => {
              for (let i = 0; i < cliInfo.aids.length; i += 1) {
                delete liveClient[cliInfo.aids[i]][cid];
              }
            });

            // Create result object
            const regResult = {
              name: cliInfo.name,
              areaCount: cliInfo.aids.length,
              connected: liveAPs,
            };
            if (core.arg.enableDebug) {
              const areaNameFuture = [];
              for (let i = 0; i < cliInfo.aids.length; i += 1) {
                areaNameFuture.push(db.queryAreaID(cliInfo.aids[i]).then((area) => ({
                  aid: area.id,
                  name: area.name,
                })));
              }
              Promise.all(areaNameFuture).then((areas) => {
                const configs = csi.getCSIConfig(core);
                regResult.debugMode = true;
                regResult.debugConfig = {
                  slideInterval: core.arg.windowInterval,
                  txArray: configs.csiTxAntenna.map(Number),
                  rxArray: configs.csiRxAntenna.map(Number),
                  labels: configs.modelLabels,
                  targetLabelIndex: core.arg.notifID.split(',').map(Number),
                  areas,
                  amplitude: configs.csiProcAmp,
                  phase: configs.csiProcPhase,
                  pps: configs.debugPPS,
                };
                cli.emit('regResult', JSON.stringify(regResult));
              });
            } else {
              regResult.debugMode = false;
              cli.emit('regResult', JSON.stringify(regResult));
            }
          })
          .catch(() => {
            lout.info(`New client tried to register but failed: ${cid}`);
            cli.emit('regResult', JSON.stringify('Failed to register your client. Please retry with correct client ID.'));
          });
      } catch (e) {
        lout.error('Client Registration Error!');
        lout.debug(e);
      }
    });
  });

  // Register alerting websocket api to CSI module
  csi.setAlerter((aid, prob) => {
    const aidLog = alertLog.indexOf(aid);
    if (aidLog === -1) {
      alertLog.push(aid);
      setTimeout(() => {
        alertLog.splice(alertLog.indexOf(aid), 1);
        core.log.debug('Alert cooltime done.');
      }, core.arg.notifMinInterval ? (core.arg.notifMinInterval * 1000) : 10000);
      if (liveClient[aid]) {
        const clis = Object.values(liveClient[aid]);
        for (let i = 0; i < clis.length; i += 1) {
          if (typeof clis[i] !== 'string') {
            clis[i].emit('alert', JSON.stringify({ loc: liveClient[aid].name, prob }));
          }
        }
        core.log(`${'⚠ FALL ALERT! ⚠'.underline.bold.bgYellow.black}  [${aid}, ${Number(prob).toFixed(7)}] ${`to ${clis.length - 1} client(s)`.grey}`);
      } else {
        core.log.warn(`No clients connected to area "${aid}"!!`);
      }
    }
  });

  // Register debugging websocket api to CSI module
  if (core.arg.enableDebug) {
    csi.setPredictionDebugger((aid, data) => {
      if (liveClient[aid]) {
        const clis = Object.values(liveClient[aid]);
        for (let i = 0; i < clis.length; i += 1) {
          if (typeof clis[i] !== 'string') {
            clis[i].emit('debugPred', JSON.stringify({
              aid, data,
            }));
          }
        }
      }
    });
    csi.setCSIDebugger((aid, cnt, data) => {
      if (liveClient[aid]) {
        const clis = Object.values(liveClient[aid]);
        for (let i = 0; i < clis.length; i += 1) {
          if (typeof clis[i] !== 'string') {
            clis[i].emit('debugCSI', JSON.stringify({
              aid, cnt, data,
            }));
          }
        }
      }
    });
  }
});
