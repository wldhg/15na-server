/* IRONA Server is subject to the terms of the Mozilla Public License 2.0.
 * You can obtain a copy of MPL at LICENSE.md of repository root. */

import tdb from 'trivialdb';

let db;
let areaDB;
let apDB;
let cliDB;

let rng;
let log;

export const load = (core) => {
  db = tdb.ns('db', { dbPath: core.config.dir.db });

  areaDB = db.db('area');
  apDB = db.db('ap');
  cliDB = db.db('cli');

  rng = (idb) => {
    let isProperRNFound = false;
    let randomNumber;
    while (!isProperRNFound) {
      randomNumber = core.util.random().toString(16);
      if (idb.get(randomNumber, null) === null) {
        isProperRNFound = true;
      }
    }
    return randomNumber;
  };
  log = core.log;

  return Promise.all(areaDB.loading, cliDB.loading, apDB.loading);
};

export const queryAreaID = (aid) => areaDB.load(aid);
export const queryAPID = (apid) => apDB.load(apid);
export const queryClientID = (cid) => cliDB.load(cid);

export const addArea = (name) => {
  if (areaDB.filter({ name }).length > 0) {
    log.error(`There's already an area named "${name}"!`);
  } else {
    const aid = rng(areaDB);
    areaDB.save(aid, {
      name, aid, ap: [], cli: [],
    });
    log.success(`New area named "${name}" created: ${aid}`);
  }
};
export const delArea = (aid) => {
  areaDB.load(aid).then((area) => {
    if (area.ap.length > 0) {
      log.error('Please delete all APs in this area before delete area.');
    } else if (area.cli.length > 0) {
      log.error('Please delete all clients in this area before delete area.');
    } else {
      areaDB.del({ aid });
      log.info('An area deleted.');
    }
  }).catch(() => {
    log.error(`There's no area with id "${aid}".`);
  });
};

export const addAP = (name, aid) => {
  areaDB.load(aid).then((area) => {
    if (apDB.filter({ name, aid }).length > 0) {
      log.error(`There's already an AP named "${name}" in "${area.name}" area!`);
    } else {
      const apid = rng(apDB);
      apDB.save(apid, { name, apid, aid });
      area.ap.push(apid);
      log.success(`New AP named "${name}" created: ${apid}`);
    }
  }).catch(() => {
    log.error(`There's no area with id "${aid}".`);
  });
};
export const delAP = (apid) => {
  apDB.load(apid).then((ap) => {
    const area = areaDB.get(ap.aid, null);
    if (area === null) {
      log.error('Failed to find area of AP.');
    } else {
      area.ap.splice(area.ap.indexOf(apid), 1);
      apDB.del({ apid });
      log.info('An AP deleted.');
    }
  }).catch(() => {
    log.error(`There's no AP with id "${apid}".`);
  });
};

export const addClient = (name, aids) => {
  const aidFinds = [];
  for (let i = 0; i < aids.length; i += 1) aidFinds.push(areaDB.load(aids[i]));

  Promise.all(aidFinds).then((areas) => {
    if (cliDB.filter({ name }).length > 0) {
      log.error(`There's already a client named "${name}"!`);
    } else {
      const cid = rng(cliDB);
      cliDB.save(cid, { name, cid, aids });
      for (let i = 0; i < areas.length; i += 1) areas[i].cli.push(cid);
      log.success(`New client named "${name}" created: ${cid}`);
    }
  }).catch(() => {
    log.error('Cannot find an area. Please check area name one more time.');
  });
};
export const delClient = (cid) => {
  cliDB.load(cid).then((cli) => {
    const aidFinds = [];
    for (let i = 0; i < cli.aids.length; i += 1) aidFinds.push(areaDB.load(cli.aids[i]));

    Promise.all(aidFinds).then((areas) => {
      for (let i = 0; i < areas.length; i += 1) {
        areas[i].cli.splice(areas[i].cli.indexOf(cid), 1);
        cliDB.del({ cid });
        log.info('An client deleted.');
      }
    }).catch(() => {
      log.error('Cannot find an area.');
    });
  }).catch(() => {
    log.error(`There's no client with id "${cid}".`);
  });
};
