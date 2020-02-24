const Joi = require("joi");
class LocalState {
  constructor() {
    this.isMaster = false;
    this.tasksQueue = [];
  }

  setIsMasterSign(isMaster) {
    if (this.isMaster == true && isMaster == true) {
      throw new Error("This node is master already");
    }
    this.isMaster = isMaster;
  }

  //TODO: put this part to queue controller
  putToQueueBeginning(task) {
    this._validateTaskSchema(task);
    this.tasksQueue.unshift(task);
  }

  popFromQueue() {
    if (!this.tasksQueue.length) {
      console.log("the queue is empty");
      return null;
    }
    return this.tasksQueue.pop();
  }

  _validateTaskSchema(task) {
    // validate task schema with Joi libruary
  }
}

module.exports = new LocalState();
