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
  }

  return future;
}).catch(core.err.parse('Unexpected error occured.'));
