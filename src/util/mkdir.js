/* IRONA Server is subject to the terms of the Mozilla Public License 2.0.
 * You can obtain a copy of MPL at LICENSE.md of repository root. */
// Do mkdir of specified path

import path from 'path';
import fs from 'fs';

const isCharSep = (char) => char === '/' || char === '\\';

/**
 * Creates directories upon {basePath}.
 * If {newDirPath} is empty, just create {baseDirPath}.
 * @param {String} basePath
 * @param {?String} newPath
 */
export default (basePath, newPath = '') => {
  /* Regulate Variables */
  let baseDir = `${basePath}`;
  let newDir = `${newPath}`;
  // {baseDirPath} must have separators on its end
  if (!isCharSep(baseDir[baseDir.length - 1])) {
    baseDir += path.sep;
  }
  // {newDirPath} should not have separators on its start and end
  if (isCharSep(newDir)) {
    newDir = newDir.substring(1);
  }
  if (isCharSep(newDir[newDir.length - 1])) {
    newDir = newDir.substring(0, newDir.length - 1);
  }
  // Unify separators
  if (path.sep === '/') {
    baseDir = baseDir.replace(/\\/g, '/');
    newDir = newDir.replace(/\\/g, '/');
  } else {
    baseDir = baseDir.replace(/\//g, '\\');
    newDir = newDir.replace(/\//g, '\\');
  }

  /* Make Directories */
  const targets = newDir.split(path.sep);
  let base = `${baseDir}`;
  return new Promise((resolve, reject) => {
    while (targets.length > 0) {
      try {
        base = path.normalize(`${base}${targets.splice(0, 1)}${path.sep}`);
        fs.mkdirSync(base);
      } catch (e) {
        if (e.code === 'EACCESS' || e.code === 'ENOENT') reject(e);
      }
    }
    resolve(base);
  });
};
