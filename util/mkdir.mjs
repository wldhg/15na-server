// Widh Jio
// Do mkdir recursively

import path from 'path'
import fs from 'fs'

export default joinedDirPath => {
  var dirPath = joinedDirPath.split(path.sep)
  if (joinedDirPath[0] === path.sep) dirPath = dirPath.slice(1)
  var lastPath = path.parse(joinedDirPath).root
  if (joinedDirPath[0] !== path.sep) lastPath = '.'

  return new Promise(async (resolve, reject) => {
    while (dirPath.length > 0) {
      try {
        lastPath = path.normalize(
          `${lastPath}${path.sep}${dirPath.splice(0, 1)}`
        )

        await fs.mkdirSync(lastPath)
      } catch (e) {
        if (e.code === 'EACCESS' || e.code === 'ENOENT') reject(e)
        else continue
      }
    }

    resolve(lastPath)
  })
}
