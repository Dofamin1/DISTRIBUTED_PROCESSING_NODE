const Joi = require("joi");
const {errorHandler, log} = require('./helpers');

const TASKS_PER_ONE_FETCH = 30;
class QueueController {
    constructor(dbClient, taskPerFetch = TASKS_PER_ONE_FETCH) {
        this.tasksQueue = [];
        this.dbClient = dbClient;
        this.taskPerFetch = taskPerFetch;
        this.minimalTasksInQueue = this.taskPerFetch * 0.3 / 100 //30%
    }

    async _fetchTasks() {
        try {
            const tasks = await this.dbClient.fetchTasks(this.taskPerFetch);
            this.tasksQueue.push(...tasks);
        } catch (err) {
            console.log('ERROR FETCHING TASKS');
            errorHandler()
        }
    }

    async popFromQueue() {
        if (this.tasksQueue.length < this.minimalTasksInQueue) {
            this._fetchTasks()
        }

        if (!this.tasksQueue.length) {
            log("ATTENTION: the queue is empty");
            await this._fetchTasks();
        }
        return this.tasksQueue.pop();
    }

    _validateTaskSchema(task) {
        // validate task schema with Joi libruary
    }
}

module.exports = QueueController;
