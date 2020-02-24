const WorkerInterface = require("workerInterface");
const MasterInterface = require("workerInterface");
const { saveTaskResult } = require("businessLogic/master");
const { executeTask } = require("businessLogic/worker");

const masterNodeEvents = [
  {
    eventName: "task",
    callback: saveTaskResult
  }
];

const workerNodeEvents = [
  {
    eventName: "task",
    callback: executeTask
  }
];

class MessagesController {
  constructor(isMaster) {
    this.isMaster = isMaster;
    this.interface;
  }

  setInterface() {
    if (this.isMaster == true) {
      this.interface = new MasterInterface();

      this._configureEventsInterface(
        masterNodeEvents,
        this.interface.initMessageRequester
      );
    } else if (this.isMaster == false) {
      this.interface = new WorkerInterface();

      this._configureEventsInterface(
        workerNodeEvents,
        this.interface.initMessageResponder
      );
    }
  }

  _configureEventsInterface(events, configurationCallback) {
    events.forEach(({ eventName, callback }) => {
      configurationCallback({ eventName, callback });
    });
  }
}
