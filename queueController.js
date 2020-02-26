const Joi = require("joi");
const  { errorHandler } = require('./helpers')
class QueueController {
  constructor() {
    this.tasksQueue = [];
  }

  //TODO: put this part to queue controller
  addToQueue(err, task) {
    if(err) errorHandler(err);
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

module.exports = new QueueController();
