const Joi = require("joi");
const  { errorHandler, log } = require('./helpers')
class QueueController {
  constructor() {
    this.tasksQueue = [];
  }

  addToQueue(task) {
    this._validateTaskSchema(task);
    this.tasksQueue.unshift(task);
    log('TASK WAS ADDED TO QUEUE')
  }

  popFromQueue() {
    if (!this.tasksQueue.length) {
      log("ATTENTION: the queue is empty")
      return null;
    }
    return this.tasksQueue.pop();
  }

  _validateTaskSchema(task) {
    // validate task schema with Joi libruary
  }
 
}

module.exports = QueueController();
