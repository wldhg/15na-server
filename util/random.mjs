// Widh Jio
// Generates cryptographically-safe random number
// Base by https://stackoverflow.com/a/33627342/9471289

import crypto from 'crypto'

export default (min, max) => {
  var d = max - min

  if (min <= max && d <= 281474976710655 && max <= Number.MAX_SAFE_INTEGER) {
    var maxBytes = 6
    var maxDec = 281474976710656

    var randBytes = parseInt(
      crypto.randomBytes(maxBytes).toString('hex'),
      16
    )
    var result = Math.floor((randBytes / maxDec) * (d + 1) + min)

    if (result > max) result = max

    return result
  } else return false
}
