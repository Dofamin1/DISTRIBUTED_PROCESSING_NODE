const cote = require("cote");

class WorkerInterface {
  constructor() {
    this.client = new cote.Responder({ name: "Worker Node" });
  }

  initMessageResponder({ eventName, callback }) {
    //callback returns some result
    client.on(eventName, (req, response) => {
      response(callback);
    });
  }
}

module.exports = WorkerInterface;
