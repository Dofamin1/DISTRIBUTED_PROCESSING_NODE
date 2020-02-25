const localState = require("./localState");
const MessagesController = require("./messagesController");
const WorkerEventsController = require("./eventsController/workerEventsController");
const MasterEventsController = require("./eventsController/masterEventsController");
const { saveTaskResult } = require("businessLogic/master");
const { executeTask } = require("businessLogic/worker");

// const masterNodeEvents = [
//   {
//     eventName: "task",
//     callback: saveTaskResult
//   }
// ];
// // const commonEventsT = [
// //   {
// //     eventName: "nodeRole"
// //     //   callback: setIsMasterSign
// //   }
// // ];

// const workerNodeEvents = [
//   {
//     eventName: "task",
//     callback: executeTask
//   }
// ];

// class Node {
//   constructor() {
//     this.isMaster = false;
//     this.localState = localState;
//     this.messagesController = new MessagesController();
//   }

//   setIsMasterSign(isMaster) {
//     if (this.isMaster == true && isMaster == true) {
//       throw new Error("This node is master already");
//     }
//     this.isMaster = isMaster;
//     this._initMessageController();
//   }

//   _initMessageController() {
//     if (this.isMaster) {
//       this.messagesController.setInterface({
//         EventsInterface: MasterEventsController,
//         eventsToSubscribe: []
//       });
//     } else {
//       this.messagesController.setInterface({
//         EventsInterface: WorkerEventsController,
//         eventsToSubscribe: workerNodeEvents
//       });
//     }
//   }
// }

class Worker {}
class Master {}

// node is instance of cote.responder
let node;
orchestratorListener.on("nodeStatus", (status, err) => {
  node = status == "master" ? new Master() : new Worker();
});
