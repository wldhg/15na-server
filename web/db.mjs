// Widh Jio

import tdb from 'trivialdb'
import * as cs from '../core/const'

const tns = tdb.ns('db', { dbPath: cs.DATA_DIR })
const connDB = tns.db('connections')

export const getRoomID = () => {
  connDB.save({
    name: 'haihai',
    body: 'title'
  }).then(id => {
    console.debug(id)
  })
}
