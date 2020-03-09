const cote = require("cote");
const WorkerEventsController = require("./eventsController/workerEventsController");
const MasterEventsController = require("./eventsController/masterEventsController");
const {errorHandler, log} = require("./helpers");
const MasterBusinessLogic = require("./businessLogic/master");
const WorkerBusinessLogic = require("./businessLogic/worker");
const QueueController = require("./queueController");
const Redis = require('ioredis');
const RedisDbClient = require('./db/redisDbClient');
const {FIRST_START_NODE_STATUS, UUID} = process.env;
log(`Params: ${process.env}`);

class Worker {
    constructor({UUID, BusinessLogic, EventsController}) {
        this.uuid = UUID;
        this.eventsController = new EventsController();
        this.businessLogic = new BusinessLogic();
        this._initEvents();
    }

    _initEvents() {
        const WORKER_EVENTS = [
            {
                eventName: `${this.uuid}_task`,
                callback: this.businessLogic.executeTask
            }
        ];
        WORKER_EVENTS.forEach(({eventName, callback}) => {
            this.eventsController.subscribeToEvent({eventName, callback});
        });
    }
}

class Master {
    constructor({UUID, BusinessLogic, EventsController, dbClient}) {
        this.uuid = UUID;

        this.freeWorkersUUIDs = [];
        this.allWorkersUUIDs = [];

    this.dbClient = dbClient;
    this.eventsController = new EventsController();
    this.businessLogic = new BusinessLogic();
    this.queueController = new QueueController(this.dbClient);

    _initEvents() {
        const MASTER_EVENTS = [
            {
                eventName: `nodes_list`,
                callback: list => {
                    this.freeWorkersUUIDs = this.freeWorkersUUIDs
                        .filter(uuid => list.includes(uuid));
                }
            }
        ];
        MASTER_EVENTS.forEach(({eventName, callback}) => {
            this.eventsController.subscribeToEvent({eventName, callback});
        });
    }

    async _sendTasks() {
        while (this.freeWorkersUUIDs.length) {
            const workerUUID = this.freeWorkersUUIDs.pop();
            const task = await this.queueController.popFromQueue();

            log(`Send task to the ${workerUUID}`);
            this.eventsController.sendTask({type: `${workerUUID}_task`, value: task}, result => {
                this.freeWorkersUUIDs.push(workerUUID);
                this.businessLogic.saveTaskResult(result);
                if (!this.freeWorkersUUIDs.length) {
                    this._sendTasks();
                }
            });
        }
    }

    withPostInit() {
        this._sendTasks();
        return this;
    }
}

const MASTER_PARAMS = {
    UUID,
    BusinessLogic: MasterBusinessLogic,
    EventsController: MasterEventsController,
    dbClient: new RedisDbClient(new Redis())
};

const WORKER_PARAMS = {
    UUID,
    BusinessLogic: WorkerBusinessLogic,
    EventsController: WorkerEventsController
};

let node = FIRST_START_NODE_STATUS === "master" ?
    new Master(MASTER_PARAMS).withPostInit() :
    new Worker(WORKER_PARAMS);

const orchestratorResponder = new cote.Responder({
    name: "Orchestrator Responder"
});
orchestratorResponder.on(`status_${UUID}`, (req, responseCallback) => {
    log(`Send status`);
    responseCallback({
        role: node instanceof Master ? "master" : "worker",
        uuid: node.uuid
    });
});


// TODO
// orchestratorResponder.on("nodeStatus", (req, responseCallback) => {
//   try {
//     errorHandler(err);
//
//     node = req.value === "master" ? new Master(masterParams) : new Worker(workerParams);
//
//     responseCallback({
//       uuid: node.uuid
//     });
//   } catch (err) {
//     responseCallback({
//       error: `Error happen while trying to set node ${node.uuid} master role`
//     });
//   }
// });
