const WebSocket = require('ws');
const {log} = require("./helpers");

class WebSocketClient {
  constructor() {
    this.ws = new WebSocket(process.env.WS_HOST);
    this.events = new Map();
    this.connectionIsOpen = false;
    this.ws.on('open', this._onConnectionOpen);
    this.ws.on('close', this._onConnectionClose);
    this.ws.on('error', this._onConnectionError);
    this.ws.on("message", msg => {
      const resp = JSON.parse(msg);
      const callback = this.events.get(resp.event);
      if (callback) {
        callback();
      }
    });
  }

  sendData = ({event, data}) => {
    if (this.connectionIsOpen === false) {
      log("SEND DATA: ws connection is not established or lost");
      return Promise.resolve(new Error("Fail to send data"));
    }
    const body = JSON.stringify({event, data});
    log("SEND DATA", body);
    this.ws.send(body);
    return Promise.resolve();
  };

  onEvent = (event, callback, repeatCondition) => {
    log("WS CONNECTION IS OPEN");
    const conditionalCallback = repeatCondition(callback);
    this.events.set(event, conditionalCallback);
  };

  _onConnectionOpen = () => {
    log("WS CONNECTION IS OPEN");
    this.connectionIsOpen = true;
  };

  _onConnectionClose = () => {
    log("WS CONNECTION IS CLOSED");
    this.connectionIsOpen = false;
  };

  _onConnectionError = (error) => {
    log(`WS CONNECTION IS FAILED DUE TO ${error}`);
    this.connectionIsOpen = false;
  }
}

module.exports = {WebSocketClient};