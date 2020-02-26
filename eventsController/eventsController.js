const cote = require("cote");

class EventsController {
  constructor(name) {
    this.responder = new cote.Responder({ name: `${name} Responder` });
    this.requester = new cote.Requester({ name: `${name} Requester` });
  }

  sendEvent({ type, value }, callback) {
    this.requester.send({ type, value }, response => {
      callback(response);
    });
  }

  subscribeToEvent({ eventName, callback }) {
    //callback returns some result
    this.responder.on(eventName, (req, sendResponse) => {
      sendResponse(null, callback(req.value));
    });
  }
}

module.exports = EventsController;
