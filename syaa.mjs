#!/usr/bin/env -S node --experimental-modules
/* eslint-disable no-unused-vars */
import { init, log, e, pkg, arg } from './core/init'
import ws from './ws'

init.then(() => {
  log.info(`${pkg.name} ${pkg.version} initialized.`)

  switch (arg.fn.keyword) {
    case 'run':
      // Start websocket server
      ws.startServer(log, e, arg, pkg)
      // Set when of exit
      process.on('exit', ws.disconnectAll)
  }
}).catch(e.parse(0x200, 'Unknown error occurred while executing some code segments.'))
