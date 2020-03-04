const cote = require("cote");
const WorkerEventsController = require("./eventsController/workerEventsController");
const MasterEventsController = require("./eventsController/masterEventsController");
const { errorHandler, log } = require("./helpers");
const MasterBusinessLogic = require("./businessLogic/master");
const WorkerBusinessLogic = require("./businessLogic/worker");
const QueueController = require("./queueController");
const orchestratorResponder = new cote.Responder({
  name: "Orchestrator Responder"
});

const { FIRST_START_NODE_STATUS, UUID } = process.env;


class Worker {
  constructor({ UUID, BusinessLogic, EventsController }) {
    this.uuid = UUID;
    this.eventsController = new EventsController();
    this.businessLogic = new BusinessLogic();
    this._setMasterResponders();
  }

  _setMasterResponders() {
    const events = [
      {
        eventName: "task",
        callback: this.businessLogic.executeTask
      }
    ];

    events.forEach(({ eventName, callback }) => {
      this.eventsController.subscribeToEvent({ eventName, callback });
    });
  }
}

class Master  {
  constructor({ UUID, BusinessLogic, EventsController }) {
    this.uuid = UUID;
    this.eventsController = new EventsController();
    this.businessLogic = new BusinessLogic();
    this.queueController = new QueueController();
  }
}


const masterParams = {
  UUID,
  BusinessLogic: MasterBusinessLogic,
  EventsController: MasterEventsController
}
const workerParams = {
  UUID,
  BusinessLogic: WorkerBusinessLogic,
  EventsController: WorkerEventsController
}

let node =
  FIRST_START_NODE_STATUS == "master"
    ? new Master(masterParams)
    : new Worker(workerParams);

orchestratorResponder.on("nodeStatus", (req, responseCallback) => {
  try {
    errorHandler(err);

    node = req.value == "master" ? new Master(masterParams) : new Worker(workerParams);

    responseCallback({
      uuid: node.uuid
    });
  } catch (err) {
    responseCallback({
      error: `Error happen while trying to set node ${node.uuid} master role`
    });
  }
});

orchestratorResponder.on("status", (req, responseCallback) => {
  responseCallback({
    role: node instanceof Master ? "master" : "worker",
    uuid: node.uuid
  });
});
