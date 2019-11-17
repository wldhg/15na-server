/* IRONA Server is subject to the terms of the Mozilla Public License 2.0.
 * You can obtain a copy of MPL at LICENSE.md of repository root. */
// Generates cryptographically-safe random number
// Algorithm & base code by https://stackoverflow.com/a/33627342/9471289

import crypto from 'crypto';

/**
 * Creates a random number.
 * @param {Number} max Must be lower than 28147497610656.
 * @param {Number} min
 */
export default (max = 281474976710655, min = 0) => {
  const d = max - min;

  if (min <= max && d <= 281474976710655 && max <= Number.MAX_SAFE_INTEGER) {
    const maxBytes = 6;
    const maxDec = 281474976710656;

    const randBytes = parseInt(
      crypto.randomBytes(maxBytes).toString('hex'),
      16,
    );
    let result = Math.floor((randBytes / maxDec) * (d + 1) + min);

    if (result > max) result = max;

    return result;
  }

  return false;
};
