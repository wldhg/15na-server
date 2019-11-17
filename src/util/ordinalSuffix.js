/* IRONA Server is subject to the terms of the Mozilla Public License 2.0.
 * You can obtain a copy of MPL at LICENSE.md of repository root. */
// Put ordinal suffix and return it as string

/**
 * Concat ordinal suffix.
 * @param {Number} num
 */
export default (num) => {
  let str;

  if (num % 10 === 1) str = `${num}st`;
  else if (num % 10 === 2) str = `${num}nd`;
  else if (num % 10 === 3) str = `${num}rd`;
  else str = `${num}th`;

  return str;
};
