#!/usr/bin/env -S node --experimental-modules
/* eslint-disable no-unused-vars */
import { init, log, e, pkg, arg } from './core/init'
import * as web from './web'

init.then(() => {
  log.info(`${pkg.name} ${pkg.version} initialized.`)

  switch (arg.fn.keyword) {
    case 'run':
      // Start websocket server
      web.startServer(log, e, arg, pkg)
      // Set when of exit
      process.on('exit', web.stopServer)
  }
}).catch(e.parse(0x200, 'Unknown error occurred while executing some code segments.'))
