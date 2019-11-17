/* IRONA Server is subject to the terms of the Mozilla Public License 2.0.
 * You can obtain a copy of MPL at LICENSE.md of repository root. */

/* eslint-disable import/extensions */
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
      const apid = JSON.parse(rawAPID);
      db.queryAPID(apid)
        .then((apInfo) => {
          lin.info(`New AP registered: ${apid}`);
          ap.on('neww', (data) => {
            if (csi.isReady()) {
              csi.processWindow(apInfo.aid, data);
            } else {
              lin.warn('CSI entered but processors are not ready. This will ignored.');
            }
          });
          ap.emit('regResult', JSON.stringify('true'));
        })
        .catch(() => {
          lin.warn(`New AP tried to register but failed: ${apid}`);
          ap.emit('regResult', JSON.stringify('Failed to register your AP. Please restart the AP program to retry.'));
        });
    });
  });

  // Client program communication
  io.of('/15na-ws/out').on('connection', (cli) => {
    lout.debug('New client connected.');
    cli.on('disconnect', () => {
      lout.info('A client disconnected.');
    });
    cli.on('reg', (rawCID) => {
      const cid = JSON.parse(rawCID);
      db.queryClientID(cid)
        .then((cliInfo) => {
          lout.info(`New client registered: ${cid}`);
          for (let i = 0; i < cliInfo.aids.length; i += 1) {
            if (liveClient[cliInfo.aids[i]]) {
              liveClient[cliInfo.aids[i]][cid] = cli;
            } else {
              db.queryAreaID(cliInfo.aids[i]).then((area) => {
                liveClient[cliInfo.aids[i]] = { name: area.name, cid: cli };
              }).catch(() => {
                core.log.error(`Failed to find an area: ${cliInfo.aids[i]}! Notification for this area may not work.`);
              });
            }
          }
          cli.on('disconnect', () => {
            for (let i = 0; i < cliInfo.aids.length; i += 1) {
              delete liveClient[cliInfo.aids[i]][cid];
            }
          });
          cli.emit('regResult', JSON.stringify({
            name: cliInfo.name,
            areaCount: cliInfo.area.length,
            connected: 0,
          }));
        })
        .catch(() => {
          lout.info(`New client tried to register but failed: ${cid}`);
          cli.emit('regResult', JSON.stringify('Failed to register your client. Please retry with correct client ID.'));
        });
    });
  });

  // Register websocket api to CSI module
  csi.setAlerter((aid, prob) => {
    const aidLog = alertLog.indexOf(aid);
    if (aidLog === -1) {
      alertLog.push(aid);
      setTimeout(() => {
        alertLog.splice(alertLog.indexOf(aid), 1);
      }, 10000);
      if (liveClient[aid]) {
        const clis = Object.values(liveClient[aid]);
        for (let i = 0; i < clis.length; i += 1) {
          clis[i].emit('alert', JSON.stringify({ loc: liveClient[aid].name, prob }));
        }
      } else {
        core.log.warn(`No clients connected to area "${aid}"!!`);
      }
    } else {
      core.log('Fall alert requested but it\'s in cooltime.');
    }
  });
});
