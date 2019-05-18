// Widh Jio
// JSON management module

import util from 'util'
import path from 'path'
import fs from 'fs'
import mkdir from './mkdir'

export const parse = function (json) {
  return util
    .promisify(fs.readFile)(json)
    .then(raw => {
      return JSON.parse(raw)
    })
}

export const safeParse = function (json) {
  return util
    .promisify(fs.readFile)(json)
    .then(raw => {
      return JSON.parse(raw)
    }, () => {
      return {}
    })
}

export const save = function (fPath, obj) {
  return util.promisify(fs.writeFile)(
    fPath,
    JSON.stringify(obj)
  ).then(
    _ => _,
    (error) => {
      if (fPath.indexOf(path.sep) === -1) {
        throw error
      } else {
        mkdir(fPath.substring(0, fPath.lastIndexOf(path.sep))).then(() => util.promisify(fs.writeFile)(
          fPath,
          JSON.stringify(obj)
        ))
      }
    }
  )
}

export const merge = (path, obj, safeMerge = false) => {
  return (safeMerge ? safeParse : parse)(path).then(
    ext => {
      // Merge
      const merge = obj =>
        ext instanceof Array
          ? ext.concat(obj)
          : Object.assign(ext, obj)

      // Already file exists
      if (obj instanceof Promise) { return obj.then(res => save(path, merge(res))) } else return save(path, merge(obj))
    },
    () => {
      // File not exists, just save it
      if (obj instanceof Promise) return obj.then(res => save(path, res))
      else return save(path, obj)
    }
  )
}
export const safeMerge = (path, obj) => {
  merge(path, obj, true)
}
