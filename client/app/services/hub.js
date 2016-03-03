import { EventEmitter } from 'events';
import { inherits } from 'util';

import socketIo from 'socket.io-client';
import log from 'loglevel';
import { v4 as uuid } from 'node-uuid';

/**
 * The Hub  is our interface between the websocket connection and the app.
 * - Can send commands over the websocket
 * - Receives backend events from the websocket
 *
 */
function Hub() {
  EventEmitter.call(this);

  const appConfig = __POINZ_CONFIG__; // this is set via webpack (see webpack.config.js and webpack.production.config.js)
  this.io = (appConfig.wsUrl) ? socketIo(appConfig.wsUrl) : socketIo();

  this.io.on('connect', () => log.info('socket to server connected'));
  this.io.on('disconnect', () => log.info('socket from server disconnected'));
  this.io.on('event', this.emit.bind(this, 'event')); // emit a event named "event"
}
inherits(Hub, EventEmitter);

/**
 * Sends a given command to the backend over the websocket connection
 * @param cmd
 */
Hub.prototype.sendCommand = function sendCommand(cmd) {
  cmd.id = uuid();
  this.io.emit('command', cmd);
};

const hubInstance = new Hub();

export default hubInstance;