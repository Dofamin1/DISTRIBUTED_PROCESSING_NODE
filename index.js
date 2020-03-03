const uuid = require("uuid");
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

const { FIRST_START_NODE_STATUS } = process.env;

class BaseNode {
  constructor() {
    this.uuid;
    this._generateUuid();
  }

  _generateUuid() {
    if (!this.uuid) {
      this.uuid = uuid.v4();
    }
  }
}

class Worker extends BaseNode {
  constructor() {
    super();
    this.eventsController = new WorkerEventsController();
    this.businessLogic = WorkerBusinessLogic;
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

class Master extends BaseNode {
  constructor() {
    super();
    this.orchestratorSubscriber = new cote.Subscriber({
      name: "Master Orchestrantor Subscriber",
      subscribesTo: ["task"]
    });
    this.eventsController = new MasterEventsController();
    this.businessLogic = MasterBusinessLogic;
    this.queueController = QueueController;
    this._setOrchestratorSubscribers();
  }

  _setOrchestratorSubscribers() {
    this.orchestratorSubscriber.on(
      "task",
      this.queueController.addToQueue.bind(this.queueController)
    );
  }
}

let node =
  FIRST_START_NODE_STATUS == "master"
    ? new Master(orchestratorResponder)
    : new Worker(orchestratorResponder);

orchestratorResponder.on("nodeStatus", (req, responseCallback) => {
  try {
    errorHandler(err);

    if (req.value == "master") {
      node = new Master(orchestratorResponder);
    } else {
      node = new Worker(orchestratorResponder);
    }

    responseCallback({
      uuid: node.uuid
    });
  } catch (err) {
    responseCallback({
      error: `Error happen while trying to set node ${node.uuid} master role`
    });
  }
});

orchestratorResponder.on("checkIfAlive", (req, responseCallback) => {
  responseCallback({
    role: node instanceof Master ? "master" : "worker",
    uuid: node.uuid
  });
});
