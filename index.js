const cote = require("cote");
const WorkerEventsController = require("./eventsController/workerEventsController");
const MasterEventsController = require("./eventsController/masterEventsController");
const { errorHandler } = require('./helpers')
const masterBusinessLogic = require("businessLogic/master");
const workerBusinessLogic = require("businessLogic/worker");
const QueueController = require('./queueController');
const orchestratorListener = new cote.Responder({ name: 'Orchestrator Listener' });

const { FIRST_START_NODE_STASTUS } = process.env

class Worker {
  constructor(orchestratorListener) {
    this.orchestratorListener = orchestratorListener;
    this.eventsController = new WorkerEventsController();
    this.businessLogic = workerBusinessLogic;
    this._setOrchestratorListeners();
    this._setMasterListeners();
  }

  _setOrchestratorListeners() {
    this.orchestratorListener.on('amIAlive', (err, responseCallback) => {
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
  constructor(orchestratorListener) {
    this.orchestratorListener = orchestratorListener;
    this.eventsController = new MasterEventsController();
    this.businessLogic = masterBusinessLogic;
    this.queueController = new QueueController()
    this._setOrchestratorListeners();
  }

  _setOrchestratorListeners() {
    this.orchestratorListener.on('task', this.queueController.addToQueue);
    this.orchestratorListener.on('amIAlive', (err, responseCallback) => {
      errorHandler(err);
      responseCallback('i am alive')
    })
  }
   
}

orchestratorListener.on("nodeStatus", (status, err) => {
  // node = status == "master" ? new Master() : 
  if(status == 'master') {
    node = new Master(orchestratorListener);
  }else {
    node = new Worker();
  }
});

let node = FIRST_START_NODE_STASTUS == 'master' ? new Master() : new Worker(); 
