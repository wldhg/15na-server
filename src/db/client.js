/* IRONA Server is subject to the terms of the Mozilla Public License 2.0.
 * You can obtain a copy of MPL at LICENSE.md of repository root. */

let rng;
let log;
let areaDB;
let cliDB;

export const init = (core, oArea, oCli) => {
  areaDB = oArea;
  cliDB = oCli;
  log = core.log;
  rng = () => {
    let isProperRNFound = false;
    let randomNumber;
    while (!isProperRNFound) {
      randomNumber = core.util.random().toString(16);
      if (cliDB.get(randomNumber, null) === null) {
        isProperRNFound = true;
      }
    }
    return randomNumber;
  };
};

export const add = (name, aids) => {
  const aidFinds = [];
  for (let i = 0; i < aids.length; i += 1) aidFinds.push(areaDB.load(aids[i]));

  return Promise.all(aidFinds).then((areas) => {
    if (cliDB.filter({ name }).length > 0) {
      log.error(`There's already a client named "${name}"!`);
    } else {
      const cid = rng();
      cliDB.save(cid, { name, cid, aids });
      for (let i = 0; i < areas.length; i += 1) areas[i].cli.push(cid);
      log.okay(`New client named "${name}" created: ${cid}`);
    }
  }).catch(() => {
    log.error('Cannot find an area. Please check area name one more time.');
  });
};

export const remove = (cid) => cliDB.load(cid).then((cli) => {
  const aidFinds = [];
  for (let i = 0; i < cli.aids.length; i += 1) aidFinds.push(areaDB.load(cli.aids[i]));

  return Promise.all(aidFinds).then((areas) => {
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
