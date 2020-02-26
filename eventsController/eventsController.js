const cote = require("cote");

class EventsController {
  constructor(name) {
    this.responder = new cote.Responder({ name: `${name} Responder` });
    this.requester = new cote.Requester({ name: `${name} Requester` });
  }

  sendEvent({ eventName, callback }) {
    //callback receive some result
    this.requester.send({ type: eventName }, response => {
      callback(response);
    });
  }

  subscribeToEvent({ eventName, callback }) {
    //callback returns some result
    this.responder.on(eventName, (req, response) => {
      response(callback);
    });
  }
}

module.exports = EventsController;
