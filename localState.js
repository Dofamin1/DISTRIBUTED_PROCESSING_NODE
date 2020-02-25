const Joi = require("joi");
class LocalState {
  constructor() {
    this.tasksQueue = [];
  }

  //TODO: put this part to queue controller
  addToQueue(task) {
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
