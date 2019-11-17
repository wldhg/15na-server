/* IRONA Server is subject to the terms of the Mozilla Public License 2.0.
 * You can obtain a copy of MPL at LICENSE.md of repository root. */

/* eslint-disable import/extensions */
import tdb from 'trivialdb';
import * as apPack from './ap.js';
import * as areaPack from './area.js';
import * as cliPack from './client.js';

let db;
let areaDB;
let apDB;
let cliDB;

export const load = async (core) => {
  db = tdb.ns('db', {
    basePath: core.config.dir.base,
    dbPath: '.',
  });
  areaDB = db.db('area');
  apDB = db.db('ap');
  cliDB = db.db('cli');

  areaPack.init(core, areaDB);
  apPack.init(core, areaDB, apDB);
  cliPack.init(core, areaDB, cliDB);

  return Promise.all([areaDB.loading, cliDB.loading, apDB.loading]);
};

export const queryAreaID = (aid) => areaDB.load(aid);
export const queryAPID = (apid) => apDB.load(apid);
export const queryClientID = (cid) => cliDB.load(cid);

export const ap = apPack;
export const area = areaPack;
export const cli = cliPack;
