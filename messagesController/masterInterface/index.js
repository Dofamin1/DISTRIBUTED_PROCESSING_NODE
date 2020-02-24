const cote = require("cote");

class MasterInterface {
  constructor() {
    this.client = new cote.Requester({ name: "Master Node" });
  }

  initMessageRequester({ eventName, callback }) {
    //callback receive some result
    client.send({ type: eventName }, response => {
      callback(response);
    });
  }
}

module.exports = MasterInterface;
