#!/usr/bin/env -S node --experimental-modules

/* IRONA Server is subject to the terms of the Mozilla Public License 2.0.
 * You can obtain a copy of MPL at LICENSE.md of repository root. */

/* eslint-disable import/extensions */
import * as core from './core/load.js';

core.init.then(() => {
  core.log.info(`${core.config.name.full} ${core.config.version} initialized.`);

  let future;
  switch (core.arg.fn.keyword) {
    default:
    case 'launch':
      future = Promise.all([
        import('./csi/load.js'),
        import('./db/load.js'),
        import('./web/load.js'),
      ]).then(([csi, db, web]) => Promise.all([
        db.load(core),
        csi.load(core),
      ]).then(() => {
        web.load(core, csi, db);
      }));
      break;

    case 'auth-config':
      import('./db/load.js').then(async (db) => {
        await db.load(core);
        const dbMod = [];
        if (core.arg.addAP) {
          for (let i = 0; i < core.arg.addAP.length; i += 1) {
            dbMod.push(db.ap.add(core.arg.addAP[i][0], core.arg.addAP[i][1]));
          }
        }
        if (core.arg.deleteAP) {
          for (let i = 0; i < core.arg.deleteAP.length; i += 1) {
            dbMod.push(db.ap.remove(core.arg.deleteAP[i]));
          }
        }
        if (core.arg.addArea) {
          for (let i = 0; i < core.arg.addArea.length; i += 1) {
            dbMod.push(db.area.add(core.arg.addArea[i]));
          }
        }
        if (core.arg.deleteArea) {
          for (let i = 0; i < core.arg.deleteArea.length; i += 1) {
            dbMod.push(db.area.remove(core.arg.deleteArea[i], core.arg.deletArea[i]));
          }
        }
        if (core.arg.addClient) {
          for (let i = 0; i < core.arg.addClient.length; i += 1) {
            dbMod.push(db.cli.add(
              core.arg.addClient[i][0],
              core.arg.addClient[i][1].split('|'),
            ));
          }
        }
        if (core.arg.deleteClient) {
          for (let i = 0; i < core.arg.deleteClient.length; i += 1) {
            dbMod.push(db.cli.remove(core.arg.deleteClient[i]));
          }
        }
        const dbModFuture = await Promise.all(dbMod);
        return dbModFuture;
      }).then(() => {
        core.log.okay('All database modification finished successfully.');
      }).catch((e) => {
        core.log.error('Failed to modify database.');
        core.log.debug(e);
      });
      break;
  }

  return future;
}).catch(core.err.parse('Unexpected error occured.'));
