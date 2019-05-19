#!/usr/bin/env node --experimental-modules
/* eslint-disable no-unused-vars */
import { init, log, e, pkg, arg } from './core/init'
import * as web from './web'
import * as csi from './csi'

init.then(() => {
  log.info(`${pkg.name} ${pkg.version} initialized.`)

  switch (arg.fn.keyword) {
    case 'aio':
      // Start websocket server with preparing CSI
      csi.prepareAll(log, e, arg)
      web.startServer(log, e, arg, pkg, csi)
      break
    case 'prep':
      csi.preparePrep(log, e, arg)
      web.startServer(log, e, arg, pkg, csi)
      break
    case 'pred':
      csi.preparePred(log, e, arg)
      break
  }
}).catch(e.parse(0x200, 'Unknown error occurred while executing some code segments.'))
