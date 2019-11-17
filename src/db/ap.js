/* IRONA Server is subject to the terms of the Mozilla Public License 2.0.
 * You can obtain a copy of MPL at LICENSE.md of repository root. */

let rng;
let log;
let apDB;
let areaDB;

export const init = (core, oArea, oAP) => {
  areaDB = oArea;
  apDB = oAP;
  log = core.log;
  rng = () => {
    let isProperRNFound = false;
    let randomNumber;
    while (!isProperRNFound) {
      randomNumber = core.util.random().toString(16);
      if (apDB.get(randomNumber, null) === null) {
        isProperRNFound = true;
      }
    }
    return randomNumber;
  };
};

export const add = (name, aid) => areaDB.load(aid).then((area) => {
  if (apDB.filter({ name, aid }).length > 0) {
    log.error(`There's already an AP named "${name}" in "${area.name}" area!`);
  } else {
    const apid = rng();
    apDB.save(apid, { name, apid, aid });
    area.ap.push(apid);
    areaDB.save(aid, area);
    log.okay(`New AP named "${name}" created: ${apid}`);
  }
}).catch(() => {
  log.error(`There's no area with id "${aid}".`);
});

export const remove = (apid) => apDB.load(apid).then((ap) => {
  const area = areaDB.get(ap.aid, null);
  if (area === null) {
    log.error('Failed to find area of AP.');
  } else {
    area.ap.splice(area.ap.indexOf(apid), 1);
    areaDB.save(ap.aid, area);
    apDB.del({ apid });
    log.info('An AP deleted.');
  }
}).catch(() => {
  log.error(`There's no AP with id "${apid}".`);
});
