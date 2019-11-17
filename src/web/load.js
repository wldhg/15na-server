/* IRONA Server is subject to the terms of the Mozilla Public License 2.0.
 * You can obtain a copy of MPL at LICENSE.md of repository root. */

import http from 'http';
import https from 'https';
import path from 'path';
import fs from 'fs';
import Koa from 'koa';
import SocketIO from 'socket.io';

/* eslint-disable import/extensions */
import * as rWebsocket from './websocket.js'; // Websocket
import * as rHTTP from './http.js'; // Koa Route

/* eslint-disable import/prefer-default-export */
export const load = async (core, csi, db) => {
  // Check whether if the port configuration is okay
  const port = Number(core.arg.port || 443);
  if (Number.isNaN(port) || port < 1 || port > 65535) {
    throw core.err.make(0x427, 'Port configuration is wrong');
  } else {
    // If web service uses 443 port, make 80 port to redirect to 443
    if (port === 443 && !core.arg.noRedirector) {
      const redirectApp = new Koa();
      redirectApp.use(async (ctx) => {
        ctx.status = 301;
        ctx.redirect(`https://${ctx.host}/`);
      });
      http.createServer(redirectApp.callback()).listen(80, () => {
        core.log.info('80 port will be redirected to 443 port automatically');
      });
    }

    // Attach Koa & socket.io
    const app = new Koa();
    const h2Server = https.createServer(core.arg.keyPath && core.arg.certPath ? {
      key: fs.readFileSync(path.resolve(process.cwd(), core.arg.keyPath)).toString(),
      cert: fs.readFileSync(path.resolve(process.cwd(), core.arg.certPath)).toString(),
    } : {}, app.callback());
    const io = new SocketIO(h2Server);

    // Prepare DB
    await db.load(core);

    // Make routers
    rWebsocket.route(core, io, csi, db);
    rHTTP.route(core, app);

    // Listen from port (default: 443)
    h2Server.listen(port);
    core.log.info('Now started web io.');
  }
};
