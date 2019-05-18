#!/usr/bin/env -S node --experimental-modules
/* eslint-disable no-unused-vars */
import { init, log, e, pkg, arg } from './core/init'
import * as web from './web'
import * as csi from './csi'

init.then(() => {
  log.info(`${pkg.name} ${pkg.version} initialized.`)

  switch (arg.fn.keyword) {
    case 'run':
      // Start websocket server with preparing CSI
      csi.prepare(log, e, arg)
      web.startServer(log, e, arg, pkg, csi)
  }
}).catch(e.parse(0x200, 'Unknown error occurred while executing some code segments.'))
