const cote = require("cote");
const WorkerEventsController = require("./eventsController/workerEventsController");
const MasterEventsController = require("./eventsController/masterEventsController");
const { errorHandler } = require('./helpers')
const masterBusinessLogic = require("./businessLogic/master");
const workerBusinessLogic = require("./businessLogic/worker");
const QueueController = require('./queueController');
const orchestratorResponder = new cote.Responder({ name: 'Orchestrator Responder' });

const { FIRST_START_NODE_STASTUS } = process.env

class Worker {
  constructor() {
    this.eventsController = new WorkerEventsController();
    this.businessLogic = workerBusinessLogic;
    this._setMasterResponders();
  }

  _setMasterResponders() {
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
  constructor() {
    this.orchestratorSubscriber = new cote.Subscriber({ name: 'Master Orchestrantor Subscriber', subscribesTo: ['task'] });
    this.eventsController = new MasterEventsController();
    this.businessLogic = masterBusinessLogic;
    this.queueController = QueueController;
    this._setOrchestratorSubscribers();
  }

  _setOrchestratorSubscribers() {
    this.orchestratorSubscriber.on('task', this.queueController.addToQueue.bind(this.queueController));
  }

}

//TODO: this message should be recived by specified node, not  by all nodes
// orchestratorResponder.on("nodeStatus", (err, responseCallback) => {
//   errorHandler(err);
//   if(status == 'master') {
//     node = new Master(orchestratorResponder );
//   } else {
//     node = new Worker(orchestratorResponder);
//   }
// });

orchestratorResponder.on('amIAlive', (err, responseCallback) => {
  errorHandler(err);
  responseCallback('i am alive')
})

let node = FIRST_START_NODE_STASTUS == 'master' ? new Master(orchestratorResponder) : new Worker(orchestratorResponder); 
