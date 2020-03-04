const Joi = require("joi");
const  { errorHandler, log } = require('./helpers')
class QueueController {
  constructor(dbClient) {
    this.tasksQueue = [];
    this.dbClient = dbClient;
    this.TASKS_PER_ONE_FETCH = 30;
    this.MINIMAL_TASKS_IN_QUEUE = his.TASKS_PER_ONE_FETCH * 0.3 / 100 //30%
  }

  addToQueue(task) {
    this._validateTaskSchema(task);
    this.tasksQueue.unshift(task);
    log('TASK WAS ADDED TO QUEUE')
  }

  async _fetchTasks() {
    try{
      const tasks = await this.dbClient.fetchTasks(this.TASKS_PER_ONE_FETCH);
      this.tasksQueue = [...this.tasksQueue, ...tasks];
    }catch(err) {
      console.log('ERROR FETCHING TASKS')
      errorHandler()
    }
  }

  async popFromQueue() {

    if(this.tasksQueue.length < this.MINIMAL_TASKS_IN_QUEUE ) {
      this._fetchTasks()
    }


    if (!this.tasksQueue.length) {
      log("ATTENTION: the queue is empty")
      await this._fetchTasks();
    }

    return this.tasksQueue.pop();
  }

  _validateTaskSchema(task) {
    // validate task schema with Joi libruary
  }
 
}

module.exports = QueueController();
