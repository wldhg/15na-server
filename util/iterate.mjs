// Widh Jio
// Iterating Promises

export default (obj, fn, limit) => {
  return new Promise((resolve, reject) => {
    if (typeof fn('example', 'example') !== 'function') { return reject(new Error('Unsupported iteration function.')) }

    // NOTE Use "count" variable instead of Object.keys(result),
    //      for in case of many many iteration.
    let iterCount = 0

    let resultCount = 0

    let result = {}

    let length = 0
    let checker = (item, callback, param1, param2) => {
      let value = item

      let key

      if (item instanceof Array) {
        value = item[1]
        key = item[0]
      }

      if (typeof value !== 'undefined') {
        if (typeof key === 'undefined') result[resultCount] = value
        else result[key] = value
      }

      if (++resultCount === length) resolve(result)
      else callback(param1, param2)
    }
    let run = (a = () => undefined, b = () => undefined) => {
      let time =
        typeof limit !== 'number'
          ? length
          : length - iterCount >= limit
            ? limit
            : length - iterCount

      for (let i = 0; i < time; i++) {
        new Promise(fn(a(), b())).then(result =>
          checker(
            result,
            time === i + 1 && iterCount !== length ? run : () => { },
            a,
            b
          )
        )
      }
    }

    if (obj instanceof Array) {
      length = obj.length

      var a = () => obj[iterCount++]

      run(a)
    } else if (typeof obj === 'object') {
      let keys = Object.keys(obj)
      length = keys.length

      var b = () => keys[iterCount]
      var c = () => obj[keys[iterCount++]]

      run(b, c)
    } else if (typeof obj === 'number') {
      length = obj

      run(() => iterCount++)
    } else return reject(new Error('Unsupported iteration item type.'))
  })
}
