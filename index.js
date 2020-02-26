const cote = require("cote");
const WorkerEventsController = require("./eventsController/workerEventsController");
const MasterEventsController = require("./eventsController/masterEventsController");
const { errorHandler } = require('./helpers')
const masterBusinessLogic = require("./businessLogic/master");
const workerBusinessLogic = require("./businessLogic/worker");
const QueueController = require('./queueController');
const orchestratorResponder = new cote.Responder({ name: 'Orchestrator Responder' });
const orchestratorSubscriber = new cote.Subscriber({ name: 'Orchestrantor Subscriber', subscribesTo: ['task'] })

const { FIRST_START_NODE_STASTUS } = process.env

class Worker {
  constructor(orchestratorResponder, ) {
    this.orchestratorResponder = orchestratorResponder;
    this.eventsController = new WorkerEventsController();
    this.businessLogic = workerBusinessLogic;
    this._setOrchestratorResponders();
    this._setMasterListeners();
  }

  _setOrchestratorResponders() {
    this.orchestratorResponder.on('amIAlive', (err, responseCallback) => {
      errorHandler(err);
      responseCallback('i am alive')
    })
  } 
  _setMasterListeners() {
    const events = [{
      eventName: 'task',
      callback: this.businessLogic.executeTask
    }]

    events.forEach(({ eventName, callback }) => {
      this.eventsController.subscribeToEvent({ eventName, callback });
    })
  }
}

class Master {
  constructor(orchestratorResponder, orchestratorSubscriber) {
    this.orchestratorResponder = orchestratorResponder;
    this.orchestratorSubscriber = orchestratorSubscriber;
    this.eventsController = new MasterEventsController();
    this.businessLogic = masterBusinessLogic;
    this.queueController = QueueController;
    this._setOrchestratorResponders();
    this._setOrchestratorSubscribers();
  }

  _setOrchestratorResponders() {
    this.orchestratorResponder.on('amIAlive', (err, responseCallback) => {
      errorHandler(err);
      responseCallback('i am alive')
    })
  }

  _setOrchestratorSubscribers() {
    this.orchestratorSubscriber.on('task', this.queueController.addToQueue);
  }

}

orchestratorSubscriber.on("nodeStatus", (err, status) => {
  errorHandler(err);
  if(status == 'master') {
    node = new Master(orchestratorResponder, orchestratorSubscriber );
  }else {
    node = new Worker(orchestratorResponder);
  }
});

let node = FIRST_START_NODE_STASTUS == 'master' ? new Master(orchestratorResponder, orchestratorSubscriber) : new Worker(orchestratorResponder); 
