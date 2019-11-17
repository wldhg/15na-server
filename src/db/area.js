/* IRONA Server is subject to the terms of the Mozilla Public License 2.0.
 * You can obtain a copy of MPL at LICENSE.md of repository root. */

let rng;
let log;
let areaDB;

export const init = (core, db) => {
  areaDB = db;
  log = core.log;
  rng = () => {
    let isProperRNFound = false;
    let randomNumber;
    while (!isProperRNFound) {
      randomNumber = core.util.random().toString(16);
      if (areaDB.get(randomNumber, null) === null) {
        isProperRNFound = true;
      }
    }
    return randomNumber;
  };
};

export const add = (name) => new Promise((resolve, reject) => {
  if (areaDB.filter({ name }).length > 0) {
    log.error(`There's already an area named "${name}"!`);
    reject();
  } else {
    const aid = rng();
    areaDB.save(aid, {
      name, aid, ap: [], cli: [],
    });
    log.okay(`New area named "${name}" created: ${aid}`);
    resolve();
  }
});

export const remove = (aid) => areaDB.load(aid).then((area) => {
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
