/* IRONA Server is subject to the terms of the Mozilla Public License 2.0.
 * You can obtain a copy of MPL at LICENSE.md of repository root. */
// Iterating Promises

/**
 * Make a promise iteration.
 * @param {*} obj
 * @param {*} fn
 * @param {*} limit
 */
export default (obj, fn, limit) => new Promise(
  (resolve, reject) => { // eslint-disable-line consistent-return
    if (typeof fn('example', 'example') !== 'function') { return reject(new Error('Unsupported iteration function.')); }

    // NOTE Use "count" variable instead of Object.keys(result),
    //      for in case of many many iteration.
    let iterCount = 0;

    let resultCount = 0;

    const result = {};

    let objLength = 0;
    const checker = (item, callback, param1, param2) => {
      let value = item;

      let key;

      if (item instanceof Array) {
        [value, key] = [item];
      }

      if (typeof value !== 'undefined') {
        if (typeof key === 'undefined') result[resultCount] = value;
        else result[key] = value;
      }

      resultCount += 1;
      if (resultCount === objLength) resolve(result);
      else callback(param1, param2);
    };
    const run = (a = () => undefined, b = () => undefined) => {
      let time = typeof limit !== 'number' ? objLength : objLength - iterCount;
      if (time >= limit) {
        time = limit;
      }

      const checkerGate = (i) => {
        const gate = (_result) => {
          const checkResult = checker(
            _result,
            time === i + 1 && iterCount !== objLength ? run : () => { },
            a,
            b,
          );
          return checkResult;
        };
        return gate;
      };

      for (let i = 0; i < time; i += 1) {
        new Promise(fn(a(), b())).then(checkerGate(i));
      }
    };

    if (obj instanceof Array) {
      const { length } = obj;
      objLength = length;

      const a = () => {
        iterCount += 1;
        return obj[iterCount - 1];
      };

      run(a);
    } else if (typeof obj === 'object') {
      const keys = Object.keys(obj);
      objLength = keys.length;

      const b = () => keys[iterCount];
      const c = () => {
        iterCount += 1;
        return obj[keys[iterCount - 1]];
      };

      run(b, c);
    } else if (typeof obj === 'number') {
      objLength = obj;

      run(() => {
        iterCount += 1;
        return iterCount;
      });
    } else reject(new Error('Unsupported iteration item type.'));
  },
);
