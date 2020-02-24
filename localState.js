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

  putToQueueBeginning(task) {
    this._validateTaskSchema(task);
    this.tasksQueue.unshift(task);
  }

  popFromQueue() {
    return this.tasksQueue.pop();
  }

  _validateTaskSchema(task) {
    //TODO: validate task schema with Joi libruary
  }
}

module.exports = new LocalState();
