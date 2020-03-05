const cote = require("cote");
const WorkerEventsController = require("./eventsController/workerEventsController");
const MasterEventsController = require("./eventsController/masterEventsController");
const { errorHandler, log } = require("./helpers");
const MasterBusinessLogic = require("./businessLogic/master");
const WorkerBusinessLogic = require("./businessLogic/worker");
const QueueController = require("./queueController");
const Redis = require('ioredis');
const RedisDbClient = require('db/redisDbClient');
const orchestratorResponder = new cote.Responder({
  name: "Orchestrator Responder"
});

const { FIRST_START_NODE_STATUS, UUID } = process.env;


class Worker {
  constructor({ UUID, BusinessLogic, EventsController }) {
    this.uuid = UUID;
    this.eventsController = new EventsController('Worker');
    this.businessLogic = new BusinessLogic();
    this._setMasterResponders();
  }

  _setMasterResponders() {
    const events = [
      {
        eventName: `${this.uuid}_task`,
        callback: this.businessLogic.executeTask
      }
    ];

    events.forEach(({ eventName, callback }) => {
      this.eventsController.subscribeToEvent({ eventName, callback });
    });
  }
}

class Master  {
  constructor({ UUID, BusinessLogic, EventsController, dbClient }) {
    this.uuid = UUID;
    
    this.freeWorkersUUIDs = []; 
    this.allWorkersUUIDs = []; 

    this.dbClient = dbClient;
    this.eventsController = new EventsController("Master");
    this.businessLogic = new BusinessLogic();
    this.queueController = new QueueController(this.dbClient);

    //TODO: save workers uuid to this.allWorkersUUIDs
    this._sendTasks()
  }

  async _sendTasks () {

    while(this.freeWorkers.length) {
      const workerUUID = this.freeWorkersUUIDs.pop();
      const task = await this.queueController.popFromQueue();

      this.eventsController.sendTask({ type: `${workerUUID}_task`, value: task }, (result) => {
        this.freeWorkersUUIDs.push(workerUUID);

        this.businessLogic.saveTaskResult(result);

        if(!this.freeWorkers.length) {
          this._sendTasks();
        }
      })
        
    }
  }



}


const masterParams = {
  UUID,
  BusinessLogic: MasterBusinessLogic,
  EventsController: MasterEventsController,
  dbClient: new RedisDbClient(new Redis())
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
