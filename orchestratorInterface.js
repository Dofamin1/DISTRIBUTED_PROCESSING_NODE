const WebSocket = require('ws');
const {log} = require("./helpers");

class OrchestratorInterface {
    constructor(Interface, notifyInterval) {
        this.interface = new Interface();
        this.notifyInterval = notifyInterval;
        this.interface.sendDataConstantly({ event: "status", data: {status: "ok"}}, this.notifyInterval)
    }
}

class WsIntarface {
    constructor() {
        this.ws = new WebSocket(process.env.WS_HOST);
        this.connectionIsOpen = false;
        this.waitForConnectionTime = 200; //ms
        this.ws.on('open', this._onConnectionOpen);
        this.ws.on('close', this._onConnectionClose);
    }

    sendData(event, data) {
        if(this.connectionIsOpen == false) {
            log("SEND DATA: ws connection is not esatblished or lost")
            setTimeout(() => this.sendData(event, data), this.waitForConnectionTime);
            return
        }
        const body = JSON.stringify({event, data});
        log("SEND DATA", body)
        this.ws.send(body)
    }

    sendDataConstantly({ event, data }, interval) {
        setInterval(() => this.sendData({ event, data }), interval )
    }

    onEvent(event, callback) {
        this.ws.on(event, callback)
    }

    _onConnectionOpen() {
        log("WS CONNECTION IS OPEN");
        this.connectionIsOpen = true
    }

    _onConnectionClose() {
        log("WS CONNECTION IS CLOSED");
        this.connectionIsOpen = false
    }
}



module.exports = { OrchestratorInterface, WsIntarface };