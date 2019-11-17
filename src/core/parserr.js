/* IRONA Server is subject to the terms of the Mozilla Public License 2.0.
 * You can obtain a copy of MPL at LICENSE.md of repository root. */
// Error capturing module

let log;
let exit;

/**
 * Set logger used in parserr.
 * @param {Log} logger Logger instance of {@link logger.js}.
 */
export const setLogger = (logger) => {
  log = logger;
};

/**
 * Set exit manager used in parserr.
 * @param {Object} exitmgr Exit manager of {@link exitmgr.js}.
 */
export const setExitManager = (exitmgr) => {
  exit = exitmgr;
};

/**
 * Create an error.
 * @param {?String} message
 * @param {*} additionals
 */
export const make = (message, additionals) => {
  const error = new Error(message);
  error.more = additionals;
  error.name = '_parserr';
  return error;
};

/**
 * Parse an error.
 * @param {String} description Expected cause of the error.
 * @param {?Number} exitCode If want exit, enter an integer rather than zero.
 */
export const parse = (description, exitCode = 0) => {
  const procError = (e) => {
    log.error(description);

    if (!e) {
      log.warn('Content of the error is empty.');
    } else if ((e.message || e.msg) && e.name === '_parserr') {
      log.debug(`${e.message || e.msg}`);

      if (e.stack) {
        log.debug(
          e.stack
            .toString()
            .substring(e.stack.toString().indexOf('\n')),
          'stack',
        );
      }

      if (e.more instanceof Object) {
        const keys = Object.keys(e.more);
        for (let i = 0; i < keys.length; i += 1) {
          log.debug(e.more[keys[i]], keys[i]);
        }
      } else if (e.more) {
        log.debug(e.more, 'more');
      }
    } else if (typeof e.stack !== 'undefined') {
      log.debug(e.stack.toString());
    } else {
      log.debug(e);
    }

    let returnPromise;
    if (typeof exitCode === 'number') returnPromise = exit.code(exitCode);

    return returnPromise || Promise.reject(e);
  };
  return procError;
};
