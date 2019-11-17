/* IRONA Server is subject to the terms of the Mozilla Public License 2.0.
 * You can obtain a copy of MPL at LICENSE.md of repository root. */
// JSON management module

/* eslint-disable import/extensions */
import util from 'util';
import fs from 'fs';
import mkdir from './mkdir.js';

const readFile = util.promisify(fs.readFile);
const writeFile = util.promisify(fs.writeFile);

/**
 * Parse a json file.
 * @param {String} json JSON file path
 * @param {?Boolean} safeParse If true, an empty object will be returned when failed
 */
export const parse = (json, safeParse = false) => readFile(json)
  .then((raw) => JSON.parse(raw), (error) => {
    if (safeParse) {
      return {};
    }
    throw error;
  });

/**
 * Parse a json file. When failed to parse, an empty object will be returned.
 * @param {String} json JSON file path
 */
export const safeParse = (json) => parse(json, true);

/**
 * Saves javascript object to JSON file.
 * @param {*} fPath JSON file path
 * @param {*} obj Javascript Object
 */
export const save = (fPath, obj) => writeFile(
  fPath,
  JSON.stringify(obj),
).then(
  (_) => _,
  () => {
    mkdir(fPath).then(() => writeFile(
      fPath,
      JSON.stringify(obj),
    ));
  },
);

/**
 * Merges a javascript object to specified JSON file.
 * @param {*} path Base JSON file path
 * @param {*} obj Javascript Object
 * @param {?Boolean} safeMerge If true, parsing base JSON file will be done in safe mode.
 */
export const merge = (path, obj, safeMerge = false) => parse(path, safeMerge).then(
  (ext) => {
    // Merge
    const assign = (fresh) => (ext instanceof Array
      ? ext.concat(fresh)
      : Object.assign(ext, fresh));

    // Already file exists
    if (obj instanceof Promise) {
      return obj.then((res) => save(path, assign(res)));
    } return save(path, assign(obj));
  },
  () => {
    // File not exists, just save it
    if (obj instanceof Promise) return obj.then((res) => save(path, res));
    return save(path, obj);
  },
);

/**
 * Merges a javascript object to specified JSON file.
 * Parsing base JSON file will be done in safe mode.
 * @param {*} path Base JSON file path
 * @param {*} obj Javascript Object
 */
export const safeMerge = (path, obj) => {
  merge(path, obj, true);
};
