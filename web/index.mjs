// Widh Jio

import http from 'http'
import https from 'https'
import path from 'path'
import fs from 'fs'
import Koa from 'koa'
import SocketIO from 'socket.io'

import * as ws from './routeWss' // Websocket
import * as kr from './routeHttps' // Koa Route
import * as db from './db' // Trivial DB

export const startRedirectHTTPServer = (log) => {
  const redirectApp = new Koa()
  redirectApp.use(async ctx => {
    ctx.status = 301
    ctx.redirect(`https://${ctx.host}/`)
  })
  http.createServer(redirectApp.callback()).listen(80, () => {
    log.info('80 port will be redirected to 443 port automatically')
  })
}

export const startServer = (log, e, arg, pkg, csi) => {
  // Check whether if the port configuration is okay
  const port = Number(arg.port || 443)
  if (isNaN(port) || port < 1 || port > 65535) {
    throw e.make(0x427, 'Port configuration is wrong')
  } else {
    // If web service uses 443 port, make 80 port to redirect to 443
    if (port === 443 && !arg.noRedirector) {
      startRedirectHTTPServer(log)
    }
    // Attach Koa & socket.io
    const app = new Koa()
    const h2Server = https.createServer(arg.keyPath && arg.certPath ? {
      key: fs.readFileSync(path.resolve(process.cwd(), arg.keyPath)).toString(),
      cert: fs.readFileSync(path.resolve(process.cwd(), arg.certPath)).toString()
    } : {}, app.callback())
    const io = new SocketIO(h2Server)
    // Make routers
    ws.route(io, csi)
    kr.route(app)
    // Listen from port (default: 443)
    h2Server.listen(port)
    log.info("Now started web io.")
    // NOTE: For future encryption feature
    db.getRoomID()
  }
}
